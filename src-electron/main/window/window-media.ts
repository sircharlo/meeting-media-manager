import type { BrowserWindow } from 'electron';
import type { ScreenPreferences } from 'src/types';

import { PLATFORM } from 'app/src-electron/constants';
import { errorCatcher } from 'app/src-electron/utils';
import { join, resolve } from 'path';

import { getAllScreens, getWindowScreen, screenPreferences } from '../screen';
import { createWindow, logToWindow, sendToWindow } from './window-base';
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
      logToWindow(mainWindow, 'fullscreen info', {
        displayNr,
        fullscreen,
        'mediaWindow.getBounds()': mediaWindow.getBounds(),
        'mediaWindow.getBounds() === screens[displayNr].bounds':
          mediaWindow.getBounds() === screens[displayNr].bounds,
        'mediaWindow.isFullScreen()': mediaWindow.isFullScreen(),
        'screens[displayNr].bounds': screens[displayNr].bounds,
      });
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

const boundsChanged = (
  current?: Electron.Rectangle,
  target?: Electron.Rectangle,
) => {
  if (!current || !target) return false;
  logToWindow(mainWindow, 'boundsChanged', {
    current,
    target,
  });
  return ['height', 'width', 'x', 'y'].some(
    (prop) =>
      current[prop as keyof Electron.Rectangle] !==
      target[prop as keyof Electron.Rectangle],
  );
};

const setWindowPosition = (
  displayNr?: number,
  fullscreen = true,
  noEvent?: boolean,
) => {
  logToWindow(mainWindow, 'setWindowPosition', {
    displayNr,
    fullscreen,
    noEvent,
  });
  try {
    if (!mediaWindow) return;

    const screens = getAllScreens();
    const currentDisplayNr = getWindowScreen(mediaWindow);
    const targetDisplay = screens[displayNr ?? 0];
    if (!targetDisplay) return;

    const targetScreenBounds = targetDisplay.bounds;

    const mediaWindowIsFullScreen = () => {
      logToWindow(mainWindow, 'mediaWindowIsFullScreen()', {
        'boundsChanged(mediaWindow?.getBounds(), targetScreenBounds)':
          boundsChanged(mediaWindow?.getBounds(), targetScreenBounds),
        'mediaWindow.isFullScreen()': mediaWindow?.isFullScreen(),
      });
      return (
        !boundsChanged(mediaWindow?.getBounds(), targetScreenBounds) ||
        mediaWindow?.isFullScreen()
      );
    };

    logToWindow(mainWindow, 'targetScreenBounds', targetScreenBounds);
    logToWindow(mainWindow, 'targetDisplay', targetDisplay);
    logToWindow(mainWindow, 'currentDisplayNr', currentDisplayNr);
    logToWindow(mainWindow, 'screens', screens);

    // const boundsChanged = (
    //   current: Electron.Rectangle,
    //   target: Electron.Rectangle,
    // ) =>
    //   ['height', 'width', 'x', 'y'].some(
    //     (prop) =>
    //       current[prop as keyof Electron.Rectangle] !==
    //       target[prop as keyof Electron.Rectangle],
    //   );

    const updateScreenAndPrefs = () => {
      logToWindow(mainWindow, 'updateScreenAndPrefs');
      sendToWindow(mainWindow, 'screenChange');
      logToWindow(mainWindow, 'sent screenChange event');
      if (!noEvent) {
        sendToWindow(mainWindow, 'screenPrefsChange', {
          preferredScreenNumber: displayNr ?? 0,
          preferWindowed: !fullscreen,
        } as ScreenPreferences);
        logToWindow(mainWindow, 'sent screenPrefsChange event', {
          preferredScreenNumber: displayNr ?? 0,
          preferWindowed: !fullscreen,
        });
      }
    };

    const setWindowBounds = (
      bounds: Partial<Electron.Rectangle>,
      fullScreen = false,
    ) => {
      const alwaysOnTop = PLATFORM !== 'darwin' && fullScreen;
      logToWindow(mainWindow, 'setWindowBounds', {
        alwaysOnTop,
        bounds,
        fullScreen,
      });
      if (!mediaWindow) return;
      mediaWindow.setBounds(bounds);
      mediaWindow.setAlwaysOnTop(alwaysOnTop);
      mediaWindow.setFullScreen(fullScreen);
      updateScreenAndPrefs();
    };

    const handleMacFullScreenTransition = (callback: () => void) => {
      logToWindow(mainWindow, 'handleMacFullScreenTransition', {
        mediaWindowIsFullScreen: mediaWindowIsFullScreen(),
        PLATFORM,
      });
      if (PLATFORM === 'darwin' && mediaWindowIsFullScreen()) {
        mediaWindow?.once('leave-full-screen', callback);
        mediaWindow?.setFullScreen(false);
      } else {
        callback();
      }
    };

    if (fullscreen) {
      logToWindow(mainWindow, 'set to fullscreen', {
        currentDisplayNr,
        displayNr,
        mediaWindowIsFullScreen: mediaWindowIsFullScreen(),
      });
      if (displayNr === currentDisplayNr && mediaWindowIsFullScreen()) {
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
      logToWindow(mainWindow, 'set to windowed', {
        currentDisplayNr,
        displayNr,
        mediaWindowIsFullScreen: mediaWindowIsFullScreen(),
        newBounds,
      });
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
