import type { ZoomDiagnosis, ZoomMeetingState } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { useZoomStateStore } from 'stores/zoom-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  runZoomSelfTest: vi.fn<() => Promise<ZoomSelfTestStep[]>>(),
  testZoomShareEntry: vi.fn(),
  withZoomRun: vi.fn(<T>(_label: string, run: () => Promise<T>) => run()),
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
  runWhileHoldingZoomAutomations: <T>(check: () => Promise<T>) => check(),
  testZoomShareEntry: zoom.testZoomShareEntry,
  withZoomRun: zoom.withZoomRun,
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
    | { actions?: { handler?: () => void; label?: string }[]; type: string };

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
    expect(await runZoomStartupCheck()).toBe('skipped');
    // Asked for, it runs again.
    expect(await runZoomStartupCheck({ manual: true })).toBe('passed');
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

  it('checks again each day while M³ stays open, opening the meeting in time', async () => {
    vi.useFakeTimers();
    // Wednesday evening; the meeting is on Thursday at 19:30.
    vi.setSystemTime(new Date(2026, 9, 14, 20, 0));
    vi.resetModules();
    const { scheduleZoomStartupCheck } = await import('../zoom-startup-check');
    const launch = meetingClosedUntilLaunched();
    zoom.getMeetingStartToday.mockImplementation((now = new Date()) =>
      now.getDate() === 15 ? new Date(2026, 9, 15, 19, 30) : null,
    );

    scheduleZoomStartupCheck();
    await vi.advanceTimersByTimeAsync(MINUTE);
    expect(launch).not.toHaveBeenCalled();

    // Thursday, 18:10: not yet (the window opens at 18:15).
    await vi.advanceTimersByTimeAsync((22 * 60 + 9) * MINUTE);
    expect(launch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(10 * MINUTE);
    expect(launch).toHaveBeenCalledWith('123 456 7890');
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

    // 1 h 15 min before the meeting (1 h 45 min from now), M³ checks again.
    await vi.advanceTimersByTimeAsync(104 * MINUTE);
    expect(launch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2 * MINUTE);
    expect(launch).toHaveBeenCalledWith('123 456 7890');
    await vi.runAllTimersAsync();
    expect(zoom.runZoomSelfTest).toHaveBeenCalledOnce();
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
      problems: ['zoom-check-problem-meeting'],
    });
    expect(notification()?.type).toBe('negative');
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

    expect(await runZoomStartupCheck()).toBe('failed');
    const zoomState = useZoomStateStore();
    expect(zoomState.automationsPaused).toBe(true);
    // Reported to Sentry, grouped by what failed.
    await vi.waitFor(() =>
      expect(sentry.captureMessage).toHaveBeenCalledWith(
        'Zoom check failed: automations paused',
        expect.objectContaining({
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
});
