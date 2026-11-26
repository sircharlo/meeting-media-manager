import type { ZoomCommand, ZoomCommandResult } from 'src/types';
import type {
  MediaPlayingState,
  MediaPlayingStateAction,
} from 'stores/current-state';

import { MEDIA_WINDOW_TITLE } from 'src/constants/zoom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, reactive } from 'vue';

import type { HostMicPlayback } from '../zoom';

const currentSettings = {
  obsEnable: false,
  zoomEnable: false,
  zoomHandButtonTitle: null as null | string,
  zoomHandRaisedPhrase: null as null | string,
  zoomJoinAudioTitle: null as null | string,
  zoomLearnedVersion: null as null | string,
  zoomMeetingManagerAutoLaunchMeeting: false,
  zoomMeetingManagerAutomateMeetingAudioSettings: false,
  zoomMeetingManagerAutomatePostMeetingAudioSettings: false,
  zoomMeetingManagerEnable: true,
  zoomMeetingManagerMeetingId: '123 456' as null | string,
  zoomMeetingManagerMuteHostMicDuringMedia: false,
  zoomMeetingManagerPostMeetingAskToUnmute: true,
  zoomMicOffTitle: 'Unmute' as null | string,
  zoomMicOnTitle: 'Mute' as null | string,
  zoomMuteAllTitle: null as null | string,
  zoomParticipantsButtonTitle: null as null | string,
  zoomReactButtonTitle: null as null | string,
  zoomShareButtonTitle: 'Share' as null | string,
  zoomStopShareTitle: null as null | string,
  zoomVideoOffTitle: 'Start Video' as null | string,
  zoomVideoOnTitle: 'Stop Video' as null | string,
};

const { dateMocks, notifyMock, sentryMocks, updateChecklistMock } = vi.hoisted(
  () => ({
    dateMocks: {
      getMeetingStartToday: vi.fn((): Date | null => null),
      isMemorialDay: vi.fn(() => false),
    },
    notifyMock: vi.fn(),
    sentryMocks: {
      addBreadcrumb: vi.fn(),
      captureMessage: vi.fn(),
      // Sentry isn't set up unless a test says so.
      getClient: vi.fn((): object | undefined => undefined),
    },
    updateChecklistMock: vi.fn(),
  }),
);

vi.mock('src/helpers/date', () => dateMocks);

vi.mock('@sentry/vue', () => sentryMocks);

const AT_REST = {
  action: '' as MediaPlayingStateAction,
  currentPosition: 0,
  duration: 0,
  playbackConfirmedToken: 0,
  playbackRate: 1,
  playToken: 0,
  shouldLoop: false,
  url: '',
};

const mediaPlaying = reactive({ ...AT_REST });

vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => ({ currentSettings, mediaPlaying }),
}));

const zoomState = {
  abortRun: vi.fn(() => {
    zoomState.runDepth = 0;
    zoomState.runLabel = null;
    zoomState.cancelRequested = false;
  }),
  automationsPaused: false,
  beginRun: vi.fn((label: string) => {
    if (zoomState.runDepth === 0) zoomState.runLabel = label;
    zoomState.runDepth++;
  }),
  cancelRequested: false,
  endRun: vi.fn(() => {
    zoomState.runDepth = Math.max(0, zoomState.runDepth - 1);
    if (zoomState.runDepth === 0) {
      zoomState.runLabel = null;
      zoomState.cancelRequested = false;
    }
  }),
  meeting: null as unknown,
  relearnNeeded: false,
  requestCancel: vi.fn(() => {
    zoomState.cancelRequested = true;
  }),
  get runActive() {
    return zoomState.runDepth > 0;
  },
  runDepth: 0,
  runLabel: null as null | string,
  setMeeting: vi.fn((meeting: unknown) => {
    zoomState.meeting = meeting;
  }),
  setRunStep: vi.fn(),
};

vi.mock('stores/zoom-state', () => ({
  useZoomStateStore: () => zoomState,
}));

vi.mock('quasar', () => ({
  Dialog: { create: vi.fn(() => ({ onOk: vi.fn() })) },
}));

vi.mock('src/helpers/error-catcher', () => ({ errorCatcher: vi.fn() }));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: notifyMock,
}));

vi.mock('src/helpers/keyboard-shortcuts', () => ({
  sendKeyboardShortcut: vi.fn(),
}));

vi.mock('src/helpers/meeting-quick-actions', () => ({
  updateChecklistFromZoom: updateChecklistMock,
}));

const zoomCommandMock =
  vi.fn<(command: ZoomCommand) => Promise<ZoomCommandResult>>();
const launchZoomMeetingMock = vi.fn();
const restartZoomHelperMock = vi.fn(async () => ({ ok: true }));
const getInstalledZoomVersionMock = vi.fn(
  async (): Promise<null | string> => null,
);

let meetingFound = true;
let zoomSharing = false;
let failing: Partial<Record<ZoomCommand['type'], string>> = {};

const commandTypes = () => zoomCommandMock.mock.calls.map(([c]) => c.type);

beforeEach(() => {
  vi.clearAllMocks();
  // The media-share bookkeeping lives in the module: start each test afresh.
  vi.resetModules();
  meetingFound = true;
  zoomSharing = false;
  failing = {};
  dateMocks.getMeetingStartToday.mockReturnValue(null);
  dateMocks.isMemorialDay.mockReturnValue(false);
  zoomState.meeting = null;
  zoomState.automationsPaused = false;
  zoomState.relearnNeeded = false;
  zoomState.cancelRequested = false;
  zoomState.runDepth = 0;
  zoomState.runLabel = null;
  sentryMocks.getClient.mockReturnValue(undefined);
  Object.assign(mediaPlaying, AT_REST);
  Object.assign(currentSettings, {
    zoomMeetingManagerAutoLaunchMeeting: false,
    zoomMeetingManagerAutomateMeetingAudioSettings: false,
    zoomMeetingManagerAutomatePostMeetingAudioSettings: false,
    zoomMeetingManagerMuteHostMicDuringMedia: false,
    zoomMeetingManagerPostMeetingAskToUnmute: true,
    zoomMicOffTitle: 'Unmute',
    zoomMicOnTitle: 'Mute',
    zoomVideoOffTitle: 'Start Video',
    zoomVideoOnTitle: 'Stop Video',
  });
  zoomCommandMock.mockImplementation(async (command) => {
    if (command.type === 'meeting') {
      return {
        meeting: { found: meetingFound, sharing: zoomSharing },
        ok: true,
      };
    }
    const error = failing[command.type];
    if (error) return { error, ok: false };
    if (command.type === 'start-share') zoomSharing = true;
    if (command.type === 'stop-share') zoomSharing = false;
    return { changed: true, ok: true };
  });
  getInstalledZoomVersionMock.mockResolvedValue(null);
  vi.stubGlobal('electronApi', {
    focusMediaWindow: vi.fn(),
    getInstalledZoomVersion: getInstalledZoomVersionMock,
    launchZoomMeeting: launchZoomMeetingMock,
    restartZoomHelper: restartZoomHelperMock,
    zoomCommand: zoomCommandMock,
  });
});

describe('Zoom meeting automation', () => {
  it('applies the in-meeting settings in order, when enabled', async () => {
    currentSettings.zoomMeetingManagerAutomateMeetingAudioSettings = true;
    const { automateZoomMeetingSettings } = await import('../zoom');

    await automateZoomMeetingSettings();

    expect(commandTypes()).toEqual([
      'meeting',
      'join-audio',
      'set-mic',
      'set-video',
      'mute-all',
    ]);
    expect(zoomCommandMock).toHaveBeenCalledWith({
      offTitle: 'Unmute',
      on: true,
      onTitle: 'Mute',
      titles: expect.any(Object),
      type: 'set-mic',
    });
    expect(zoomCommandMock).toHaveBeenCalledWith({
      offTitle: 'Start Video',
      on: true,
      onTitle: 'Stop Video',
      titles: expect.any(Object),
      type: 'set-video',
    });
    expect(zoomCommandMock).toHaveBeenCalledWith({
      allowSelfUnmute: false,
      titles: expect.any(Object),
      type: 'mute-all',
    });
  });

  it('applies the before/after-meeting settings in order, when enabled', async () => {
    currentSettings.zoomMeetingManagerAutomatePostMeetingAudioSettings = true;
    const { automateZoomPostMeetingSettings } = await import('../zoom');

    await automateZoomPostMeetingSettings();

    expect(commandTypes()).toEqual([
      'meeting',
      'leave-audio',
      'set-video',
      'mute-all',
      'ask-all-to-unmute',
    ]);
    expect(zoomCommandMock).toHaveBeenCalledWith({
      allowSelfUnmute: true,
      titles: expect.any(Object),
      type: 'mute-all',
    });
  });

  it('lets everyone unmute without asking them to, when that is turned off', async () => {
    currentSettings.zoomMeetingManagerAutomatePostMeetingAudioSettings = true;
    currentSettings.zoomMeetingManagerPostMeetingAskToUnmute = false;
    const { automateZoomPostMeetingSettings } = await import('../zoom');

    await automateZoomPostMeetingSettings();

    expect(commandTypes()).toEqual([
      'meeting',
      'leave-audio',
      'set-video',
      'mute-all',
    ]);
    expect(zoomCommandMock).toHaveBeenCalledWith({
      allowSelfUnmute: true,
      titles: expect.any(Object),
      type: 'mute-all',
    });
    expect(updateChecklistMock).not.toHaveBeenCalledWith({
      participantsMuted: false,
    });
  });

  it('asks everyone to unmute when told to, whatever the setting', async () => {
    currentSettings.zoomMeetingManagerPostMeetingAskToUnmute = false;
    const { runZoomPostMeetingSequence } = await import('../zoom');

    await runZoomPostMeetingSequence(undefined, true);

    expect(commandTypes()).toContain('ask-all-to-unmute');
  });

  it('does nothing when the matching setting is off', async () => {
    currentSettings.zoomMeetingManagerAutomateMeetingAudioSettings = true;
    const { automateZoomPostMeetingSettings } = await import('../zoom');

    await automateZoomPostMeetingSettings();

    expect(zoomCommandMock).not.toHaveBeenCalled();
  });

  it.each([
    ['after the meeting has started', -60, true],
    ['on a day without a meeting', null, true],
    // Its own schedule applies them then, after the startup check.
    ['before the meeting', 60, false],
  ])(
    'music starting %s (meeting in %s min) applies the before/after-meeting settings: %s',
    async (_when, minutesToStart, applied) => {
      currentSettings.zoomMeetingManagerAutomatePostMeetingAudioSettings = true;
      const now = new Date(2026, 9, 15, 19, 30);
      dateMocks.getMeetingStartToday.mockReturnValue(
        minutesToStart === null
          ? null
          : new Date(now.getTime() + minutesToStart * 60_000),
      );
      const { automateZoomSettingsOnMusicStart } = await import('../zoom');

      await automateZoomSettingsOnMusicStart(now);

      expect(commandTypes().includes('leave-audio')).toBe(applied);
    },
  );

  it('skips every step when no Zoom meeting is open', async () => {
    meetingFound = false;
    const { runZoomMeetingSequence } = await import('../zoom');

    const result = await runZoomMeetingSequence();

    expect(result).toEqual({ failedSteps: ['meeting'], ok: false });
    expect(commandTypes()).toEqual(['meeting']);
  });

  it('carries on past a failed step and reports it', async () => {
    failing = { 'join-audio': 'audio-not-joined' };
    const { runZoomMeetingSequence } = await import('../zoom');

    const result = await runZoomMeetingSequence();

    expect(result).toEqual({ failedSteps: ['join-audio'], ok: false });
    expect(commandTypes()).toContain('mute-all');
    // Something is left to do in Zoom by hand: it stays until closed.
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        group: 'zoom-automation',
        timeout: 0,
        type: 'negative',
      }),
    );
  });

  it('leaves the video alone, without failing, when its titles were never captured', async () => {
    failing = { 'set-video': 'video-titles-not-captured' };
    const { runZoomPostMeetingSequence } = await import('../zoom');

    const result = await runZoomPostMeetingSequence();

    expect(result).toEqual({ failedSteps: [], ok: true });
  });

  it('leaves the microphone alone, without failing, when its titles were never captured', async () => {
    failing = { 'set-mic': 'mic-titles-not-captured' };
    const { runZoomMeetingSequence } = await import('../zoom');

    const result = await runZoomMeetingSequence();

    expect(result).toEqual({ failedSteps: [], ok: true });
  });
});

describe('Zoom actions and the meeting checklist', () => {
  const checklistUpdates = () =>
    updateChecklistMock.mock.calls.map(([state]) => state);

  it('reports what the in-meeting settings did, step by step', async () => {
    const { runZoomMeetingSequence } = await import('../zoom');

    await runZoomMeetingSequence();

    expect(checklistUpdates()).toEqual([
      { audioJoined: true },
      { hostMicOn: true },
      { hostVideoOn: true },
      { participantsCanUnmute: false, participantsMuted: true },
    ]);
  });

  it('reports what the before/after-meeting settings did, step by step', async () => {
    const { runZoomPostMeetingSequence } = await import('../zoom');

    await runZoomPostMeetingSequence();

    expect(checklistUpdates()).toEqual([
      { audioJoined: false, hostMicOn: false },
      { hostVideoOn: false },
      { participantsCanUnmute: true, participantsMuted: true },
      { participantsMuted: false },
    ]);
  });

  it('reports nothing for a step that failed', async () => {
    failing = {
      'join-audio': 'audio-not-joined',
      'set-mic': 'audio-not-joined',
      'set-video': 'video-titles-not-captured',
    };
    const { runZoomMeetingSequence } = await import('../zoom');

    await runZoomMeetingSequence();

    expect(checklistUpdates()).toEqual([
      { participantsCanUnmute: false, participantsMuted: true },
    ]);
  });

  it('leaves the checklist alone during a self-test', async () => {
    const { runZoomMeetingSequence, withoutZoomFeedback } =
      await import('../zoom');

    await withoutZoomFeedback(() => runZoomMeetingSequence());

    expect(updateChecklistMock).not.toHaveBeenCalled();
    expect(notifyMock).not.toHaveBeenCalled();
  });
});

describe('Zoom media sharing', () => {
  it('shares the media window using the captured Share entry', async () => {
    const { startSharingMediaInZoom } = await import('../zoom');

    expect(await startSharingMediaInZoom()).toBe(true);
    expect(zoomCommandMock).toHaveBeenCalledWith({
      shareButtonTitle: 'Share',
      titles: expect.any(Object),
      type: 'start-share',
      windowTitle: MEDIA_WINDOW_TITLE,
    });
  });

  it('reports a share that did not start', async () => {
    failing = { 'start-share': 'share-picker-not-found' };
    const { startSharingMediaInZoom } = await import('../zoom');

    expect(await startSharingMediaInZoom()).toBe(false);
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ group: 'zoom-sharing', type: 'negative' }),
    );
  });

  it('does not report a cancelled share as failed', async () => {
    failing = { 'start-share': 'cancelled' };
    const { startSharingMediaInZoom } = await import('../zoom');

    expect(await startSharingMediaInZoom()).toBe(false);
    expect(notifyMock).not.toHaveBeenCalled();
  });
});

describe('automated media sharing', () => {
  const minutesFromNow = (minutes: number) =>
    new Date(Date.now() + minutes * 60 * 1000);

  it('does not touch Zoom, nor say so, without a meeting open outside meeting time', async () => {
    meetingFound = false;
    const { automateZoomMediaSharing } = await import('../zoom');

    expect(await automateZoomMediaSharing(true)).toBe(false);

    expect(commandTypes()).toEqual(['meeting']);
    expect(zoomState.beginRun).not.toHaveBeenCalled();
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it('warns that nothing was shared without a meeting open at meeting time', async () => {
    meetingFound = false;
    dateMocks.getMeetingStartToday.mockReturnValue(minutesFromNow(10));
    const { automateZoomMediaSharing } = await import('../zoom');

    expect(await automateZoomMediaSharing(true)).toBe(false);

    expect(commandTypes()).toEqual(['meeting']);
    expect(zoomState.beginRun).not.toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ group: 'zoom-sharing', type: 'warning' }),
    );
  });

  it("reports Zoom's helper not answering at meeting time as a failure", async () => {
    dateMocks.getMeetingStartToday.mockReturnValue(minutesFromNow(-30));
    zoomCommandMock.mockImplementation(async () => ({
      error: 'helper-not-running',
      ok: false,
    }));
    const { automateZoomMediaSharing } = await import('../zoom');

    expect(await automateZoomMediaSharing(true)).toBe(false);

    expect(zoomState.beginRun).not.toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        group: 'zoom-sharing',
        timeout: 0,
        type: 'negative',
      }),
    );
  });

  it('shares under the overlay once a meeting is found', async () => {
    const labels: (null | string)[] = [];
    const respond = zoomCommandMock.getMockImplementation();
    zoomCommandMock.mockImplementation(async (command) => {
      labels.push(zoomState.runLabel);
      return respond?.(command) ?? { ok: false };
    });
    const { automateZoomMediaSharing } = await import('../zoom');

    expect(await automateZoomMediaSharing(true)).toBe(true);

    expect(commandTypes()).toEqual(['meeting', 'start-share']);
    expect(labels).toEqual([null, 'zoom-run-media-sharing-start']);
  });

  it('stops the share it started once the media stops', async () => {
    const { automateZoomMediaSharing } = await import('../zoom');

    await automateZoomMediaSharing(true);
    expect(await automateZoomMediaSharing(false)).toBe(true);

    expect(commandTypes()).toEqual([
      'meeting',
      'start-share',
      'meeting',
      'stop-share',
    ]);
  });

  it('waits for a share being started before stopping it', async () => {
    const { automateZoomMediaSharing } = await import('../zoom');

    const starting = automateZoomMediaSharing(true);
    const stopping = automateZoomMediaSharing(false);
    await Promise.all([starting, stopping]);

    expect(commandTypes()).toContain('stop-share');
    expect(zoomSharing).toBe(false);
  });

  it('leaves a share the user started alone, then and after the media', async () => {
    zoomSharing = true;
    const { automateZoomMediaSharing } = await import('../zoom');

    expect(await automateZoomMediaSharing(true)).toBe(true);
    expect(await automateZoomMediaSharing(false)).toBe(true);

    expect(commandTypes()).toEqual(['meeting']);
    expect(zoomState.beginRun).not.toHaveBeenCalled();
  });

  it('does not stop anything when nothing was shared', async () => {
    meetingFound = false;
    const { automateZoomMediaSharing } = await import('../zoom');

    await automateZoomMediaSharing(true);
    expect(await automateZoomMediaSharing(false)).toBe(true);

    expect(commandTypes()).toEqual(['meeting']);
    expect(zoomState.beginRun).not.toHaveBeenCalled();
  });

  it('skips stopping a share already stopped in Zoom', async () => {
    const { automateZoomMediaSharing } = await import('../zoom');

    await automateZoomMediaSharing(true);
    zoomSharing = false;
    await automateZoomMediaSharing(false);

    expect(commandTypes()).not.toContain('stop-share');
  });
});

describe('meeting time', () => {
  const at = (hours: number, minutes = 0) => {
    const date = new Date(2026, 9, 15);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  it('runs from the music window before the meeting until a while after its end', async () => {
    dateMocks.getMeetingStartToday.mockImplementation(() => at(19));
    const { isAroundMeetingTime } = await import('../zoom');

    expect(isAroundMeetingTime(at(17, 44))).toBe(false);
    expect(isAroundMeetingTime(at(17, 45))).toBe(true);
    expect(isAroundMeetingTime(at(20, 30))).toBe(true);
    // A 1h45 meeting, then half an hour.
    expect(isAroundMeetingTime(at(21, 15))).toBe(true);
    expect(isAroundMeetingTime(at(21, 16))).toBe(false);
  });

  it('is never without a meeting today', async () => {
    const { isAroundMeetingTime } = await import('../zoom');
    expect(isAroundMeetingTime(at(19))).toBe(false);
  });

  it('is all day on the Memorial, which has no start time', async () => {
    dateMocks.isMemorialDay.mockReturnValue(true);
    const { isAroundMeetingTime } = await import('../zoom');
    expect(isAroundMeetingTime(at(10))).toBe(true);
  });
});

describe('what the action island shows', () => {
  it('remembers what the last look at Zoom found', async () => {
    const { getZoomMeetingState } = await import('../zoom');

    await getZoomMeetingState();
    expect(zoomState.meeting).toEqual({ found: true, sharing: false });

    meetingFound = false;
    await getZoomMeetingState();
    expect(zoomState.meeting).toEqual({ found: false, sharing: false });
  });
});

describe('Zoom meeting auto-launch', () => {
  it('launches the meeting when no Zoom meeting is open yet', async () => {
    currentSettings.zoomMeetingManagerAutoLaunchMeeting = true;
    meetingFound = false;
    const { autoLaunchZoomMeetingIfNeeded } = await import('../zoom');

    await autoLaunchZoomMeetingIfNeeded();

    expect(launchZoomMeetingMock).toHaveBeenCalledWith('123 456');
  });

  it('does not launch a second meeting', async () => {
    currentSettings.zoomMeetingManagerAutoLaunchMeeting = true;
    const { autoLaunchZoomMeetingIfNeeded } = await import('../zoom');

    await autoLaunchZoomMeetingIfNeeded();

    expect(launchZoomMeetingMock).not.toHaveBeenCalled();
  });
});

describe('Zoom automations and the startup check', () => {
  it('do nothing while a failed check has paused them', async () => {
    const {
      autoLaunchZoomMeetingIfNeeded,
      automateZoomMediaSharing,
      automateZoomMeetingSettings,
    } = await import('../zoom');
    Object.assign(currentSettings, {
      zoomMeetingManagerAutoLaunchMeeting: true,
      zoomMeetingManagerAutomateMeetingAudioSettings: true,
    });
    zoomState.automationsPaused = true;
    meetingFound = false;

    await automateZoomMeetingSettings();
    expect(await automateZoomMediaSharing(true)).toBe(false);
    await autoLaunchZoomMeetingIfNeeded();

    expect(zoomCommandMock).not.toHaveBeenCalled();
    expect(launchZoomMeetingMock).not.toHaveBeenCalled();
  });

  // The check's own "automations paused" notice may have been closed by
  // the time media is shown: the media not reaching Zoom is said each time.
  // Like the check's own notice, it offers to test Zoom again, or the setup
  // assistant once Zoom's buttons no longer read as learned.
  it.each([
    { event: 'testZoomAgain', label: 'Test again', relearnNeeded: false },
    {
      event: 'openZoomSetupAssistant',
      label: 'Open setup assistant',
      relearnNeeded: true,
    },
  ])(
    'say the media was not shared in Zoom while paused, at meeting time, with "$label"',
    async ({ event, label, relearnNeeded }) => {
      const { automateZoomMediaSharing } = await import('../zoom');
      zoomState.automationsPaused = true;
      zoomState.relearnNeeded = relearnNeeded;
      dateMocks.getMeetingStartToday.mockReturnValue(
        new Date(Date.now() + 10 * 60 * 1000),
      );
      const dispatched: string[] = [];
      const dispatch = vi
        .spyOn(globalThis, 'dispatchEvent')
        .mockImplementation((sent) => {
          dispatched.push(sent.type);
          return true;
        });

      expect(await automateZoomMediaSharing(true)).toBe(false);

      expect(zoomCommandMock).not.toHaveBeenCalled();
      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          caption: 'Share the media window from Zoom yourself.',
          group: 'zoom-sharing',
          message:
            "Zoom automations are paused, so the media wasn't shared in Zoom",
          // Red, like the other "not shared in Zoom" failure with this caption.
          type: 'negative',
        }),
      );
      const [{ actions }] = notifyMock.mock.calls[0] as [
        { actions: { handler: () => void; label: string }[] },
      ];
      expect(actions.map((action) => action.label)).toEqual([label, undefined]);
      // Its own actions replace the default close button: it gets one again.
      expect(actions[1]).toEqual({
        color: 'white',
        icon: 'close',
        round: true,
      });
      actions[0]?.handler();
      expect(dispatched).toEqual([event]);
      dispatch.mockRestore();
    },
  );

  it('say nothing of it while paused outside meeting time', async () => {
    const { automateZoomMediaSharing } = await import('../zoom');
    zoomState.automationsPaused = true;

    expect(await automateZoomMediaSharing(true)).toBe(false);

    expect(notifyMock).not.toHaveBeenCalled();
  });

  it('wait for a check in progress, which uses Zoom too', async () => {
    const { automateZoomMeetingSettings, runWhileHoldingZoomAutomations } =
      await import('../zoom');
    currentSettings.zoomMeetingManagerAutomateMeetingAudioSettings = true;
    let finishCheck: () => void = () => undefined;
    const check = runWhileHoldingZoomAutomations(
      () =>
        new Promise<void>((resolve) => {
          finishCheck = resolve;
        }),
    );

    const automation = automateZoomMeetingSettings();
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(zoomCommandMock).not.toHaveBeenCalled();

    finishCheck();
    await check;
    await automation;
    expect(commandTypes()).toEqual([
      'meeting',
      'join-audio',
      'set-mic',
      'set-video',
      'mute-all',
    ]);
  });
});

// MMM-V2-3NC: the helper said which windows the Share press left open, but
// that never reached the check's report.
describe('testing the share window', () => {
  it("passes on how Share was pressed and what Zoom showed when the share window didn't open", async () => {
    zoomCommandMock.mockResolvedValue({
      ok: true,
      opened: false,
      pickerError: 'share-picker-not-found',
      pressedVia: 'more',
      presses: 2,
      snapshot: { windows: ['ZPContentViewWndClass'] },
      windowListed: false,
      windowsLeft: ['zBubbleBaseClass'],
      windowsOpened: ['zBubbleBaseClass', 'ZPMoreMenuClass'],
    });
    const { testZoomShareEntry } = await import('../zoom');

    expect(await testZoomShareEntry('Share')).toEqual({
      error: undefined,
      opened: false,
      pickerError: 'share-picker-not-found',
      pressedVia: 'more',
      presses: 2,
      snapshot: { windows: ['ZPContentViewWndClass'] },
      windowListed: false,
      windowSelected: false,
      windowsLeft: ['zBubbleBaseClass'],
      windowsOpened: ['zBubbleBaseClass', 'ZPMoreMenuClass'],
    });
  });
});

describe('Zoom setup assistant', () => {
  it('is only needed once the Manager is on and a button is unknown', async () => {
    const { isZoomSetupNeeded } = await import('../zoom');

    currentSettings.zoomMeetingManagerEnable = true;
    currentSettings.zoomVideoOnTitle = null;
    expect(isZoomSetupNeeded()).toBe(true);

    currentSettings.zoomVideoOnTitle = 'Stop Video';
    currentSettings.zoomVideoOffTitle = 'Start Video';
    expect(isZoomSetupNeeded()).toBe(false);

    currentSettings.zoomMicOnTitle = null;
    expect(isZoomSetupNeeded()).toBe(true);
    currentSettings.zoomMicOnTitle = 'Mute';

    currentSettings.zoomMeetingManagerEnable = false;
    currentSettings.zoomVideoOnTitle = null;
    expect(isZoomSetupNeeded()).toBe(false);
    currentSettings.zoomMeetingManagerEnable = true;
  });

  it('learns the microphone button by switching it once and back', async () => {
    currentSettings.zoomMicOnTitle = null;
    currentSettings.zoomMicOffTitle = null;
    const toggles = [
      { after: 'Unmute', before: 'Mute', ok: true },
      { after: 'Mute', before: 'Unmute', ok: true },
    ];
    zoomCommandMock.mockImplementation(
      async () => toggles.shift() ?? { ok: false },
    );
    const { learnZoomMicTitles } = await import('../zoom');

    expect(await learnZoomMicTitles(true)).toEqual({ ok: true });

    expect(commandTypes()).toEqual(['toggle-mic', 'toggle-mic']);
    expect(currentSettings.zoomMicOnTitle).toBe('Mute');
    expect(currentSettings.zoomMicOffTitle).toBe('Unmute');
  });

  it("learns raised hands through Zoom's Reactions button, remembering its name", async () => {
    Object.assign(currentSettings, {
      zoomHandButtonTitle: null,
      zoomHandRaisedPhrase: null,
      zoomReactButtonTitle: 'React',
    });
    zoomCommandMock.mockResolvedValue({
      ok: true,
      phrase: 'Hand raised',
      reactButtonTitle: 'Reactions',
    });
    const { learnZoomHandRaisedPhrase } = await import('../zoom');

    await learnZoomHandRaisedPhrase();

    expect(zoomCommandMock).toHaveBeenCalledWith({
      handRaiseTitle: null,
      reactButtonTitle: 'React',
      titles: expect.any(Object),
      type: 'learn-hand-raised',
    });
    expect(currentSettings).toMatchObject({
      zoomHandButtonTitle: null,
      zoomHandRaisedPhrase: 'Hand raised',
      zoomReactButtonTitle: 'Reactions',
    });
  });

  it("learns raised hands through Zoom's plain Raise hand button", async () => {
    Object.assign(currentSettings, {
      zoomHandButtonTitle: null,
      zoomHandRaisedPhrase: null,
      zoomReactButtonTitle: 'React',
    });
    zoomCommandMock.mockResolvedValue({
      handButtonTitle: 'Raise hand',
      ok: true,
      phrase: 'Hand raised',
      reactButtonTitle: null,
    });
    const { learnZoomHandRaisedPhrase } = await import('../zoom');

    await learnZoomHandRaisedPhrase('Raise hand');

    expect(zoomCommandMock).toHaveBeenCalledWith({
      handRaiseTitle: null,
      reactButtonTitle: 'Raise hand',
      titles: expect.any(Object),
      type: 'learn-hand-raised',
    });
    // Zoom has no React button for this account: none is looked for again.
    expect(currentSettings).toMatchObject({
      zoomHandButtonTitle: 'Raise hand',
      zoomHandRaisedPhrase: 'Hand raised',
      zoomReactButtonTitle: null,
    });

    // Learning again goes by the button learned, whatever Zoom shows first.
    zoomCommandMock.mockClear();
    await learnZoomHandRaisedPhrase();
    expect(zoomCommandMock).toHaveBeenCalledWith({
      handRaiseTitle: 'Raise hand',
      reactButtonTitle: null,
      titles: expect.any(Object),
      type: 'learn-hand-raised',
    });
  });

  it('keeps the Reactions button name when learning raised hands fails', async () => {
    Object.assign(currentSettings, {
      zoomHandRaisedPhrase: null,
      zoomReactButtonTitle: 'React',
    });
    zoomCommandMock.mockResolvedValue({
      error: 'reaction-panel-not-found',
      ok: false,
    });
    const { learnZoomHandRaisedPhrase } = await import('../zoom');

    await learnZoomHandRaisedPhrase();

    expect(currentSettings).toMatchObject({
      zoomHandRaisedPhrase: null,
      zoomReactButtonTitle: 'React',
    });
  });

  it('sends the names learned so far with every action and keeps what the helper learns', async () => {
    Object.assign(currentSettings, {
      zoomJoinAudioTitle: null,
      zoomMuteAllTitle: null,
      zoomParticipantsButtonTitle: 'Participants',
      zoomStopShareTitle: null,
    });
    zoomCommandMock.mockResolvedValue({
      diagnosis: { meeting: true },
      learned: { joinAudio: 'Join audio', muteAll: 'Mute all' },
      ok: true,
    });
    const { diagnoseZoom } = await import('../zoom');

    await diagnoseZoom();

    expect(zoomCommandMock).toHaveBeenCalledWith({
      titles: {
        joinAudio: null,
        micOff: 'Unmute',
        micOn: 'Mute',
        muteAll: null,
        participants: 'Participants',
        stopShare: null,
      },
      type: 'diagnose',
    });
    expect(currentSettings).toMatchObject({
      zoomJoinAudioTitle: 'Join audio',
      zoomMuteAllTitle: 'Mute all',
      zoomParticipantsButtonTitle: 'Participants',
    });
  });

  it('keeps a Participants entry the user picked only once it opened the panel', async () => {
    currentSettings.zoomParticipantsButtonTitle = null;
    zoomCommandMock.mockResolvedValueOnce({
      error: 'participants-button-not-found',
      ok: false,
    });
    const { tryZoomParticipantsEntry } = await import('../zoom');

    expect(await tryZoomParticipantsEntry('Enregistrer')).toBe(false);
    expect(currentSettings.zoomParticipantsButtonTitle).toBeNull();

    expect(await tryZoomParticipantsEntry('Participants')).toBe(true);
    // Through the entry even if the panel was open: closed, then opened.
    expect(zoomCommandMock).toHaveBeenLastCalledWith({
      reopen: true,
      titles: expect.objectContaining({ participants: 'Participants' }),
      type: 'participants',
    });
    expect(currentSettings.zoomParticipantsButtonTitle).toBe('Participants');
  });

  it("has the setup assistant's checks open the participants panel through its button, even when it's open", async () => {
    zoomCommandMock.mockResolvedValue({
      diagnosis: { meeting: true },
      ok: true,
    });
    const { diagnoseZoom } = await import('../zoom');

    await diagnoseZoom({ reopenParticipants: true });
    expect(zoomCommandMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ reopenParticipants: true, type: 'diagnose' }),
    );

    // The check before a meeting leaves an open panel as it is.
    await diagnoseZoom();
    expect(zoomCommandMock).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ reopenParticipants: true }),
    );
  });

  it('keeps a "Mute all" or "Stop share" pick only once Zoom confirmed it', async () => {
    zoomCommandMock.mockImplementation(async (command) => {
      if (command.type === 'panel-entries') {
        return { entries: ['Invite', 'Mute all'], ok: true };
      }
      if (command.type === 'test-mute-all-entry') {
        return { isMuteAll: command.title === 'Mute all', ok: true };
      }
      if (command.type === 'share-toolbar-entries') {
        return { entries: ['Pause share', 'Stop share'], ok: true };
      }
      if (command.type === 'test-stop-share-entry') {
        return { ok: true, stopped: command.title === 'Stop share' };
      }
      return { ok: true };
    });
    const {
      getZoomPanelEntries,
      getZoomShareToolbarEntries,
      tryZoomMuteAllEntry,
      tryZoomStopShareEntry,
    } = await import('../zoom');

    expect(await getZoomPanelEntries()).toEqual(['Invite', 'Mute all']);
    expect(await tryZoomMuteAllEntry('Invite')).toBe(false);
    expect(await tryZoomMuteAllEntry('Mute all')).toBe(true);
    expect(await getZoomShareToolbarEntries()).toEqual([
      'Pause share',
      'Stop share',
    ]);
    expect(await tryZoomStopShareEntry('Pause share')).toBe(false);
    expect(await tryZoomStopShareEntry('Stop share')).toBe(true);
  });

  it('leaves what Zoom showed on the Sentry trail when an action fails', async () => {
    zoomCommandMock.mockResolvedValue({
      error: 'participants-panel-not-opened',
      ok: false,
      snapshot: { toolbar: ['Mute, Alt+A'], zoomVersion: '7.2.1' },
    });
    const { muteAllZoomParticipants } = await import('../zoom');

    await muteAllZoomParticipants(false);

    await vi.waitFor(() =>
      expect(sentryMocks.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'zoom',
          data: {
            error: 'participants-panel-not-opened',
            toolbar: ['Mute, Alt+A'],
            zoomVersion: '7.2.1',
          },
          message: 'Zoom action failed: mute-all',
        }),
      ),
    );
  });

  it('keeps the latest failed actions for the startup check to report', async () => {
    zoomCommandMock.mockResolvedValue({
      error: 'participants-panel-not-opened',
      ok: false,
      snapshot: { toolbar: ['Mute, Alt+A'] },
    });
    const {
      getZoomMeetingState,
      muteAllZoomParticipants,
      takeZoomActionFailures,
    } = await import('../zoom');

    await muteAllZoomParticipants(false);

    expect(takeZoomActionFailures()).toContainEqual({
      action: 'mute-all',
      error: 'participants-panel-not-opened',
      snapshot: { toolbar: ['Mute, Alt+A'] },
    });
    // Taken: the next report starts afresh.
    expect(takeZoomActionFailures()).toEqual([]);

    // Only the latest ones are kept.
    for (let i = 0; i < 25; i++) await getZoomMeetingState(); // NOSONAR: sequential - one failure each
    expect(takeZoomActionFailures()).toHaveLength(20);
  });

  it('joins computer audio for the microphone step without telling the checklist', async () => {
    const { joinZoomAudioForSetup } = await import('../zoom');

    expect(await joinZoomAudioForSetup()).toBe('joined');

    expect(commandTypes()).toEqual(['join-audio']);
    expect(updateChecklistMock).not.toHaveBeenCalled();
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("says when M³ can't tell whether computer audio is joined, and learns the microphone on the user's word", async () => {
    zoomCommandMock.mockResolvedValueOnce({
      audioStateUnknown: true,
      changed: false,
      ok: true,
    });
    const { joinZoomAudioForSetup, learnZoomMicTitles } =
      await import('../zoom');

    expect(await joinZoomAudioForSetup()).toBe('unknown');

    const toggles = [
      { after: 'Unmute', before: 'Mute', ok: true },
      { after: 'Mute', before: 'Unmute', ok: true },
    ];
    zoomCommandMock.mockImplementation(
      async () => toggles.shift() ?? { ok: false },
    );
    expect(await learnZoomMicTitles(true, true)).toEqual({ ok: true });
    expect(zoomCommandMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ assumeAudioJoined: true, type: 'toggle-mic' }),
    );
    expect(currentSettings.zoomMicOnTitle).toBe('Mute');
  });

  it('notices Zoom changing (updated, or buttons no longer reading as learned) once each', async () => {
    Object.assign(currentSettings, {
      zoomLearnedVersion: '7.2.1',
      zoomVideoOffTitle: 'Start Video',
      zoomVideoOnTitle: 'Stop Video',
    });
    const changed = vi.fn();
    globalThis.addEventListener('zoomChanged', changed);
    const states = [
      { found: true, sharing: false, zoomVersion: '7.2.1' },
      { found: true, sharing: false, zoomVersion: '7.3.0' },
      { found: true, sharing: false, zoomVersion: '7.3.0' },
      { found: true, sharing: false, videoTitle: 'Stop Video' },
      { found: true, sharing: false, videoTitle: 'Vidéo' },
      { found: true, sharing: false, videoTitle: 'Vidéo' },
    ];
    zoomCommandMock.mockImplementation(async () => ({
      meeting: states.shift(),
      ok: true,
    }));
    const { getZoomMeetingState, rememberZoomVersion } =
      await import('../zoom');

    for (let i = 0; i < 6; i++) await getZoomMeetingState(); // NOSONAR: sequential, in order

    expect(changed).toHaveBeenCalledTimes(2);
    expect(changed.mock.calls.map(([e]) => (e as CustomEvent).detail)).toEqual([
      { reason: 'version' },
      { reason: 'names' },
    ]);
    globalThis.removeEventListener('zoomChanged', changed);

    // A passing check keeps the version the names work with.
    zoomState.meeting = { found: true, sharing: false, zoomVersion: '7.3.0' };
    rememberZoomVersion();
    expect(currentSettings.zoomLearnedVersion).toBe('7.3.0');
  });

  it.each([
    ['Start my video', true],
    ['Start Video', false],
    ['Stop Video', false],
    // Zoom's toolbar hidden: can't be told.
    [null, false],
  ])(
    'tells whether the camera button reading "%s" means Zoom\'s names changed',
    async (videoTitle, changed) => {
      const { zoomNamesChanged } = await import('../zoom');

      expect(
        zoomNamesChanged({ found: true, sharing: false, videoTitle }),
      ).toBe(changed);
    },
  );
});

// Shared videos sounded muffled or choppy to Zoom participants in a hall
// whose sound desk sends the media computer's own output back to it as
// Zoom's microphone: Zoom got the media's sound twice.
describe('the host microphone while media plays', () => {
  const VIDEO = 'file:///C:/Media/video.mp4';
  const SONG = 'file:///C:/Media/song.mp3';
  const PICTURE = 'file:///C:/Media/picture.jpg';

  const micCommands = () =>
    zoomCommandMock.mock.calls
      .map(([command]) => command)
      .filter((command) => command.type === 'set-mic')
      .map((command) => ('on' in command ? command.on : null));

  // A minute-long video or audio file, playing at `position` seconds.
  const playing = (
    url: string,
    position: number,
    more: Partial<HostMicPlayback> = {},
  ): HostMicPlayback => ({
    action: 'play',
    confirmed: true,
    end: 60,
    loops: false,
    position,
    rate: 1,
    url,
    ...more,
  });

  const STOPPED: HostMicPlayback = {
    action: '',
    confirmed: false,
    end: 0,
    loops: false,
    position: 0,
    rate: 1,
    url: '',
  };

  const loadZoom = async () => {
    const zoom = await import('../zoom');
    return {
      ...zoom,
      // Plays `url` through each of `positions`, in turn.
      play: async (
        url: string,
        positions: number[],
        more: Partial<HostMicPlayback> = {},
      ) => {
        for (const position of positions) {
          await zoom.followZoomHostMicWithMedia(playing(url, position, more));
        }
      },
    };
  };

  beforeEach(() => {
    Object.assign(currentSettings, {
      zoomMeetingManagerAutomateMediaSharing: true,
      zoomMeetingManagerMuteHostMicDuringMedia: true,
    });
  });

  it.each([VIDEO, SONG])(
    'mutes it 5 seconds into media with sound, and unmutes it 10 seconds before its end (%s)',
    async (url) => {
      const { automateZoomMediaSharing, play } = await loadZoom();

      expect(await automateZoomMediaSharing(true)).toBe(true);
      await play(url, [0, 0.3, 4.9]);
      expect(micCommands()).toEqual([]);

      await play(url, [5, 20, 49.9]);
      expect(micCommands()).toEqual([false]);

      await play(url, [50, 59.9]);
      expect(micCommands()).toEqual([false, true]);

      // Already unmuted as the media ends.
      expect(await automateZoomMediaSharing(false)).toBe(true);
      expect(commandTypes()).toEqual([
        'meeting',
        'start-share',
        'set-mic',
        'set-mic',
        'meeting',
        'stop-share',
      ]);
      // Only for the media's time: the meeting checklist stays as it was.
      expect(updateChecklistMock).not.toHaveBeenCalled();
      expect(notifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          group: 'zoom-host',
          message: 'Host microphone muted while the media plays',
        }),
      );
    },
  );

  it('counts the 5 seconds from where the media started playing', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);

    // A trimmed or cued video, which starts a minute in.
    await play(VIDEO, [60, 64.9], { end: 120 });
    expect(micCommands()).toEqual([]);

    await play(VIDEO, [65], { end: 120 });
    expect(micCommands()).toEqual([false]);
  });

  it('waits for the media window to report the new media before counting', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);

    // Still the media before's position.
    await play(VIDEO, [45], { confirmed: false });
    await play(VIDEO, [0.5, 5.4]);
    expect(micCommands()).toEqual([]);

    await play(VIDEO, [5.5]);
    expect(micCommands()).toEqual([false]);
  });

  it('unmutes it while the media is paused, and mutes it again as it resumes', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);

    await play(VIDEO, [0, 6]);
    await play(VIDEO, [20], { action: 'pause' });
    expect(micCommands()).toEqual([false, true]);

    await play(VIDEO, [20]);
    expect(micCommands()).toEqual([false, true, false]);
  });

  it('still waits out the first 5 seconds when paused before them', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);

    await play(VIDEO, [0, 3]);
    await play(VIDEO, [3], { action: 'pause' });
    await play(VIDEO, [3, 4.9]);
    expect(micCommands()).toEqual([]);

    await play(VIDEO, [5]);
    expect(micCommands()).toEqual([false]);
  });

  it('mutes it again when the user goes back from its last 10 seconds', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);

    await play(VIDEO, [0, 6, 55, 30]);

    expect(micCommands()).toEqual([false, true, false]);
  });

  it('keeps it muted through media that starts over at its end', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);

    await play(VIDEO, [0, 6, 55, 59.9, 0, 3], { loops: true });

    expect(micCommands()).toEqual([false]);
  });

  it("keeps it muted until the media stops when its end isn't known", async () => {
    const { automateZoomMediaSharing, followZoomHostMicWithMedia, play } =
      await loadZoom();
    await automateZoomMediaSharing(true);

    await play(VIDEO, [0, 6, 3600], { end: 0 });
    expect(micCommands()).toEqual([false]);

    await followZoomHostMicWithMedia(STOPPED);
    expect(micCommands()).toEqual([false, true]);
  });

  it('leaves it on for media that plays less than 30 seconds', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);

    await play(VIDEO, [0, 5, 10, 19.9, 29.8], { end: 29.9 });
    // A clip trimmed (or cued) out of a longer file: what plays is short.
    await play(SONG, [100, 106, 115], { end: 120 });

    expect(micCommands()).toEqual([]);
  });

  it('mutes it for media that plays 30 seconds', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);

    await play(VIDEO, [0, 5, 20], { end: 30 });

    expect(micCommands()).toEqual([false, true]);
  });

  it('mutes it for short media that starts over at its end', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);

    await play(VIDEO, [0, 5, 9, 0, 3], { end: 10, loops: true });

    expect(micCommands()).toEqual([false]);
  });

  it('counts in seconds of playback at another speed', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);

    await play(VIDEO, [0, 9.9], { rate: 2 });
    expect(micCommands()).toEqual([]);

    await play(VIDEO, [10, 39.9], { rate: 2 });
    expect(micCommands()).toEqual([false]);

    await play(VIDEO, [40], { rate: 2 });
    expect(micCommands()).toEqual([false, true]);
  });

  it('unmutes it as soon as the media is stopped, before the share stops', async () => {
    const { automateZoomMediaSharing, followZoomHostMicWithMedia, play } =
      await loadZoom();
    await automateZoomMediaSharing(true);
    await play(VIDEO, [0, 6]);

    await followZoomHostMicWithMedia(STOPPED);
    await automateZoomMediaSharing(false);

    expect(commandTypes()).toEqual([
      'meeting',
      'start-share',
      'set-mic',
      'set-mic',
      'meeting',
      'stop-share',
    ]);
    expect(micCommands()).toEqual([false, true]);
  });

  it('unmutes it once the share stops, if the media stopping did not', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);
    await play(VIDEO, [0, 6]);

    expect(await automateZoomMediaSharing(false)).toBe(true);

    expect(commandTypes()).toEqual([
      'meeting',
      'start-share',
      'set-mic',
      'meeting',
      'stop-share',
      'set-mic',
    ]);
    expect(micCommands()).toEqual([false, true]);
  });

  it('mutes it as the share starts when the first 5 seconds played meanwhile', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();

    await play(VIDEO, [0, 6]);
    expect(micCommands()).toEqual([]);

    await automateZoomMediaSharing(true);
    await vi.waitFor(() => expect(micCommands()).toEqual([false]));
    expect(commandTypes()).toEqual(['meeting', 'start-share', 'set-mic']);
  });

  it('leaves it alone for a picture', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();

    await automateZoomMediaSharing(true);
    await play(PICTURE, [0, 30]);
    await automateZoomMediaSharing(false);

    expect(micCommands()).toEqual([]);
  });

  it('follows the media while the share goes on: a picture unmutes it, the next video mutes it 5 seconds in', async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();

    await automateZoomMediaSharing(true);
    await play(VIDEO, [0, 6]);
    await play(PICTURE, [0]);
    await play(SONG, [0, 4]);
    expect(micCommands()).toEqual([false, true]);

    await play(SONG, [5]);
    expect(micCommands()).toEqual([false, true, false]);
  });

  it("doesn't unmute a microphone the host had muted already", async () => {
    const respond = zoomCommandMock.getMockImplementation();
    zoomCommandMock.mockImplementation(async (command) =>
      command.type === 'set-mic'
        ? { changed: false, ok: true }
        : (respond?.(command) ?? { ok: false }),
    );
    const { automateZoomMediaSharing, play } = await loadZoom();

    await automateZoomMediaSharing(true);
    await play(VIDEO, [0, 6, 50]);
    await automateZoomMediaSharing(false);

    expect(micCommands()).toEqual([false]);
  });

  it("does nothing when the share doesn't start", async () => {
    failing = { 'start-share': 'share-picker-not-found' };
    const { automateZoomMediaSharing, play } = await loadZoom();

    expect(await automateZoomMediaSharing(true)).toBe(false);
    await play(VIDEO, [0, 6]);

    expect(micCommands()).toEqual([]);
  });

  it('does nothing with a share the user started', async () => {
    zoomSharing = true;
    const { automateZoomMediaSharing, play } = await loadZoom();

    await automateZoomMediaSharing(true);
    await play(VIDEO, [0, 6]);
    await automateZoomMediaSharing(false);

    expect(micCommands()).toEqual([]);
  });

  it("does nothing once M³'s share has stopped", async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();

    await automateZoomMediaSharing(true);
    await automateZoomMediaSharing(false);
    await play(VIDEO, [0, 6]);

    expect(micCommands()).toEqual([]);
  });

  it('does nothing with the setting off', async () => {
    currentSettings.zoomMeetingManagerMuteHostMicDuringMedia = false;
    const { automateZoomMediaSharing, play } = await loadZoom();

    await automateZoomMediaSharing(true);
    await play(SONG, [0, 6]);
    await automateZoomMediaSharing(false);

    expect(micCommands()).toEqual([]);
  });

  it("doesn't mute it while the Zoom automations are paused", async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);
    zoomState.automationsPaused = true;

    await play(VIDEO, [0, 6]);

    expect(micCommands()).toEqual([]);
  });

  it('makes one change at a time, skipping one undone before its turn', async () => {
    let release: (() => void) | undefined;
    const respond = zoomCommandMock.getMockImplementation();
    zoomCommandMock.mockImplementation(async (command) => {
      if (command.type === 'set-mic') {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
      return respond?.(command) ?? { ok: false };
    });
    const { automateZoomMediaSharing, followZoomHostMicWithMedia: follow } =
      await loadZoom();
    await automateZoomMediaSharing(true);
    await follow(playing(VIDEO, 0));

    // Paused while it's being muted: unmuting waits for the mute.
    void follow(playing(VIDEO, 6));
    await vi.waitFor(() => expect(micCommands()).toEqual([false]));
    const unmuting = follow(playing(VIDEO, 7, { action: 'pause' }));
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(micCommands()).toEqual([false]);
    release?.();
    await vi.waitFor(() => expect(micCommands()).toEqual([false, true]));
    release?.();
    await unmuting;

    // Paused and resumed while it's being muted: no unmute, nor a second mute.
    void follow(playing(VIDEO, 8));
    await vi.waitFor(() => expect(micCommands()).toEqual([false, true, false]));
    void follow(playing(VIDEO, 9, { action: 'pause' }));
    const resumed = follow(playing(VIDEO, 9));
    release?.();
    await resumed;
    expect(micCommands()).toEqual([false, true, false]);
  });

  it("says so when it can't mute it, and shares all the same", async () => {
    failing = { 'set-mic': 'share-toolbar-mic-button-not-found' };
    const { automateZoomMediaSharing, play } = await loadZoom();

    expect(await automateZoomMediaSharing(true)).toBe(true);
    await play(VIDEO, [0, 6]);

    expect(commandTypes()).toContain('start-share');
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        group: 'zoom-host',
        message: expect.stringContaining('couldn’t mute the host microphone'),
        timeout: 15_000,
        type: 'warning',
      }),
    );
  });

  it.each(['audio-not-joined', 'cancelled'])(
    'says nothing when it could not mute it for %s',
    async (error) => {
      failing = { 'set-mic': error };
      const { automateZoomMediaSharing, play } = await loadZoom();

      await automateZoomMediaSharing(true);
      await play(VIDEO, [0, 6]);

      expect(micCommands()).toEqual([false]);
      expect(notifyMock).not.toHaveBeenCalledWith(
        expect.objectContaining({ group: 'zoom-host' }),
      );
    },
  );

  it("says so when it can't unmute it after the media", async () => {
    const { automateZoomMediaSharing, play } = await loadZoom();
    await automateZoomMediaSharing(true);
    await play(VIDEO, [0, 6]);
    failing = { 'set-mic': 'share-toolbar-mic-button-not-found' };

    await automateZoomMediaSharing(false);

    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        group: 'zoom-host',
        message: expect.stringContaining('couldn’t unmute the host microphone'),
        // The hall can't be heard in Zoom until someone unmutes it.
        timeout: 0,
        type: 'negative',
      }),
    );
  });

  it('follows the media playing once started', async () => {
    const { automateZoomMediaSharing, startZoomHostMicMediaSync } =
      await loadZoom();
    await automateZoomMediaSharing(true);
    // Stops the watcher with the test (each test loads the module afresh).
    const scope = effectScope();
    try {
      // Trimmed to its first 45 seconds.
      const item = { customDuration: { max: 45, min: 0 }, duration: 60 };
      scope.run(() => startZoomHostMicMediaSync(() => item));

      Object.assign(mediaPlaying, {
        action: 'play',
        currentPosition: 0.5,
        playbackConfirmedToken: 1,
        playToken: 1,
        url: VIDEO,
      });
      await nextTick();
      mediaPlaying.currentPosition = 6;
      await vi.waitFor(() => expect(micCommands()).toEqual([false]));

      mediaPlaying.currentPosition = 35;
      await vi.waitFor(() => expect(micCommands()).toEqual([false, true]));
    } finally {
      scope.stop();
    }
  });
});

describe('what the host microphone goes by of the media playing', () => {
  const mediaPlayingState = (
    more: Partial<MediaPlayingState> = {},
  ): MediaPlayingState => ({
    action: 'play',
    currentPosition: 12,
    currentPositionUpdatedAt: 0,
    duration: 90,
    pan: {},
    playbackConfirmedToken: 1,
    playbackRate: 1,
    playToken: 1,
    seekTo: 0,
    shouldLoop: false,
    slideshowAudioUrl: '',
    subtitlesUrl: '',
    uniqueId: 'video',
    url: 'file:///C:/Media/video.mp4',
    zoom: 1,
    ...more,
  });

  it("reads the media window's report", async () => {
    const { getHostMicPlayback } = await import('../zoom');

    expect(
      getHostMicPlayback(mediaPlayingState({ playbackRate: 1.5 })),
    ).toEqual({
      action: 'play',
      confirmed: true,
      end: 90,
      loops: false,
      position: 12,
      rate: 1.5,
      url: 'file:///C:/Media/video.mp4',
    });
  });

  it('ends where the trim ends, or else where the file does', async () => {
    const { getHostMicPlayback } = await import('../zoom');
    const playing = mediaPlayingState();

    expect(
      getHostMicPlayback(playing, { customDuration: { max: 45, min: 10 } }).end,
    ).toBe(45);
    // A trim's end of 0 means to the end.
    expect(
      getHostMicPlayback(playing, { customDuration: { max: 0, min: 10 } }).end,
    ).toBe(90);
    // The media window hasn't said (or didn't say again, for media just as
    // long as the one before).
    expect(
      getHostMicPlayback(mediaPlayingState({ duration: 0 }), { duration: 75 })
        .end,
    ).toBe(75);
    expect(getHostMicPlayback(mediaPlayingState({ duration: 0 })).end).toBe(0);
  });

  it('starts over at its end when it repeats, or for a slideshow', async () => {
    const { getHostMicPlayback } = await import('../zoom');

    expect(
      getHostMicPlayback(mediaPlayingState(), { repeat: true }).loops,
    ).toBe(true);
    expect(
      getHostMicPlayback(mediaPlayingState({ shouldLoop: true })).loops,
    ).toBe(true);
  });

  it('is confirmed once the media window reported this play request moving', async () => {
    const { getHostMicPlayback } = await import('../zoom');

    // Not issued yet: media was just set.
    expect(
      getHostMicPlayback(
        mediaPlayingState({ playbackConfirmedToken: 0, playToken: 0 }),
      ).confirmed,
    ).toBe(false);
    expect(
      getHostMicPlayback(
        mediaPlayingState({ playbackConfirmedToken: 1, playToken: 2 }),
      ).confirmed,
    ).toBe(false);
  });
});

describe('stopping Zoom sharing after media', () => {
  it("stops the Zoom Meeting Manager's share when its media sharing is automated", async () => {
    Object.assign(currentSettings, {
      zoomMeetingManagerAutomateMediaSharing: true,
    });
    const { automateZoomMediaSharing, stopZoomSharingAfterMedia } =
      await import('../zoom');
    await automateZoomMediaSharing(true);

    stopZoomSharingAfterMedia();
    await vi.waitFor(() => expect(commandTypes()).toContain('stop-share'));
  });

  it('falls back to the keyboard-shortcut integration otherwise', async () => {
    Object.assign(currentSettings, {
      zoomMeetingManagerAutomateMediaSharing: false,
    });
    const { stopZoomSharingAfterMedia } = await import('../zoom');

    stopZoomSharingAfterMedia();
    await Promise.resolve();
    expect(commandTypes()).not.toContain('stop-share');
  });
});

describe("acting on a raised hand's participant", () => {
  const participantNotices = () =>
    notifyMock.mock.calls
      .map(([options]) => options as { group?: string; type?: string })
      .filter((options) => options.group === 'zoom-participants');

  it('says it unmuted them (or asked them to) as done, and an already unmuted one as information', async () => {
    const { unmuteZoomParticipant } = await import('../zoom');

    zoomCommandMock.mockResolvedValueOnce({ ok: true, pressed: true });
    await unmuteZoomParticipant('Ann');
    zoomCommandMock.mockResolvedValueOnce({ ok: true, pressed: false });
    await unmuteZoomParticipant('Ann');

    expect(participantNotices().map(({ type }) => type)).toEqual([
      'positive',
      'info',
    ]);
  });

  it('says it muted them and lowered their hand as done', async () => {
    const { muteZoomParticipantAndLowerHand } = await import('../zoom');

    await muteZoomParticipantAndLowerHand('Ann');

    expect(participantNotices().map(({ type }) => type)).toEqual(['positive']);
  });
});

describe('telling the user while M³ operates Zoom', () => {
  it('runs a whole sequence under one label and clears it afterwards', async () => {
    const labels: (null | string)[] = [];
    zoomCommandMock.mockImplementation(async (command) => {
      labels.push(zoomState.runLabel);
      if (command.type === 'meeting') {
        return { meeting: { found: true, sharing: false }, ok: true };
      }
      return { changed: true, ok: true };
    });
    const { runZoomMeetingSequence } = await import('../zoom');

    await runZoomMeetingSequence();

    // The read-only meeting lookup shows nothing; every action after it runs
    // under the sequence's label, not its own.
    expect(labels[0]).toBeNull();
    expect(new Set(labels.slice(1))).toEqual(
      new Set(['zoom-run-meeting-sequence']),
    );
    expect(zoomState.runActive).toBe(false);
  });

  it('shows nothing for read-only lookups', async () => {
    const { getZoomRaisedHands } = await import('../zoom');
    await getZoomRaisedHands();
    expect(zoomState.beginRun).not.toHaveBeenCalled();
  });

  it('counts the people in the meeting from a participants panel already open, when only peeking', async () => {
    zoomCommandMock
      .mockResolvedValueOnce({
        ok: true,
        participants: [
          { details: 'Host, me', name: 'Host', section: 'meeting' },
          { details: 'Waiting', name: 'Visitor', section: 'waiting' },
          { details: 'Guest', name: 'Guest', section: 'meeting' },
        ],
      })
      // The panel is closed: nothing to read without pressing anything.
      .mockResolvedValueOnce({ ok: true });
    const { countZoomMeetingParticipants } = await import('../zoom');

    expect(await countZoomMeetingParticipants({ peek: true })).toBe(2);
    expect(await countZoomMeetingParticipants({ peek: true })).toBeNull();
    expect(zoomCommandMock).toHaveBeenCalledWith(
      expect.objectContaining({ peek: true, type: 'participants' }),
    );
    expect(zoomState.beginRun).not.toHaveBeenCalled();
  });

  it('sends nothing more to Zoom once cancelled', async () => {
    const { cancelZoomRun, runZoomMeetingSequence } = await import('../zoom');
    zoomCommandMock.mockImplementation(async (command) => {
      if (command.type === 'meeting') {
        return { meeting: { found: true, sharing: false }, ok: true };
      }
      if (command.type === 'join-audio') await cancelZoomRun();
      return { changed: true, ok: true };
    });

    const result = await runZoomMeetingSequence();

    expect(result.ok).toBe(false);
    expect(commandTypes()).toEqual(['meeting', 'join-audio']);
    expect(restartZoomHelperMock).toHaveBeenCalled();
    expect(zoomState.runActive).toBe(false);
  });
});

describe('warning about an older Zoom', () => {
  /** Has the helper say this Zoom version for the meeting it finds. */
  const zoomSays = (zoomVersion: string) => {
    zoomCommandMock.mockImplementation(async () => ({
      meeting: { found: true, sharing: false, zoomVersion },
      ok: true,
    }));
  };

  const versionWarnings = () =>
    notifyMock.mock.calls.filter(
      ([props]) => props.group === 'zoom-outdated-version',
    );

  it('warns once a session that an older Zoom may be less reliable, and suggests updating it', async () => {
    zoomSays('6.5.12.14128');
    const { getZoomMeetingState } = await import('../zoom');

    await getZoomMeetingState();
    await getZoomMeetingState();

    expect(versionWarnings()).toEqual([
      [
        {
          caption:
            'Some features may be less reliable with it. Update Zoom at your earliest convenience.',
          deferWhileDialogOpen: true,
          group: 'zoom-outdated-version',
          icon: 'mmm-warning',
          message:
            'Zoom 6.5.12 is older than Zoom 7.2.1, the version M³ is tested with',
          timeout: 15_000,
          type: 'warning',
        },
      ],
    ]);
  });

  it('warns again for another older version, such as after an update that still falls short', async () => {
    const { getZoomMeetingState } = await import('../zoom');

    zoomSays('6.5.12.14128');
    await getZoomMeetingState();
    zoomSays('7.1.9.48550');
    await getZoomMeetingState();

    expect(versionWarnings()).toHaveLength(2);
  });

  it.each(['7.2.1.48556', '7.3.0.100'])(
    'says nothing about Zoom %s',
    async (version) => {
      zoomSays(version);
      const { getZoomMeetingState } = await import('../zoom');

      await getZoomMeetingState();

      expect(versionWarnings()).toEqual([]);
    },
  );

  it('says nothing while no integration that involves Zoom is on', async () => {
    currentSettings.zoomMeetingManagerEnable = false;
    zoomSays('6.5.12.14128');
    getInstalledZoomVersionMock.mockResolvedValue('6.5.12.14128');
    const { getZoomMeetingState, warnIfInstalledZoomOutdated } =
      await import('../zoom');

    try {
      await getZoomMeetingState();
      await warnIfInstalledZoomOutdated();
    } finally {
      currentSettings.zoomMeetingManagerEnable = true;
    }

    expect(versionWarnings()).toEqual([]);
    expect(getInstalledZoomVersionMock).not.toHaveBeenCalled();
  });

  describe("from the installed Zoom's files", () => {
    const integrations = [
      'obsEnable',
      'zoomEnable',
      'zoomMeetingManagerEnable',
    ] as const;

    /** Only `on` among the integrations that involve Zoom. */
    const onlyOn = (on: (typeof integrations)[number]) => {
      for (const key of integrations) currentSettings[key] = key === on;
    };

    afterEach(() => {
      onlyOn('zoomMeetingManagerEnable');
    });

    it.each(integrations)(
      'warns with only %s on, whether or not Zoom runs',
      async (on) => {
        onlyOn(on);
        getInstalledZoomVersionMock.mockResolvedValue('6.5.12.14128');
        const { warnIfInstalledZoomOutdated } = await import('../zoom');

        await warnIfInstalledZoomOutdated();

        expect(versionWarnings()).toHaveLength(1);
        expect(versionWarnings()[0]?.[0]).toMatchObject({
          message:
            'Zoom 6.5.12 is older than Zoom 7.2.1, the version M³ is tested with',
        });
        expect(commandTypes()).toEqual([]);
      },
    );

    it('takes a macOS version as Zoom gives it', async () => {
      getInstalledZoomVersionMock.mockResolvedValue('6.5.12 (63187)');
      const { warnIfInstalledZoomOutdated } = await import('../zoom');

      await warnIfInstalledZoomOutdated();

      expect(versionWarnings()[0]?.[0]).toMatchObject({
        message:
          'Zoom 6.5.12 is older than Zoom 7.2.1, the version M³ is tested with',
      });
    });

    it("doesn't warn twice when the meeting shows the same Zoom", async () => {
      getInstalledZoomVersionMock.mockResolvedValue('6.5.12.14128');
      zoomSays('6.5.12.14128');
      const { getZoomMeetingState, warnIfInstalledZoomOutdated } =
        await import('../zoom');

      await warnIfInstalledZoomOutdated();
      await warnIfInstalledZoomOutdated();
      await getZoomMeetingState();

      expect(versionWarnings()).toHaveLength(1);
    });

    it.each([
      ['Zoom not found', async () => null],
      [
        'reading it failed',
        async () => {
          throw new Error('IPC failed');
        },
      ],
    ])('stays silent when %s', async (_why, answer) => {
      getInstalledZoomVersionMock.mockImplementation(answer);
      const { warnIfInstalledZoomOutdated } = await import('../zoom');

      await expect(warnIfInstalledZoomOutdated()).resolves.toBeUndefined();

      expect(versionWarnings()).toEqual([]);
    });
  });
});

describe('describing Zoom for error reports', () => {
  it('reads what Zoom shows, without the overlay', async () => {
    const snapshot = {
      dialogs: { 'SomeZoomDialog 420x240': ['Join', 'Cancel'] },
      meeting: false,
      sharing: false,
      windows: ['SomeZoomDialog'],
      zoomVersion: '7.2.5.51704',
    };
    zoomCommandMock.mockResolvedValueOnce({ ok: true, snapshot });
    const { getZoomSnapshot } = await import('../zoom');

    expect(await getZoomSnapshot()).toEqual(snapshot);
    expect(commandTypes()).toEqual(['snapshot']);
    expect(zoomState.beginRun).not.toHaveBeenCalled();
  });

  it("gives null when the helper can't tell", async () => {
    zoomCommandMock.mockResolvedValueOnce({
      error: 'helper-not-running',
      ok: false,
    });
    const { getZoomSnapshot } = await import('../zoom');

    expect(await getZoomSnapshot()).toBeNull();
  });
});

describe("reporting Zoom's Original sound controls", () => {
  const probe = {
    audioMenu: {
      groups: [3, 4, 4, 2, 1],
      names: [
        'Mic modes',
        'Noise suppression (default), Checked',
        'Original sound for musicians, Unchecked',
      ],
      via: 'share-toolbar' as const,
    },
    meetingControls: ['Mute, Alt+A', 'End, Alt+Q'],
    sharing: true,
    zoomVersion: '7.2.1.48556',
  };

  // Whether the overlay was up as each probe reached the helper.
  let overlayDuringProbes: boolean[] = [];

  /** Answers the probe as `result`, and everything else as before. */
  const answerProbe = (result: ZoomCommandResult) => {
    overlayDuringProbes = [];
    const respond = zoomCommandMock.getMockImplementation();
    zoomCommandMock.mockImplementation(async (command) => {
      if (command.type !== 'original-sound-probe') {
        return respond?.(command) ?? { ok: false };
      }
      overlayDuringProbes.push(zoomState.runActive);
      return result;
    });
  };

  const probes = () =>
    commandTypes().filter((type) => type === 'original-sound-probe');

  it('reports what Zoom shows once, after the first share M³ started, without the overlay', async () => {
    sentryMocks.getClient.mockReturnValue({});
    answerProbe({ ok: true, originalSound: probe });
    const { automateZoomMediaSharing } = await import('../zoom');

    await automateZoomMediaSharing(true);
    await vi.waitFor(() =>
      expect(sentryMocks.captureMessage).toHaveBeenCalled(),
    );
    await automateZoomMediaSharing(false);
    await automateZoomMediaSharing(true);
    await automateZoomMediaSharing(false);

    expect(probes()).toHaveLength(1);
    expect(sentryMocks.captureMessage).toHaveBeenCalledTimes(1);
    expect(sentryMocks.captureMessage).toHaveBeenCalledWith(
      'Zoom original sound controls',
      {
        extra: probe,
        fingerprint: ['zoom-original-sound-controls'],
        level: 'info',
        tags: { feature: 'zoom-meeting-manager', zoomVersion: '7.2.1.48556' },
      },
    );
    expect(overlayDuringProbes).toEqual([false]);
  });

  it("doesn't open Zoom's audio menu when Sentry isn't set up", async () => {
    answerProbe({ ok: true, originalSound: probe });
    const { automateZoomMediaSharing } = await import('../zoom');

    expect(await automateZoomMediaSharing(true)).toBe(true);
    await automateZoomMediaSharing(false);

    expect(probes()).toEqual([]);
    expect(sentryMocks.captureMessage).not.toHaveBeenCalled();
  });

  it("doesn't look while M³ hasn't shared anything, nor for a share the user started", async () => {
    sentryMocks.getClient.mockReturnValue({});
    answerProbe({ ok: true, originalSound: probe });
    failing = { 'start-share': 'share-not-started' };
    const { automateZoomMediaSharing } = await import('../zoom');

    expect(await automateZoomMediaSharing(true)).toBe(false);
    failing = {};
    zoomSharing = true;
    expect(await automateZoomMediaSharing(true)).toBe(true);

    expect(probes()).toEqual([]);
  });

  it("reports nothing, and doesn't look again, when the helper doesn't answer", async () => {
    sentryMocks.getClient.mockReturnValue({});
    answerProbe({ error: 'helper-not-running', ok: false });
    const { automateZoomMediaSharing } = await import('../zoom');

    await automateZoomMediaSharing(true);
    await vi.waitFor(() => expect(probes()).toHaveLength(1));
    await automateZoomMediaSharing(false);
    await automateZoomMediaSharing(true);

    expect(probes()).toHaveLength(1);
    expect(sentryMocks.captureMessage).not.toHaveBeenCalled();
  });
});

describe('cancelling also stops the read-only lookups', () => {
  it('answers "cancelled" to a meeting lookup while a cancel is pending', async () => {
    zoomState.runDepth = 1;
    zoomState.cancelRequested = true;
    const { getZoomMeetingState } = await import('../zoom');

    expect(await getZoomMeetingState()).toBeNull();
    expect(zoomCommandMock).not.toHaveBeenCalled();
  });
});

// The meeting checklist goes by these to tell the user what M³ will do in
// Zoom, so they must match what the sequences themselves tick.
describe('what the Zoom sequences leave Zoom in', () => {
  /** Every checklist update the sequence made, merged in order. */
  const reportedState = () =>
    Object.assign(
      {},
      ...updateChecklistMock.mock.calls.map(([state]) => state as object),
    );

  const forgetButtonNames = () => {
    Object.assign(currentSettings, {
      zoomMicOffTitle: null,
      zoomMicOnTitle: null,
      zoomVideoOffTitle: null,
      zoomVideoOnTitle: null,
    });
    failing = {
      'set-mic': 'mic-titles-not-captured',
      'set-video': 'video-titles-not-captured',
    };
  };

  it.each([true, false])(
    'the meeting settings, with the button names learned: %s',
    async (learned) => {
      if (!learned) forgetButtonNames();
      const { getZoomMeetingSequenceOutcome, runZoomMeetingSequence } =
        await import('../zoom');

      await runZoomMeetingSequence();

      expect(getZoomMeetingSequenceOutcome()).toEqual(reportedState());
    },
  );

  it.each([
    [true, true],
    [true, false],
    [false, true],
  ])(
    'the before/after-meeting settings, with the button names learned: %s, asking everyone to unmute: %s',
    async (learned, askAllToUnmute) => {
      if (!learned) forgetButtonNames();
      currentSettings.zoomMeetingManagerPostMeetingAskToUnmute = askAllToUnmute;
      const { getZoomPostMeetingSequenceOutcome, runZoomPostMeetingSequence } =
        await import('../zoom');

      await runZoomPostMeetingSequence();

      expect(getZoomPostMeetingSequenceOutcome()).toEqual(reportedState());
    },
  );

  it('remembers when music asked for the before/after-meeting settings once the meeting started', async () => {
    const start = new Date(2026, 9, 15, 19, 30);
    dateMocks.getMeetingStartToday.mockReturnValue(start);
    const { automateZoomSettingsOnMusicStart, getAfterMeetingSettingsAskedAt } =
      await import('../zoom');
    expect(getAfterMeetingSettingsAskedAt()).toBeNull();

    // Before the meeting, the meeting's own schedule applies them.
    await automateZoomSettingsOnMusicStart(new Date(2026, 9, 15, 19, 0));
    expect(getAfterMeetingSettingsAskedAt()).toBeNull();

    const after = new Date(2026, 9, 15, 21, 20);
    await automateZoomSettingsOnMusicStart(after);
    expect(getAfterMeetingSettingsAskedAt()).toBe(after.getTime());
  });
});
