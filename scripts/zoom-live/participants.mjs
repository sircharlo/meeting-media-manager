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
const BLOCKED_RETRY_DELAY_MS = 15000;
const WATCHDOG_INTERVAL_MS = 1000;

const ACTIONS = [
  'accept-unmute-requests', // future "please unmute" prompts are accepted
  'ignore-unmute-requests', // ...or left unanswered
  'leave',
  'mute',
  'reset-events',
  'try-unmute', // the participant tries to unmute themselves
];

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
    if (await locator.nth(index).isVisible()) {
      target = locator.nth(index);
      break;
    }
  }
  // Short timeout: Zoom removes prompts on its own, and a vanished button
  // must not stall the watchdog.
  await target.evaluate((el) => el.click(), undefined, { timeout: 2000 });
  return true;
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
      const lastEvent = participant.events.at(-1);
      if (lastEvent?.type !== 'unmute-requested') {
        addEvent(participant, 'unmute-requested');
      }
      if (participant.unmuteRequestPolicy === 'accept') {
        if (await clickButton(page, /^unmute$/i)) {
          addEvent(participant, 'unmute-request-accepted');
        }
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
      await sleep(500);
      await participant.context.close();
      return true;
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
    timeout: 60000,
    waitUntil: 'domcontentloaded',
  });
  await page.locator('#input-for-name').waitFor({ timeout: 30000 });
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
      await submitJoinForm(page, name);
      await sleep(6000);
      const phase = detectPhase(await readPageInfo(page), 'joining');
      // Only the last attempt's "turned away" is final: until then the
      // participant is still joining.
      const finalAttempt = attempt === JOIN_ATTEMPTS;
      participant.phase =
        phase === 'blocked' && !finalAttempt ? 'joining' : phase;
      if (phase !== 'blocked') break;
      log(`${name} was turned away (attempt ${attempt}/${JOIN_ATTEMPTS})`);
      if (!finalAttempt) await sleep(BLOCKED_RETRY_DELAY_MS);
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
      if (!ACTIONS.includes(action)) {
        return sendJson(res, 400, { error: `Unknown action: ${action}` });
      }
      const targets =
        typeof index === 'number' ? [participants[index]] : participants;
      const results = await Promise.all(
        targets
          .filter((p) => p && p.phase !== 'left')
          .map((p) => runAction(p, action).catch((error) => String(error))),
      );
      return sendJson(res, 200, { results });
    }
    if (req.method === 'POST' && url.pathname === '/quit') {
      sendJson(res, 200, { ok: true });
      return shutdown();
    }
    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(res, 500, { error: String(error) });
  }
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  mkdirSync(join(SESSION_FILE, '..'), { recursive: true });
  writeFileSync(
    SESSION_FILE,
    JSON.stringify({ count, meetingId, pid: process.pid, port }),
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
  await joinParticipant(participant, index);
  if (index < count - 1) await sleep(JOIN_STAGGER_MS);
}
log(`${count} participant(s) launched for meeting ${meetingId}`);
