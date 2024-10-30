import type { BrowserWindow } from 'electron';

import { closeOtherWindows, createWindow, sendToWindow } from './window-base';
import { createMediaWindow } from './window-media';

export let mainWindow: BrowserWindow | null = null;
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

  mainWindow.webContents.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  );

  mainWindow.on('close', (e) => {
    if (mainWindow && authorizedClose) {
      closeOtherWindows(mainWindow);
    } else {
      e.preventDefault();
      sendToWindow(mainWindow, 'attemptedClose');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMediaWindow();
}

/**
 * Toggles the authorizedClose state
 * @param authorized Wether the window is authorized to close
 */
export function toggleAuthorizedClose(authorized: boolean) {
  authorizedClose = authorized;
}
