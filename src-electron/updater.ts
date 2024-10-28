import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
import { existsSync } from 'fs-extra';
import path from 'path';

import { errorCatcher } from './utils';

export function initUpdater() {
  const disabled = existsSync(
    path.join(app.getPath('userData'), 'Global Preferences', 'disable-updates'),
  );

  if (!disabled) triggerUpdateCheck();
}

const triggerUpdateCheck = async (attempt = 1) => {
  try {
    const { default: isOnline } = await import('is-online');
    const online = await isOnline();
    if (online) {
      console.log('Checking for updates...');
      autoUpdater.checkForUpdatesAndNotify();
    } else {
      if (attempt < 5) {
        console.log('Offline, retrying update check in 5 seconds...');
        setTimeout(() => triggerUpdateCheck(attempt + 1), 5000);
      } else {
        console.log('Unable to check for updates.');
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};
