import type { BrowserWindow } from 'electron';

import { PLATFORM } from 'src-electron/constants';
import { cancelAllDownloads } from 'src-electron/main/downloads';
import { setShouldQuit } from 'src-electron/main/session';
import { throttleWithTrailing } from 'src-electron/main/utils';
import {
  closeOtherWindows,
  createWindow,
  sendToWindow,
} from 'src-electron/main/window/window-base';
import {
  createMediaWindow,
  moveMediaWindow,
} from 'src-electron/main/window/window-media';
import { moveTimerWindow } from 'src-electron/main/window/window-timer';

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

  const moveMediaWindowThrottled = throttleWithTrailing(
    () => moveMediaWindow(),
    100,
  );
  const moveTimerWindowThrottled = throttleWithTrailing(
    () => moveTimerWindow(),
    100,
  );
  mainWindow.on('move', () => {
    moveMediaWindowThrottled();
    moveTimerWindowThrottled();
  });
  if (PLATFORM !== 'darwin')
    mainWindow.on('moved', () => {
      moveMediaWindowThrottled();
      moveTimerWindowThrottled();
    }); // On macOS, the 'moved' event is just an alias for 'move'

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
