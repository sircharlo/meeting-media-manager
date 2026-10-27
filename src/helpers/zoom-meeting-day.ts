import { AUTO_START_WINDOW_HOURS } from 'src/constants/date';
import { ZOOM_SETUP_ASSISTANT_DIALOG_ID } from 'src/constants/zoom';
import { getMeetingStartToday } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  autoLaunchZoomMeetingIfNeeded,
  automateZoomMeetingSettings,
  automateZoomPostMeetingSettings,
  getZoomMeetingState,
} from 'src/helpers/zoom';
import { runZoomStartupCheck } from 'src/helpers/zoom-startup-check';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { useZoomStateStore } from 'stores/zoom-state';

// Before each meeting, the Zoom Meeting Manager's automatic steps run one
// after the other, on the meeting's own schedule rather than background
// music's (which may be off, or stopped by hand):
//
// 1. From AUTO_START_WINDOW_HOURS before the meeting (or once M³ starts, if
//    later): the startup check, which opens the meeting (or else
//    auto-launch does), then the before/after-meeting settings. Not in the
//    meeting's last moments, when background music doesn't start either:
//    the meeting settings would undo them right away.
// 2. When background music stops (meetingStopBufferSeconds before the
//    meeting): the meeting settings, which also tick off the before-meeting
//    checklist. Also when M³ only starts then, but never once the meeting
//    has started.
//
// Each step runs once per meeting. One that can't run yet (no meeting open,
// something else using Zoom, the automations paused) is tried again every
// few seconds for as long as it's due. After the meeting, starting
// background music applies the before/after-meeting settings (see the music
// store).

interface MeetingSchedule {
  /** Today's meeting, for the current congregation. */
  key: string;
  /** When the next step is due (ms), if one is still to come. */
  nextAt: null | number;
  /** The step due now, if any. */
  step: MeetingStep | null;
}

type MeetingStep = 'before-meeting' | 'meeting';

const STARTUP_DELAY_MS = 10_000;
// M³ may stay open for days: each new day gets its own check and steps, and
// a computer that slept through a step's time catches up when it wakes.
const RECHECK_INTERVAL_MS = 5 * 60 * 1000;
const RETRY_MS = 15_000;
// Lets a meeting that just opened finish setting up its window.
const MEETING_SETTLE_MS = 5000;
// With the music stopping right as the meeting starts, the meeting settings
// still get a moment to run.
const MIN_MEETING_STEP_MS = 30_000;

const STEP_SETTINGS = {
  'before-meeting': 'zoomMeetingManagerAutomatePostMeetingAudioSettings',
  meeting: 'zoomMeetingManagerAutomateMeetingAudioSettings',
} as const;

/** Steps done (or given up on) today, as `<meeting key>:<step>`. */
const doneSteps = new Set<string>();
/** Meetings M³ found open or launched: it never launches one twice. */
const launchedMeetings = new Set<string>();
let meetingWasMissing = false;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Which step is due at `now`, and when the next one is. */
const getSchedule = (now: Date): MeetingSchedule | null => {
  const currentState = useCurrentStateStore();
  const congregationId = currentState.currentCongregation;
  const start = getMeetingStartToday(now)?.getTime();
  if (!congregationId || !start) return null;

  const stopBufferMs =
    (currentState.currentSettings?.meetingStopBufferSeconds ?? 60) * 1000;
  const beforeFrom = start - AUTO_START_WINDOW_HOURS * 3600 * 1000;
  // As background music's auto-start (see the music store's shouldAutoStart).
  const beforeUntil = start - stopBufferMs * 1.5;
  const meetingFrom = start - stopBufferMs;
  const meetingUntil = Math.max(start, meetingFrom + MIN_MEETING_STEP_MS);
  const key = `${congregationId}:${new Date(start).toDateString()}`;
  const time = now.getTime();

  if (time < beforeFrom) return { key, nextAt: beforeFrom, step: null };
  if (time < beforeUntil) {
    return { key, nextAt: meetingFrom, step: 'before-meeting' };
  }
  if (time < meetingFrom) return { key, nextAt: meetingFrom, step: null };
  if (time < meetingUntil) return { key, nextAt: null, step: 'meeting' };
  return { key, nextAt: null, step: null };
};

const isPending = (schedule: MeetingSchedule | null) =>
  !!schedule?.step && !doneSteps.has(`${schedule.key}:${schedule.step}`);

/**
 * Whether a step has to wait: the automations are paused, or something
 * else is using Zoom.
 */
const mustWait = () => {
  const zoomState = useZoomStateStore();
  return (
    zoomState.automationsPaused ||
    zoomState.checkRunning ||
    zoomState.runActive ||
    useDialogStateStore().isDialogOpen(ZOOM_SETUP_ASSISTANT_DIALOG_ID)
  );
};

/**
 * Runs a step: launches the meeting first, if that's turned on, then
 * applies the step's settings. Resolves to whether it's done (false: to be
 * tried again).
 */
const runStep = async (step: MeetingStep, key: string) => {
  const settings = useCurrentStateStore().currentSettings;
  const applies = !!settings?.[STEP_SETTINGS[step]];
  const launches =
    !!settings?.zoomMeetingManagerAutoLaunchMeeting &&
    !launchedMeetings.has(key);
  if (!applies && !launches) return true;
  if (mustWait()) return false;

  const meeting = await getZoomMeetingState();
  if (!meeting?.found) {
    meetingWasMissing = true;
    if (launches) {
      launchedMeetings.add(key);
      await autoLaunchZoomMeetingIfNeeded();
    }
    // The settings wait for the meeting to open.
    return !applies;
  }
  launchedMeetings.add(key);
  if (!applies) return true;

  if (meetingWasMissing) {
    meetingWasMissing = false;
    await sleep(MEETING_SETTLE_MS);
  }
  log(`Zoom ${step} step: applying its settings`, 'zoom', 'info');
  await (step === 'meeting'
    ? automateZoomMeetingSettings()
    : automateZoomPostMeetingSettings());
  return true;
};

/**
 * Runs the startup check, then the step due, if any, so they never get in
 * each other's way.
 */
const runDue = async () => {
  if (!useCurrentStateStore().currentSettings?.zoomMeetingManagerEnable) {
    return;
  }
  const dueBefore = getSchedule(new Date());
  const outcome = await runZoomStartupCheck();
  const schedule = getSchedule(new Date());
  // The check can take a while. The meeting settings, if due when it began,
  // still run after it, even once the meeting has started; the
  // before/after-meeting settings don't, if their time is over by then.
  const step = dueBefore?.step === 'meeting' ? dueBefore.step : schedule?.step;
  if (!step || !schedule) return;
  const stepKey = `${schedule.key}:${step}`;
  if (doneSteps.has(stepKey)) return;

  if (outcome === 'cancelled') {
    // The user stopped the check: Zoom is left alone until the next step.
    doneSteps.add(stepKey);
    log(`Zoom ${step} step: skipped, the check was stopped`, 'zoom', 'info');
    return;
  }
  if (await runStep(step, schedule.key)) doneSteps.add(stepKey);
};

let running = false;
let runAgain = false;
let stepTimer: ReturnType<typeof setTimeout> | undefined;

/** Wakes up when the next step is due, or to try a waiting one again. */
const scheduleNextStep = () => {
  clearTimeout(stepTimer);
  if (!useCurrentStateStore().currentSettings?.zoomMeetingManagerEnable) {
    return;
  }
  const now = Date.now();
  const schedule = getSchedule(new Date(now));
  const at = isPending(schedule) ? now + RETRY_MS : schedule?.nextAt;
  if (!at) return;
  stepTimer = setTimeout(
    () => {
      void runDueZoomAutomations();
    },
    Math.max(0, at - now),
  );
};

/** Runs whatever is due now, one run at a time, then waits for what's next. */
export const runDueZoomAutomations = async () => {
  if (running) {
    runAgain = true;
    return;
  }
  running = true;
  try {
    do {
      runAgain = false;
      await runDue(); // NOSONAR: sequential - a run asked for meanwhile follows this one
    } while (runAgain);
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'runDueZoomAutomations' } },
    });
  } finally {
    running = false;
    scheduleNextStep();
  }
};

let startupTimer: ReturnType<typeof setTimeout> | undefined;
let recheckTimer: ReturnType<typeof setInterval> | undefined;
let checkedDay = new Date().toDateString();

const recheck = () => {
  const today = new Date().toDateString();
  if (today !== checkedDay) {
    checkedDay = today;
    useZoomStateStore().checkedCongregations = [];
    doneSteps.clear();
    launchedMeetings.clear();
  }
  void runDueZoomAutomations();
};

/**
 * Starts the Zoom Meeting Manager's automatic steps shortly after M³ starts
 * (or a congregation is opened), once things have settled, or after the
 * given delay; from then on, they run as they're due, each day.
 */
export function scheduleZoomAutomations(delayMs = STARTUP_DELAY_MS) {
  clearTimeout(startupTimer);
  startupTimer = setTimeout(() => {
    void runDueZoomAutomations();
  }, delayMs);
  recheckTimer ??= setInterval(recheck, RECHECK_INTERVAL_MS);
}
