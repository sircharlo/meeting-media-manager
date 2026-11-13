import type {
  ZoomDiagnosis,
  ZoomFailureSnapshot,
  ZoomMeetingState,
} from 'src/types';

import { i18n } from 'boot/i18n';
import {
  ZOOM_DIAGNOSIS_CHECKS,
  ZOOM_SETUP_ASSISTANT_DIALOG_ID,
} from 'src/constants/zoom';
import { getMeetingStartToday } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import {
  countZoomMeetingParticipants,
  diagnoseZoom,
  getZoomMeetingState,
  getZoomSnapshot,
  getZoomTitlesFromSettings,
  isZoomSetupNeeded,
  prepareMediaWindowForZoomTest,
  rememberZoomVersion,
  runWhileHoldingZoomAutomations,
  takeZoomActionFailures,
  testZoomShareEntry,
  withZoomRun,
  ZOOM_CHANGED_EVENT,
  type ZoomActionFailure,
  zoomNamesChanged,
} from 'src/helpers/zoom';
import {
  answerZoomCheckPrompt,
  askBeforeCheckingZoom,
  CHECK_PROMPT_TIMEOUT_MS,
} from 'src/helpers/zoom-check-prompt';
import {
  runZoomSelfTest,
  ZOOM_SELF_TEST_STEP_LABELS,
  type ZoomSelfTestStepId,
} from 'src/helpers/zoom-self-test';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { AUTO_START_WINDOW_HOURS } from 'stores/music';
import { useZoomStateStore } from 'stores/zoom-state';
import { watch } from 'vue';

// The startup check: once a day (per congregation) while M³ is open, before
// any automation relies on Zoom, M³ makes sure the meeting is open and that
// everything it automates works, much like the setup assistant's test. On
// its own, it only runs on meeting days, in the same window background music
// can start in, before the meeting: on the meeting if it's open, else
// opening it. Before it presses Zoom's buttons (to open the meeting, or to
// test everything with the host alone in it), it asks the user; with others
// in the meeting, it only looks, and asks nothing. If anything fails, the
// user is told and the Zoom automations are paused until M³ restarts or a
// new check passes, rather than risking an automation going wrong in front
// of the congregation. When it fails because Zoom's buttons no longer read
// as learned (Zoom's language was changed, or Zoom was updated), the user is
// offered the setup assistant instead, to learn them again. A check the user
// stops changes nothing.

export type ZoomStartupCheckOutcome =
  'cancelled' | 'declined' | 'failed' | 'passed' | 'scheduled' | 'skipped';

/** A check that can go ahead: on the meeting open, or opening it first. */
interface CheckPlan {
  meetingToOpen?: string;
}

/** What a check found wrong. */
interface Findings {
  /** What each failed step ran into, for the error report. */
  details: string[];
  /** i18n keys of what doesn't work, to show the user. */
  problems: string[];
  /**
   * What Zoom showed when something the check waited for never happened, so
   * no action failed to leave a snapshot of its own (see meetingNotFound).
   */
  snapshot?: ZoomFailureSnapshot;
}

/**
 * Why a check that needed the user's go-ahead went without it: 'declined',
 * they'd rather not have Zoom tested; 'unanswered', nobody said; 'snoozed',
 * nobody answered the last question, not long ago; 'too-late', too close to
 * the meeting to ask (see LAST_QUESTION_MS).
 */
type NoGoAhead = 'declined' | 'snoozed' | 'too-late' | 'unanswered';

type NotChecked = NoGoAhead | NothingToCheck;

/**
 * Why a check can't go ahead now: no meeting today, or it's starting or
 * under way (null); 'no-meeting', asked for with no meeting open and no ID
 * to open it; 'sharing', until Zoom stops sharing; or, before the meeting's
 * window, when to check.
 */
type NothingToCheck =
  'no-meeting' | 'sharing' | null | { checkInSeconds: number };

const findings = (problems: string[], details: string[] = []): Findings => ({
  details,
  problems,
});

/** What a check the user stopped returns: dropped (see runCheck). */
const stopped = () => findings([]);

const MEETING_OPEN_TIMEOUT_MS = 90_000;
const MEETING_POLL_MS = 3000;
// Lets a meeting that just opened finish setting up its window.
const MEETING_SETTLE_MS = 5000;
// Ample time to test everything in a meeting that's open.
const TESTS_MS = 2 * 60_000;
// The latest an automatic check asks before the meeting's window closes
// (see getMeetingOpeningWindow): time enough for the question to wait for
// its answer, then for the check to open the meeting and test everything.
// So neither runs into the meeting, nor holds up the settings the meeting
// day's schedule applies after the check (see runDue in zoom-meeting-day.ts).
const LAST_QUESTION_MS =
  CHECK_PROMPT_TIMEOUT_MS +
  MEETING_OPEN_TIMEOUT_MS +
  MEETING_SETTLE_MS +
  TESTS_MS;
// After a question nobody answered, how long until the next: whoever is at
// the computer may be busy elsewhere, and the question, which stays in front
// of everything (M³'s shortcuts included), isn't to come back every few
// minutes for as long as the meeting is open.
const ASK_AGAIN_AFTER_MS = 15 * 60_000;

const HELPER_PROBLEM = 'zoom-check-problem-helper';
const MEETING_PROBLEM = 'zoom-check-problem-meeting';
const SHARE_PROBLEM = ZOOM_SELF_TEST_STEP_LABELS['share-start'];

const t = (key: string, named?: Record<string, unknown>) =>
  (i18n.global.t as (key: string, named?: Record<string, unknown>) => string)(
    key,
    named ?? {},
  );

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** What the enabled automations need from Zoom. */
const getNeeds = () => {
  const settings = useCurrentStateStore().currentSettings;
  return {
    // Both audio automations also switch the microphone and the camera,
    // and mute everyone.
    audio:
      !!settings?.zoomMeetingManagerAutomateMeetingAudioSettings ||
      !!settings?.zoomMeetingManagerAutomatePostMeetingAudioSettings,
    sharing: !!settings?.zoomMeetingManagerAutomateMediaSharing,
  };
};

/**
 * No meeting where the check needs one, with what Zoom shows instead: a
 * passcode or "waiting for the host" window, a sign-in or update prompt, only
 * Zoom's home window, or no Zoom at all (MMM-V2-3MW: these reports used to
 * say nothing but that the meeting wasn't there).
 */
const meetingNotFound = async (detail: string): Promise<Findings> => ({
  ...findings([MEETING_PROBLEM], [detail]),
  snapshot: (await getZoomSnapshot()) ?? undefined,
});

const missingControls = (
  diagnosis: ZoomDiagnosis,
  ids: (typeof ZOOM_DIAGNOSIS_CHECKS)[number]['id'][],
) =>
  ZOOM_DIAGNOSIS_CHECKS.filter(
    (check) => ids.includes(check.id) && !diagnosis[check.id],
  ).map((check) => check.label);

/**
 * With others in the meeting: finds every control the automations use,
 * without pressing anything they'd notice.
 */
const checkWithoutPressing = async (signal: AbortSignal): Promise<Findings> => {
  const needs = getNeeds();
  const diagnosis = await diagnoseZoom();
  if (signal.aborted) return stopped();
  if (!diagnosis) return findings([HELPER_PROBLEM]);
  if (!diagnosis.meeting) {
    return meetingNotFound('meeting: gone before its controls were checked');
  }

  const problems: string[] = missingControls(
    diagnosis,
    needs.audio
      ? ['toolbar', 'videoButton', 'participantsPanel', 'hostControls']
      : ['toolbar'],
  );
  const details: string[] = [];
  // Zoom's share window only opens on the host's screen. The media window
  // has to be showing to be offered, and it isn't shown just for this, as
  // it might be on the congregation's screens.
  const mediaWindowShowing = useCurrentStateStore().mediaWindowVisible;
  if (needs.sharing && mediaWindowShowing) {
    const share = await testZoomShareEntry(
      getZoomTitlesFromSettings().shareButtonTitle,
    );
    if (!share.opened || !share.windowSelected) {
      problems.push(SHARE_PROBLEM);
      details.push(`share-picker: ${JSON.stringify(share)}`);
    }
  }
  return findings(problems, details);
};

/** With nobody else in the meeting: tries each automated action. */
const testEverything = async (signal: AbortSignal): Promise<Findings> => {
  const needs = getNeeds();
  const steps: ZoomSelfTestStepId[] = ['meeting'];
  if (needs.audio) {
    steps.push(
      'leave-audio',
      'join-audio',
      'mic-off',
      'mic-on',
      'video-off',
      'video-on',
      'restore',
    );
  }
  if (needs.sharing) steps.push('share-start', 'share-stop');

  const results = await runZoomSelfTest({
    prepareMediaWindow: prepareMediaWindowForZoomTest,
    // Stopped, it doesn't go on to the next step (see untilStopped).
    signal,
    steps,
    titles: getZoomTitlesFromSettings(),
  });
  if (signal.aborted) return stopped();
  const failed = results.filter((step) => step.status === 'failed');
  const problems = failed.map((step) => ZOOM_SELF_TEST_STEP_LABELS[step.id]);
  const details = failed.map(
    (step) => `${step.id}: ${step.detail ?? 'failed'}`,
  );

  // Muting everyone can't be tried without anyone to mute: check that the
  // host controls it needs are there.
  if (needs.audio) {
    const diagnosis = await diagnoseZoom();
    if (!diagnosis) problems.push(HELPER_PROBLEM);
    else {
      problems.push(
        ...missingControls(diagnosis, ['participantsPanel', 'hostControls']),
      );
    }
  }
  return findings(problems, details);
};

/**
 * Today's meeting window for the check, in seconds from now: when it opens
 * and when it closes (see getMeetingOpeningWindow). Null with no meeting
 * today.
 */
const getMeetingWindowTimes = () => {
  const now = new Date();
  // Whichever day is selected in the media calendar.
  const start = getMeetingStartToday(now);
  if (!start) return null;
  const secondsUntilStart = (start.getTime() - now.getTime()) / 1000;
  const stopBufferSeconds =
    useCurrentStateStore().currentSettings?.meetingStopBufferSeconds ?? 60;
  return {
    closesIn: secondsUntilStart - stopBufferSeconds * 1.5,
    opensIn: secondsUntilStart - AUTO_START_WINDOW_HOURS * 3600,
  };
};

/**
 * When a check may run on its own: in the window background music can
 * auto-start in (see the music store's shouldAutoStart), from
 * AUTO_START_WINDOW_HOURS before the meeting until just before it starts.
 * 'now', the seconds until the window opens, or null: no meeting today, or
 * it's starting or under way.
 */
const getMeetingOpeningWindow = (): 'now' | null | number => {
  const times = getMeetingWindowTimes();
  if (!times || times.closesIn <= 0) return null;
  return times.opensIn > 0 ? times.opensIn : 'now';
};

/** Whether the meeting's window closes too soon to ask (see LAST_QUESTION_MS). */
const isTooLateToAsk = () =>
  (getMeetingWindowTimes()?.closesIn ?? 0) * 1000 < LAST_QUESTION_MS;

/**
 * Runs `run` with a signal aborted as soon as the user stops the check (see
 * cancelZoomRun), for it to give up at once. Unlike the stop request, which
 * only holds Zoom's actions back until the run is force-ended (abortRun
 * clears it, and Zoom's actions then go through again), the signal stays
 * aborted.
 */
const untilStopped = async <T>(
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> => {
  const controller = new AbortController();
  const stopWatching = watch(
    () => useZoomStateStore().cancellations,
    () => {
      controller.abort();
    },
    { flush: 'sync' },
  );
  try {
    return await run(controller.signal);
  } finally {
    stopWatching();
  }
};

/**
 * Waits for the meeting M³ opened: false if it isn't open in time, or the
 * user stopped the check meanwhile, after which nothing more goes to Zoom.
 */
const waitForMeeting = async (signal: AbortSignal) => {
  const deadline = Date.now() + MEETING_OPEN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(MEETING_POLL_MS); // NOSONAR: sequential - polls until ready
    if (signal.aborted) return false;
    const meeting = await getZoomMeetingState(); // NOSONAR: sequential - polls until ready
    if (meeting?.found) return true;
  }
  return false;
};

/**
 * Opens the meeting and lets it settle: false if it isn't open in time, or
 * the user stopped the check meanwhile.
 */
const openMeeting = async (meetingId: string, signal: AbortSignal) => {
  log('Zoom check: opening the meeting', 'zoom', 'info');
  globalThis.electronApi.launchZoomMeeting(meetingId);
  if (!(await waitForMeeting(signal))) return false;
  await sleep(MEETING_SETTLE_MS);
  return true;
};

/** See checkMeeting. */
const checkMeetingUntilStopped = async (
  meetingToOpen: string | undefined,
  mayPress: boolean,
  signal: AbortSignal,
): Promise<Findings> => {
  const open = !meetingToOpen || (await openMeeting(meetingToOpen, signal));
  if (signal.aborted) return stopped();
  if (!open) {
    return meetingNotFound(
      `meeting: not open ${MEETING_OPEN_TIMEOUT_MS / 1000} s after opening it`,
    );
  }
  if (!mayPress) return checkWithoutPressing(signal);

  const people = await countZoomMeetingParticipants();
  if (signal.aborted) return stopped();
  // Unknown counts as not alone: nothing gets pressed.
  if (people === 1) return testEverything(signal);
  log('Zoom check: others in the meeting, only looking', 'zoom', 'info', {
    people,
  });
  return checkWithoutPressing(signal);
};

/**
 * Checks the meeting, opening it first if given its ID: tries everything
 * when the host is alone in it, unless it mustn't press anything
 * (`mayPress` false), else only looks. Stopped by the user, it gives up at
 * once.
 */
const checkMeeting = (meetingToOpen: string | undefined, mayPress: boolean) =>
  withZoomRun('zoom-run-startup-check', () =>
    untilStopped((signal) =>
      checkMeetingUntilStopped(meetingToOpen, mayPress, signal),
    ),
  );

const getMeetingId = () =>
  useCurrentStateStore().currentSettings?.zoomMeetingManagerMeetingId?.trim();

/**
 * What a check can do, given what Zoom shows (null: the helper couldn't
 * tell). On its own, it only runs in the meeting's window (see
 * getMeetingOpeningWindow), whether or not the meeting is open: never
 * during or after the meeting, nor on a day without one.
 */
const planCheck = (
  manual: boolean,
  meeting: null | ZoomMeetingState,
): CheckPlan | Findings | NothingToCheck => {
  if (!meeting) return findings([HELPER_PROBLEM]);
  // Never during a share: testing would end it, and in Zoom's single window
  // (its default) sharing hides the meeting window, and with it everything
  // a check looks at, which would read as no meeting at all.
  if (meeting.found && meeting.sharing) return 'sharing';
  if (!manual) {
    const opening = getMeetingOpeningWindow();
    if (opening === null) return null;
    if (opening !== 'now') return { checkInSeconds: opening };
  }
  if (meeting.found) return {};
  const meetingId = getMeetingId();
  if (meetingId) return { meetingToOpen: meetingId };
  return manual ? 'no-meeting' : null;
};

const goesAhead = (
  plan: CheckPlan | Findings | NothingToCheck,
): plan is CheckPlan =>
  !!plan &&
  typeof plan === 'object' &&
  !('problems' in plan) &&
  !('checkInSeconds' in plan);

/**
 * How many are in the meeting, the host included, when Zoom's participants
 * panel shows others than the host: null if it doesn't, or isn't open, as
 * reading it then means opening it, which presses Zoom's buttons (see
 * countZoomMeetingParticipants). Unknown counts as maybe alone.
 */
const peekAtOthers = async () => {
  const people = await countZoomMeetingParticipants({ peek: true });
  return people !== null && people > 1 ? people : null;
};

/**
 * Asks the user whether the check may press Zoom's buttons now (see
 * askBeforeCheckingZoom), unless it's too late to (see LAST_QUESTION_MS),
 * or the last question went unanswered not long ago (see
 * ASK_AGAIN_AFTER_MS).
 */
const askFirst = async (): Promise<'run' | NoGoAhead> => {
  if (isTooLateToAsk()) return 'too-late';
  const zoomState = useZoomStateStore();
  if (Date.now() < zoomState.checkPromptSnoozedUntil) return 'snoozed';
  const answer = await askBeforeCheckingZoom();
  zoomState.checkPromptSnoozedUntil =
    answer === 'unanswered' ? Date.now() + ASK_AGAIN_AFTER_MS : 0;
  return answer === 'skip' ? 'declined' : answer;
};

/**
 * What doesn't work in Zoom, or why it wasn't checked (see NotChecked).
 * Zoom's buttons are only pressed (to open the meeting, or to test
 * everything with the host alone in it) once the user said so, or when they
 * asked for the check; with others in the meeting, it only looks, and asks
 * nothing.
 */
const findProblems = async (
  manual: boolean,
): Promise<Findings | NotChecked> => {
  // Only looking, so far: nothing to tell the user about.
  const plan = planCheck(manual, await getZoomMeetingState());
  if (!goesAhead(plan)) return plan;
  if (manual) return checkMeeting(plan.meetingToOpen, true);
  const people = plan.meetingToOpen ? null : await peekAtOthers();
  if (people) {
    log('Zoom check: others in the meeting, only looking', 'zoom', 'info', {
      people,
    });
    return checkMeeting(undefined, false);
  }

  // Zoom is about to be taken for a moment: the user says when.
  const answer = await askFirst();
  if (answer !== 'run') return answer;
  // The answer can take a while: Zoom is looked at again, as the user may
  // have opened the meeting or started sharing meanwhile.
  const replanned = planCheck(manual, await getZoomMeetingState());
  if (!goesAhead(replanned)) return replanned;
  return checkMeeting(replanned.meetingToOpen, true);
};

/**
 * Tells Sentry that a check failed, grouped by what failed, with what each
 * failed step and action ran into and what Zoom showed (version, windows,
 * button names) when the check gave up waiting, or else at the last failed
 * action, so a Zoom update or an untested language breaking the Zoom Meeting
 * Manager shows up as one issue with the details to fix it. Each failed
 * action also left its own breadcrumb.
 */
const reportFailedCheck = async (
  { details, problems, snapshot }: Findings,
  failures: ZoomActionFailure[],
  namesChanged: boolean,
) => {
  try {
    const { captureMessage } = await import('@sentry/vue');
    const last = failures.at(-1);
    // The check's own snapshot explains what it waited for in vain; else
    // the last failed action's shows what that action ran into.
    const shown = snapshot ?? last?.snapshot;
    const snapshotAction = snapshot ? 'snapshot' : (last?.action ?? null);
    captureMessage('Zoom check failed: automations paused', {
      extra: {
        // Spread out: Sentry flattens the snapshot's lists if nested deeper.
        ...shown,
        failedActions: failures.map(
          ({ action, error }) => `${action}: ${error ?? 'failed'}`,
        ),
        failedSteps: details,
        namesChanged,
        problems,
        snapshotAction,
        zoomVersion:
          shown?.zoomVersion ??
          useZoomStateStore().meeting?.zoomVersion ??
          null,
      },
      fingerprint: ['zoom-check-failed', ...problems],
      level: 'warning',
      tags: { feature: 'zoom-meeting-manager' },
    });
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'reportFailedCheck' } } });
  }
};

// A microphone or camera button that reads as neither of its learned names.
const UNRECOGNIZED_TITLE = /^(?:mic|video)-title-unrecognized:/;

/**
 * Whether the check failed because Zoom's buttons no longer read as learned,
 * which testing again won't fix: an action said so, or Zoom's camera button
 * reads as neither of its learned names.
 */
const failedOnChangedNames = (failures: ZoomActionFailure[]) =>
  failures.some(({ error }) => UNRECOGNIZED_TITLE.test(error ?? '')) ||
  zoomNamesChanged(useZoomStateStore().meeting);

// Closes the last failed check's notification, which stays until closed.
let dismissFailedCheckNotice: (() => void) | undefined;

/**
 * Closes the notification of a failed check, if it's still showing: the
 * setup assistant, which it may offer, does so as it opens.
 */
export const dismissFailedZoomCheckNotice = () => {
  dismissFailedCheckNotice?.();
  dismissFailedCheckNotice = undefined;
};

const notifyFailedCheck = (problems: string[], namesChanged: boolean) => {
  dismissFailedCheckNotice = createTemporaryNotification({
    actions: [
      namesChanged
        ? {
            color: 'white',
            handler: () => {
              globalThis.dispatchEvent(
                new CustomEvent('openZoomSetupAssistant'),
              );
            },
            label: t('zoom-setup-open'),
          }
        : {
            color: 'white',
            handler: () => {
              void runZoomStartupCheck({ manual: true });
            },
            label: t('zoom-check-test-again'),
          },
      { color: 'white', icon: 'close', round: true },
    ],
    caption: namesChanged
      ? t('zoom-check-names-changed')
      : t('zoom-check-failed-caption', {
          problems: problems.map((key) => t(key)).join(', '),
        }),
    group: 'zoom-check',
    message: t('zoom-automations-paused'),
    timeout: 0,
    type: 'negative',
  });
};

const report = (
  congregationId: string,
  found: Findings,
): ZoomStartupCheckOutcome => {
  const zoomState = useZoomStateStore();
  const { problems } = found;
  if (problems.length) {
    const failures = takeZoomActionFailures();
    const namesChanged = failedOnChangedNames(failures);
    zoomState.pauseAutomations(congregationId, problems, namesChanged);
    log('Zoom check failed: automations paused', 'zoom', 'warn', {
      ...found,
      namesChanged,
    });
    void reportFailedCheck(found, failures, namesChanged);
    notifyFailedCheck(problems, namesChanged);
    return 'failed';
  }

  zoomState.resumeAutomations();
  rememberZoomVersion();
  log('Zoom check passed', 'zoom', 'info');
  // Confirmed even when nobody asked and nothing was paused: the check
  // presses Zoom's buttons, so it says how that went.
  createTemporaryNotification({
    group: 'zoom-check',
    message: t('zoom-check-passed'),
    type: 'positive',
  });
  return 'passed';
};

/**
 * Whether the check may run now: on its own (`manual` false), only once a
 * day per congregation, when the startup check is turned on and the setup
 * assistant has been through; asked for, whenever possible.
 */
const mayCheck = (congregationId: string, manual: boolean) => {
  const settings = useCurrentStateStore().currentSettings;
  const zoomState = useZoomStateStore();
  if (!settings?.zoomMeetingManagerEnable) return false;
  if (isZoomSetupNeeded() || zoomState.checkRunning) return false;
  // The setup assistant operates Zoom and tests everything itself, and its
  // names are half learned on the way (which also makes Zoom look changed):
  // a check now would get in its way. Today's check is still to do.
  if (useDialogStateStore().isDialogOpen(ZOOM_SETUP_ASSISTANT_DIALOG_ID)) {
    return false;
  }
  if (manual) return true;
  // They said no already (Test again is the way back): don't ask twice.
  if (zoomState.checkDeclined) return false;
  return (
    settings.zoomMeetingManagerStartupCheck &&
    !zoomState.checkedCongregations.includes(congregationId) &&
    // Never while an automation operates Zoom: they'd press each other's
    // buttons. Today's check is still to do.
    !zoomState.runActive
  );
};

/** Leaves today's check to do: the meeting day's schedule runs the next. */
const checkLater = (congregationId: string) => {
  const zoomState = useZoomStateStore();
  zoomState.checkedCongregations = zoomState.checkedCongregations.filter(
    (id) => id !== congregationId,
  );
};

/**
 * They'd rather M³ left Zoom alone: its automations go off for this
 * meeting, until the day is over or an asked-for check passes (see the Zoom
 * popup).
 */
const turnOffForMeeting = (congregationId: string): ZoomStartupCheckOutcome => {
  useZoomStateStore().pauseAutomations(congregationId, [], false, true);
  log('Zoom check: skipped by the user, automations off', 'zoom', 'warn');
  createTemporaryNotification({
    caption: t('zoom-check-declined-caption'),
    group: 'zoom-check',
    message: t('zoom-automations-off-for-meeting'),
    timeout: 10_000,
    type: 'warning',
  });
  return 'declined';
};

/**
 * Asked for with no meeting open, and no meeting ID to open it: nothing to
 * check, which is down to the setup, not to anything broken in Zoom. The
 * user is told, but it isn't reported, and the automations stay as they
 * were.
 */
const sayThereIsNoMeeting = (): ZoomStartupCheckOutcome => {
  log('Zoom check: no meeting open, and no meeting ID', 'zoom', 'info');
  createTemporaryNotification({
    caption: t('zoom-meeting-manager-meeting-id-missing'),
    group: 'zoom-check',
    message: t('zoom-meeting-window-not-found'),
    type: 'warning',
  });
  return 'skipped';
};

/**
 * Zoom is sharing: the regular recheck runs the check once sharing has
 * stopped; asked for, the user is told.
 */
const waitForSharingToStop = (manual: boolean): ZoomStartupCheckOutcome => {
  log('Zoom check: waiting for Zoom to stop sharing', 'zoom', 'info');
  if (!manual) return 'scheduled';
  createTemporaryNotification({
    group: 'zoom-check',
    message: t('zoom-check-while-sharing'),
    type: 'warning',
  });
  return 'skipped';
};

/** What a check that didn't go ahead comes to (see NotChecked). */
const settleNotChecked = (
  reason: NotChecked,
  manual: boolean,
  congregationId: string,
): ZoomStartupCheckOutcome => {
  if (reason === null) {
    log('Zoom check: no meeting to check now', 'zoom', 'info');
    return 'skipped';
  }
  if (reason === 'declined') return turnOffForMeeting(congregationId);
  if (reason === 'too-late') {
    // Nor is it asked again today: the meeting is about to start.
    log('Zoom check: too close to the meeting to ask', 'zoom', 'info', {
      windowClosesInSeconds: getMeetingWindowTimes()?.closesIn,
    });
    return 'skipped';
  }

  // Today's check is still to do.
  checkLater(congregationId);
  if (reason === 'no-meeting') return sayThereIsNoMeeting();
  if (reason === 'sharing') return waitForSharingToStop(manual);
  if (reason === 'unanswered') {
    // Also what happens when no dialog is there to answer it: asked again
    // later (see ASK_AGAIN_AFTER_MS), rather than Zoom going untested for
    // the day.
    log('Zoom check: nobody answered, asking again later', 'zoom', 'warn');
  } else if (reason === 'snoozed') {
    const snoozedUntil = useZoomStateStore().checkPromptSnoozedUntil;
    log(
      'Zoom check: last question unanswered, not asking yet',
      'zoom',
      'info',
      {
        askingAgainInSeconds: Math.round((snoozedUntil - Date.now()) / 1000),
      },
    );
  } else {
    // Too early: the meeting day's schedule (see zoom-meeting-day.ts)
    // checks again when the meeting's window opens, if M³ is still on.
    log('Zoom check: waiting for the meeting', 'zoom', 'info', reason);
  }
  return 'scheduled';
};

const isFindings = (found: Findings | NotChecked): found is Findings =>
  !!found && typeof found === 'object' && 'problems' in found;

/** Runs a check that may run (see mayCheck). */
const runCheck = async (
  congregationId: string,
  manual: boolean,
): Promise<ZoomStartupCheckOutcome> => {
  const zoomState = useZoomStateStore();
  zoomState.checkRunning = true;
  if (!zoomState.checkedCongregations.includes(congregationId)) {
    zoomState.checkedCongregations.push(congregationId);
  }
  try {
    log('Zoom check: starting', 'zoom', 'info', { manual });
    // Only this check's failed actions go in its report.
    takeZoomActionFailures();
    const cancellations = zoomState.cancellations;
    const found = await runWhileHoldingZoomAutomations(() =>
      findProblems(manual),
    );
    if (zoomState.cancellations !== cancellations) {
      // Whatever failed after the user stopped it never ran.
      log('Zoom check: stopped by the user', 'zoom', 'info');
      return 'cancelled';
    }
    if (isFindings(found)) return report(congregationId, found);
    return settleNotChecked(found, manual, congregationId);
  } finally {
    zoomState.checkRunning = false;
  }
};

// The check under way, for Test again to join while it waits for the
// user's go-ahead.
let checkUnderWay: null | Promise<ZoomStartupCheckOutcome> = null;

/** Checks the Zoom Meeting Manager, when it may (see mayCheck). */
export const runZoomStartupCheck = async ({
  manual = false,
} = {}): Promise<ZoomStartupCheckOutcome> => {
  // Asked for (Test again, in a notification above the question) while a
  // check waits for the user's go-ahead: that's the go-ahead.
  if (manual && checkUnderWay && useZoomStateStore().checkPrompt) {
    log('Zoom check: asked for while asking, so it runs', 'zoom', 'info');
    answerZoomCheckPrompt('run');
    return checkUnderWay;
  }
  const congregationId = useCurrentStateStore().currentCongregation;
  if (!congregationId || !mayCheck(congregationId, manual)) return 'skipped';
  const check = runCheck(congregationId, manual);
  checkUnderWay = check;
  try {
    return await check;
  } finally {
    checkUnderWay = null;
  }
};

/**
 * Zoom was updated, or its buttons no longer read as learned (see
 * ZOOM_CHANGED_EVENT): today's check no longer counts, and a new one runs
 * as soon as a meeting can be checked.
 */
const onZoomChanged = () => {
  const zoomState = useZoomStateStore();
  // Noticed while a check is under way, most often by its own first look at
  // Zoom (nothing else polls Zoom during a check's run): that check covers
  // it. Dropping today's check now would only have it asked for and run
  // again once this one is over.
  if (zoomState.checkRunning) return;
  const congregationId = useCurrentStateStore().currentCongregation;
  zoomState.checkedCongregations = zoomState.checkedCongregations.filter(
    (id) => id !== congregationId,
  );
  void runZoomStartupCheck();
};

/** Starts checking again whenever Zoom changes (once per app window). */
export const watchZoomChanges = () => {
  globalThis.removeEventListener(ZOOM_CHANGED_EVENT, onZoomChanged);
  globalThis.addEventListener(ZOOM_CHANGED_EVENT, onZoomChanged);
};
