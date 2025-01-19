import type { BrowserWindow } from 'electron';

import { cancelAllDownloads } from 'main/downloads';
import { throttle } from 'main/utils';
import {
  closeOtherWindows,
  createWindow,
  sendToWindow,
} from 'main/window/window-base';
import { createMediaWindow, moveMediaWindow } from 'main/window/window-media';
import { PLATFORM } from 'src-electron/constants';

import { setShouldQuit } from '../session';

export let mainWindow: BrowserWindow | null = null;
let closeAttempts = 0;
export let authorizedClose = false;

/**
 * Creates the main window
 */
export function createMainWindow() {
  // If the window is already open, just focus it
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    return;
  }

  // Create the browser window
  mainWindow = createWindow('main');

  mainWindow.on(
    'move',
    throttle(() => moveMediaWindow(), 100),
  );

  if (PLATFORM !== 'darwin') mainWindow.on('moved', moveMediaWindow); // On macOS, the 'moved' event is just an alias for 'move'

  mainWindow.on('close', (e) => {
    if (mainWindow && (authorizedClose || closeAttempts > 2)) {
      cancelAllDownloads();
      closeOtherWindows(mainWindow);
    } else {
      setShouldQuit(false);
      e.preventDefault();
      sendToWindow(mainWindow, 'attemptedClose');
      closeAttempts++;
      setTimeout(() => {
        closeAttempts = 0;
      }, 10000);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMediaWindow();
}

/**
 * Toggles the authorizedClose state
 * @param authorized Whether the window is authorized to close
 */
export function toggleAuthorizedClose(authorized: boolean) {
  authorizedClose = authorized;
}
