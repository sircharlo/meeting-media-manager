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
    const allScreens = getAllScreens();
    const otherScreens = allScreens.filter((screen) => !screen.mainWindow);

    if (!mediaWindow || !mainWindow) return;

    if (displayNr === undefined || fullscreen === undefined) {
      displayNr = screenPreferences.preferredScreenNumber;
      fullscreen = !screenPreferences.preferWindowed;
    }

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
  } catch (e) {
    errorCatcher(e);
  }
};

const setWindowPosition = (
  displayNr?: number,
  fullscreen = true,
  noEvent?: boolean,
) => {
  console.log('setWindowPosition', { displayNr, fullscreen, noEvent });
  try {
    if (!mediaWindow) return;

    const screens = getAllScreens();
    const currentDisplayNr = getWindowScreen(mediaWindow);
    const targetDisplay = screens[displayNr ?? 0];
    if (!targetDisplay) return;

    const targetScreenBounds = targetDisplay.bounds;

    console.log('targetScreenBounds', targetScreenBounds);
    console.log('targetDisplay', targetDisplay);
    console.log('currentDisplayNr', currentDisplayNr);
    console.log('screens', screens);

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
      console.log('updateScreenAndPrefs');
      sendToWindow(mainWindow, 'screenChange');
      console.log('sent screenChange event');
      if (!noEvent) {
        sendToWindow(mainWindow, 'screenPrefsChange', {
          preferredScreenNumber: displayNr ?? 0,
          preferWindowed: !fullscreen,
        } as ScreenPreferences);
        console.log('sent screenPrefsChange event', {
          preferredScreenNumber: displayNr ?? 0,
          preferWindowed: !fullscreen,
        });
      }
    };

    const setWindowBounds = (
      bounds: Partial<Electron.Rectangle>,
      alwaysOnTop = false,
      fullScreen = false,
    ) => {
      console.log('setWindowBounds', {
        alwaysOnTop,
        bounds,
        fullScreen,
      });
      if (!mediaWindow) return;
      mediaWindow.setBounds(bounds);
      if (mediaWindow.isAlwaysOnTop() !== alwaysOnTop) {
        mediaWindow.setAlwaysOnTop(alwaysOnTop);
      }
      if (mediaWindow.isFullScreen() !== fullScreen) {
        mediaWindow.setFullScreen(fullScreen);
      }
      updateScreenAndPrefs();
    };

    const handleMacFullScreenTransition = (callback: () => void) => {
      console.log(
        'handleMacFullScreenTransition',
        PLATFORM,
        mediaWindow?.isFullScreen(),
      );
      if (PLATFORM === 'darwin' && mediaWindow && mediaWindow.isFullScreen()) {
        mediaWindow.once('leave-full-screen', callback);
        mediaWindow.setFullScreen(false);
      } else {
        callback();
      }
    };

    if (fullscreen) {
      console.log(
        'displayNr === currentDisplayNr',
        displayNr === currentDisplayNr,
        'mediaWindow.isAlwaysOnTop()',
        mediaWindow.isAlwaysOnTop(),
      );
      if (displayNr === currentDisplayNr && mediaWindow.isAlwaysOnTop()) return;
      handleMacFullScreenTransition(() => {
        setWindowBounds(targetScreenBounds, PLATFORM !== 'darwin', true);
      });
    } else {
      const newBounds = {
        height: 720,
        width: 1280,
        x: targetScreenBounds.x + 50,
        y: targetScreenBounds.y + 50,
      };
      console.log(
        'displayNr !== currentDisplayNr',
        displayNr !== currentDisplayNr,
        'mediaWindow.isFullScreen()',
        mediaWindow.isFullScreen(),
        'newBounds',
        newBounds,
      );
      if (displayNr !== currentDisplayNr || mediaWindow.isFullScreen()) {
        handleMacFullScreenTransition(() => {
          setWindowBounds(newBounds, false, false);
        });
      } else {
        updateScreenAndPrefs();
      }
    }
  } catch (err) {
    errorCatcher(err);
  }
};
