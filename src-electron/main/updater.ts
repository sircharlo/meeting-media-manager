import { app } from 'electron';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import fse from 'fs-extra';
import isOnline from 'is-online';
const { exists } = fse;
import { captureElectronError } from 'main/utils';
import { sendToWindow } from 'main/window/window-base';
import { mainWindow } from 'main/window/window-main';
import { join } from 'node:path';
import { IS_TEST } from 'src-electron/constants';

export async function initUpdater() {
  autoUpdater.allowDowngrade = true;
  autoUpdater.autoDownload = !IS_TEST;
  autoUpdater.autoInstallOnAppQuit = !IS_TEST;

  autoUpdater.on('error', (error, message) => {
    if (IS_TEST) return;

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
    ];

    const shouldIgnore = ignoreErrors.some(
      (ignoreError) =>
        message?.includes(ignoreError) || error?.message?.includes(ignoreError),
    );

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
  if (
    await exists(
      join(app.getPath('userData'), 'Global Preferences', 'disable-updates'),
    )
  ) {
    return;
  }

  if (attempt === 1) {
    autoUpdater.allowPrerelease = await exists(
      join(app.getPath('userData'), 'Global Preferences', 'beta-updates'),
    );
  }

  try {
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
