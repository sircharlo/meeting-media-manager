import type { ZoomDiagnosis } from 'src/types';

import { i18n } from 'boot/i18n';
import { ZOOM_DIAGNOSIS_CHECKS } from 'src/constants/zoom';
import { getTodaysMeetingStartDateTime } from 'src/helpers/date';
import { createTemporaryNotification } from 'src/helpers/notifications';
import {
  countZoomMeetingParticipants,
  diagnoseZoom,
  getZoomMeetingState,
  getZoomTitlesFromSettings,
  isZoomSetupNeeded,
  prepareMediaWindowForZoomTest,
  runWhileHoldingZoomAutomations,
  testZoomShareEntry,
} from 'src/helpers/zoom';
import {
  runZoomSelfTest,
  ZOOM_SELF_TEST_STEP_LABELS,
  type ZoomSelfTestStepId,
} from 'src/helpers/zoom-self-test';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';
import { AUTO_START_WINDOW_HOURS } from 'stores/music';
import { useZoomStateStore } from 'stores/zoom-state';

// The startup check: once per M³ session (per congregation), before any
// automation relies on Zoom, M³ makes sure the meeting is open and that
// everything it automates works, much like the setup assistant's test. A
// meeting already open is checked right away; otherwise, on meeting days,
// M³ opens it in the same window background music can start in, before the
// meeting. If anything fails, the user is told and the Zoom automations are
// paused until M³ restarts or a new check passes, rather than risking an
// automation going wrong in front of the congregation.

export type ZoomStartupCheckOutcome =
  'failed' | 'passed' | 'scheduled' | 'skipped';

const STARTUP_DELAY_MS = 10_000;
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
const checkWithoutPressing = async (
  alreadySharing: boolean,
): Promise<string[]> => {
  const needs = getNeeds();
  const diagnosis = await diagnoseZoom();
  if (!diagnosis) return [HELPER_PROBLEM];
  if (!diagnosis.meeting) return [MEETING_PROBLEM];

  const problems: string[] = missingControls(
    diagnosis,
    needs.audio
      ? ['toolbar', 'videoButton', 'participantsPanel', 'hostControls']
      : ['toolbar'],
  );
  // Zoom's share window only opens on the host's screen. The media window
  // has to be showing to be offered, and it isn't shown just for this, as
  // it might be on the congregation's screens.
  const mediaWindowShowing = useCurrentStateStore().mediaWindowVisible;
  if (needs.sharing && !alreadySharing && mediaWindowShowing) {
    const share = await testZoomShareEntry(
      getZoomTitlesFromSettings().shareButtonTitle,
    );
    if (!share.opened || !share.windowSelected) problems.push(SHARE_PROBLEM);
  }
  return problems;
};

/** With nobody else in the meeting: tries each automated action. */
const testEverything = async (): Promise<string[]> => {
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
  const problems = results
    .filter((step) => step.status === 'failed')
    .map((step) => ZOOM_SELF_TEST_STEP_LABELS[step.id]);

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
  return problems;
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
  const start = getTodaysMeetingStartDateTime(now);
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
    await sleep(MEETING_POLL_MS);
    const meeting = await getZoomMeetingState();
    if (meeting?.found) return true;
  }
  return false;
};

/**
 * What doesn't work in Zoom (i18n keys); null if there's nothing to check
 * (no meeting open, and none to open now); or, before the meeting's window,
 * when to check.
 */
const findProblems = async (
  manual: boolean,
): Promise<null | string[] | { checkInSeconds: number }> => {
  const meeting = await getZoomMeetingState();
  if (!meeting) return [HELPER_PROBLEM];

  if (!meeting.found) {
    const meetingId =
      useCurrentStateStore().currentSettings?.zoomMeetingManagerMeetingId?.trim();
    if (!manual) {
      const opening = getMeetingOpeningWindow();
      if (!meetingId || opening === null) return null;
      if (opening !== 'now') return { checkInSeconds: opening };
    }
    if (!meetingId) return [MEETING_PROBLEM];
    log('Zoom check: opening the meeting', 'zoom', 'info');
    globalThis.electronApi.launchZoomMeeting(meetingId);
    if (!(await waitForMeeting())) return [MEETING_PROBLEM];
    await sleep(MEETING_SETTLE_MS);
  }

  const people = await countZoomMeetingParticipants();
  // Unknown counts as not alone: nothing gets pressed.
  if (people === 1) return testEverything();
  log('Zoom check: others in the meeting, only looking', 'zoom', 'info', {
    people,
  });
  return checkWithoutPressing(!!meeting.sharing);
};

const report = (
  congregationId: string,
  problems: string[],
  manual: boolean,
): ZoomStartupCheckOutcome => {
  const zoomState = useZoomStateStore();
  if (problems.length) {
    zoomState.pauseAutomations(congregationId, problems);
    log('Zoom check failed: automations paused', 'zoom', 'warn', { problems });
    createTemporaryNotification({
      actions: [
        {
          color: 'white',
          handler: () => {
            void runZoomStartupCheck({ manual: true });
          },
          label: t('zoom-check-test-again'),
        },
        { color: 'white', icon: 'close', round: true },
      ],
      caption: t('zoom-check-failed-caption', {
        problems: problems.map((key) => t(key)).join(', '),
      }),
      group: 'zoom-check',
      message: t('zoom-automations-paused'),
      timeout: 0,
      type: 'negative',
    });
    return 'failed';
  }

  const wasPaused = zoomState.automationsPaused;
  zoomState.resumeAutomations();
  log('Zoom check passed', 'zoom', 'info');
  if (manual || wasPaused) {
    createTemporaryNotification({
      group: 'zoom-check',
      message: t('zoom-check-passed'),
      type: 'positive',
    });
  }
  return 'passed';
};

/**
 * Checks the Zoom Meeting Manager. On its own (`manual` false), only once
 * per session per congregation, when the startup check is turned on and
 * the setup assistant has been through; asked for, whenever possible.
 */
export const runZoomStartupCheck = async ({
  manual = false,
} = {}): Promise<ZoomStartupCheckOutcome> => {
  const currentState = useCurrentStateStore();
  const zoomState = useZoomStateStore();
  const congregationId = currentState.currentCongregation;
  const settings = currentState.currentSettings;
  if (!congregationId || !settings?.zoomMeetingManagerEnable) return 'skipped';
  if (isZoomSetupNeeded() || zoomState.checkRunning) return 'skipped';
  if (!manual) {
    if (!settings.zoomMeetingManagerStartupCheck) return 'skipped';
    if (zoomState.checkedCongregations.includes(congregationId)) {
      return 'skipped';
    }
  }

  zoomState.checkRunning = true;
  if (!zoomState.checkedCongregations.includes(congregationId)) {
    zoomState.checkedCongregations.push(congregationId);
  }
  try {
    log('Zoom check: starting', 'zoom', 'info', { manual });
    const found = await runWhileHoldingZoomAutomations(() =>
      findProblems(manual),
    );
    if (found === null) {
      log('Zoom check: no meeting to check now', 'zoom', 'info');
      return 'skipped';
    }
    if (!Array.isArray(found)) {
      // Too early: check when the meeting's window opens, if M³ is still on.
      zoomState.checkedCongregations = zoomState.checkedCongregations.filter(
        (id) => id !== congregationId,
      );
      scheduleZoomStartupCheck(found.checkInSeconds * 1000);
      log('Zoom check: waiting for the meeting', 'zoom', 'info', found);
      return 'scheduled';
    }
    return report(congregationId, found, manual);
  } finally {
    zoomState.checkRunning = false;
  }
};

let startupTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Runs the startup check shortly after M³ starts (or a congregation is
 * opened), once things have settled, or after the given delay.
 */
export function scheduleZoomStartupCheck(delayMs = STARTUP_DELAY_MS) {
  clearTimeout(startupTimer);
  startupTimer = setTimeout(() => {
    void runZoomStartupCheck();
  }, delayMs);
}
