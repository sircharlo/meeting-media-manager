import type {
  ZoomDiagnosis,
  ZoomFailureSnapshot,
  ZoomMeetingState,
} from 'src/types';

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
  countZoomMeetingParticipants:
    vi.fn<(options?: { peek?: boolean }) => Promise<null | number>>(),
  diagnoseZoom: vi.fn<() => Promise<null | ZoomDiagnosis>>(),
  getMeetingStartToday: vi.fn<(now?: Date) => Date | null>(),
  getZoomMeetingState: vi.fn<() => Promise<null | ZoomMeetingState>>(),
  getZoomSnapshot: vi.fn<() => Promise<null | ZoomFailureSnapshot>>(),
  isZoomSetupNeeded: vi.fn(() => false),
  notify: vi.fn(),
  rememberZoomVersion: vi.fn(),
  runZoomSelfTest:
    vi.fn<(options: { signal?: AbortSignal }) => Promise<ZoomSelfTestStep[]>>(),
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
  getZoomSnapshot: zoom.getZoomSnapshot,
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

const prompt = vi.hoisted(() => ({
  answer: vi.fn(),
  ask: vi.fn<() => Promise<'run' | 'skip' | 'unanswered'>>(),
}));
vi.mock('src/helpers/zoom-check-prompt', () => ({
  answerZoomCheckPrompt: prompt.answer,
  askBeforeCheckingZoom: prompt.ask,
  CHECK_PROMPT_TIMEOUT_MS: 2 * 60_000,
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
  zoom.getZoomSnapshot.mockResolvedValue(null);
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
  prompt.ask.mockResolvedValue('run');
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

  it('asks the user before an automatic check touches Zoom', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');

    expect(await runZoomStartupCheck()).toBe('passed');
    expect(prompt.ask).toHaveBeenCalledOnce();
    expect(zoom.withZoomRun).toHaveBeenCalledOnce();
  });

  it('asks only when a check is really going to run', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    meetingClosedUntilLaunched();
    meetingStartsIn(null);

    expect(await runZoomStartupCheck()).toBe('skipped');
    expect(prompt.ask).not.toHaveBeenCalled();
  });

  it('never asks for a check the user asked for', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');

    expect(await runZoomStartupCheck({ manual: true })).toBe('passed');
    expect(prompt.ask).not.toHaveBeenCalled();
  });

  it('turns the automations off for the meeting when the user skips', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    prompt.ask.mockResolvedValueOnce('skip');

    expect(await runZoomStartupCheck()).toBe('declined');
    // Zoom was left alone altogether.
    expect(zoom.withZoomRun).not.toHaveBeenCalled();
    expect(zoom.runZoomSelfTest).not.toHaveBeenCalled();
    const zoomState = useZoomStateStore();
    expect(zoomState.automationsPaused).toBe(true);
    expect(zoomState.checkDeclined).toBe(true);
    expect(notification()?.type).toBe('warning');
    // And it doesn't ask again: Test again is the way back.
    zoomState.checkedCongregations = [];
    expect(await runZoomStartupCheck()).toBe('skipped');
    expect(prompt.ask).toHaveBeenCalledOnce();
  });

  it('asks again a while later when nobody answers, leaving the automations on', async () => {
    vi.useFakeTimers();
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    meetingStartsIn(60 * MINUTE);
    prompt.ask.mockResolvedValueOnce('unanswered');

    expect(await runZoomStartupCheck()).toBe('scheduled');
    // Zoom was left alone, and nothing was turned off for the meeting.
    expect(zoom.withZoomRun).not.toHaveBeenCalled();
    expect(useZoomStateStore().automationsPaused).toBe(false);
    expect(zoom.notify).not.toHaveBeenCalled();

    // Today's check is still to do, but the meeting day's recheck, every 5
    // minutes, doesn't bring the question back each time.
    vi.advanceTimersByTime(14 * MINUTE);
    expect(await runZoomStartupCheck()).toBe('scheduled');
    expect(prompt.ask).toHaveBeenCalledOnce();
    expect(zoom.withZoomRun).not.toHaveBeenCalled();

    // A quarter of an hour later, it asks again, and runs.
    vi.advanceTimersByTime(MINUTE);
    expect(await runZoomStartupCheck()).toBe('passed');
    expect(prompt.ask).toHaveBeenCalledTimes(2);
    expect(zoom.withZoomRun).toHaveBeenCalledOnce();
  });

  it.each([
    ['under way, as when M³ restarts during it', -10 * MINUTE],
    ['over', -3 * 60 * MINUTE],
    ['not today, as in any other Zoom call', null],
  ])(
    'leaves an open meeting alone when the meeting is %s',
    async (_when, startsIn) => {
      const { runZoomStartupCheck } = await import('../zoom-startup-check');
      meetingStartsIn(startsIn);

      expect(await runZoomStartupCheck()).toBe('skipped');
      expect(prompt.ask).not.toHaveBeenCalled();
      expect(zoom.countZoomMeetingParticipants).not.toHaveBeenCalled();
      expect(zoom.withZoomRun).not.toHaveBeenCalled();
    },
  );

  it("waits for the meeting's window with the meeting already open", async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    meetingStartsIn(3 * 60 * MINUTE);

    expect(await runZoomStartupCheck()).toBe('scheduled');
    expect(prompt.ask).not.toHaveBeenCalled();
    expect(zoom.withZoomRun).not.toHaveBeenCalled();
    // Today's check is still to do.
    expect(useZoomStateStore().checkedCongregations).toEqual([]);
  });

  it('only looks, asking nothing, when the open participants panel shows others', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    zoom.countZoomMeetingParticipants.mockResolvedValue(3);

    expect(await runZoomStartupCheck()).toBe('passed');
    expect(prompt.ask).not.toHaveBeenCalled();
    // Read from the panel as it was: nothing pressed to find out.
    expect(zoom.countZoomMeetingParticipants).toHaveBeenCalledWith({
      peek: true,
    });
    expect(zoom.diagnoseZoom).toHaveBeenCalledOnce();
    expect(zoom.runZoomSelfTest).not.toHaveBeenCalled();
  });

  it("asks when it can't tell who is in the meeting without opening the participants panel", async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    // The panel is closed: only opening it, once allowed, tells.
    zoom.countZoomMeetingParticipants.mockImplementation(async (options) =>
      options?.peek ? null : 1,
    );

    expect(await runZoomStartupCheck()).toBe('passed');
    expect(prompt.ask).toHaveBeenCalledOnce();
    expect(zoom.runZoomSelfTest).toHaveBeenCalledOnce();
  });

  it('never presses what it did not ask about, even once the others have left', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    zoom.countZoomMeetingParticipants.mockImplementation(async (options) =>
      options?.peek ? 3 : 1,
    );

    expect(await runZoomStartupCheck()).toBe('passed');
    expect(prompt.ask).not.toHaveBeenCalled();
    expect(zoom.runZoomSelfTest).not.toHaveBeenCalled();
  });

  it("asks only early enough for the question and the check to be over before the meeting's settings", async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    const zoomState = useZoomStateStore();
    // The question waits 2 minutes at most, opening the meeting and testing
    // take up to about 3.5 more, and the meeting's window closes 90 s before
    // it starts.
    meetingStartsIn(8 * MINUTE);
    expect(await runZoomStartupCheck()).toBe('passed');
    expect(prompt.ask).toHaveBeenCalledOnce();

    zoomState.checkedCongregations = [];
    meetingStartsIn(7 * MINUTE);
    expect(await runZoomStartupCheck()).toBe('skipped');
    expect(prompt.ask).toHaveBeenCalledOnce();
    expect(zoom.withZoomRun).toHaveBeenCalledOnce();
    // Nor is it asked again as the meeting starts.
    expect(zoomState.checkedCongregations).toEqual(['cong-1']);

    // With others in the meeting, there's nothing to ask: it still looks.
    zoomState.checkedCongregations = [];
    zoom.countZoomMeetingParticipants.mockResolvedValue(3);
    expect(await runZoomStartupCheck()).toBe('passed');
    expect(prompt.ask).toHaveBeenCalledOnce();
  });

  it('looks at Zoom again once the user answers, rather than opening the meeting they opened meanwhile', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    const launch = vi
      .spyOn(globalThis.electronApi, 'launchZoomMeeting')
      .mockReturnValue();
    zoom.getZoomMeetingState.mockResolvedValueOnce({
      found: false,
      sharing: false,
    });

    expect(await runZoomStartupCheck()).toBe('passed');
    expect(prompt.ask).toHaveBeenCalledOnce();
    expect(launch).not.toHaveBeenCalled();
    expect(zoom.runZoomSelfTest).toHaveBeenCalledOnce();
  });

  it('waits for Zoom to stop sharing when sharing started while it asked', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    zoom.getZoomMeetingState
      .mockResolvedValueOnce(OPEN)
      .mockResolvedValue({ found: true, sharing: true });

    expect(await runZoomStartupCheck()).toBe('scheduled');
    // The user's share is left alone, and nothing reads as broken.
    expect(zoom.withZoomRun).not.toHaveBeenCalled();
    expect(useZoomStateStore().pause).toBeNull();
    expect(useZoomStateStore().checkedCongregations).toEqual([]);
  });

  it('runs the check waiting for an answer when the user tests again', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    const zoomState = useZoomStateStore();
    let answer: (choice: 'run' | 'skip' | 'unanswered') => void = () =>
      undefined;
    prompt.ask.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          zoomState.promptForCheck();
          answer = resolve;
        }),
    );
    prompt.answer.mockImplementationOnce((choice: 'run' | 'skip') => {
      zoomState.closeCheckPrompt();
      answer(choice);
    });

    const automatic = runZoomStartupCheck();
    await vi.waitFor(() => expect(zoomState.checkPrompt).toBe(true));
    // Only waiting for the go-ahead: not checking Zoom, as far as the user
    // is told.
    expect(zoomState.checkingZoom).toBe(false);

    // Test again, from a notification above the question: the go-ahead.
    const manual = runZoomStartupCheck({ manual: true });
    expect(prompt.answer).toHaveBeenCalledWith('run');
    expect(await manual).toBe('passed');
    expect(await automatic).toBe('passed');
    expect(zoom.runZoomSelfTest).toHaveBeenCalledOnce();
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
    zoom.getZoomSnapshot.mockResolvedValue({
      dialogs: { 'SomeZoomDialog 420x240': ['Join', 'Cancel'] },
      meeting: false,
      sharing: false,
      windows: ['SomeZoomDialog'],
      zoomVersion: '7.2.5.51704',
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
    // MMM-V2-3MW: reported with what Zoom showed instead of the meeting,
    // where these reports used to say only that it wasn't there.
    await vi.waitFor(() =>
      expect(sentry.captureMessage).toHaveBeenCalledWith(
        'Zoom check failed: automations paused',
        expect.objectContaining({
          extra: {
            dialogs: { 'SomeZoomDialog 420x240': ['Join', 'Cancel'] },
            failedActions: [],
            failedSteps: ['meeting: not open 90 s after opening it'],
            meeting: false,
            namesChanged: false,
            problems: ['zoom-check-problem-meeting'],
            sharing: false,
            snapshotAction: 'snapshot',
            windows: ['SomeZoomDialog'],
            zoomVersion: '7.2.5.51704',
          },
        }),
      ),
    );
  });

  it('says there is no meeting ID when tested again with no meeting open, without reporting it', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    const zoomState = useZoomStateStore();
    // Tested again from the popup, after skipping the question.
    zoomState.pauseAutomations('cong-1', [], false, true);
    currentState.currentSettings.zoomMeetingManagerMeetingId = null;
    zoom.getZoomMeetingState.mockResolvedValue({
      found: false,
      sharing: false,
    });

    expect(await runZoomStartupCheck({ manual: true })).toBe('skipped');
    expect(notification()).toMatchObject({
      caption:
        'Set a Zoom meeting ID in the settings to launch the meeting from here.',
      message: 'No Zoom meeting window detected',
      type: 'warning',
    });
    // Down to the setup, not to anything broken in Zoom: not reported, and
    // the automations stay as they were, with today's check still to do.
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(sentry.captureMessage).not.toHaveBeenCalled();
    expect(zoomState.checkDeclined).toBe(true);
    expect(zoomState.checkedCongregations).toEqual([]);
    // Nothing was opened, so there's nothing to look at in Zoom.
    expect(zoom.getZoomSnapshot).not.toHaveBeenCalled();
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

  it('covers a Zoom change it noticed itself, rather than asking and testing again', async () => {
    const { runZoomStartupCheck, watchZoomChanges } =
      await import('../zoom-startup-check');
    watchZoomChanges();
    zoom.getZoomMeetingState.mockImplementationOnce(async () => {
      // Zoom was updated: the check's own look at it is the first to notice.
      globalThis.dispatchEvent(
        new CustomEvent('zoomChanged', { detail: { reason: 'version' } }),
      );
      return OPEN;
    });

    expect(await runZoomStartupCheck()).toBe('passed');
    expect(useZoomStateStore().checkedCongregations).toEqual(['cong-1']);
    // The next recheck finds today's check done.
    expect(await runZoomStartupCheck()).toBe('skipped');
    expect(prompt.ask).toHaveBeenCalledOnce();
    expect(zoom.runZoomSelfTest).toHaveBeenCalledOnce();
  });

  it('confirms a routine pass, not only one asked for', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');

    expect(await runZoomStartupCheck()).toBe('passed');
    expect(useZoomStateStore().automationsPaused).toBe(false);
    expect(notification()).toMatchObject({
      group: 'zoom-check',
      type: 'positive',
    });
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

  // MMM-V2-3NC: without the reason, these reports couldn't tell a share button
  // that wasn't found from a share window that never came up.
  it('reports why the share picker did not open', async () => {
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    zoom.countZoomMeetingParticipants.mockResolvedValue(4);
    zoom.testZoomShareEntry.mockResolvedValueOnce({
      opened: false,
      pickerError: 'share-button-not-found',
      windowListed: false,
      windowSelected: false,
    });

    await runZoomStartupCheck();

    await vi.waitFor(() =>
      expect(sentry.captureMessage).toHaveBeenCalledWith(
        'Zoom check failed: automations paused',
        expect.objectContaining({
          extra: expect.objectContaining({
            failedSteps: [
              'share-picker: {"opened":false,"pickerError":"share-button-not-found","windowListed":false,"windowSelected":false}',
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
    // The test was told to stop, and still was once the run was force-ended
    // (which lets Zoom's actions through again): it goes no further.
    expect(zoom.runZoomSelfTest.mock.calls[0]?.[0].signal?.aborted).toBe(true);
    expect(zoom.diagnoseZoom).not.toHaveBeenCalled();
  });

  it('stops waiting for the meeting it opened when the user stops the check', async () => {
    vi.useFakeTimers();
    const { runZoomStartupCheck } = await import('../zoom-startup-check');
    const zoomState = useZoomStateStore();
    vi.spyOn(globalThis.electronApi, 'launchZoomMeeting').mockReturnValue();
    const zoomShows = { meeting: false };
    zoom.getZoomMeetingState.mockImplementation(async () => ({
      found: zoomShows.meeting,
      sharing: false,
    }));

    const outcome = runZoomStartupCheck();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(globalThis.electronApi.launchZoomMeeting).toHaveBeenCalled();
    // Stopped, and force-ended at once (Esc pressed twice), which lets
    // Zoom's actions through again...
    zoomState.beginRun('zoom-run-startup-check');
    zoomState.requestCancel();
    zoomState.abortRun();
    const looks = zoom.getZoomMeetingState.mock.calls.length;
    // ...then the meeting opens, with the host alone in it.
    zoomShows.meeting = true;
    await vi.runAllTimersAsync();

    expect(await outcome).toBe('cancelled');
    // Nothing more went to Zoom: not even a look.
    expect(zoom.getZoomMeetingState).toHaveBeenCalledTimes(looks);
    expect(zoom.countZoomMeetingParticipants).not.toHaveBeenCalled();
    expect(zoom.runZoomSelfTest).not.toHaveBeenCalled();
    expect(zoom.diagnoseZoom).not.toHaveBeenCalled();
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
