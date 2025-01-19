import { app } from 'electron';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import fse from 'fs-extra';
const { exists } = fse;
import { captureElectronError } from 'main/utils';
import { join } from 'path';

export async function initUpdater() {
  autoUpdater.on('error', (error, message) => {
    const ignoreErrors = ['ENOENT', 'EPERM'];
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
