import { BrowserWindow } from 'electron';
import { PLATFORM, PRODUCT_NAME } from 'src-electron/constants';
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
let isCreatingMainWindow = false;

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
  if (focusMainWindow() || isCreatingMainWindow) return;

  isCreatingMainWindow = true;

  try {
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
  } finally {
    isCreatingMainWindow = false;
  }
}

export function focusMainWindow() {
  const mainWindow = getExistingMainWindow();

  if (!mainWindow) return false;

  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();

  return true;
}

const getExistingMainWindow = () => {
  if (mainWindowInfo.mainWindow && !mainWindowInfo.mainWindow.isDestroyed()) {
    return mainWindowInfo.mainWindow;
  }

  const existingWindow = BrowserWindow.getAllWindows().find((window) => {
    return !window.isDestroyed() && window.getTitle() === PRODUCT_NAME;
  });

  if (existingWindow) {
    mainWindowInfo.mainWindow = existingWindow;
  }

  return existingWindow ?? null;
};

/**
 * Toggles the authorizedClose state
 * @param authorized Whether the window is authorized to close
 */
export function toggleAuthorizedClose(authorized: boolean) {
  authorizedClose.authorized = authorized;
}
