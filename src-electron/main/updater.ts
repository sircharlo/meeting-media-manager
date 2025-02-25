import { app } from 'electron';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import fse from 'fs-extra';
const { exists } = fse;
import { captureElectronError } from 'main/utils';
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
      'HttpError: 504',
      'YAMLException',
    ];
    if (!ignoreErrors.some((ignoreError) => message?.includes(ignoreError))) {
      captureElectronError(error, {
        contexts: { fn: { message, name: 'initUpdater' } },
      });
    }
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
