import type { ZoomDiagnosis, ZoomFailureSnapshot } from 'src/types';

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
import { askBeforeCheckingZoom } from 'src/helpers/zoom-check-prompt';
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

// The startup check: once a day (per congregation) while M³ is open, before
// any automation relies on Zoom, M³ makes sure the meeting is open and that
// everything it automates works, much like the setup assistant's test. A
// meeting already open is checked right away; otherwise, on meeting days,
// M³ opens it in the same window background music can start in, before the
// meeting. If anything fails, the user is told and the Zoom automations are
// paused until M³ restarts or a new check passes, rather than risking an
// automation going wrong in front of the congregation. When it fails because
// Zoom's buttons no longer read as learned (Zoom's language was changed, or
// Zoom was updated), the user is offered the setup assistant instead, to
// learn them again. A check the user stops changes nothing.

export type ZoomStartupCheckOutcome =
  'cancelled' | 'declined' | 'failed' | 'passed' | 'scheduled' | 'skipped';

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

const findings = (problems: string[], details: string[] = []): Findings => ({
  details,
  problems,
});

const MEETING_OPEN_TIMEOUT_MS = 90_000;
const MEETING_POLL_MS = 3000;
// Lets a meeting that just opened finish setting up its window.
const MEETING_SETTLE_MS = 5000;

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
const checkWithoutPressing = async (): Promise<Findings> => {
  const needs = getNeeds();
  const diagnosis = await diagnoseZoom();
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
const testEverything = async (): Promise<Findings> => {
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
    steps,
    titles: getZoomTitlesFromSettings(),
  });
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
 * When the meeting may be opened for the check: in the window background
 * music can auto-start in (see the music store's shouldAutoStart), from
 * AUTO_START_WINDOW_HOURS before the meeting until just before it starts.
 * 'now', the seconds until the window opens, or null: no meeting today, or
 * it's starting or under way.
 */
const getMeetingOpeningWindow = (): 'now' | null | number => {
  const now = new Date();
  // Whichever day is selected in the media calendar.
  const start = getMeetingStartToday(now);
  if (!start) return null;
  const secondsUntilStart = (start.getTime() - now.getTime()) / 1000;
  const stopBufferSeconds =
    useCurrentStateStore().currentSettings?.meetingStopBufferSeconds ?? 60;
  if (secondsUntilStart <= stopBufferSeconds * 1.5) return null;
  const opensIn = secondsUntilStart - AUTO_START_WINDOW_HOURS * 3600;
  return opensIn > 0 ? opensIn : 'now';
};

const waitForMeeting = async () => {
  const deadline = Date.now() + MEETING_OPEN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(MEETING_POLL_MS); // NOSONAR: sequential - polls until ready
    const meeting = await getZoomMeetingState(); // NOSONAR: sequential - polls until ready
    if (meeting?.found) return true;
  }
  return false;
};

/**
 * With no meeting open: 'open' to open it for the check; null if there's
 * none to open now (no meeting today, or it's starting or under way), or,
 * before the meeting's window, when to check; or, asked for without a
 * meeting ID, that the meeting can't be opened.
 */
const planWithoutMeeting = (
  manual: boolean,
  meetingId: string | undefined,
): 'open' | Findings | null | { checkInSeconds: number } => {
  if (!manual) {
    const opening = getMeetingOpeningWindow();
    if (!meetingId || opening === null) return null;
    if (opening !== 'now') return { checkInSeconds: opening };
  }
  if (!meetingId) {
    return findings([MEETING_PROBLEM], ['meeting: none open, and no ID']);
  }
  return 'open';
};

/**
 * Opens the meeting first, given its ID, then checks it: tries everything
 * when alone in it, else only looks.
 */
const checkMeeting = (meetingToOpen: string | undefined) =>
  withZoomRun('zoom-run-startup-check', async () => {
    if (meetingToOpen) {
      log('Zoom check: opening the meeting', 'zoom', 'info');
      globalThis.electronApi.launchZoomMeeting(meetingToOpen);
      if (!(await waitForMeeting())) {
        return meetingNotFound(
          `meeting: not open ${MEETING_OPEN_TIMEOUT_MS / 1000} s after opening it`,
        );
      }
      await sleep(MEETING_SETTLE_MS);
    }

    const people = await countZoomMeetingParticipants();
    // Unknown counts as not alone: nothing gets pressed.
    if (people === 1) return testEverything();
    log('Zoom check: others in the meeting, only looking', 'zoom', 'info', {
      people,
    });
    return checkWithoutPressing();
  });

/**
 * What doesn't work in Zoom; null if there's nothing to check (no meeting
 * open, and none to open now); 'sharing' if it can't be checked until Zoom
 * stops sharing; 'declined' if the user would rather not have it checked;
 * 'unanswered' if nobody said whether it may run; or, before the meeting's
 * window, when to check.
 */
const findProblems = async (
  manual: boolean,
): Promise<
  | 'declined'
  | 'sharing'
  | 'unanswered'
  | Findings
  | null
  | { checkInSeconds: number }
> => {
  // Only looking, so far: nothing to tell the user about.
  const meeting = await getZoomMeetingState();
  if (!meeting) return findings([HELPER_PROBLEM]);
  // Never during a share: testing would end it, and in Zoom's single window
  // (its default) sharing hides the meeting window, and with it everything
  // a check looks at, which would read as no meeting at all.
  if (meeting.found && meeting.sharing) return 'sharing';

  const meetingId =
    useCurrentStateStore().currentSettings?.zoomMeetingManagerMeetingId?.trim();
  if (!meeting.found) {
    const plan = planWithoutMeeting(manual, meetingId);
    if (plan !== 'open') return plan;
  }

  // Zoom is about to be taken for a moment: the user says when.
  if (!manual) {
    const answer = await askBeforeCheckingZoom();
    if (answer === 'skip') return 'declined';
    // Nobody said: never wait on the question for ever (see the timeout in
    // zoom-check-prompt.ts), rather give up on this check and ask again.
    if (answer === 'unanswered') return 'unanswered';
  }

  // From here on, M³ may open the meeting and press things in Zoom.
  return checkMeeting(meeting.found ? undefined : meetingId);
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

/** Checks the Zoom Meeting Manager, when it may (see mayCheck). */
export const runZoomStartupCheck = async ({
  manual = false,
} = {}): Promise<ZoomStartupCheckOutcome> => {
  const zoomState = useZoomStateStore();
  const congregationId = useCurrentStateStore().currentCongregation;
  if (!congregationId || !mayCheck(congregationId, manual)) return 'skipped';

  zoomState.checkRunning = true;
  if (!zoomState.checkedCongregations.includes(congregationId)) {
    zoomState.checkedCongregations.push(congregationId);
  }
  const checkLater = () => {
    zoomState.checkedCongregations = zoomState.checkedCongregations.filter(
      (id) => id !== congregationId,
    );
  };
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
    if (found === null) {
      log('Zoom check: no meeting to check now', 'zoom', 'info');
      return 'skipped';
    }
    if (found === 'sharing') {
      // Today's check is still to do: the regular recheck runs it once
      // sharing has stopped.
      checkLater();
      log('Zoom check: waiting for Zoom to stop sharing', 'zoom', 'info');
      if (!manual) return 'scheduled';
      createTemporaryNotification({
        group: 'zoom-check',
        message: t('zoom-check-while-sharing'),
        type: 'warning',
      });
      return 'skipped';
    }
    if (found === 'declined') {
      // They'd rather M³ left Zoom alone: its automations go off for this
      // meeting, until an asked-for check passes (see the Zoom popup).
      zoomState.pauseAutomations(congregationId, [], false, true);
      log('Zoom check: skipped by the user, automations off', 'zoom', 'warn');
      createTemporaryNotification({
        caption: t('zoom-check-declined-caption'),
        group: 'zoom-check',
        message: t('zoom-automations-off-for-meeting'),
        timeout: 10_000,
        type: 'warning',
      });
      return 'declined';
    }
    if (found === 'unanswered') {
      // The question went unanswered, which is also what happens when no
      // dialog is there to answer it: today's check is still to do, so the
      // next one asks again, rather than Zoom going untested for the day.
      checkLater();
      log('Zoom check: nobody answered, asking again later', 'zoom', 'warn');
      return 'scheduled';
    }
    if ('checkInSeconds' in found) {
      // Too early: the meeting day's schedule (see zoom-meeting-day.ts)
      // checks again when the meeting's window opens, if M³ is still on.
      checkLater();
      log('Zoom check: waiting for the meeting', 'zoom', 'info', found);
      return 'scheduled';
    }
    return report(congregationId, found);
  } finally {
    zoomState.checkRunning = false;
  }
};

/**
 * Zoom was updated, or its buttons no longer read as learned (see
 * ZOOM_CHANGED_EVENT): today's check no longer counts, and a new one runs
 * as soon as a meeting can be checked.
 */
const onZoomChanged = () => {
  const zoomState = useZoomStateStore();
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
