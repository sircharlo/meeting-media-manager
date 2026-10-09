import type { ZoomCommand, ZoomCommandResult } from 'src/types';

import { MEDIA_WINDOW_TITLE } from 'src/constants/zoom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const currentSettings = {
  zoomMeetingManagerAutoLaunchMeeting: false,
  zoomMeetingManagerAutomateMeetingAudioSettings: false,
  zoomMeetingManagerAutomatePostMeetingAudioSettings: false,
  zoomMeetingManagerEnable: true,
  zoomMeetingManagerMeetingId: '123 456' as null | string,
  zoomShareButtonTitle: 'Share' as null | string,
  zoomVideoOffTitle: 'Start Video' as null | string,
  zoomVideoOnTitle: 'Stop Video' as null | string,
};

const { notifyMock } = vi.hoisted(() => ({ notifyMock: vi.fn() }));

vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => ({ currentSettings }),
}));

const zoomState = { automationsPaused: false };

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

const zoomCommandMock =
  vi.fn<(command: ZoomCommand) => Promise<ZoomCommandResult>>();
const launchZoomMeetingMock = vi.fn();

let meetingFound = true;
let failing: Partial<Record<ZoomCommand['type'], string>> = {};

const commandTypes = () => zoomCommandMock.mock.calls.map(([c]) => c.type);

beforeEach(() => {
  vi.clearAllMocks();
  meetingFound = true;
  failing = {};
  zoomState.automationsPaused = false;
  Object.assign(currentSettings, {
    zoomMeetingManagerAutoLaunchMeeting: false,
    zoomMeetingManagerAutomateMeetingAudioSettings: false,
    zoomMeetingManagerAutomatePostMeetingAudioSettings: false,
    zoomVideoOffTitle: 'Start Video',
    zoomVideoOnTitle: 'Stop Video',
  });
  zoomCommandMock.mockImplementation(async (command) => {
    if (command.type === 'meeting') {
      return { meeting: { found: meetingFound, sharing: false }, ok: true };
    }
    const error = failing[command.type];
    return error ? { error, ok: false } : { changed: true, ok: true };
  });
  vi.stubGlobal('electronApi', {
    focusMediaWindow: vi.fn(),
    launchZoomMeeting: launchZoomMeetingMock,
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
      'set-video',
      'mute-all',
    ]);
    expect(zoomCommandMock).toHaveBeenCalledWith({
      offTitle: 'Start Video',
      on: true,
      onTitle: 'Stop Video',
      type: 'set-video',
    });
    expect(zoomCommandMock).toHaveBeenCalledWith({
      allowSelfUnmute: false,
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
      type: 'mute-all',
    });
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
});

describe('Zoom media sharing', () => {
  it('shares the media window using the captured Share entry', async () => {
    const { startSharingMediaInZoom } = await import('../zoom');

    expect(await startSharingMediaInZoom()).toBe(true);
    expect(zoomCommandMock).toHaveBeenCalledWith({
      shareButtonTitle: 'Share',
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
      'set-video',
      'mute-all',
    ]);
  });
});

describe('Zoom setup assistant', () => {
  it('is only needed once the Manager is on and the camera button is unknown', async () => {
    const { isZoomSetupNeeded } = await import('../zoom');

    currentSettings.zoomMeetingManagerEnable = true;
    currentSettings.zoomVideoOnTitle = null;
    expect(isZoomSetupNeeded()).toBe(true);

    currentSettings.zoomVideoOnTitle = 'Stop Video';
    currentSettings.zoomVideoOffTitle = 'Start Video';
    expect(isZoomSetupNeeded()).toBe(false);

    currentSettings.zoomMeetingManagerEnable = false;
    currentSettings.zoomVideoOnTitle = null;
    expect(isZoomSetupNeeded()).toBe(false);
    currentSettings.zoomMeetingManagerEnable = true;
  });
});
