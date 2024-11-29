import { app } from 'electron';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import fse from 'fs-extra';
const { exists } = fse;
import { join } from 'path';

import { PLATFORM } from './../constants';
import { captureElectronError } from './../utils';

export async function initUpdater() {
  autoUpdater.on('error', (error, message) => {
    captureElectronError(error, {
      contexts: { fn: { message, name: 'initUpdater' } },
    });
  });

  const disabled = await exists(
    join(app.getPath('userData'), 'Global Preferences', 'disable-updates'),
  );
  if (!disabled && PLATFORM !== 'darwin') triggerUpdateCheck();
}

const triggerUpdateCheck = async (attempt = 1) => {
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
