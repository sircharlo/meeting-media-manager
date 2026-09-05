import type { UpdaterProgressInfo, UpdaterState } from 'src/types';

import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import { pathExists } from 'fs-extra/esm';
import { IS_TEST } from 'src-electron/constants';
import { isDownloadErrorExpected } from 'src-electron/main/downloads';
import { getAppDataPath } from 'src-electron/main/fs';
import { getOsSupportWarning } from 'src-electron/main/os-support';
import {
  captureElectronError,
  isIgnoredUpdateError,
  isUpdaterFullDownloadFallbackError,
  markUpdaterFullDownloadFallback,
} from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import { log } from 'src/shared/vanilla';
import { join } from 'upath';

const isIgnoredUpdaterLog = (message?: string) => {
  if (!message) return false;

  return (
    message.includes('Cannot rename temp file to final file') ||
    isIgnoredUpdateError(message)
  );
};

const logUpdaterMessage = (
  level: 'debug' | 'error' | 'info' | 'warn',
  message: unknown,
) => {
  let normalizedMessage = '';

  if (typeof message === 'string') {
    normalizedMessage = message;
  } else if (message instanceof Error) {
    normalizedMessage = message.message;
  }

  markUpdaterFullDownloadFallback(message);

  if (isIgnoredUpdaterLog(normalizedMessage)) return;
  log(message, 'electronUpdater', level);
};

const updaterLogger = {
  debug: (message: unknown) => logUpdaterMessage('debug', message),
  error: (message: unknown) => logUpdaterMessage('error', message),
  info: (message: unknown) => logUpdaterMessage('info', message),
  warn: (message: unknown) => logUpdaterMessage('warn', message),
};

let updateDownloaded = false;
let updateInstallStarted = false;

// Current updater lifecycle state, kept so the renderer can catch up on an
// update that started before it mounted and missed the push events (the
// update check runs at startup, concurrently with window/renderer boot).
let updatePhase: UpdaterState['phase'] = null;
let lastUpdaterProgress: null | UpdaterProgressInfo = null;

export const getUpdaterState = (): UpdaterState => ({
  phase: updatePhase,
  progress: lastUpdaterProgress,
});

export const isUpdateInstallInProgress = () => updateInstallStarted;

const formatUpdateDownloadProgress = (info: UpdaterProgressInfo) => {
  const details: string[] = [];

  if (typeof info.percent === 'number' && Number.isFinite(info.percent)) {
    details.push(`${info.percent.toFixed(2)}%`);
  }

  if (
    typeof info.transferred === 'number' &&
    typeof info.total === 'number' &&
    Number.isFinite(info.transferred) &&
    Number.isFinite(info.total)
  ) {
    details.push(`${info.transferred}/${info.total} bytes`);
  }

  if (
    typeof info.bytesPerSecond === 'number' &&
    Number.isFinite(info.bytesPerSecond)
  ) {
    details.push(`${info.bytesPerSecond} B/s`);
  }

  if (typeof info.delta === 'number' && Number.isFinite(info.delta)) {
    details.push(`delta ${info.delta} bytes`);
  }

  return details.length ? details.join(', ') : 'unknown progress';
};

export const getUpdatesDisabledPath = async () =>
  join(await getAppDataPath(), 'Global Preferences', 'disable-updates');

export const getBetaUpdatesPath = async () =>
  join(await getAppDataPath(), 'Global Preferences', 'beta-updates');

const isPortable = () => !!process.env.PORTABLE_EXECUTABLE_DIR;

export async function initUpdater() {
  if (await pathExists(await getUpdatesDisabledPath())) return; // Skip updater if updates are disabled by user
  if (isPortable()) return; // Skip updater for portable version

  // SEC-6 (full-audit-2026-09-04.md): load-bearing for the beta<->stable
  // channel switch below (allowPrerelease toggled by getBetaUpdatesPath()) -
  // a user turning beta updates back off needs the updater willing to
  // install the latest stable release even when its version number is
  // lower than their currently-installed beta build, which electron-updater
  // would otherwise refuse as a "downgrade". Code-signature verification
  // still applies regardless of this flag, so it's not a path to unsigned
  // code - its real effect is allowing a version rollback, which relies on
  // the GitHub releases feed/assets themselves staying trustworthy.
  autoUpdater.allowDowngrade = true;
  autoUpdater.autoDownload = !IS_TEST;
  autoUpdater.autoInstallOnAppQuit = !IS_TEST;
  autoUpdater.logger = updaterLogger;

  autoUpdater.on('error', async (error, message) => {
    // Whatever was in progress is no longer verifiably progressing - reset
    // regardless of whether this specific error gets reported/ignored below,
    // so a stale 'downloading' phase doesn't stick around forever and
    // mislead a future renderer mount's catch-up (getUpdaterState()) into
    // showing a "downloading" notification for an update that actually
    // failed.
    updatePhase = null;
    lastUpdaterProgress = null;

    if (IS_TEST) return;

    if (await isDownloadErrorExpected()) return;

    if (
      message?.includes('read-only volume') ||
      error?.message?.includes('read-only volume')
    ) {
      sendToWindow(mainWindowInfo.mainWindow, 'update-error');
    }

    if (
      !isIgnoredUpdateError(error, message) &&
      !isUpdaterFullDownloadFallbackError(error)
    ) {
      captureElectronError(error, {
        contexts: {
          fn: { errorMessage: error.message, message, name: 'initUpdater' },
        },
      });
    }
  });

  autoUpdater.on('update-available', (info) => {
    log('Update available:', 'electronUpdater', 'log', info);
    updateDownloaded = false;
    updateInstallStarted = false;
    updatePhase = 'downloading';
    lastUpdaterProgress = null;
    sendToWindow(mainWindowInfo.mainWindow, 'update-available');
  });

  autoUpdater.on('download-progress', (info) => {
    log(
      `Update download progress: ${formatUpdateDownloadProgress(info)}`,
      'electronUpdater',
      'log',
    );
    lastUpdaterProgress = info;
    sendToWindow(mainWindowInfo.mainWindow, 'update-download-progress', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log('Update downloaded:', 'electronUpdater', 'log', info);
    updateDownloaded = true;
    updatePhase = 'downloaded';
    sendToWindow(mainWindowInfo.mainWindow, 'update-downloaded');
  });

  triggerUpdateCheck();
}

export const triggerUpdateCheck = async (attempt = 1) => {
  if (await pathExists(await getUpdatesDisabledPath())) {
    return;
  }

  // This release is the last one supporting 32-bit Windows and macOS 12, so
  // builds on those platforms must stop checking for updates: future releases
  // won't ship artifacts they can run, and attempting the update anyway would
  // download an incompatible installer (the Windows updater doesn't filter by
  // architecture) or fail after download on macOS.
  if (getOsSupportWarning()) {
    log(
      'Skipping update check: this platform is no longer supported by future releases.',
      'electronUpdater',
      'info',
    );
    return;
  }

  if (attempt === 1) {
    autoUpdater.allowPrerelease = await pathExists(await getBetaUpdatesPath());
  }

  try {
    const { default: isOnline } = await import('is-online');
    const online = await isOnline();
    if (online) {
      await autoUpdater.checkForUpdatesAndNotify();
    } else if (attempt < 5) {
      setTimeout(() => triggerUpdateCheck(attempt + 1), 5000);
    }
  } catch (error) {
    if (!isIgnoredUpdateError(error as Error | string)) {
      captureElectronError(error, {
        contexts: { fn: { name: 'triggerUpdateCheck' } },
      });
    }
  }
};

export function quitAndInstallUpdate() {
  if (!updateDownloaded) {
    log(
      'Ignoring quitAndInstall because no downloaded update is ready.',
      'electronUpdater',
      'warn',
    );
    return;
  }

  if (updateInstallStarted) {
    log(
      'Ignoring duplicate quitAndInstall request.',
      'electronUpdater',
      'warn',
    );
    return;
  }

  updateInstallStarted = true;

  try {
    autoUpdater.quitAndInstall(false, true);
  } catch (error) {
    updateInstallStarted = false;
    captureElectronError(error, {
      contexts: { fn: { name: 'quitAndInstallUpdate' } },
    });
  }
}
