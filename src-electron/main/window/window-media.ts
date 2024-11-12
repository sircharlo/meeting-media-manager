import type { BrowserWindow } from 'electron';
import type { ScreenPreferences } from 'src/types';

import { PLATFORM } from 'app/src-electron/constants';
import { errorCatcher } from 'app/src-electron/utils';
import { join, resolve } from 'path';

import { getAllScreens, getWindowScreen } from '../screen';
import { createWindow, sendToWindow } from './window-base';
import { mainWindow } from './window-main';

export let mediaWindow: BrowserWindow | null = null;

/**
 * Creates the media window
 */
export function createMediaWindow() {
  // If the window is already open, just focus it
  if (mediaWindow && !mediaWindow.isDestroyed()) {
    mediaWindow.show();
    return;
  }

  // Create the browser window
  mediaWindow = createWindow('media', {
    backgroundColor: 'black',
    frame: false,
    height: 720,
    icon: resolve(join(__dirname, 'icons', 'media-player.png')),
    minHeight: 110,
    minWidth: 195,
    thickFrame: false,
    title: 'Media Window',
    width: 1280,
  });

  // Force aspect ratio
  mediaWindow.setAspectRatio(16 / 9);

  mediaWindow.on('closed', () => {
    mediaWindow = null;
  });
}

export const moveMediaWindow = (
  displayNr?: number,
  fullscreen = true,
  noEvent?: boolean,
) => {
  try {
    const allScreens = getAllScreens();
    const otherScreens = allScreens.filter((screen) => !screen.mainWindow);

    if (!mediaWindow || !mainWindow) return;

    if (otherScreens.length > 0) {
      fullscreen = fullscreen ?? mediaWindow.isFullScreen();

      if (displayNr === undefined || otherScreens.length >= 1) {
        if (otherScreens.length === 1) {
          displayNr = allScreens.findIndex((s) => !s.mainWindow);
        } else {
          const mainWindowScreen = allScreens.findIndex((s) => s.mainWindow);
          displayNr =
            displayNr !== mainWindowScreen
              ? displayNr
              : allScreens.findIndex((s) => !s.mainWindow);
        }
      }
    } else {
      displayNr = 0;
      fullscreen = false;
    }

    setWindowPosition(displayNr, fullscreen, noEvent);
    sendToWindow(mainWindow, 'screenChange');
  } catch (e) {
    errorCatcher(e);
  }
};

const setWindowPosition = (
  displayNr?: number,
  fullscreen = true,
  noEvent?: boolean,
) => {
  try {
    if (!mediaWindow) return;

    const screens = getAllScreens();
    const currentDisplayNr = getWindowScreen(mediaWindow);
    const targetDisplay = screens[displayNr ?? 0];

    if (!targetDisplay) return;

    const targetScreenBounds = targetDisplay.bounds;

    if (!targetScreenBounds) return;

    if (fullscreen) {
      if (displayNr === currentDisplayNr && mediaWindow.isAlwaysOnTop()) return;

      mediaWindow.setPosition(targetScreenBounds.x, targetScreenBounds.y);

      // macOS doesn't play nice when trying to share a fullscreen window in Zoom if it's set to always be on top
      if (PLATFORM !== 'darwin' && !mediaWindow.isAlwaysOnTop()) {
        mediaWindow.setAlwaysOnTop(true);
      }
      // On macOS, fullscreen transitions take place asynchronously. Let's not check for isFullScreen() if we're on that platform
      if (PLATFORM === 'darwin' || !mediaWindow.isFullScreen()) {
        mediaWindow.setFullScreen(true);
      }
    } else {
      const newBounds = {
        height: 720,
        width: 1280,
        x: targetScreenBounds.x + 50,
        y: targetScreenBounds.y + 50,
      };

      if (
        mediaWindow.isAlwaysOnTop() ||
        // On macOS, fullscreen transitions take place asynchronously. Let's not check for isFullScreen() if we're on that platform
        PLATFORM === 'darwin' ||
        mediaWindow.isFullScreen()
      ) {
        // macOS doesn't play nice when trying to share a fullscreen window in Zoom if it's set to always be on top
        if (PLATFORM !== 'darwin') mediaWindow.setAlwaysOnTop(false);
        mediaWindow.setFullScreen(false);
        mediaWindow.setBounds(newBounds);
      }

      if (displayNr === currentDisplayNr) return;

      const currentBounds = mediaWindow.getBounds();
      if (
        currentBounds.height !== newBounds.height ||
        currentBounds.width !== newBounds.width ||
        currentBounds.x !== newBounds.x ||
        currentBounds.y !== newBounds.y
      ) {
        mediaWindow.setBounds(newBounds);
      }
    }

    if (!noEvent) {
      const prefs: ScreenPreferences = {
        preferredScreenNumber: displayNr ?? 0,
        preferWindowed: !fullscreen,
      };
      sendToWindow(mainWindow, 'screenPrefsChange', prefs);
    }
  } catch (err) {
    errorCatcher(err);
  }
};
