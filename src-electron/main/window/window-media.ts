import type { BrowserWindow } from 'electron';
import type { ScreenPreferences } from 'src/types';

import { PLATFORM } from 'app/src-electron/constants';
import { errorCatcher } from 'app/src-electron/utils';
import { join, resolve } from 'path';

import { getAllScreens, getWindowScreen, screenPreferences } from '../screen';
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
  fullscreen?: boolean,
  noEvent?: boolean,
) => {
  try {
    const screens = getAllScreens();
    const otherScreens = screens.filter((screen) => !screen.mainWindow);

    if (!mediaWindow || !mainWindow) return;

    if (displayNr === undefined || fullscreen === undefined) {
      displayNr = screenPreferences.preferredScreenNumber;
      fullscreen = !screenPreferences.preferWindowed;
    }

    if (otherScreens.length > 0) {
      if (displayNr === undefined || otherScreens.length >= 1) {
        if (otherScreens.length === 1) {
          displayNr = screens.findIndex((s) => !s.mainWindow);
        } else {
          const mainWindowScreen = screens.findIndex((s) => s.mainWindow);
          displayNr =
            displayNr !== mainWindowScreen
              ? displayNr
              : screens.findIndex((s) => !s.mainWindow);
        }
      }
      if (displayNr === undefined) return;
      fullscreen =
        fullscreen ??
        (mediaWindow.getBounds() === screens[displayNr].bounds ||
          mediaWindow.isFullScreen());
    } else {
      displayNr = 0;
      fullscreen = false;
    }

    setWindowPosition(displayNr, fullscreen, noEvent);
  } catch (e) {
    errorCatcher(e);
  }
};

const boundsAreSame = (
  current?: Electron.Rectangle,
  target?: Electron.Rectangle,
) => {
  if (!current || !target) return false;
  return ['height', 'width', 'x', 'y'].every(
    (prop) =>
      current[prop as keyof Electron.Rectangle] ===
      target[prop as keyof Electron.Rectangle],
  );
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

    const mediaWindowIsFullScreen = () =>
      boundsAreSame(mediaWindow?.getBounds(), targetScreenBounds) ||
      mediaWindow?.isFullScreen();

    const updateScreenAndPrefs = () => {
      sendToWindow(mainWindow, 'screenChange');
      if (!noEvent) {
        sendToWindow(mainWindow, 'screenPrefsChange', {
          preferredScreenNumber: displayNr ?? 0,
          preferWindowed: !fullscreen,
        } as ScreenPreferences);
      }
    };

    const setWindowBounds = (
      bounds: Partial<Electron.Rectangle>,
      fullScreen = false,
    ) => {
      const alwaysOnTop = PLATFORM !== 'darwin' && fullScreen;
      if (!mediaWindow) return;
      if (mediaWindowIsFullScreen()) {
        // We need to set the fullscreen state before changing the bounds in the case of a window that is already fullscreen
        mediaWindow.setFullScreen(fullScreen);
      }
      mediaWindow.setAlwaysOnTop(alwaysOnTop);
      mediaWindow.setBounds(bounds);
      mediaWindow.setFullScreen(fullScreen);
      mediaWindow.setBounds(bounds);
      updateScreenAndPrefs();
    };

    const handleMacFullScreenTransition = (callback: () => void) => {
      if (PLATFORM === 'darwin' && mediaWindowIsFullScreen()) {
        mediaWindow?.once('leave-full-screen', callback);
        mediaWindow?.setFullScreen(false);
      } else {
        callback();
      }
    };

    if (fullscreen) {
      if (displayNr === currentDisplayNr && mediaWindowIsFullScreen()) {
        mediaWindow.setAlwaysOnTop(PLATFORM !== 'darwin');
        updateScreenAndPrefs();
        return;
      }
      handleMacFullScreenTransition(() => {
        setWindowBounds(targetScreenBounds, true);
      });
    } else {
      const newBounds = {
        height: 720,
        width: 1280,
        x: targetScreenBounds.x + 50,
        y: targetScreenBounds.y + 50,
      };
      if (displayNr !== currentDisplayNr || mediaWindowIsFullScreen()) {
        handleMacFullScreenTransition(() => {
          setWindowBounds(newBounds, false);
        });
      } else {
        updateScreenAndPrefs();
        return;
      }
    }
  } catch (err) {
    errorCatcher(err);
  }
};
