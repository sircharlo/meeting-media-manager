import type { BrowserWindow } from 'electron';
import type { ScreenPreferences } from 'src/types';

import { HD_RESOLUTION, PLATFORM } from 'app/src-electron/constants';

import { getAllScreens, getWindowScreen, screenPreferences } from './../screen';
import { captureElectronError, getIconPath } from './../utils';
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
    height: HD_RESOLUTION[1],
    icon: getIconPath('media-player'),
    minHeight: 110,
    minWidth: 195,
    thickFrame: false,
    title: 'Media Player - M³',
    width: HD_RESOLUTION[0],
  });

  // Force aspect ratio
  mediaWindow.setAspectRatio(16 / 9);

  mediaWindow.on('closed', () => {
    mediaWindow = null;
  });

  mediaWindow.on('maximize', () => {
    mediaWindow?.unmaximize();
    sendToWindow(mainWindow, 'toggleFullScreenFromMediaWindow');
  });
}

const mediaWindowIsFullScreen = (parentScreenBounds?: Electron.Rectangle) => {
  if (!parentScreenBounds)
    parentScreenBounds = getAllScreens().find(
      (screen) => screen.mediaWindow,
    )?.bounds;
  return (
    boundsAreSame(mediaWindow?.getBounds(), parentScreenBounds) ||
    mediaWindow?.isFullScreen()
  );
};

const mediaWindowIsOffscreen = (parentScreenBounds: Electron.Rectangle) => {
  const mediaWindowBounds = mediaWindow?.getBounds();
  if (!mediaWindowBounds) return true;

  const visibleWidth =
    Math.min(
      mediaWindowBounds.x + mediaWindowBounds.width,
      parentScreenBounds.x + parentScreenBounds.width,
    ) - Math.max(mediaWindowBounds.x, parentScreenBounds.x);

  const visibleHeight =
    Math.min(
      mediaWindowBounds.y + mediaWindowBounds.height,
      parentScreenBounds.y + parentScreenBounds.height,
    ) - Math.max(mediaWindowBounds.y, parentScreenBounds.y);

  return visibleWidth <= 100 || visibleHeight <= 100;
};

export const moveMediaWindow = (
  displayNr?: number,
  fullscreen?: boolean,
  noEvent?: boolean,
) => {
  try {
    const screens = getAllScreens();
    mediaWindow?.setMaximizable(screens.length > 1);
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
        fullscreen ?? mediaWindowIsFullScreen(screens[displayNr]?.bounds);
    } else {
      displayNr = 0;
      fullscreen = false;
    }

    setWindowPosition(displayNr, fullscreen, noEvent);
  } catch (e) {
    captureElectronError(e);
  }
};

const boundsAreSame = (
  current?: Electron.Rectangle,
  target?: Electron.Rectangle,
) => {
  if (!current || !target) return false;
  return ['height', 'width', 'x', 'y'].every(
    (prop) =>
      Math.abs(
        current[prop as keyof Electron.Rectangle] -
          target[prop as keyof Electron.Rectangle],
      ) <= 5,
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
      if (mediaWindowIsFullScreen(targetScreenBounds)) {
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
      if (
        PLATFORM === 'darwin' &&
        mediaWindowIsFullScreen(targetScreenBounds)
      ) {
        mediaWindow?.once('leave-full-screen', callback);
        mediaWindow?.setFullScreen(false);
      } else {
        callback();
      }
    };

    if (fullscreen) {
      if (
        displayNr === currentDisplayNr &&
        mediaWindowIsFullScreen(targetScreenBounds)
      ) {
        if (!mediaWindow.isAlwaysOnTop() && PLATFORM !== 'darwin') {
          mediaWindow.setAlwaysOnTop(true);
        }
        updateScreenAndPrefs();
        return;
      }
      handleMacFullScreenTransition(() => {
        setWindowBounds(targetScreenBounds, true);
      });
    } else {
      const HD_RESOLUTION_RATIO = HD_RESOLUTION[0] / HD_RESOLUTION[1];

      const newBounds = (() => {
        // Calculate max width and height while ensuring they don't exceed screen bounds
        let maxHeight = Math.min(
          targetScreenBounds.height - 100,
          HD_RESOLUTION[1],
        );
        let maxWidth = Math.min(
          targetScreenBounds.width - 100,
          HD_RESOLUTION[0],
        );

        // Adjust height and width to maintain a 16:9 ratio
        if (maxWidth / HD_RESOLUTION_RATIO <= maxHeight) {
          maxHeight = Math.floor(maxWidth / HD_RESOLUTION_RATIO);
        } else {
          maxWidth = Math.floor(maxHeight * HD_RESOLUTION_RATIO);
        }

        return {
          height: maxHeight,
          width: maxWidth,
          x: targetScreenBounds.x + 50,
          y: targetScreenBounds.y + 50,
        };
      })();
      if (
        displayNr !== currentDisplayNr ||
        mediaWindowIsFullScreen(targetScreenBounds) ||
        mediaWindowIsOffscreen(targetScreenBounds)
      ) {
        handleMacFullScreenTransition(() => {
          setWindowBounds(newBounds, false);
        });
      } else {
        updateScreenAndPrefs();
        return;
      }
    }
  } catch (err) {
    captureElectronError(err);
  }
};
