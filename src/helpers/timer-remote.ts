import { i18n } from 'boot/i18n';
import useTimer from 'src/composables/useTimer';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';

// Starts and stops the timer remote (src-electron/main/timer-remote.ts) to
// match the settings, and keeps the main process told of the page's words
// in M3's language.

const t = (key: string) => (i18n.global.t as (key: string) => string)(key);

const getPageText = (): Record<string, string> => ({
  elapsed: t('elapsed'),
  lang: i18n.global.locale.value,
  meetingStartsIn: t('meeting-starts-in'),
  paused: t('paused'),
  reconnecting: t('timer-remote-reconnecting'),
  remaining: t('remaining'),
});

export const parseTimerRemotePort = (value: null | string | undefined) => {
  const port = Number.parseInt(value ?? '', 10);
  if (!Number.isInteger(port) || port < 1024 || port > 65_535) return null;
  return port;
};

let runningPort: null | number = null;
let syncInProgress: null | Promise<void> = null;

const notifyStartFailed = (error: string | undefined) => {
  createTemporaryNotification({
    group: 'timer-remote',
    icon: 'mmm-error',
    message: t(
      error === 'port-in-use'
        ? 'timer-remote-port-in-use'
        : 'timer-remote-start-failed',
    ),
    type: 'negative',
  });
};

const applySettings = async () => {
  const currentState = useCurrentStateStore();
  const settings = currentState.currentSettings;
  const wanted =
    !!settings?.enableTimerDisplay && !!settings?.timerRemoteEnable
      ? parseTimerRemotePort(settings.timerRemotePort)
      : null;

  if (wanted === null) {
    if (runningPort !== null) {
      globalThis.electronApi.stopTimerRemote();
      runningPort = null;
      currentState.setTimerRemoteUrls([]);
      log('Timer remote stopped', 'timer', 'info');
    }
    return;
  }

  globalThis.electronApi.timerRemoteText(getPageText());
  if (runningPort === wanted) return;

  const status = await globalThis.electronApi.startTimerRemote(wanted);
  if (!status.running) {
    runningPort = null;
    currentState.setTimerRemoteUrls([]);
    notifyStartFailed(status.error);
    return;
  }
  runningPort = wanted;
  currentState.setTimerRemoteUrls(status.urls);
  log('Timer remote started', 'timer', 'info', status.urls);
  // Pages opened before the first part is timed need the current state.
  useTimer().updateTimerWindow();
};

/** Starts, restarts (new port) or stops the timer remote per the settings. */
export const syncTimerRemote = async () => {
  if (syncInProgress) await syncInProgress;
  syncInProgress = applySettings().catch((error) => {
    errorCatcher(error, { contexts: { fn: { name: 'syncTimerRemote' } } });
  });
  try {
    await syncInProgress;
  } finally {
    syncInProgress = null;
  }
};

export const __testables = {
  reset: () => {
    runningPort = null;
    syncInProgress = null;
  },
};
