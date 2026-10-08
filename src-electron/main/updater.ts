import type {
  UpdaterProgressInfo,
  UpdaterState,
  UpdateVersionInfo,
} from 'src/types';

import { app } from 'electron';
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
import {
  mainWindowInfo,
  toggleAuthorizedClose,
} from 'src-electron/main/window/window-main';
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
let lastUpdateVersionInfo: null | UpdateVersionInfo = null;

export const getUpdaterState = (): UpdaterState => ({
  phase: updatePhase,
  progress: lastUpdaterProgress,
  versionInfo: lastUpdateVersionInfo,
});

/**
 * Compares two version strings using semver precedence (release outranks a
 * prerelease of the same X.Y.Z; prerelease identifiers compared
 * numerically-then-lexicographically per dot-segment) - just enough to
 * correctly detect a downgrade for this app's own version scheme
 * (`X.Y.Z` or `X.Y.Z-beta.N`), without pulling in the full semver package
 * for one comparison (it's only a transitive dependency here).
 * @returns negative if a < b, positive if a > b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const [aRelease, aPre] = a.split('-', 2);
  const [bRelease, bPre] = b.split('-', 2);

  const aParts = (aRelease || '').split('.').map(Number);
  const bParts = (bRelease || '').split('.').map(Number);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (diff !== 0) return diff;
  }

  // Same release version - a release (no prerelease tag) outranks any
  // prerelease of that same version.
  if (!aPre && !bPre) return 0;
  if (!aPre) return 1;
  if (!bPre) return -1;

  const aPreParts = aPre.split('.');
  const bPreParts = bPre.split('.');
  for (let i = 0; i < Math.max(aPreParts.length, bPreParts.length); i++) {
    const aSeg = aPreParts[i];
    const bSeg = bPreParts[i];
    if (aSeg === undefined) return -1;
    if (bSeg === undefined) return 1;
    const aNum = Number(aSeg);
    const bNum = Number(bSeg);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      if (aNum !== bNum) return aNum - bNum;
    } else if (aSeg !== bSeg) {
      return aSeg < bSeg ? -1 : 1;
    }
  }
  return 0;
}

const buildUpdateVersionInfo = (version: string): UpdateVersionInfo => ({
  isDowngrade: compareVersions(version, app.getVersion()) < 0,
  version,
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
    lastUpdateVersionInfo = null;

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
    lastUpdateVersionInfo = buildUpdateVersionInfo(info.version);
    sendToWindow(
      mainWindowInfo.mainWindow,
      'update-available',
      lastUpdateVersionInfo,
    );
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
    // SEC-6 (full-audit backlog): re-derive rather than trust the
    // lastUpdateVersionInfo an earlier update-available event may have set -
    // that event isn't guaranteed to have fired first in every code path
    // (e.g. an update already downloaded in a previous session can surface
    // here directly).
    lastUpdateVersionInfo = buildUpdateVersionInfo(info.version);
    sendToWindow(
      mainWindowInfo.mainWindow,
      'update-downloaded',
      lastUpdateVersionInfo,
    );
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
  // BE-15 (full-audit-2026-09-05.md): on macOS, autoRunAppAfterInstall
  // defaults to true (never overridden here), so MacUpdater calls Electron's
  // own native autoUpdater.quitAndInstall() - which, per Electron's own
  // documentation, closes every window FIRST and only fires the app-level
  // 'before-quit' event after that. Without this, the main window's own
  // close handler (window-main.ts) would still see
  // authorizedClose.authorized === false at that point and intercept the
  // close with its confirm-quit prompt, silently aborting the whole install
  // - and since updateInstallStarted latches true above, every later click
  // of "Quit & Install" would then do nothing for the rest of the session.
  // On Windows/Linux, electron-updater's own quitAndInstall() just calls
  // plain app.quit(), where 'before-quit' already fires before any window's
  // 'close' event - so this is a no-op timing-wise there, matching
  // relaunchApp's identical call one IPC handler below.
  toggleAuthorizedClose(true);

  try {
    autoUpdater.quitAndInstall(false, true);
  } catch (error) {
    updateInstallStarted = false;
    // A failed call never actually quit, so don't leave the main window
    // permanently closable-without-confirmation behind it.
    toggleAuthorizedClose(false);
    captureElectronError(error, {
      contexts: { fn: { name: 'quitAndInstallUpdate' } },
    });
  }
}
