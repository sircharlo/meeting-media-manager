import type { ZoomCommand, ZoomCommandResult } from 'src/types';

import { MEDIA_WINDOW_TITLE } from 'src/constants/zoom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const currentSettings = {
  zoomHandRaisedPhrase: null as null | string,
  zoomJoinAudioTitle: null as null | string,
  zoomLearnedVersion: null as null | string,
  zoomMeetingManagerAutoLaunchMeeting: false,
  zoomMeetingManagerAutomateMeetingAudioSettings: false,
  zoomMeetingManagerAutomatePostMeetingAudioSettings: false,
  zoomMeetingManagerEnable: true,
  zoomMeetingManagerMeetingId: '123 456' as null | string,
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
    sentryMocks: { addBreadcrumb: vi.fn(), captureMessage: vi.fn() },
    updateChecklistMock: vi.fn(),
  }),
);

vi.mock('src/helpers/date', () => dateMocks);

vi.mock('@sentry/vue', () => sentryMocks);

vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => ({ currentSettings }),
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
  zoomState.cancelRequested = false;
  zoomState.runDepth = 0;
  zoomState.runLabel = null;
  Object.assign(currentSettings, {
    zoomMeetingManagerAutoLaunchMeeting: false,
    zoomMeetingManagerAutomateMeetingAudioSettings: false,
    zoomMeetingManagerAutomatePostMeetingAudioSettings: false,
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
  vi.stubGlobal('electronApi', {
    focusMediaWindow: vi.fn(),
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
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ group: 'zoom-automation', type: 'negative' }),
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
      expect.objectContaining({ group: 'zoom-sharing', type: 'negative' }),
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

    await autoLaunchZoomMeetingIfNeeded(600);

    expect(launchZoomMeetingMock).toHaveBeenCalledWith('123 456');
  });

  it('does not launch a second meeting', async () => {
    currentSettings.zoomMeetingManagerAutoLaunchMeeting = true;
    const { autoLaunchZoomMeetingIfNeeded } = await import('../zoom');

    await autoLaunchZoomMeetingIfNeeded(600);

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
    await autoLaunchZoomMeetingIfNeeded(600);

    expect(zoomCommandMock).not.toHaveBeenCalled();
    expect(launchZoomMeetingMock).not.toHaveBeenCalled();
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
      reactButtonTitle: 'React',
      titles: expect.any(Object),
      type: 'learn-hand-raised',
    });
    expect(currentSettings).toMatchObject({
      zoomHandRaisedPhrase: 'Hand raised',
      zoomReactButtonTitle: 'Reactions',
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
    expect(zoomCommandMock).toHaveBeenLastCalledWith({
      titles: expect.objectContaining({ participants: 'Participants' }),
      type: 'participants',
    });
    expect(currentSettings.zoomParticipantsButtonTitle).toBe('Participants');
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

describe('cancelling also stops the read-only lookups', () => {
  it('answers "cancelled" to a meeting lookup while a cancel is pending', async () => {
    zoomState.runDepth = 1;
    zoomState.cancelRequested = true;
    const { getZoomMeetingState } = await import('../zoom');

    expect(await getZoomMeetingState()).toBeNull();
    expect(zoomCommandMock).not.toHaveBeenCalled();
  });
});
