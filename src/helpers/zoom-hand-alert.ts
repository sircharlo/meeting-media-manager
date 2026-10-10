import { i18n } from 'boot/i18n';
import useTimer from 'src/composables/useTimer';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getRendererPlatform } from 'src/helpers/fs';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { getZoomRaisedHands, pressZoomParticipantMic } from 'src/helpers/zoom';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';
import { useHandAlertStore } from 'stores/hand-alert';
import { watch } from 'vue';

// Watches Zoom's participants list for raised hands while the Zoom Meeting
// Manager's raised-hand alert is on: each new hand puts the hand alert on the
// timer display (for the chairman) and a notification in M³ (for the
// operator) with a button to mute or unmute that participant.

const t = (key: string, named?: Record<string, unknown>) =>
  (i18n.global.t as (key: string, named?: Record<string, unknown>) => string)(
    key,
    named ?? {},
  );

/** How often the list is read during a meeting. */
export const HAND_POLL_INTERVAL_MS = 4000;
/** How often to look again while no Zoom meeting is open. */
export const HAND_NO_MEETING_INTERVAL_MS = 30_000;
const NOTIFICATION_TIMEOUT_MS = 30_000;

let pollTimer: ReturnType<typeof setTimeout> | undefined;
let pollInProgress = false;
let stopDisplaySync: (() => void) | undefined;

export const isZoomHandAlertEnabled = () => {
  const settings = useCurrentStateStore().currentSettings;
  return (
    getRendererPlatform() === 'win32' &&
    !!settings?.zoomMeetingManagerEnable &&
    !!settings?.zoomMeetingManagerHandAlert &&
    !!settings?.zoomHandRaisedPhrase
  );
};

const notifyHandRaised = (name: string) => {
  createTemporaryNotification({
    actions: [
      {
        handler: () => {
          void pressZoomParticipantMic(name);
        },
        label: t('zoom-hand-mic'),
        noCaps: true,
      },
      { label: t('dismiss'), noCaps: true },
    ],
    group: `zoom-hand-${name}`,
    icon: 'mmm-groups',
    message: t('zoom-hand-raised', { name }),
    timeout: NOTIFICATION_TIMEOUT_MS,
    type: 'warning',
  });
};

/** Records what Zoom reports, telling the operator about each new hand. */
export const handleRaisedHands = (names: string[]) => {
  const store = useHandAlertStore();
  const newNames = names.filter((name) => !store.raisedHands.includes(name));
  store.setRaisedHands(names);
  for (const name of newNames) {
    log(`Raised hand in Zoom: ${name}`, 'zoom', 'info');
    notifyHandRaised(name);
  }
};

const schedulePoll = (delayMs: number) => {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(() => {
    void pollRaisedHands();
  }, delayMs);
};

const pollRaisedHands = async () => {
  if (!isZoomHandAlertEnabled()) {
    stopZoomHandAlertWatcher();
    return;
  }
  if (pollInProgress) {
    schedulePoll(HAND_POLL_INTERVAL_MS);
    return;
  }
  pollInProgress = true;
  try {
    const hands = await getZoomRaisedHands();
    if (hands === null) {
      // No meeting (or the list couldn't be read): nothing is raised.
      handleRaisedHands([]);
      schedulePoll(HAND_NO_MEETING_INTERVAL_MS);
      return;
    }
    handleRaisedHands(hands);
    schedulePoll(HAND_POLL_INTERVAL_MS);
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'pollRaisedHands' } } });
    schedulePoll(HAND_NO_MEETING_INTERVAL_MS);
  } finally {
    pollInProgress = false;
  }
};

export const startZoomHandAlertWatcher = () => {
  if (pollTimer !== undefined) return;
  if (!isZoomHandAlertEnabled()) return;
  log('Watching Zoom for raised hands', 'zoom', 'info');
  schedulePoll(0);
};

export const stopZoomHandAlertWatcher = () => {
  if (pollTimer === undefined) return;
  clearTimeout(pollTimer);
  pollTimer = undefined;
  useHandAlertStore().setRaisedHands([]);
  log('Stopped watching Zoom for raised hands', 'zoom', 'info');
};

/** Starts or stops the watcher to match the current settings. */
export const syncZoomHandAlertWatcher = () => {
  if (isZoomHandAlertEnabled()) {
    startZoomHandAlertWatcher();
  } else {
    stopZoomHandAlertWatcher();
  }
};

/**
 * Keeps the timer display up to date with the hand alert: the display only
 * learns about it from the timer's broadcasts, which otherwise only go out
 * while a part is being timed.
 */
export const startHandAlertDisplaySync = () => {
  if (stopDisplaySync) return;
  const store = useHandAlertStore();
  stopDisplaySync = watch(
    () => [store.active, store.raisedHands.join('\n')],
    () => {
      useTimer().updateTimerWindow();
    },
  );
};

export const __testables = {
  pollRaisedHands,
  reset: () => {
    clearTimeout(pollTimer);
    pollTimer = undefined;
    pollInProgress = false;
    stopDisplaySync?.();
    stopDisplaySync = undefined;
  },
};
