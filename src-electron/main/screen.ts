import type { Display } from 'src/types/electron';

import { app, type BrowserWindow, screen } from 'electron';
import { captureElectronError } from 'src-electron/main/utils';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import {
  mediaWindowInfo,
  moveMediaWindowThrottled,
} from 'src-electron/main/window/window-media';

let isScreenListenerInitialized = false;

/**
 * Handles screen changes by moving the media window if necessary
 */
const onDisplayChanged = () => {
  try {
    moveMediaWindowThrottled();
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { name: 'onDisplayChanged' } },
    });
  }
};

export const initScreenListeners = () => {
  if (isScreenListenerInitialized) {
    console.log('🔍 [initScreenListeners] Already initialized, skipping');
    return;
  }

  app
    .whenReady()
    .then(() => {
      if (isScreenListenerInitialized) return;
      isScreenListenerInitialized = true;

      // Clean up any existing listeners just in case
      screen.removeAllListeners('display-added');
      screen.removeAllListeners('display-removed');
      screen.removeAllListeners('display-metrics-changed');

      // Add the listeners
      screen.on('display-added', onDisplayChanged);
      screen.on('display-removed', onDisplayChanged);
      screen.on('display-metrics-changed', onDisplayChanged);

      console.log('🔍 [initScreenListeners] Screen listeners initialized');
    })
    .catch((e) => {
      isScreenListenerInitialized = false;
      captureElectronError(e, {
        contexts: { fn: { name: 'initScreenListeners.whenReady' } },
      });
    });
};

export const getAllScreens = (): Display[] => {
  const displays: Display[] = screen
    .getAllDisplays()
    .sort((a, b) => a.bounds.x + a.bounds.y - (b.bounds.x + b.bounds.y));

  try {
    const mainWindowScreen = displays.find(
      (display) =>
        mainWindowInfo.mainWindow &&
        display.id ===
          screen.getDisplayMatching(mainWindowInfo.mainWindow.getBounds()).id,
    );
    if (mainWindowScreen) {
      mainWindowScreen.mainWindow = true;
      try {
        mainWindowScreen.mainWindowBounds =
          mainWindowInfo.mainWindow?.getBounds();
      } catch (e) {
        captureElectronError(e, {
          contexts: {
            fn: { name: 'getAllScreens', window: 'mainWindowBounds' },
          },
        });
      }
    }
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { name: 'getAllScreens', window: 'mainWindow' } },
    });
  }

  try {
    const mediaWindowScreen = displays.find(
      (display) =>
        mediaWindowInfo.mediaWindow &&
        display.id ===
          screen.getDisplayMatching(mediaWindowInfo.mediaWindow.getBounds()).id,
    );
    if (mediaWindowScreen) mediaWindowScreen.mediaWindow = true;
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { name: 'getAllScreens', window: 'mediaWindow' } },
    });
  }

  return displays;
};

export const getWindowScreen = (window: BrowserWindow | null) => {
  if (!window) return 0;
  const allScreens = getAllScreens();
  const windowDisplay = screen.getDisplayMatching(window.getBounds());
  return allScreens.findIndex((display) => display.id === windowDisplay.id);
};
