import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ZoomStartupCheckOutcome } from '../zoom-startup-check';

const currentState = vi.hoisted(() => ({
  currentCongregation: 'cong-1',
  currentSettings: {
    meetingStopBufferSeconds: 60,
    zoomMeetingManagerAutoLaunchMeeting: false,
    zoomMeetingManagerAutomateMeetingAudioSettings: true,
    zoomMeetingManagerAutomatePostMeetingAudioSettings: true,
    zoomMeetingManagerEnable: true,
  },
}));

const zoom = vi.hoisted(() => {
  // What M³ did to Zoom, in order.
  const calls: string[] = [];
  const world = { meetingOpen: true };
  return {
    autoLaunchZoomMeetingIfNeeded: vi.fn(async () => {
      calls.push('launch');
    }),
    automateZoomMeetingSettings: vi.fn(async () => {
      calls.push('meeting settings');
    }),
    automateZoomPostMeetingSettings: vi.fn(async () => {
      calls.push('before-meeting settings');
    }),
    calls,
    getMeetingStartToday: vi.fn<(now?: Date) => Date | null>(),
    getZoomMeetingState: vi.fn(async () => ({
      found: world.meetingOpen,
      sharing: false,
    })),
    runZoomStartupCheck: vi.fn<() => Promise<ZoomStartupCheckOutcome>>(),
    world,
  };
});

vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => currentState,
}));

vi.mock('src/helpers/date', () => ({
  getMeetingStartToday: zoom.getMeetingStartToday,
}));

vi.mock('src/helpers/zoom', () => ({
  autoLaunchZoomMeetingIfNeeded: zoom.autoLaunchZoomMeetingIfNeeded,
  automateZoomMeetingSettings: zoom.automateZoomMeetingSettings,
  automateZoomPostMeetingSettings: zoom.automateZoomPostMeetingSettings,
  getZoomMeetingState: zoom.getZoomMeetingState,
}));

vi.mock('src/helpers/zoom-startup-check', () => ({
  runZoomStartupCheck: zoom.runZoomStartupCheck,
}));

const errors = vi.hoisted(() => ({ errorCatcher: vi.fn() }));
vi.mock('src/helpers/error-catcher', () => errors);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
// Thursday's meeting, at 19:30.
const MEETING_START = new Date(2026, 9, 15, 19, 30);

/** Starts the clock this long before the meeting. */
const startAt = (beforeMeetingMs: number) => {
  vi.setSystemTime(MEETING_START.getTime() - beforeMeetingMs);
};

/** What M³ did to Zoom, apart from checking it. */
const actions = () => zoom.calls.filter((call) => call !== 'check');

/** A check that takes this long. */
const checkTaking = (ms: number, outcome: ZoomStartupCheckOutcome) => {
  zoom.runZoomStartupCheck.mockImplementationOnce(async () => {
    zoom.calls.push('check started');
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
    zoom.calls.push('check done');
    return outcome;
  });
};

const setup = async () => {
  const { createPinia, setActivePinia } = await import('pinia');
  setActivePinia(createPinia());
  const meetingDay = await import('../zoom-meeting-day');
  const { useZoomStateStore } = await import('stores/zoom-state');
  const { useDialogStateStore } = await import('stores/dialog-state');
  return {
    ...meetingDay,
    dialogState: useDialogStateStore(),
    zoomState: useZoomStateStore(),
  };
};

/** M³ starts: what's due runs once things have settled. */
const startM3 = async () => {
  const context = await setup();
  context.scheduleZoomAutomations();
  await vi.advanceTimersByTimeAsync(10 * SECOND);
  return context;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
  vi.clearAllMocks();
  zoom.calls.length = 0;
  zoom.world.meetingOpen = true;
  Object.assign(currentState.currentSettings, {
    meetingStopBufferSeconds: 60,
    zoomMeetingManagerAutoLaunchMeeting: false,
    zoomMeetingManagerAutomateMeetingAudioSettings: true,
    zoomMeetingManagerAutomatePostMeetingAudioSettings: true,
    zoomMeetingManagerEnable: true,
  });
  zoom.getMeetingStartToday.mockImplementation((now = new Date()) =>
    now.toDateString() === MEETING_START.toDateString()
      ? new Date(MEETING_START)
      : null,
  );
  zoom.runZoomStartupCheck.mockImplementation(async () => {
    zoom.calls.push('check');
    return 'passed';
  });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('Zoom meeting day', () => {
  it('checks Zoom, then applies the before-meeting settings, then the meeting settings when the music would stop', async () => {
    startAt(30 * MINUTE);
    checkTaking(30 * SECOND, 'passed');

    await startM3();
    // The before-meeting settings wait for the check to be over.
    expect(zoom.calls).toEqual(['check started']);
    await vi.advanceTimersByTimeAsync(30 * SECOND);
    expect(zoom.calls).toEqual([
      'check started',
      'check done',
      'before-meeting settings',
    ]);

    // 19:29, a minute before the meeting.
    await vi.advanceTimersByTimeAsync(28 * MINUTE + 19 * SECOND);
    expect(actions()).toEqual([
      'check started',
      'check done',
      'before-meeting settings',
    ]);
    await vi.advanceTimersByTimeAsync(2 * SECOND);
    expect(actions()).toEqual([
      'check started',
      'check done',
      'before-meeting settings',
      'meeting settings',
    ]);

    // Nothing more, for the rest of the day.
    await vi.advanceTimersByTimeAsync(3 * 60 * MINUTE);
    expect(zoom.automateZoomPostMeetingSettings).toHaveBeenCalledOnce();
    expect(zoom.automateZoomMeetingSettings).toHaveBeenCalledOnce();
    expect(errors.errorCatcher).not.toHaveBeenCalled();
  });

  it('waits until an hour and a quarter before the meeting', async () => {
    startAt(3 * 60 * MINUTE);

    await startM3();
    expect(actions()).toEqual([]);

    // 18:15.
    await vi.advanceTimersByTimeAsync(104 * MINUTE + 49 * SECOND);
    expect(actions()).toEqual([]);
    await vi.advanceTimersByTimeAsync(2 * SECOND);
    expect(actions()).toEqual(['before-meeting settings']);
  });

  it("skips the before-meeting settings in the meeting's last moments, then applies the meeting settings on time", async () => {
    // 80 s before the meeting: the music wouldn't start either.
    startAt(80 * SECOND);

    await startM3();
    expect(actions()).toEqual([]);

    await vi.advanceTimersByTimeAsync(10 * SECOND);
    expect(actions()).toEqual(['meeting settings']);
    expect(zoom.automateZoomPostMeetingSettings).not.toHaveBeenCalled();
  });

  it('applies the meeting settings right away when M³ starts after the music would have stopped', async () => {
    startAt(40 * SECOND);

    await startM3();
    expect(actions()).toEqual(['meeting settings']);
  });

  it('leaves Zoom alone once the meeting has started', async () => {
    startAt(-MINUTE);

    await startM3();
    await vi.advanceTimersByTimeAsync(10 * MINUTE);
    expect(actions()).toEqual([]);
  });

  it("still applies the meeting settings when the check runs into the meeting's start", async () => {
    startAt(55 * SECOND);
    checkTaking(2 * MINUTE, 'passed');

    await startM3();
    await vi.advanceTimersByTimeAsync(2 * MINUTE);
    expect(actions()).toEqual([
      'check started',
      'check done',
      'meeting settings',
    ]);
  });

  it('leaves the next step out when the user stops the check', async () => {
    startAt(30 * MINUTE);
    zoom.runZoomStartupCheck.mockResolvedValueOnce('cancelled');

    await startM3();
    await vi.advanceTimersByTimeAsync(MINUTE);
    expect(actions()).toEqual([]);

    // The meeting settings are a step of their own.
    await vi.advanceTimersByTimeAsync(29 * MINUTE);
    expect(actions()).toEqual(['meeting settings']);
  });

  it('launches the meeting once, then applies the settings when it opens', async () => {
    startAt(30 * MINUTE);
    currentState.currentSettings.zoomMeetingManagerAutoLaunchMeeting = true;
    zoom.world.meetingOpen = false;
    zoom.autoLaunchZoomMeetingIfNeeded.mockImplementation(async () => {
      zoom.calls.push('launch');
      zoom.world.meetingOpen = true;
    });

    await startM3();
    expect(actions()).toEqual(['launch']);

    // Tried again shortly, once the new meeting had time to settle.
    await vi.advanceTimersByTimeAsync(20 * SECOND);
    expect(actions()).toEqual(['launch', 'before-meeting settings']);

    // Closed by the user: never launched again.
    zoom.world.meetingOpen = false;
    await vi.advanceTimersByTimeAsync(30 * MINUTE);
    expect(zoom.autoLaunchZoomMeetingIfNeeded).toHaveBeenCalledOnce();
    expect(zoom.automateZoomMeetingSettings).not.toHaveBeenCalled();
  });

  it('launches the meeting even with no settings to apply', async () => {
    startAt(30 * MINUTE);
    Object.assign(currentState.currentSettings, {
      zoomMeetingManagerAutoLaunchMeeting: true,
      zoomMeetingManagerAutomateMeetingAudioSettings: false,
      zoomMeetingManagerAutomatePostMeetingAudioSettings: false,
    });
    zoom.world.meetingOpen = false;

    await startM3();
    await vi.advanceTimersByTimeAsync(60 * MINUTE);
    expect(actions()).toEqual(['launch']);
  });

  it('waits for the user to open the meeting when M³ is not to launch it', async () => {
    startAt(30 * MINUTE);
    zoom.world.meetingOpen = false;

    await startM3();
    await vi.advanceTimersByTimeAsync(5 * MINUTE);
    expect(actions()).toEqual([]);

    zoom.world.meetingOpen = true;
    await vi.advanceTimersByTimeAsync(20 * SECOND);
    expect(actions()).toEqual(['before-meeting settings']);
  });

  it.each([
    [
      'another automation is operating Zoom',
      ({ zoomState }: Awaited<ReturnType<typeof setup>>) => {
        zoomState.beginRun('zoom-run-media-sharing-start');
        return () => zoomState.endRun();
      },
    ],
    [
      'a failed check paused the automations',
      ({ zoomState }: Awaited<ReturnType<typeof setup>>) => {
        zoomState.pauseAutomations('cong-1', ['zoom-check-problem-meeting']);
        return () => zoomState.resumeAutomations();
      },
    ],
    [
      'the setup assistant is open',
      ({ dialogState }: Awaited<ReturnType<typeof setup>>) => {
        dialogState.openDialog(
          'zoom-setup-assistant',
          'DialogZoomSetupAssistant',
        );
        return () => dialogState.closeDialog('zoom-setup-assistant');
      },
    ],
  ])('waits while %s', async (_reason, block) => {
    startAt(30 * MINUTE);
    const context = await setup();
    const unblock = block(context);

    context.scheduleZoomAutomations();
    // Not quite 5 minutes: the run's watchdog would end it then.
    await vi.advanceTimersByTimeAsync(4 * MINUTE);
    expect(actions()).toEqual([]);

    unblock();
    await vi.advanceTimersByTimeAsync(15 * SECOND);
    expect(actions()).toEqual(['before-meeting settings']);
  });

  it('runs each step once, however often it is asked to', async () => {
    startAt(30 * MINUTE);
    const { runDueZoomAutomations } = await setup();

    await Promise.all([runDueZoomAutomations(), runDueZoomAutomations()]);
    await runDueZoomAutomations();
    expect(actions()).toEqual(['before-meeting settings']);
  });

  it('does nothing while the Zoom Meeting Manager is off', async () => {
    startAt(30 * MINUTE);
    currentState.currentSettings.zoomMeetingManagerEnable = false;

    await startM3();
    await vi.advanceTimersByTimeAsync(60 * MINUTE);
    expect(zoom.calls).toEqual([]);
  });

  it('starts again each day while M³ stays open', async () => {
    // Wednesday evening; the meeting is on Thursday at 19:30.
    vi.setSystemTime(new Date(2026, 9, 14, 20, 0));
    const { zoomState } = await startM3();
    zoomState.checkedCongregations = ['cong-1'];

    // Thursday, 18:14:59: today's check is to do again, and the meeting's
    // steps are not due yet.
    await vi.advanceTimersByTimeAsync((22 * 60 + 14) * MINUTE + 49 * SECOND);
    expect(zoomState.checkedCongregations).toEqual([]);
    expect(actions()).toEqual([]);

    // 18:15.
    await vi.advanceTimersByTimeAsync(2 * SECOND);
    expect(actions()).toEqual(['before-meeting settings']);
  });
});
