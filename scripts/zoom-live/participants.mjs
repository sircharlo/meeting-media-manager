#!/usr/bin/env node
// Joins test participants to YOUR OWN Zoom test meeting through the Zoom web
// client, so the Zoom Meeting Manager automation can be exercised end to end
// (mute everyone, ask everyone to unmute, etc.) without real attendees.
//
// Local developer tool only - never run it in CI, and never point it at a
// real congregation meeting. Reads the meeting from .env.zoom-test
// (gitignored) at the repo root:
//   ZOOM_TEST_MEETING_ID=...
//   ZOOM_TEST_PASSCODE=...
//   ZOOM_TEST_PARTICIPANTS=3
//
// Usage: node scripts/zoom-live/participants.mjs [count] [--exit-with-parent]
//
// Left running on its own (without --exit-with-parent), the participants stay
// in the meeting, and later test runs reuse them; POST /quit or Ctrl+C makes
// them leave.
//
// Prints `ZOOM_PARTICIPANTS_PORT=<port>` once its local control server is up:
//   GET  /state           -> { participants: ParticipantState[] }
//   GET  /dump?index=0    -> visible buttons and page text (debugging)
//   POST /action          -> { action, index? } - see ACTIONS
//   POST /quit            -> every participant leaves, then the script exits

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const ENV_FILE = new URL('../../.env.zoom-test', import.meta.url);
const PROFILE_ROOT = join(tmpdir(), 'm3-zoom-live-profiles');
// Lets the live test and M³'s developer tool reuse participants that are
// already in the meeting instead of joining new ones every run, which makes
// Zoom far less likely to turn them away. Read by test/zoom-live and
// src-electron/main/zoom-test-participants.ts.
const SESSION_FILE = join(
  tmpdir(),
  'm3-zoom-live',
  'participants-session.json',
);
const MAX_PARTICIPANTS = 5;
const JOIN_STAGGER_MS = 5000;
const JOIN_ATTEMPTS = 3;
const BLOCKED_RETRY_DELAY_MS = 15_000;
const WATCHDOG_INTERVAL_MS = 1000;

const ACTIONS = new Set([
  'accept-unmute-requests', // future "please unmute" prompts are accepted
  'ignore-unmute-requests', // ...or left unanswered
  'leave',
  'lower-hand', // for M³ to lower someone else's hand
  'mute',
  'raise-hand', // so M³ has a raised hand to find in the list
  'reset-events',
  'try-unmute', // the participant tries to unmute themselves
]);

const readEnvFile = () => {
  try {
    return Object.fromEntries(
      readFileSync(ENV_FILE, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const index = line.indexOf('=');
          return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
        }),
    );
  } catch {
    return {};
  }
};

const env = { ...readEnvFile(), ...process.env };
const meetingId = (env.ZOOM_TEST_MEETING_ID || '').replaceAll(/\D/g, '');
const passcode = env.ZOOM_TEST_PASSCODE || '';
const count = Math.min(
  Math.max(Number(process.argv[2] || env.ZOOM_TEST_PARTICIPANTS || 3), 1),
  MAX_PARTICIPANTS,
);

if (!meetingId) {
  console.error('ZOOM_TEST_MEETING_ID is not set (see .env.zoom-test)');
  process.exit(1);
}

const log = (...args) => console.error('[participants]', ...args);
const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * @typedef {{
 *   context?: import('playwright').BrowserContext,
 *   error?: string,
 *   events: { at: number, type: string }[],
 *   name: string,
 *   page?: import('playwright').Page,
 *   phase: 'blocked' | 'error' | 'in-meeting' | 'joining' | 'left' | 'waiting-room',
 *   unmuteRequestPolicy: 'accept' | 'ignore',
 *   watchdog?: ReturnType<typeof setInterval>,
 * }} Participant
 */

// Everyone is listed from the start, so a reader of /state knows how many
// participants to wait for while they join one after another.
/** @type {Participant[]} */
const participants = Array.from({ length: count }, (_, index) => ({
  events: [],
  name: `M3 Test ${index + 1}`,
  phase: 'joining',
  unmuteRequestPolicy: 'accept',
}));

const addEvent = (participant, type) => {
  participant.events.push({ at: Date.now(), type });
  log(`${participant.name}: ${type}`);
};

// Every button, hidden or not: the meeting toolbar hides itself while the
// mouse is idle, but its buttons still say what state the participant is in.
const buttonLabels = (page) =>
  page.$$eval('button', (els) =>
    els
      .map((el) => (el.getAttribute('aria-label') || el.innerText || '').trim())
      .filter(Boolean),
  );

// A DOM click rather than a pointer click: the web client's footer can sit
// outside the viewport, and it hides itself while the mouse is idle, both
// of which a pointer click refuses. Visible matches win; otherwise the
// first match is clicked anyway (e.g. the auto-hidden footer's buttons).
const clickButton = async (page, pattern) => {
  const locator = page.getByRole('button', {
    includeHidden: true,
    name: pattern,
  });
  const total = await locator.count();
  if (!total) return false;
  let target = locator.first();
  for (let index = 0; index < total; index++) {
    const isVisible = await locator.nth(index).isVisible(); // NOSONAR: sequential - stops at first match
    if (isVisible) {
      target = locator.nth(index);
      break;
    }
  }
  // Short timeout: Zoom removes prompts on its own, and a vanished button
  // must not stall the watchdog.
  await target.evaluate((el) => el.click(), undefined, { timeout: 2000 });
  return true;
};

// Zoom asks to confirm leaving, with a "Leave Meeting" menu item (a button
// with role="menuitem", so not one by its role). Closing the browser without
// confirming only drops the connection, and the host's Zoom then keeps
// listing the participant for 3 more minutes.
const confirmLeave = async (page) => {
  const confirm = page
    .locator('button', { hasText: /^\s*leave meeting\s*$/i })
    .first();
  await confirm.waitFor({ state: 'attached', timeout: 3000 });
  await confirm.evaluate((el) => el.click(), undefined, { timeout: 2000 });
  // Out of the meeting once the web client leaves the meeting's page.
  await page.waitForURL((url) => !url.pathname.endsWith('/join'), {
    timeout: 5000,
  });
};

const readPageInfo = async (page) => ({
  labels: await buttonLabels(page),
  text: await page.evaluate(() => document.body.innerText),
});

const detectPhase = ({ labels, text }, current) => {
  if (/Automated bots aren't allowed/i.test(text)) return 'blocked';
  // The meeting ended (e.g. a free account's 40-minute limit) or the host
  // removed them: they're no longer in it.
  if (/meeting has (been )?ended|removed you from the meeting/i.test(text)) {
    return 'left';
  }
  if (/let them know you're here|host will let you in/i.test(text)) {
    return 'waiting-room';
  }
  if (labels.some((label) => /^leave$/i.test(label))) return 'in-meeting';
  return current;
};

// Zoom's "would like you to unmute" prompt stays up across watchdog ticks
// until it is answered, so it is only recorded when it isn't already the
// latest event.
const recordUnmuteRequest = (participant) => {
  const lastEvent = participant.events.at(-1);
  if (lastEvent?.type !== 'unmute-requested') {
    addEvent(participant, 'unmute-requested');
  }
};

// Keeps each participant in a known, steady state between test steps and
// records the prompts Zoom shows them, so a test can still check that a
// prompt appeared after it has been answered or dismissed.
const watch = async (participant) => {
  const { page } = participant;
  if (!page || participant.phase === 'left' || page.isClosed()) return;
  try {
    const info = await readPageInfo(page);
    participant.phase = detectPhase(info, participant.phase);
    if (participant.phase !== 'in-meeting') return;

    if (info.labels.includes('Got it')) await clickButton(page, /^got it$/i);

    if (info.labels.includes('Join Audio by Computer')) {
      await clickButton(page, /^join audio by computer$/i);
      addEvent(participant, 'audio-rejoined');
    }

    if (/not allowing participants to unmute themselves/i.test(info.text)) {
      addEvent(participant, 'unmute-blocked');
      await clickButton(page, /^ok$/i);
    }

    if (/would like you to unmute/i.test(info.text)) {
      recordUnmuteRequest(participant);
      if (
        participant.unmuteRequestPolicy === 'accept' &&
        (await clickButton(page, /^unmute$/i))
      ) {
        addEvent(participant, 'unmute-request-accepted');
      }
    }
  } catch (error) {
    if (!page.isClosed()) log(`${participant.name} watchdog error:`, error);
  }
};

const readState = async (participant) => {
  const base = {
    error: participant.error,
    events: participant.events,
    name: participant.name,
    phase: participant.phase,
    unmuteRequestPolicy: participant.unmuteRequestPolicy,
  };
  // Not launched yet: still waiting for its turn to join.
  if (!participant.page) return base;
  if (participant.phase === 'left' || participant.page.isClosed()) {
    return { ...base, phase: 'left' };
  }
  try {
    const { labels } = await readPageInfo(participant.page);
    // Footer microphone button: "mute my microphone" while unmuted,
    // "unmute my microphone" while muted, "join audio" when not connected.
    const micLabel = labels.find((label) =>
      /^(un)?mute my microphone$/i.test(label),
    );
    return {
      ...base,
      audioConnected: !!micLabel,
      micMuted: micLabel ? /^unmute/i.test(micLabel) : null,
    };
  } catch (error) {
    return { ...base, error: String(error) };
  }
};

// Raises or lowers the participant's own hand. The web client builds its
// footer a few seconds after joining, keeps the hand button in its Reactions
// panel, or shows it straight in the footer where reactions are turned off
// for the account: it is looked for for a while, and the panel opened once if
// it isn't there.
const setHand = async (page, raising) => {
  const pattern = raising ? /^raise hand$/i : /^lower hand$/i;
  const deadline = Date.now() + 20_000;
  // One look at the footer, then another after a pause until the deadline.
  // Recursion rather than a loop: each look is awaited before the next one
  // starts, which is the whole point of polling a UI.
  const look = async (openedPanel) => {
    if (Date.now() >= deadline) return false;
    if (await clickButton(page, pattern)) return true;
    if (!openedPanel && (await clickButton(page, /^reactions$/i))) {
      // The panel is a portal of its own: give it a moment to render.
      await sleep(600);
      return look(true);
    }
    await sleep(1000);
    return look(openedPanel);
  };
  return look(false);
};

const runAction = async (participant, action) => {
  const { page } = participant;
  if (!page && action !== 'leave') return false;
  switch (action) {
    case 'accept-unmute-requests':
      participant.unmuteRequestPolicy = 'accept';
      return true;
    case 'ignore-unmute-requests':
      participant.unmuteRequestPolicy = 'ignore';
      return true;
    case 'leave':
      clearInterval(participant.watchdog);
      participant.phase = 'left';
      if (!page) return true;
      await clickButton(page, /^leave$/i).catch(() => false);
      await confirmLeave(page).catch(() => undefined);
      await participant.context.close();
      return true;
    case 'lower-hand':
    case 'raise-hand': {
      const raising = action === 'raise-hand';
      const pressed = await setHand(page, raising);
      if (pressed)
        addEvent(participant, raising ? 'hand-raised' : 'hand-lowered');
      return pressed;
    }
    case 'mute':
      return clickButton(page, /^mute my microphone$/i);
    case 'reset-events':
      participant.events = [];
      return true;
    case 'try-unmute':
      return clickButton(page, /^unmute my microphone$/i);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
};

const submitJoinForm = async (page, name) => {
  await page.goto(`https://app.zoom.us/wc/join/${meetingId}`, {
    timeout: 60_000,
    waitUntil: 'domcontentloaded',
  });
  await page.locator('#input-for-name').waitFor({ timeout: 30_000 });
  await sleep(2000);
  if (passcode && (await page.locator('#input-for-pwd').count())) {
    await page.locator('#input-for-pwd').fill('');
    await page.locator('#input-for-pwd').pressSequentially(passcode, {
      delay: 60,
    });
  }
  await page.locator('#input-for-name').fill('');
  await page.locator('#input-for-name').pressSequentially(name, { delay: 60 });
  await sleep(600);
  await page.getByRole('button', { exact: true, name: 'Join' }).click();
};

const joinParticipant = async (participant, index) => {
  if (participant.phase === 'left') return;
  const { name } = participant;
  // A persistent profile per participant, so Zoom sees the same returning
  // browser on every run instead of a brand-new one each time.
  const context = await chromium.launchPersistentContext(
    join(PROFILE_ROOT, `participant-${index + 1}`),
    {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--disable-blink-features=AutomationControlled',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
      channel: 'chrome',
      headless: false,
      ignoreDefaultArgs: ['--enable-automation'],
      locale: 'en-US',
      permissions: ['microphone', 'camera'],
      viewport: { height: 720, width: 1280 },
    },
  );
  const page = context.pages()[0] ?? (await context.newPage());
  participant.context = context;
  participant.page = page;

  for (let attempt = 1; attempt <= JOIN_ATTEMPTS; attempt++) {
    try {
      await submitJoinForm(page, name); // NOSONAR: sequential - retry loop
      await sleep(6000); // NOSONAR: sequential - retry loop
      const phase = detectPhase(await readPageInfo(page), 'joining'); // NOSONAR: sequential - retry loop
      // Only the last attempt's "turned away" is final: until then the
      // participant is still joining.
      const finalAttempt = attempt === JOIN_ATTEMPTS;
      participant.phase =
        phase === 'blocked' && !finalAttempt ? 'joining' : phase;
      if (phase !== 'blocked') break;
      log(`${name} was turned away (attempt ${attempt}/${JOIN_ATTEMPTS})`);
      if (!finalAttempt) await sleep(BLOCKED_RETRY_DELAY_MS); // NOSONAR: sequential - retry loop
    } catch (error) {
      participant.phase = 'error';
      participant.error = String(error);
      log(`${name} failed to join:`, error);
      break;
    }
  }
  log(`${name}: ${participant.phase}`);
  participant.watchdog = setInterval(
    () => void watch(participant),
    WATCHDOG_INTERVAL_MS,
  );
};

const readBody = (req) =>
  new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });

const sendJson = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

// Who a POST /action applies to: the participant at `index` when one is
// given, otherwise everyone - minus an out-of-range index and anyone who has
// already left.
const actionTargets = (index) => {
  const targets =
    typeof index === 'number' ? [participants[index]] : participants;
  return targets.filter((p) => p && p.phase !== 'left');
};

let shuttingDown = false;
const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  rmSync(SESSION_FILE, { force: true });
  await Promise.all(
    participants
      .filter((participant) => participant.phase !== 'left')
      .map((participant) =>
        runAction(participant, 'leave').catch(() => undefined),
      ),
  );
  process.exit(0);
};

const server = createServer(async (req, res) => {
  // Browsers mark requests from web pages with an Origin header; M³ and the
  // live tests (through node:http) don't send one. No web page gets to drive
  // the participants.
  if (req.headers.origin) {
    sendJson(res, 403, { error: 'forbidden' });
    return;
  }
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/state') {
      const states = await Promise.all(participants.map(readState));
      return sendJson(res, 200, { expected: count, participants: states });
    }
    if (req.method === 'GET' && url.pathname === '/dump') {
      const participant = participants[Number(url.searchParams.get('index'))];
      if (!participant) return sendJson(res, 404, { error: 'No participant' });
      return sendJson(res, 200, await readPageInfo(participant.page));
    }
    if (req.method === 'POST' && url.pathname === '/action') {
      const { action, index } = await readBody(req);
      if (!ACTIONS.has(action)) {
        return sendJson(res, 400, { error: `Unknown action: ${action}` });
      }
      const results = await Promise.all(
        actionTargets(index).map((p) => runAction(p, action).catch(String)),
      );
      return sendJson(res, 200, { results });
    }
    if (req.method === 'POST' && url.pathname === '/quit') {
      sendJson(res, 200, { ok: true });
      return shutdown();
    }
    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    // Details stay in this terminal rather than going back to the caller.
    log('Request failed:', error);
    sendJson(res, 500, { error: 'internal-error' });
  }
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  mkdirSync(join(SESSION_FILE, '..'), { recursive: true });
  writeFileSync(
    SESSION_FILE,
    JSON.stringify({
      count,
      // Identifies the meeting without writing its ID to a temp file.
      meeting: createHash('sha256').update(meetingId).digest('hex'),
      pid: process.pid,
      port,
    }),
  );
  console.log(`ZOOM_PARTICIPANTS_PORT=${port}`);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
// When spawned by the test runner or M³, our stdin closing means the parent
// is gone, so nobody would ever send /quit.
if (process.argv.includes('--exit-with-parent')) {
  process.stdin.on('end', shutdown);
  process.stdin.resume();
}

for (const [index, participant] of participants.entries()) {
  await joinParticipant(participant, index); // NOSONAR: sequential - Zoom UI automation must not overlap
  if (index < count - 1) await sleep(JOIN_STAGGER_MS); // NOSONAR: sequential - Zoom UI automation must not overlap
}
log(`${count} participant(s) launched for the test meeting`);
