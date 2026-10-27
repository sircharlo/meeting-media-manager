import type { ZoomDiagnosis, ZoomMeetingState } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { useDialogStateStore } from 'stores/dialog-state';
import { useZoomStateStore } from 'stores/zoom-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ZoomActionFailure } from '../zoom';
import type { ZoomSelfTestStep } from '../zoom-self-test';

const currentState = vi.hoisted(() => ({
  currentCongregation: 'cong-1',
  currentSettings: {
    zoomMeetingManagerAutomateMediaSharing: true,
    zoomMeetingManagerAutomateMeetingAudioSettings: true,
    zoomMeetingManagerAutomatePostMeetingAudioSettings: true,
    zoomMeetingManagerEnable: true,
    zoomMeetingManagerMeetingId: '123 456 7890' as null | string,
    zoomMeetingManagerStartupCheck: true,
  },
  mediaWindowVisible: true,
}));

const zoom = vi.hoisted(() => ({
  countZoomMeetingParticipants: vi.fn<() => Promise<null | number>>(),
  diagnoseZoom: vi.fn<() => Promise<null | ZoomDiagnosis>>(),
  getMeetingStartToday: vi.fn<(now?: Date) => Date | null>(),
  getZoomMeetingState: vi.fn<() => Promise<null | ZoomMeetingState>>(),
  isZoomSetupNeeded: vi.fn(() => false),
  notify: vi.fn(),
  rememberZoomVersion: vi.fn(),
  runZoomSelfTest: vi.fn<() => Promise<ZoomSelfTestStep[]>>(),
  takeZoomActionFailures: vi.fn<() => ZoomActionFailure[]>(),
  testZoomShareEntry: vi.fn(),
  withZoomRun: vi.fn(<T>(_label: string, run: () => Promise<T>) => run()),
  zoomNamesChanged: vi.fn(() => false),
}));

vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => currentState,
}));

vi.mock('src/helpers/zoom', () => ({
  countZoomMeetingParticipants: zoom.countZoomMeetingParticipants,
  diagnoseZoom: zoom.diagnoseZoom,
  getZoomMeetingState: zoom.getZoomMeetingState,
  getZoomTitlesFromSettings: () => ({
    shareButtonTitle: 'Share',
    videoOffTitle: 'Start Video',
    videoOnTitle: 'Stop Video',
  }),
  isZoomSetupNeeded: zoom.isZoomSetupNeeded,
  prepareMediaWindowForZoomTest: vi.fn(),
  rememberZoomVersion: zoom.rememberZoomVersion,
  runWhileHoldingZoomAutomations: <T>(check: () => Promise<T>) => check(),
  takeZoomActionFailures: zoom.takeZoomActionFailures,
  testZoomShareEntry: zoom.testZoomShareEntry,
  withZoomRun: zoom.withZoomRun,
  ZOOM_CHANGED_EVENT: 'zoomChanged',
  zoomNamesChanged: zoom.zoomNamesChanged,
}));

vi.mock('src/helpers/zoom-self-test', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  runZoomSelfTest: zoom.runZoomSelfTest,
}));

vi.mock('src/helpers/date', () => ({
  getMeetingStartToday: zoom.getMeetingStartToday,
}));

vi.mock('stores/music', () => ({ AUTO_START_WINDOW_HOURS: 1.25 }));

const MINUTE = 60_000;

/** Today's meeting starts this long from now (or there's none, with null). */
const meetingStartsIn = (ms: null | number) => {
  zoom.getMeetingStartToday.mockReturnValue(
    ms === null ? null : new Date(Date.now() + ms),
  );
};

/** No meeting open until M³ opens it. */
const meetingClosedUntilLaunched = () => {
  let launched = false;
  const launch = vi
    .spyOn(globalThis.electronApi, 'launchZoomMeeting')
    .mockImplementation(() => {
      launched = true;
    });
  zoom.getZoomMeetingState.mockImplementation(async () => ({
    found: launched,
    sharing: false,
  }));
  return launch;
};

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: zoom.notify,
}));

const sentry = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock('@sentry/vue', () => sentry);

const ALL_FOUND: ZoomDiagnosis = {
  hostControls: true,
  meeting: true,
  participantsPanel: true,
  toolbar: true,
  videoButton: true,
};

const OPEN: ZoomMeetingState = { found: true, sharing: false };

const passed = (...ids: ZoomSelfTestStep['id'][]): ZoomSelfTestStep[] =>
  ids.map((id) => ({ id, status: 'passed' }));

const notification = () =>
  zoom.notify.mock.lastCall?.[0] as
    | undefined
    | {
        actions?: { handler?: () => void; label?: string }[];
        caption?: string;
        type: string;
      };

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  Object.assign(currentState.currentSettings, {
    zoomMeetingManagerAutomateMediaSharing: true,
    zoomMeetingManagerAutomateMeetingAudioSettings: true,
    zoomMeetingManagerMeetingId: '123 456 7890',
    zoomMeetingManagerStartupCheck: true,
  });
  currentState.mediaWindowVisible = true;
  zoom.getZoomMeetingState.mockResolvedValue(OPEN);
  zoom.countZoomMeetingParticipants.mockResolvedValue(1);
  zoom.diagnoseZoom.mockResolvedValue(ALL_FOUND);
  // Today's meeting, unless a test says otherwise.
  meetingStartsIn(30 * MINUTE);
  zoom.isZoomSetupNeeded.mockReturnValue(false);
  zoom.runZoomSelfTest.mockImplementation(async () => passed('meeting'));
  zoom.takeZoomActionFailures.mockReturnValue([]);
  zoom.zoomNamesChanged.mockReturnValue(false);
  zoom.testZoomShareEntry.mockResolvedValue({
    opened: true,
    windowListed: true,
    windowSelected: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Zoom startup check', () => {
  it('runs once per session, only when turned on and set up', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');

    currentState.currentSettings.zoomMeetingManagerStartupCheck = false;
    expect(await runZoomStartupCheck()).toBe('skipped');
    currentState.currentSettings.zoomMeetingManagerStartupCheck = true;

    zoom.isZoomSetupNeeded.mockReturnValueOnce(true);
    expect(await runZoomStartupCheck()).toBe('skipped');

    expect(await runZoomStartupCheck()).toBe('passed');
    expect(zoom.rememberZoomVersion).toHaveBeenCalledOnce();
    expect(await runZoomStartupCheck()).toBe('skipped');
    // Asked for, it runs again.
    expect(await runZoomStartupCheck({ manual: true })).toBe('passed');
  });

  it("stays out of the setup assistant's way while it is open", async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    useDialogStateStore().openDialog(
      'zoom-setup-assistant',
      'DialogZoomSetupAssistant',
    );

    expect(await runZoomStartupCheck({ manual: true })).toBe('skipped');
    expect(zoom.runZoomSelfTest).not.toHaveBeenCalled();
    expect(zoom.withZoomRun).not.toHaveBeenCalled();
    // Today's check is still to do.
    expect(useZoomStateStore().checkedCongregations).toEqual([]);
  });

  it('leaves Zoom alone on days without a meeting', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    const launch = meetingClosedUntilLaunched();
    meetingStartsIn(null);

    expect(await runZoomStartupCheck()).toBe('skipped');
    expect(launch).not.toHaveBeenCalled();
    expect(zoom.runZoomSelfTest).not.toHaveBeenCalled();
    // Nor says it's operating Zoom, since it isn't.
    expect(zoom.withZoomRun).not.toHaveBeenCalled();
  });

  it('says nothing while only waiting for the meeting', async () => {
    vi.useFakeTimers();
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    meetingClosedUntilLaunched();
    meetingStartsIn(3 * 60 * MINUTE);

    expect(await runZoomStartupCheck()).toBe('scheduled');
    expect(zoom.withZoomRun).not.toHaveBeenCalled();
  });

  it('goes by the calendar date, whichever day is selected', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    meetingClosedUntilLaunched();

    await runZoomStartupCheck();
    expect(zoom.getMeetingStartToday).toHaveBeenCalled();
  });

  it("doesn't open the meeting once it's starting or under way", async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    const launch = meetingClosedUntilLaunched();
    meetingStartsIn(-10 * MINUTE);

    expect(await runZoomStartupCheck()).toBe('skipped');
    expect(launch).not.toHaveBeenCalled();
  });

  it('waits until background music could start before opening the meeting', async () => {
    vi.useFakeTimers();
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    const launch = meetingClosedUntilLaunched();
    meetingStartsIn(3 * 60 * MINUTE);

    expect(await runZoomStartupCheck()).toBe('scheduled');
    expect(launch).not.toHaveBeenCalled();
    // Today's check is still to do.
    expect(useZoomStateStore().checkedCongregations).toEqual([]);

    // 1 h 15 min before the meeting, the meeting day's schedule (see
    // zoom-meeting-day.ts) checks again.
    meetingStartsIn(75 * MINUTE);
    const outcome = runZoomStartupCheck();
    await vi.runAllTimersAsync();
    expect(await outcome).toBe('passed');
    expect(launch).toHaveBeenCalledWith('123 456 7890');
    expect(zoom.runZoomSelfTest).toHaveBeenCalledOnce();
  });

  it('waits while another automation is operating Zoom', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    const zoomState = useZoomStateStore();
    zoomState.beginRun('zoom-run-post-meeting-sequence');

    expect(await runZoomStartupCheck()).toBe('skipped');
    expect(zoom.getZoomMeetingState).not.toHaveBeenCalled();
    // Today's check is still to do.
    expect(zoomState.checkedCongregations).toEqual([]);

    zoomState.endRun();
    expect(await runZoomStartupCheck()).toBe('passed');
  });

  it('opens the meeting before it starts, then tests what is automated', async () => {
    vi.useFakeTimers();
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    const launch = meetingClosedUntilLaunched();

    const outcome = runZoomStartupCheck();
    await vi.runAllTimersAsync();

    expect(await outcome).toBe('passed');
    expect(launch).toHaveBeenCalledWith('123 456 7890');
    expect(zoom.runZoomSelfTest).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: [
          'meeting',
          'leave-audio',
          'join-audio',
          'mic-off',
          'mic-on',
          'video-off',
          'video-on',
          'restore',
          'share-start',
          'share-stop',
        ],
      }),
    );
    expect(useZoomStateStore().automationsPaused).toBe(false);
  });

  it('pauses the automations and says why when the meeting does not open', async () => {
    vi.useFakeTimers();
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    vi.spyOn(globalThis.electronApi, 'launchZoomMeeting').mockReturnValue();
    zoom.getZoomMeetingState.mockResolvedValue({
      found: false,
      sharing: false,
    });

    const outcome = runZoomStartupCheck();
    await vi.runAllTimersAsync();

    expect(await outcome).toBe('failed');
    expect(useZoomStateStore().pause).toEqual({
      congregationId: 'cong-1',
      namesChanged: false,
      problems: ['zoom-check-problem-meeting'],
    });
    expect(notification()?.type).toBe('negative');
  });

  it('checks again when Zoom changed, even if today was checked already', async () => {
    const { watchZoomChanges } = await import('../zoom-startup-check');
    const zoomState = useZoomStateStore();
    zoomState.checkedCongregations = ['cong-1'];
    // A meeting with others in it: the check only looks.
    zoom.getZoomMeetingState.mockResolvedValue({ found: true, sharing: false });
    zoom.countZoomMeetingParticipants.mockResolvedValue(3);
    zoom.diagnoseZoom.mockResolvedValue(ALL_FOUND);
    zoom.testZoomShareEntry.mockResolvedValue({
      opened: true,
      windowListed: true,
      windowSelected: true,
    });
    watchZoomChanges();

    globalThis.dispatchEvent(
      new CustomEvent('zoomChanged', { detail: { reason: 'version' } }),
    );

    // The check ran again (and counts as today's check once more).
    await vi.waitFor(() => expect(zoom.getZoomMeetingState).toHaveBeenCalled());
  });

  it('pauses the automations when a test step fails, until a new check passes', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    zoom.runZoomSelfTest.mockResolvedValueOnce([
      { id: 'meeting', status: 'passed' },
      { detail: 'Video button reads "x"', id: 'video-off', status: 'failed' },
    ]);
    zoom.diagnoseZoom.mockResolvedValueOnce({
      ...ALL_FOUND,
      hostControls: false,
    });
    zoom.takeZoomActionFailures
      // Before the check: an earlier failure, left out of its report.
      .mockReturnValueOnce([
        { action: 'raised-hands', error: 'helper-stopped' },
      ])
      .mockReturnValueOnce([
        {
          action: 'set-video',
          error: 'video-not-changed',
          snapshot: {
            dialogs: { 'CVoiceActivityDetectedDlgCls 400x120': ['Unmute'] },
            toolbar: ['Start my video, Alt+V'],
            zoomVersion: '7.2.1',
          },
        },
      ]);

    expect(await runZoomStartupCheck()).toBe('failed');
    const zoomState = useZoomStateStore();
    expect(zoomState.automationsPaused).toBe(true);
    // Reported to Sentry, grouped by what failed, with what Zoom showed.
    await vi.waitFor(() =>
      expect(sentry.captureMessage).toHaveBeenCalledWith(
        'Zoom check failed: automations paused',
        expect.objectContaining({
          extra: {
            dialogs: { 'CVoiceActivityDetectedDlgCls 400x120': ['Unmute'] },
            failedActions: ['set-video: video-not-changed'],
            failedSteps: ['video-off: Video button reads "x"'],
            namesChanged: false,
            problems: [
              'zoom-self-test-step-video-off',
              'zoom-setup-check-host',
            ],
            snapshotAction: 'set-video',
            toolbar: ['Start my video, Alt+V'],
            zoomVersion: '7.2.1',
          },
          fingerprint: [
            'zoom-check-failed',
            'zoom-self-test-step-video-off',
            'zoom-setup-check-host',
          ],
          level: 'warning',
        }),
      ),
    );
    expect(zoomState.pause?.problems).toEqual([
      'zoom-self-test-step-video-off',
      'zoom-setup-check-host',
    ]);

    // "Test again", from the notification.
    const testAgain = notification()?.actions?.find((a) => a.handler);
    expect(testAgain?.label).toBe('Test again');
    testAgain?.handler?.();
    await vi.waitFor(() => expect(zoomState.automationsPaused).toBe(false));
    expect(notification()?.type).toBe('positive');
  });

  it.each([
    [
      'an action found a button named otherwise',
      () => {
        zoom.takeZoomActionFailures.mockReturnValue([
          { action: 'set-mic', error: 'mic-title-unrecognized:Mute' },
        ]);
      },
    ],
    [
      'the camera button reads otherwise',
      () => {
        zoom.zoomNamesChanged.mockReturnValue(true);
      },
    ],
  ])(
    "offers the setup assistant instead of testing again when Zoom's names changed: %s",
    async (_cause, arrange) => {
      const { runZoomStartupCheck } = await import('../zoom-startup-check');
      arrange();
      zoom.runZoomSelfTest.mockResolvedValueOnce([
        { id: 'meeting', status: 'passed' },
        { detail: 'Mute the microphone', id: 'mic-off', status: 'failed' },
      ]);
      const dispatch = vi.spyOn(globalThis, 'dispatchEvent');

      expect(await runZoomStartupCheck()).toBe('failed');
      expect(useZoomStateStore().pause?.namesChanged).toBe(true);
      expect(notification()?.caption).toContain(
        "Zoom's language was changed or Zoom was updated",
      );
      const action = notification()?.actions?.find((a) => a.handler);
      expect(action?.label).toBe('Open setup assistant');
      action?.handler?.();
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'openZoomSetupAssistant' }),
      );
    },
  );

  it('only looks, without pressing anything, when others are in the meeting', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    zoom.countZoomMeetingParticipants.mockResolvedValue(4);
    zoom.testZoomShareEntry.mockResolvedValueOnce({
      opened: true,
      windowListed: true,
      windowSelected: false,
    });

    expect(await runZoomStartupCheck()).toBe('failed');
    expect(zoom.runZoomSelfTest).not.toHaveBeenCalled();
    expect(useZoomStateStore().pause?.problems).toEqual([
      'zoom-self-test-step-share-start',
    ]);
    await vi.waitFor(() =>
      expect(sentry.captureMessage).toHaveBeenCalledWith(
        'Zoom check failed: automations paused',
        expect.objectContaining({
          extra: expect.objectContaining({
            failedSteps: [
              'share-picker: {"opened":true,"windowListed":true,"windowSelected":false}',
            ],
          }),
        }),
      ),
    );
  });

  it('changes nothing when the user stops the check', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    const zoomState = useZoomStateStore();
    zoom.runZoomSelfTest.mockImplementationOnce(async () => {
      // Stopped, then force-ended: the steps left all fail.
      zoomState.beginRun('zoom-run-self-test');
      zoomState.requestCancel();
      zoomState.abortRun();
      return [
        { id: 'meeting', status: 'passed' },
        { detail: 'Join audio: cancelled', id: 'join-audio', status: 'failed' },
      ];
    });

    expect(await runZoomStartupCheck()).toBe('cancelled');
    expect(zoomState.pause).toBeNull();
    expect(zoom.notify).not.toHaveBeenCalled();
    expect(sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('waits for Zoom to stop sharing instead of checking during a share', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    zoom.getZoomMeetingState.mockResolvedValue({ found: true, sharing: true });

    expect(await runZoomStartupCheck()).toBe('scheduled');
    // Nothing pressed (testing would end the share) and nothing paused.
    expect(zoom.withZoomRun).not.toHaveBeenCalled();
    expect(zoom.countZoomMeetingParticipants).not.toHaveBeenCalled();
    expect(zoom.diagnoseZoom).not.toHaveBeenCalled();
    const zoomState = useZoomStateStore();
    expect(zoomState.pause).toBeNull();
    expect(zoom.notify).not.toHaveBeenCalled();
    // Today's check is still to do, and runs once the share is over.
    expect(zoomState.checkedCongregations).toEqual([]);
    zoom.getZoomMeetingState.mockResolvedValue(OPEN);
    expect(await runZoomStartupCheck()).toBe('passed');
  });

  it('asks to stop sharing first when tested again during a share', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    const zoomState = useZoomStateStore();
    zoomState.pauseAutomations('cong-1', ['zoom-check-problem-meeting'], false);
    zoom.getZoomMeetingState.mockResolvedValue({ found: true, sharing: true });

    expect(await runZoomStartupCheck({ manual: true })).toBe('skipped');
    expect(zoom.withZoomRun).not.toHaveBeenCalled();
    expect(notification()).toMatchObject({
      message:
        "M³ can't check Zoom while it's sharing. Stop sharing in Zoom, then test again.",
      type: 'warning',
    });
    // Still paused until a check passes, and today's check still to do.
    expect(zoomState.automationsPaused).toBe(true);
    expect(zoomState.checkedCongregations).toEqual([]);
  });

  it("doesn't show the media window to check sharing while others are in", async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    zoom.countZoomMeetingParticipants.mockResolvedValue(null);
    currentState.mediaWindowVisible = false;

    expect(await runZoomStartupCheck()).toBe('passed');
    expect(zoom.testZoomShareEntry).not.toHaveBeenCalled();
  });

  it('pauses the automations when the Zoom helper does not answer', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    zoom.getZoomMeetingState.mockResolvedValue(null);

    expect(await runZoomStartupCheck()).toBe('failed');
    expect(useZoomStateStore().pause?.problems).toEqual([
      'zoom-check-problem-helper',
    ]);
  });

  it("lets the setup assistant close a failed check's notification", async () => {
    const { dismissFailedZoomCheckNotice, runZoomStartupCheck } =
      await import('../zoom-startup-check');
    const dismiss = vi.fn();
    zoom.notify.mockReturnValueOnce(dismiss);
    zoom.getZoomMeetingState.mockResolvedValue(null);

    expect(await runZoomStartupCheck()).toBe('failed');
    dismissFailedZoomCheckNotice();
    dismissFailedZoomCheckNotice();
    expect(dismiss).toHaveBeenCalledOnce();
  });
});
