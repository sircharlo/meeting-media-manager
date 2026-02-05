import type { BrowserWindow } from 'electron';

import { PLATFORM } from 'src-electron/constants';
import { cancelAllDownloads } from 'src-electron/main/downloads';
import { setAppQuitting, setShouldQuit } from 'src-electron/main/session';
import {
  closeOtherWindows,
  createWindow,
  sendToWindow,
} from 'src-electron/main/window/window-base';
import {
  createMediaWindow,
  moveMediaWindowThrottled,
} from 'src-electron/main/window/window-media';

export const mainWindowInfo = {
  mainWindow: null as BrowserWindow | null,
};

let closeAttempts = 0;

export const authorizedClose = {
  authorized: false,
};

/**
 * Creates the main window
 */
export function createMainWindow() {
  // Reset app quitting state
  setAppQuitting(false);

  // If the window is already open, just focus it
  if (mainWindowInfo.mainWindow && !mainWindowInfo.mainWindow.isDestroyed()) {
    mainWindowInfo.mainWindow.show();
    return;
  }

  // Create the browser window
  mainWindowInfo.mainWindow = createWindow('main');

  mainWindowInfo.mainWindow.on('move', moveMediaWindowThrottled);
  if (PLATFORM !== 'darwin')
    mainWindowInfo.mainWindow.on('moved', moveMediaWindowThrottled); // On macOS, the 'moved' event is just an alias for 'move'

  mainWindowInfo.mainWindow.on('close', (e) => {
    if (
      mainWindowInfo.mainWindow &&
      (authorizedClose.authorized || closeAttempts > 2)
    ) {
      cancelAllDownloads();
      closeOtherWindows(mainWindowInfo.mainWindow);
    } else {
      setShouldQuit(false);
      e.preventDefault();
      sendToWindow(mainWindowInfo.mainWindow, 'attemptedClose');
      closeAttempts++;
      setTimeout(() => {
        closeAttempts = 0;
      }, 10000);
    }
  });

  mainWindowInfo.mainWindow.on('closed', () => {
    mainWindowInfo.mainWindow = null;
  });

  createMediaWindow();
}

/**
 * Toggles the authorizedClose state
 * @param authorized Whether the window is authorized to close
 */
export function toggleAuthorizedClose(authorized: boolean) {
  authorizedClose.authorized = authorized;
}
