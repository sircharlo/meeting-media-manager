import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import { pathExists } from 'fs-extra/esm';
import { IS_TEST } from 'src-electron/constants';
import { isDownloadErrorExpected } from 'src-electron/main/downloads';
import { getAppDataPath } from 'src-electron/main/fs';
import {
  captureElectronError,
  isIgnoredUpdateError,
} from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindow } from 'src-electron/main/window/window-main';
import upath from 'upath';

const { join } = upath;

export const getUpdatesDisabledPath = async () =>
  join(await getAppDataPath(), 'Global Preferences', 'disable-updates');

export const getBetaUpdatesPath = async () =>
  join(await getAppDataPath(), 'Global Preferences', 'beta-updates');

const isPortable = () => !!process.env.PORTABLE_EXECUTABLE_DIR;

export async function initUpdater() {
  if (await pathExists(await getUpdatesDisabledPath())) return; // Skip updater if updates are disabled by user
  if (isPortable()) return; // Skip updater for portable version

  autoUpdater.allowDowngrade = true;
  autoUpdater.autoDownload = !IS_TEST;
  autoUpdater.autoInstallOnAppQuit = !IS_TEST;

  autoUpdater.on('error', async (error, message) => {
    if (IS_TEST) return;

    if (await isDownloadErrorExpected()) return;

    if (
      message?.includes('read-only volume') ||
      error?.message?.includes('read-only volume')
    ) {
      sendToWindow(mainWindow, 'update-error');
    }

    if (!isIgnoredUpdateError(error, message)) {
      captureElectronError(error, {
        contexts: {
          fn: { errorMessage: error.message, message, name: 'initUpdater' },
        },
      });
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    sendToWindow(mainWindow, 'update-available');
  });

  autoUpdater.on('download-progress', (info) => {
    console.log('Update download progress:', info);
    sendToWindow(mainWindow, 'update-download-progress', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    sendToWindow(mainWindow, 'update-downloaded');
  });

  triggerUpdateCheck();
}

export const triggerUpdateCheck = async (attempt = 1) => {
  if (await pathExists(await getUpdatesDisabledPath())) {
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
    } else {
      if (attempt < 5) {
        setTimeout(() => triggerUpdateCheck(attempt + 1), 5000);
      }
    }
  } catch (error) {
    if (!isIgnoredUpdateError(error)) {
      captureElectronError(error, {
        contexts: { fn: { name: 'triggerUpdateCheck' } },
      });
    }
  }
};
