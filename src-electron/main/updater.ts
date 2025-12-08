import { app } from 'electron';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import { pathExists } from 'fs-extra/esm';
import { IS_TEST } from 'src-electron/constants';
import { isDownloadErrorExpected } from 'src-electron/main/downloads';
import { captureElectronError } from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindow } from 'src-electron/main/window/window-main';
import upath from 'upath';

const { join } = upath;

const getUpdatesDisabledPath = () =>
  join(app.getPath('userData'), 'Global Preferences', 'disable-updates');

const getBetaUpdatesPath = () =>
  join(app.getPath('userData'), 'Global Preferences', 'beta-updates');

const isPortable = () => !!process.env.PORTABLE_EXECUTABLE_DIR;

export async function initUpdater() {
  if (await pathExists(getUpdatesDisabledPath())) return; // Skip updater if updates are disabled by user
  if (isPortable()) return; // Skip updater for portable version

  autoUpdater.allowDowngrade = true;
  autoUpdater.autoDownload = !IS_TEST;
  autoUpdater.autoInstallOnAppQuit = !IS_TEST;

  autoUpdater.on('error', async (error, message) => {
    if (IS_TEST) return;

    if (await isDownloadErrorExpected()) return;

    const ignoreErrors = [
      'ENOENT',
      'EPERM',
      'Command failed: mv -f',
      '504 Gateway Time-out',
      'Code signature at URL',
      'HttpError: 503',
      'HttpError: 504',
      'YAMLException',
      'ECONNRESET',
      'ERR_CONNECTION_RESET',
      'ECONNREFUSED',
      'ENOTFOUND',
      'EAI_AGAIN',
      'SELF_SIGNED_CERT_IN_CHAIN',
      'OSStatus error -60006',
    ];

    const shouldIgnore = ignoreErrors.some(
      (ignoreError) =>
        message?.includes(ignoreError) || error?.message?.includes(ignoreError),
    );

    if (
      message?.includes('read-only volume') ||
      error?.message?.includes('read-only volume')
    ) {
      sendToWindow(mainWindow, 'update-error');
      return;
    }

    if (!shouldIgnore) {
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
  if (await pathExists(getUpdatesDisabledPath())) {
    return;
  }

  if (attempt === 1) {
    autoUpdater.allowPrerelease = await pathExists(getBetaUpdatesPath());
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
    captureElectronError(error, {
      contexts: { fn: { name: 'triggerUpdateCheck' } },
    });
  }
};
