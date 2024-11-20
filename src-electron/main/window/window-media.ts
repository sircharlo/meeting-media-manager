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

/**
 * Sets the position and display of the media window.
 * @param displayNr {number} [optional] Target display number. Defaults to the primary screen if not provided.
 * @param fullscreenDesired {boolean} [optional] Indicates if fullscreen mode is desired. Defaults to `true`.
 * @param noEvent {boolean} [optional] If true, suppresses sending preference change events. Defaults to `false`.
 */
const setWindowPosition = (
  displayNr?: number,
  fullscreenDesired = true,
  noEvent?: boolean,
) => {
  try {
    if (!mediaWindow) return; // Exit if the media window is not initialized.

    // Retrieve all screens and determine the current display of the media window.
    const screens = getAllScreens();
    const currentDisplayNr = getWindowScreen(mediaWindow);
    const targetDisplay = screens[displayNr ?? 0]; // Use specified display or default to the primary screen.
    if (!targetDisplay) return; // Exit if the target display does not exist.

    const targetScreenBounds = targetDisplay.bounds; // Bounds of the target display.

    // Function to set the window bounds and manage fullscreen transitions.
    const setWindowBounds = (bounds: Partial<Electron.Rectangle>) => {
      if (
        !mediaWindow || // Ensure the media window exists.
        (displayNr === currentDisplayNr && // Check if already on the correct display.
          fullscreenDesired === mediaWindow.isFullScreen()) // Check if fullscreen state matches the desired state.
      ) {
        return; // Exit if no changes are needed.
      }

      // Set "always on top" for non-macOS systems when fullscreen is desired.
      mediaWindow.setAlwaysOnTop(PLATFORM !== 'darwin' && fullscreenDesired);

      // Handle screen change events for fullscreen transitions.
      const handleScreenChange = () => {
        if (!fullscreenDesired) mediaWindow?.setBounds(bounds); // Update bounds in windowed mode.

        // Notify the main window of updated screen preferences, unless suppressed.
        if (!noEvent) {
          sendToWindow(mainWindow, 'screenPrefsChange', {
            preferredScreenNumber: displayNr ?? 0, // Save the target display number.
            preferWindowed: !fullscreenDesired, // Save the desired windowed/fullscreen preference.
          } as ScreenPreferences);
        }
      };

      if (fullscreenDesired === mediaWindow.isFullScreen()) {
        handleScreenChange();
      } else {
        // Attach appropriate event listeners for fullscreen transitions.
        if (fullscreenDesired) {
          mediaWindow.once('enter-full-screen', handleScreenChange);
          mediaWindow.setBounds(bounds); // Set window bounds before entering fullscreen.
        } else {
          mediaWindow.once('leave-full-screen', handleScreenChange);
        }

        // Toggle fullscreen state.
        mediaWindow.setFullScreen(fullscreenDesired);
      }
    };

    // Function to handle macOS-specific fullscreen transition quirks.
    const handleMacFullScreenTransition = (callback: () => void) => {
      if (!mediaWindow || PLATFORM !== 'darwin') {
        callback(); // Proceed immediately if not on macOS.
      } else {
        // Handle macOS fullscreen exit when moving to a different display.
        if (mediaWindow.isFullScreen() && displayNr !== currentDisplayNr) {
          mediaWindow.once('leave-full-screen', callback); // Wait for fullscreen exit before setting window bounds.
          mediaWindow.setFullScreen(false); // Exit fullscreen.
        } else {
          callback(); // Proceed immediately if no transition is needed.
        }
      }
    };

    // If fullscreen mode is desired, handle fullscreen transition.
    if (fullscreenDesired) {
      handleMacFullScreenTransition(() => {
        setWindowBounds(targetScreenBounds); // Set bounds to target screen.
      });
    } else {
      // Set bounds for windowed mode.
      const newBounds = {
        height: 720,
        width: 1280,
        x: targetScreenBounds.x + 50, // Offset for aesthetics.
        y: targetScreenBounds.y + 50,
      };

      // Check if the new bounds are targeting a different display.
      if (displayNr !== currentDisplayNr) {
        handleMacFullScreenTransition(() => {
          setWindowBounds(newBounds); // Apply new bounds after transition.
        });
      }
    }
  } catch (err) {
    errorCatcher(err); // Catch and log any errors.
  }
};
