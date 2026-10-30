import type { ZoomTestParticipant } from 'src/types';

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defaultSettings } from 'src/constants/settings';
import {
  getZoomRaisedHands,
  getZoomShareEntries,
  learnZoomHandRaisedPhrase,
  muteZoomParticipantAndLowerHand,
  unmuteZoomParticipant,
} from 'src/helpers/zoom';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ZoomHandReport } from './hand-report';
import {
  callParticipants,
  canRunLive,
  createHelper,
  ensureMeeting,
  env,
  meetingId,
  print,
  ROOT,
  titles,
  waitUntilHostAlone,
} from './support';

// What the raised-hand side of the Zoom Meeting Manager does, against the real
// Zoom app: learning how Zoom marks a raised hand (in the user's Zoom
// language, whether or not reactions are turned off for the account),
// noticing somebody's raised hand, and the two controls that act on it (ask to
// unmute, mute and lower the hand).
//
// Unlike the other live tests, a broken step doesn't stop the run: every
// probe's reply is written to reports/zoom-live/hand-*.json, with Zoom's own
// control names and, on failure, what Zoom had on screen. That file is what
// makes a report like issue #10161 reproducible without the reporter's
// computer: run it on a Zoom in their language and compare the strings.
//
// See README.md. Run with `yarn test:zoom-live`.

const PARTICIPANT_JOIN_TIMEOUT_MS = 240_000;
const RAISED_HAND_TIMEOUT_MS = 20_000;
const POLL_MS = 1500;
// Written by scripts/zoom-live/participants.mjs while it runs.
const SESSION_FILE = join(
  tmpdir(),
  'm3-zoom-live',
  'participants-session.json',
);

type HandAction = 'lower-hand' | 'mute' | 'raise-hand';

// The entry that raises the hand in this Zoom, as the user would pick it in the
// setup assistant (e.g. Portuguese "Levantar mão"). Only an entry that looks
// like a hand control is ever pressed: the entry list also holds Record,
// Breakout rooms and the like, and nothing may press those.
const HAND_ENTRY = /m[ãa]o|\bhand\b|\bmain\b/i;
const NOT_A_HAND_ENTRY =
  /gravar|record|encerrar|\bend\b|leave|sair|salas|breakout|anfitri|host tools|compartilhar|share|participantes|participants|configura|settings|quadro|whiteboard|docs|aplicativ|apps|suporte|support|legenda|caption|informa|\bchat\b/i;

interface ParticipantsApi {
  act: (action: HandAction) => Promise<boolean>;
  dump: (index: number) => Promise<unknown>;
  list: () => Promise<ZoomTestParticipant[]>;
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Reads until `done` or the timeout; reports what it last read either way. */
const waitFor = async <T>(
  read: () => Promise<T>,
  done: (value: T) => boolean,
  timeoutMs: number,
) => {
  const deadline = Date.now() + timeoutMs;
  let value = await read();
  while (!done(value) && Date.now() < deadline) {
    await sleep(POLL_MS); // NOSONAR: sequential - polls until ready
    value = await read(); // NOSONAR: sequential - polls until ready
  }
  return { done: done(value), value };
};

/** Which of Zoom's two hand-raising buttons raised the host's hand. */
const learnedWith = (reply?: {
  handButtonTitle?: null | string;
  reactButtonTitle?: null | string;
}) => {
  if (reply?.handButtonTitle) return 'raise-hand-button';
  if (reply?.reactButtonTitle) return 'react-button';
  return null;
};

const participantsApi = (port: number): ParticipantsApi => ({
  act: async (action) => {
    const reply = await callParticipants<{ results?: boolean[] }>(
      port,
      '/action',
      { action },
    );
    return (reply.results?.length ?? 0) > 0 && !!reply.results?.every(Boolean);
  },
  dump: (index) => callParticipants<unknown>(port, `/dump?index=${index}`),
  list: async () =>
    (
      await callParticipants<{ participants?: ZoomTestParticipant[] }>(
        port,
        '/state',
      )
    ).participants ?? [],
});

const CONGREGATION_ID = 'zoom-live-hand';

describe.skipIf(!canRunLive)('Zoom Meeting Manager, raised hands', () => {
  const helper = createHelper();
  const report = new ZoomHandReport({
    zoomLanguage: env.ZOOM_TEST_LANGUAGE ?? null,
  });
  const store = useCurrentStateStore();

  let participants: ParticipantsApi | undefined;
  let ownParticipants = false;

  const handSettings = () => ({
    handButtonTitle: store.currentSettings?.zoomHandButtonTitle ?? null,
    handRaisedPhrase: store.currentSettings?.zoomHandRaisedPhrase ?? null,
    reactButtonTitle: store.currentSettings?.zoomReactButtonTitle ?? null,
  });

  beforeAll(async () => {
    const started = await helper.start();
    if (!started.ok) {
      throw new Error(`Zoom helper: ${started.error} ${started.detail ?? ''}`);
    }
    globalThis.electronApi.zoomCommand = (command) => helper.request(command);
    // M³'s Zoom names live in its settings. The report starts from what this
    // computer already learned, then follows what each probe saves, as the
    // setup assistant does.
    useCongregationSettingsStore().congregations[CONGREGATION_ID] = {
      ...structuredClone(defaultSettings),
      zoomMeetingManagerEnable: true,
      zoomMicOffTitle: titles.micOffTitle,
      zoomMicOnTitle: titles.micOnTitle,
      zoomShareButtonTitle: titles.shareButtonTitle,
      zoomVideoOffTitle: titles.videoOffTitle,
      zoomVideoOnTitle: titles.videoOnTitle,
    };
    store.currentCongregation = CONGREGATION_ID;
    report.note('settings.before', handSettings());
    report.note('titles', titles);
    await ensureMeeting(helper);
  });

  afterAll(async () => {
    if (participants && ownParticipants) {
      await callParticipants(0, '/quit', {}).catch(() => undefined);
      if (!(await waitUntilHostAlone(helper))) {
        print('  The test participants are still in the meeting');
      }
    }
    helper.stop();
  });

  /** The participants already in the meeting, or a new set of them. */
  const findParticipants = async (): Promise<ParticipantsApi> => {
    try {
      const session = JSON.parse(readFileSync(SESSION_FILE, 'utf8')) as {
        meeting: string;
        port: number;
      };
      const hash = createHash('sha256').update(meetingId).digest('hex');
      if (session.meeting === hash) {
        const existing = participantsApi(session.port);
        const list = await existing.list();
        if (list.some((p) => p.phase === 'in-meeting')) {
          print('  Reusing the test participants already in the meeting');
          return existing;
        }
      }
    } catch {
      // No session: start our own below.
    }
    ownParticipants = true;
    return participantsApi(await startParticipants());
  };

  const startParticipants = () =>
    new Promise<number>((resolve, reject) => {
      const child = spawn(
        'node',
        [
          'scripts/zoom-live/participants.mjs',
          String(Number(env.ZOOM_TEST_PARTICIPANTS ?? 3)),
          '--exit-with-parent',
        ],
        { cwd: ROOT },
      );
      const timeout = setTimeout(
        () => reject(new Error('The participants script did not start')),
        30_000,
      );
      child.stdout.on('data', (data: Buffer) => {
        const match = /ZOOM_PARTICIPANTS_PORT=(\d+)/.exec(data.toString());
        if (match) {
          clearTimeout(timeout);
          resolve(Number(match[1]));
        }
      });
    });

  it('learns, notices and acts on raised hands, recording what it saw', async () => {
    print(`\n  Zoom raised hands (meeting ${meetingId})`);
    const verdicts: Record<string, boolean | null | string> = {};

    // --- What M³ can see without pressing anything --------------------------
    const meeting = await report.reply('meeting', "Zoom's meeting window", () =>
      helper.request({ type: 'meeting' }),
    );
    if (!meeting.ok) {
      report.finish({ ...verdicts, meeting: false });
      throw new Error('No Zoom meeting open (see the report)');
    }
    report.note('meeting', meeting.value?.meeting ?? null);

    const diagnosed = await report.reply(
      'diagnose',
      'the setup assistant finds what it needs',
      () => helper.request({ type: 'diagnose' }),
    );
    report.note('diagnose', diagnosed.value?.diagnosis ?? null);
    verdicts.diagnosed = !!diagnosed.value?.diagnosis?.meeting;

    const entries = await report.probe(
      'entries',
      "Zoom's toolbar and More-menu buttons (what the hand picker offers)",
      () => getZoomShareEntries(),
      (found) => ({ more: found.more.length, toolbar: found.toolbar.length }),
    );
    report.note('entries', entries.value ?? null);

    // --- Learning how Zoom marks a raised hand ------------------------------
    // Run 1 is what the setup assistant does from a fresh install: M³'s own
    // guess at Zoom's React button, else Zoom's plain Raise hand button.
    const learned = await report.reply(
      'hand.learn',
      'raise and lower the host hand, then read how Zoom marks it',
      () => learnZoomHandRaisedPhrase(),
    );
    report.note('learn.reply', learned.value ?? null);
    report.note('settings.afterLearn', handSettings());
    // Not a failure by itself: where reactions are turned off, Zoom's plain
    // Raise hand button shows no shortcut in its name, so M³ can only find it
    // once the user picks it (the next probe).
    verdicts.learnedWithoutHelp = learned.ok;

    // When M³ found neither button, the assistant lists Zoom's entries for the
    // user to pick from. Only the entry named in ZOOM_TEST_HAND_ENTRY is
    // pressed: choosing it is the user's job, and most of that list (Record,
    // Breakout rooms...) must never be pressed by a test.
    if (!learned.ok) {
      const handEntry = (env.ZOOM_TEST_HAND_ENTRY ?? '').trim();
      const safe =
        !!handEntry &&
        HAND_ENTRY.test(handEntry) &&
        !NOT_A_HAND_ENTRY.test(handEntry);
      if (!handEntry) {
        report.note('picked', {
          entry: null,
          note: 'Set ZOOM_TEST_HAND_ENTRY to the entry that raises your hand to exercise the picked-button path',
        });
      } else if (!safe) {
        report.note('picked', {
          entry: handEntry,
          note: 'Not pressed: does not look like a hand button',
        });
      } else {
        const attempt = await report.reply(
          'hand.learn.picked',
          `whether "${handEntry}" raises the host hand`,
          () => learnZoomHandRaisedPhrase(handEntry),
        );
        report.note('picked', { entry: handEntry, ok: attempt.ok });
        verdicts.pickedEntry = handEntry;
        verdicts.learnedFromList = attempt.ok;
      }
    }

    // Run 2 is the run the user reports as failing now and then, with the
    // names M³ remembers: same code path as pressing the button again.
    const relearned = await report.reply(
      'hand.learn.again',
      'learn again with the names M³ remembered',
      () => learnZoomHandRaisedPhrase(),
    );
    verdicts.relearned = relearned.ok;
    // What M³ ended up knowing, however the names got there.
    const learnedNames = handSettings();
    verdicts.learned = learned.ok || !!verdicts.learnedFromList || relearned.ok;
    verdicts.phrase = learnedNames.handRaisedPhrase;
    verdicts.learnedWith = learnedWith(learnedNames);

    const phrase = learnedNames.handRaisedPhrase;
    // Only meaningful when the host is alone: hands left raised by an earlier
    // run linger in Zoom's list for a while after those participants leave.
    const present = await report.reply(
      'participants.before',
      'who is in the meeting before the test participants join',
      () => helper.request({ type: 'participants' }),
    );
    const hostAlone =
      (present.value?.participants ?? []).filter(
        (row) => row.section === 'meeting',
      ).length <= 1;
    report.note('hostAlone', hostAlone);
    const alone = hostAlone
      ? await report.reply(
          'hand.detect.nobody',
          'with nobody raising a hand, none are reported',
          () => helper.request({ phrase, type: 'raised-hands' }),
        )
      : undefined;
    verdicts.nobodyReported = alone?.ok
      ? (alone.value?.raisedHands ?? []).length === 0
      : null;

    // --- Somebody else raises their hand ------------------------------------
    const testParticipants = await findParticipants();
    participants = testParticipants;
    const joined = await waitFor(
      testParticipants.list,
      (list) => list.some((p) => p.phase === 'in-meeting'),
      PARTICIPANT_JOIN_TIMEOUT_MS,
    );
    const waiting = joined.value
      .filter((p) => p.phase === 'waiting-room')
      .map((p) => p.name);
    if (waiting.length > 0) {
      await report.reply(
        'participants.admit',
        'let the test participants in',
        () => helper.request({ names: waiting, type: 'admit' }),
      );
      await waitFor(
        participants.list,
        (list) => !list.some((p) => p.phase === 'waiting-room'),
        60_000,
      );
    }
    const inMeeting = (await participants.list()).filter(
      (p) => p.phase === 'in-meeting',
    );
    const name = inMeeting[0]?.name;
    if (!name) {
      report.finish({ ...verdicts, detected: null, testParticipants: false });
      throw new Error(
        'No test participant reached the meeting (see the report)',
      );
    }

    const raised = await report.probe(
      'participants.raise-hand',
      "a test participant raises their hand in Zoom's web client",
      () => testParticipants.act('raise-hand'),
      (pressed) => ({ pressed }),
    );
    if (!raised.value) {
      report.note('participant.dump', await testParticipants.dump(0));
      report.finish({
        ...verdicts,
        detected: null,
        loweredHand: null,
        unmuted: null,
      });
      throw new Error('The web client offered no hand button (see the report)');
    }

    const detection = await report.probe(
      'hand.detect',
      "M³ sees the participant's raised hand in the participants list",
      async () =>
        waitFor(
          () => getZoomRaisedHands(),
          (hands) => !!hands?.includes(name),
          RAISED_HAND_TIMEOUT_MS,
        ),
      (found) => ({ found: found.done, hands: found.value }),
    );
    verdicts.detected = detection.value?.done ?? null;

    // Zoom's own wording for that row, and every control it offers: the
    // strings to compare with a report from another Zoom language.
    const rows = await report.reply(
      'participants.rows',
      "Zoom's description of each participant, in its language",
      () => helper.request({ type: 'participants' }),
    );
    report.note('rows', rows.value?.participants ?? null);
    const inspected = await report.reply(
      'participant.inspect',
      "a raised-hand row's buttons and its More menu",
      () => helper.request({ name, type: 'inspect-participant' }),
    );
    report.note('inspect', inspected.value ?? null);

    // --- The two controls the reporter says don't work ---------------------
    await report.probe(
      'participants.mute',
      'the participant is muted',
      () => testParticipants.act('mute'),
      (pressed) => ({ pressed }),
    );
    const unmuted = await report.reply(
      'participant.unmute',
      'M³ asks the participant to unmute',
      () => unmuteZoomParticipant(name),
    );
    const unmuteWorked = await waitFor(
      participants.list,
      (list) => list.some((p) => p.name === name && p.micMuted === false),
      15_000,
    );
    verdicts.unmuted = unmuted.ok ? unmuteWorked.done : false;

    const lowered = await report.reply(
      'participant.mute-and-lower',
      'M³ mutes the participant and lowers their hand',
      () => muteZoomParticipantAndLowerHand(name),
    );
    const handGone = await waitFor(
      () => getZoomRaisedHands(),
      (hands) => !!hands && !hands.includes(name),
      15_000,
    );
    verdicts.loweredHand = lowered.ok ? handGone.done : false;
    // Their hand must be down for the next run to mean anything.
    if (!handGone.done) await testParticipants.act('lower-hand');

    report.finish(verdicts);

    // The outcome a user depends on. Every probe is in the report either way,
    // so a failure here is a finding, not a dead end.
    const failures = Object.entries(verdicts)
      .filter(([, value]) => value === false)
      .map(([key]) => key);
    expect(failures).toEqual([]);
  });
});
