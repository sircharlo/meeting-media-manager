import type { ZoomTestParticipant } from 'src/types';

import { type ChildProcess, spawn } from 'node:child_process';
import { defaultSettings } from 'src/constants/settings';
import {
  admitZoomParticipants,
  countZoomMeetingParticipants,
  getZoomMeetingState,
} from 'src/helpers/zoom';
import { runZoomStartupCheck } from 'src/helpers/zoom-startup-check';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useZoomStateStore } from 'stores/zoom-state';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  callParticipants,
  canRunLive,
  createHelper,
  env,
  meetingId,
  openFakeMediaWindow,
  print,
  ROOT,
  sleep,
  titles,
} from './support';

// The startup check against the real Zoom app (see README.md): it opens
// the meeting if needed and tests everything when the host is alone, and
// only looks, changing nothing, once others are in the meeting.

// A meeting starts in 30 minutes, every day here: M³ may open it now.
vi.mock('src/helpers/date', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getTodaysMeetingStartDateTime: () => new Date(Date.now() + 30 * 60_000),
}));

// Set to stand in for others in the meeting, which Zoom's web client
// doesn't always let the test participants become.
const participantCount = vi.hoisted(() => ({
  override: null as null | number,
}));

vi.mock('src/helpers/zoom', async (importOriginal) => {
  const actual = await importOriginal<{
    countZoomMeetingParticipants: () => Promise<null | number>;
  }>();
  return {
    ...actual,
    countZoomMeetingParticipants: () =>
      participantCount.override === null
        ? actual.countZoomMeetingParticipants()
        : Promise.resolve(participantCount.override),
  };
});

const CONGREGATION_ID = 'zoom-live';
// What visibly changes Zoom for everyone in the meeting.
const VISIBLE_ACTIONS = [
  'join-audio',
  'leave-audio',
  'mute-all',
  'set-video',
  'start-share',
  'stop-share',
];
const PARTICIPANTS_START_TIMEOUT_MS = 30_000;
const PARTICIPANTS_JOIN_TIMEOUT_MS = 240_000;

/** Opens the test meeting the way M³ does, with its passcode. */
const launchMeeting = (id: string) => {
  const query = new URLSearchParams({ confno: id.replaceAll(/\D/g, '') });
  if (env.ZOOM_TEST_PASSCODE) query.set('pwd', env.ZOOM_TEST_PASSCODE);
  spawn('rundll32', [
    'url.dll,FileProtocolHandler',
    `zoommtg://zoom.us/join?${query.toString()}`,
  ]);
};

const startParticipants = (count: number) =>
  new Promise<{ child: ChildProcess; port: number }>((resolve, reject) => {
    const child = spawn(
      'node',
      [
        'scripts/zoom-live/participants.mjs',
        String(count),
        '--exit-with-parent',
      ],
      { cwd: ROOT },
    );
    const timeout = setTimeout(
      () => reject(new Error('The participants script did not start')),
      PARTICIPANTS_START_TIMEOUT_MS,
    );
    child.stdout.on('data', (data: Buffer) => {
      const match = /ZOOM_PARTICIPANTS_PORT=(\d+)/.exec(data.toString());
      if (match) {
        clearTimeout(timeout);
        resolve({ child, port: Number(match[1]) });
      }
    });
    child.stderr.on('data', (data: Buffer) => {
      process.stderr.write(`    ${data.toString().trimEnd()}\n`);
    });
    child.on('error', reject);
  });

/** Admits the participants from the waiting room until some are in. */
const admitParticipants = async (port: number) => {
  const deadline = Date.now() + PARTICIPANTS_JOIN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const { participants = [] } = await callParticipants<{
      participants?: ZoomTestParticipant[];
    }>(port, '/state');
    const waiting = participants.filter((p) => p.phase === 'waiting-room');
    if (waiting.length) await admitZoomParticipants(waiting.map((p) => p.name));
    const settled = participants.every(
      (p) => p.phase === 'in-meeting' || p.phase === 'blocked',
    );
    if (participants.length && settled) {
      return participants.filter((p) => p.phase === 'in-meeting').length;
    }
    await sleep(2000);
  }
  return 0;
};

describe.skipIf(!canRunLive)('Zoom startup check, live', () => {
  const helper = createHelper();
  const children: ChildProcess[] = [];
  let participantsPort = 0;
  /** The commands sent to Zoom, in order. */
  let sent: string[] = [];
  const visibleActionsSent = () =>
    [...new Set(sent.filter((type) => VISIBLE_ACTIONS.includes(type)))].sort(
      (a, b) => a.localeCompare(b),
    );

  beforeAll(async () => {
    expect(await helper.start()).toEqual({ ok: true });
    globalThis.electronApi.zoomCommand = (command) => {
      sent.push(command.type);
      return helper.request(command);
    };
    globalThis.electronApi.launchZoomMeeting = launchMeeting;
    children.push(openFakeMediaWindow());

    useCongregationSettingsStore().congregations = {
      [CONGREGATION_ID]: {
        ...defaultSettings,
        zoomMeetingManagerAutomateMediaSharing: true,
        zoomMeetingManagerAutomateMeetingAudioSettings: true,
        zoomMeetingManagerAutomatePostMeetingAudioSettings: true,
        zoomMeetingManagerEnable: true,
        zoomMeetingManagerMeetingId: meetingId,
        zoomMeetingManagerStartupCheck: true,
        zoomShareButtonTitle: titles.shareButtonTitle,
        zoomVideoOffTitle: titles.videoOffTitle,
        zoomVideoOnTitle: titles.videoOnTitle,
      },
    };
    const currentState = useCurrentStateStore();
    currentState.currentCongregation = CONGREGATION_ID;
    // The stand-in media window is already showing.
    currentState.mediaWindowVisible = true;
  });

  afterAll(async () => {
    if (participantsPort) {
      await callParticipants(participantsPort, '/quit', {}).catch(
        () => undefined,
      );
      await sleep(3000);
    }
    children.forEach((child) => child.kill());
    helper.stop();
  });

  it('opens the meeting if needed, then tests everything with the host alone', async () => {
    const open = (await getZoomMeetingState())?.found;
    print(
      open
        ? '  The meeting is already open'
        : '  The meeting is not open: the check opens it',
    );

    sent = [];
    expect(await runZoomStartupCheck()).toBe('passed');
    print(`  Sent to Zoom: ${sent.join(', ')}`);
    expect(visibleActionsSent()).toEqual([
      'join-audio',
      'leave-audio',
      'set-video',
      'start-share',
      'stop-share',
    ]);
    expect((await getZoomMeetingState())?.found).toBe(true);
    expect(useZoomStateStore().automationsPaused).toBe(false);
  });

  /** Runs the check with others in the meeting, expecting no visible change. */
  const expectCheckOnlyLooks = async () => {
    const before = await getZoomMeetingState(true);
    sent = [];
    expect(await runZoomStartupCheck({ manual: true })).toBe('passed');
    print(`  Sent to Zoom: ${sent.join(', ')}`);
    expect(visibleActionsSent()).toEqual([]);
    // It still looked at everything the automations use.
    expect(sent).toEqual(
      expect.arrayContaining(['diagnose', 'test-share-picker']),
    );
    const after = await getZoomMeetingState(true);
    expect(after?.audioJoined).toBe(before?.audioJoined);
    expect(after?.videoTitle).toBe(before?.videoTitle);
    expect(after?.sharing).toBe(false);
    expect(useZoomStateStore().automationsPaused).toBe(false);
  };

  it('only looks, changing nothing, when others are in the meeting', async () => {
    participantCount.override = 3;
    try {
      await expectCheckOnlyLooks();
    } finally {
      participantCount.override = null;
    }
  });

  it('counts real participants as others in the meeting', async (context) => {
    const launched = await startParticipants(2);
    children.push(launched.child);
    participantsPort = launched.port;
    const joined = await admitParticipants(launched.port);
    print(`  ${joined} test participant(s) in the meeting`);
    if (!joined) {
      context.skip('Zoom turned every test participant away');
      return;
    }

    expect(await countZoomMeetingParticipants()).toBe(joined + 1);
    await expectCheckOnlyLooks();
  });
});
