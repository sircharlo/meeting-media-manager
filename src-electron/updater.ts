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
      autoUpdater.checkForUpdatesAndNotify();
    } else {
      if (attempt < 5) {
        setTimeout(() => triggerUpdateCheck(attempt + 1), 5000);
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};
