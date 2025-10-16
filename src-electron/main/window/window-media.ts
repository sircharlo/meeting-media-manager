import { app, type BrowserWindow, type Rectangle } from 'electron';
import { pathExistsSync, readJsonSync, writeJsonSync } from 'fs-extra/esm';
import { getAllScreens, getWindowScreen } from 'main/screen';
import { captureElectronError, getIconPath } from 'main/utils';
import { createWindow, sendToWindow } from 'main/window/window-base';
import { mainWindow } from 'main/window/window-main';
import { join } from 'node:path';
import { HD_RESOLUTION, PLATFORM } from 'src-electron/constants';

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
    alwaysOnTop: true, // Always on top by default
    backgroundColor: 'black',
    frame: false,
    height: HD_RESOLUTION[1],
    icon: getIconPath('media-player'),
    minHeight: 110,
    minWidth: 195,
    opacity: 1,
    roundedCorners: PLATFORM === 'darwin',
    thickFrame: false,
    title: 'Media Player - M³',
    width: HD_RESOLUTION[0],
  });

  // Force aspect ratio
  mediaWindow.setAspectRatio(16 / 9);

  // Check if only one screen is available and set to windowed mode with HD resolution
  const screens = getAllScreens();
  if (screens.length === 1 && screens[0]) {
    console.log(
      '🔍 [createMediaWindow] Only one screen available, checking if window needs repositioning',
    );

    // Get current window bounds
    const currentBounds = mediaWindow.getBounds();
    const screenBounds = screens[0].bounds;

    // Check if current window is already within screen bounds and smaller than screen
    const isSmallerThanScreen =
      currentBounds.width < screenBounds.width &&
      currentBounds.height < screenBounds.height;

    const isWithinScreenBounds =
      currentBounds.x >= screenBounds.x &&
      currentBounds.y >= screenBounds.y &&
      currentBounds.x + currentBounds.width <=
        screenBounds.x + screenBounds.width &&
      currentBounds.y + currentBounds.height <=
        screenBounds.y + screenBounds.height;

    console.log('🔍 [createMediaWindow] Window position check:', {
      currentBounds,
      isSmallerThanScreen,
      isWithinScreenBounds,
      screenBounds,
    });

    // Only reposition if window is not already properly positioned
    if (!isWithinScreenBounds || !isSmallerThanScreen) {
      console.log(
        '🔍 [createMediaWindow] Window needs repositioning, setting to windowed mode with HD resolution',
      );

      // Set windowed bounds to HD resolution
      const maxWidth = screenBounds.width * 0.5; // 50% of screen width
      const maxHeight = screenBounds.height * 0.5; // 50% of screen height

      // Calculate scale to fit HD resolution within screen bounds
      const scaleX = maxWidth / HD_RESOLUTION[0];
      const scaleY = maxHeight / HD_RESOLUTION[1];
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

      const windowedWidth = Math.floor(HD_RESOLUTION[0] * scale);
      const windowedHeight = Math.floor(HD_RESOLUTION[1] * scale);

      // Center the window on the screen
      const x =
        screenBounds.x + Math.floor((screenBounds.width - windowedWidth) / 2);
      const y =
        screenBounds.y + Math.floor((screenBounds.height - windowedHeight) / 2);

      mediaWindow.setFullScreen(false);

      mediaWindow.setBounds({
        height: windowedHeight,
        width: windowedWidth,
        x,
        y,
      });

      console.log('🔍 [createMediaWindow] Set windowed bounds:', {
        height: windowedHeight,
        scale,
        width: windowedWidth,
        x,
        y,
      });
    } else {
      console.log(
        '🔍 [createMediaWindow] Window already properly positioned, keeping current bounds',
      );
    }
  }

  mediaWindow.on('closed', () => {
    mediaWindow = null;
  });
}

/**
 * Fade in the media window with opacity transition
 * @param duration Transition duration in milliseconds (default: 300ms)
 */
export function fadeInMediaWindow(duration = 300): Promise<void> {
  return new Promise((resolve) => {
    if (!mediaWindow || mediaWindow.isDestroyed()) {
      resolve();
      return;
    }

    try {
      // Set initial opacity to 0
      mediaWindow.setOpacity(0);

      // Show the window first if it's not visible
      if (!mediaWindow.isVisible()) {
        mediaWindow.show();
      }

      // Gradually increase opacity
      const steps = Math.max(10, Math.floor(duration / 30));
      const stepDuration = duration / steps;
      const opacityStep = 1 / steps;
      let currentStep = 0;

      const fadeInterval = setInterval(() => {
        currentStep++;
        const newOpacity = Math.min(currentStep * opacityStep, 1);

        try {
          mediaWindow?.setOpacity(newOpacity);
        } catch {
          // Fallback: just show the window normally
          if (mediaWindow && !mediaWindow.isDestroyed()) {
            mediaWindow.setOpacity(1);
          }
          clearInterval(fadeInterval);
          resolve();
          return;
        }

        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          if (mediaWindow && !mediaWindow.isDestroyed()) {
            mediaWindow.setOpacity(1);
          }
          resolve();
        }
      }, stepDuration);

      // Fallback timeout
      setTimeout(() => {
        clearInterval(fadeInterval);
        if (mediaWindow && !mediaWindow.isDestroyed()) {
          mediaWindow.setOpacity(1);
        }
        resolve();
      }, duration + 100);
    } catch {
      // Fallback: just show the window normally
      if (mediaWindow && !mediaWindow.isDestroyed()) {
        mediaWindow.show();
        mediaWindow.setOpacity(1);
      }
      resolve();
    }
  });
}

/**
 * Fade out the media window with opacity transition
 * @param duration Transition duration in milliseconds (default: 300ms)
 */
export function fadeOutMediaWindow(duration = 300): Promise<void> {
  return new Promise((resolve) => {
    if (!mediaWindow || mediaWindow.isDestroyed()) {
      resolve();
      return;
    }

    try {
      // Gradually decrease opacity
      const steps = Math.max(10, Math.floor(duration / 30));
      const stepDuration = duration / steps;
      const opacityStep = 1 / steps;
      let currentStep = 0;

      const fadeInterval = setInterval(() => {
        currentStep++;
        const newOpacity = Math.max(1 - currentStep * opacityStep, 0);

        try {
          mediaWindow?.setOpacity(newOpacity);
        } catch {
          // Fallback: just hide the window normally
          if (mediaWindow && !mediaWindow.isDestroyed()) {
            mediaWindow.hide();
          }
          clearInterval(fadeInterval);
          resolve();
          return;
        }

        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          if (mediaWindow && !mediaWindow.isDestroyed()) {
            mediaWindow.hide();
            mediaWindow.setOpacity(1);
          }
          resolve();
        }
      }, stepDuration);

      // Fallback timeout
      setTimeout(() => {
        clearInterval(fadeInterval);
        if (mediaWindow && !mediaWindow.isDestroyed()) {
          mediaWindow.hide();
          mediaWindow.setOpacity(1);
        }
        resolve();
      }, duration + 100);
    } catch {
      // Fallback: just hide the window normally
      if (mediaWindow && !mediaWindow.isDestroyed()) {
        mediaWindow.hide();
        mediaWindow.setOpacity(1);
      }
      resolve();
    }
  });
}

export const moveMediaWindow = (displayNr?: number, fullscreen?: boolean) => {
  console.log('🔍 [moveMediaWindow] START - Called with:', {
    displayNr,
    fullscreen,
  });

  try {
    if (!mediaWindow || !mainWindow) {
      console.log(
        '❌ [moveMediaWindow] No mediaWindow or mainWindow, returning',
      );
      return;
    }

    const screens = getAllScreens();
    console.log('🔍 [moveMediaWindow] Available screens:', screens.length);

    const currentBounds = mediaWindow.getBounds();
    const currentDisplayNr = getWindowScreen(mediaWindow);

    const currentScreen = screens[currentDisplayNr];
    const screenBounds = currentScreen?.bounds;

    // Set maximizable based on screen count
    mediaWindow.setMaximizable(screens.length > 1);

    // Set always on top based on fullscreen parameter and current fullscreen state
    const isEffectivelyFullscreen =
      screenBounds &&
      currentBounds.width >= screenBounds.width - 10 &&
      currentBounds.height >= screenBounds.height - 10;

    const alwaysOnTop =
      PLATFORM !== 'darwin' && !!(isEffectivelyFullscreen || fullscreen);

    console.log('🔍 [moveMediaWindow] Setting always on top:', alwaysOnTop);
    mediaWindow.setAlwaysOnTop(
      alwaysOnTop,
      alwaysOnTop ? 'screen-saver' : undefined,
    );

    // Get current window state
    const isCurrentlyFullscreen = mediaWindow.isFullScreen();

    console.log('🔍 [moveMediaWindow] Window state details:', {
      bounds: currentBounds,
      isFullScreen: mediaWindow.isFullScreen(),
      isMaximized: mediaWindow.isMaximized(),
      isMinimized: mediaWindow.isMinimized(),
      isVisible: mediaWindow.isVisible(),
    });

    console.log('🔍 [moveMediaWindow] Current state:', {
      currentBounds,
      currentDisplayNr,
      currentScreen: screens[currentDisplayNr]?.bounds,
      isCurrentlyFullscreen,
    });

    // Determine target display and mode
    let targetDisplayNr = displayNr;
    let targetFullscreen = fullscreen;

    let preferredIndex = -1;
    const mediaWindowPrefs = loadMediaWindowPrefs();
    if (mediaWindowPrefs) {
      preferredIndex = screens.findIndex((s) => {
        const b = s.bounds;
        return (
          b.x === mediaWindowPrefs.x &&
          b.y === mediaWindowPrefs.y &&
          b.width === mediaWindowPrefs.width &&
          b.height === mediaWindowPrefs.height
        );
      });
      if (preferredIndex !== -1) {
        console.log(
          '🔍 [moveMediaWindow] Preferred display index:',
          preferredIndex,
        );
      } else {
        console.log('🔍 [moveMediaWindow] Preferred display index not found');
      }
    } else {
      console.log('🔍 [moveMediaWindow] No preferred display geometry found');
    }

    if (targetDisplayNr === undefined || targetFullscreen === undefined) {
      console.log(
        '🔍 [moveMediaWindow] No parameters provided - checking if media window should move',
      );

      // Check if media window is fullscreen, maximized, or effectively fullscreen
      const isFullscreenOrMaximized =
        isCurrentlyFullscreen ||
        mediaWindow.isMaximized() ||
        isEffectivelyFullscreen;

      console.log('🔍 [moveMediaWindow] Fullscreen detection:', {
        heightMatch: screenBounds
          ? currentBounds.height >= screenBounds.height - 10
          : false,
        isCurrentlyFullscreen,
        isEffectivelyFullscreen,
        isMaximized: mediaWindow.isMaximized(),
        screenBounds,
        widthMatch: screenBounds
          ? currentBounds.width >= screenBounds.width - 10
          : false,
        windowBounds: currentBounds,
      });

      if (!isFullscreenOrMaximized) {
        console.log(
          '🔍 [moveMediaWindow] Media window is windowed, checking if it should go fullscreen',
        );

        // If windowed but multiple screens available, move to another screen and go fullscreen
        if (screens.length > 1) {
          const alternativeScreen = screens.findIndex(
            (s, index) => !s.mainWindow && index !== currentDisplayNr,
          );

          if (alternativeScreen !== -1) {
            targetDisplayNr = alternativeScreen;
            targetFullscreen = true;
            console.log(
              '🔍 [moveMediaWindow] Moving windowed media window to alternative screen and going fullscreen:',
              targetDisplayNr,
            );
          } else {
            // If no alternative found, try any non-main window screen
            const anyAlternativeScreen = screens.findIndex(
              (s) => !s.mainWindow,
            );
            if (anyAlternativeScreen !== -1) {
              targetDisplayNr = anyAlternativeScreen;
              targetFullscreen = true;
              console.log(
                '🔍 [moveMediaWindow] Moving windowed media window to any alternative screen and going fullscreen:',
                targetDisplayNr,
              );
            } else {
              console.log(
                '🔍 [moveMediaWindow] No alternative screens available, keeping current position',
              );
              return;
            }
          }
        } else {
          console.log(
            '🔍 [moveMediaWindow] Only one screen available, keeping windowed',
          );
          return;
        }
      }

      console.log(
        '🔍 [moveMediaWindow] Media window is fullscreen/maximized, checking if it should move',
      );

      // If media window is fullscreen, check if it needs to move
      const mainWindowScreen = screens.findIndex((s) => s.mainWindow);

      console.log('🔍 [moveMediaWindow] Screen analysis:', {
        currentDisplayNr,
        mainWindowScreen,
        screens: screens.map((s, i) => ({
          index: i,
          mainWindow: s.mainWindow,
          mediaWindow: s.mediaWindow,
        })),
      });

      // Prefer saved screen when applicable (fullscreen/maximized, 3+ displays, saved exists)
      if (
        (isFullscreenOrMaximized || isCurrentlyFullscreen) &&
        screens.length >= 3 &&
        preferredIndex !== -1 &&
        preferredIndex !== mainWindowScreen
      ) {
        targetDisplayNr = preferredIndex;
        targetFullscreen = true;
        console.log('🔍 [moveMediaWindow] Using preferred screen:', {
          preferredIndex,
        });
      } else {
        console.log('🔍 [moveMediaWindow] Not using preferred screen');
      }

      // Only move if media window is on the same screen as main window
      if (currentDisplayNr === mainWindowScreen) {
        console.log(
          '🔍 [moveMediaWindow] Media window is on main window screen, moving to alternative',
        );

        // Find an alternative screen
        const alternativeScreen = screens.findIndex(
          (s, index) => !s.mainWindow && index !== currentDisplayNr,
        );

        if (alternativeScreen !== -1) {
          targetDisplayNr = alternativeScreen;
          targetFullscreen = true;
          console.log(
            '🔍 [moveMediaWindow] Moving fullscreen media window to alternative screen:',
            targetDisplayNr,
          );
        } else {
          // If no alternative found, try any non-main window screen
          const anyAlternativeScreen = screens.findIndex((s) => !s.mainWindow);
          if (anyAlternativeScreen !== -1) {
            targetDisplayNr = anyAlternativeScreen;
            targetFullscreen = true;
            console.log(
              '🔍 [moveMediaWindow] Moving fullscreen media window to any alternative screen:',
              targetDisplayNr,
            );
          } else {
            console.log(
              '🔍 [moveMediaWindow] No alternative screens available, keeping current position',
            );
            return;
          }
        }
      } else {
        console.log(
          '🔍 [moveMediaWindow] Media window is already on different screen, checking if it should stay fullscreen',
        );

        // If fullscreen but only one screen available, go windowed
        if (screens.length === 1) {
          console.log(
            '🔍 [moveMediaWindow] Only one screen available, setting fullscreen media window to windowed',
          );
          targetDisplayNr = 0; // Use the only available screen
          targetFullscreen = false;
        } else {
          console.log(
            '🔍 [moveMediaWindow] Multiple screens available, keeping current position',
          );
          return;
        }
      }
    }

    console.log('🔍 [moveMediaWindow] Target state:', {
      targetDisplayNr,
      targetFullscreen,
      targetScreen: screens[targetDisplayNr]?.bounds,
    });

    // Validate target display
    if (targetDisplayNr < 0 || targetDisplayNr >= screens.length) {
      console.log(
        '❌ [moveMediaWindow] Invalid display number:',
        targetDisplayNr,
      );
      return;
    }

    let targetScreen = screens[targetDisplayNr];
    if (!targetScreen) {
      console.log('❌ [moveMediaWindow] Target screen not found');
      return;
    }

    // Prevent fullscreen on same monitor as main window
    const mainWindowScreen = screens.findIndex((s) => s.mainWindow);
    if (
      targetFullscreen &&
      targetDisplayNr === mainWindowScreen &&
      screens.length > 1
    ) {
      console.log(
        '🔍 [moveMediaWindow] Preventing fullscreen on main window screen, switching to alternative',
      );
      const alternativeScreen = screens.findIndex((s) => !s.mainWindow);
      if (alternativeScreen !== -1) {
        targetDisplayNr = alternativeScreen;
        targetScreen = screens[targetDisplayNr];
        console.log(
          '🔍 [moveMediaWindow] Switched to screen:',
          targetDisplayNr,
        );
      } else {
        targetFullscreen = false;
        console.log(
          '🔍 [moveMediaWindow] No alternative screen, going windowed',
        );
      }
    }

    console.log('🔍 [moveMediaWindow] Final target:', {
      targetDisplayNr,
      targetFullscreen,
      targetScreen: targetScreen?.bounds,
    });

    // Apply the changes
    setWindowPosition(targetDisplayNr, targetFullscreen);

    console.log('🔍 [moveMediaWindow] END - Changes applied');
  } catch (e) {
    console.error('❌ [moveMediaWindow] Error:', e);
    captureElectronError(e, {
      contexts: { fn: { name: 'moveMediaWindow' } },
    });
  }
};

function loadMediaWindowPrefs(): null | Rectangle {
  try {
    const file = join(app.getPath('userData'), 'media-window-prefs.json');
    if (!pathExistsSync(file)) {
      console.log('🔍 [loadMediaWindowPrefs] File does not exist:', file);
      return null;
    }
    console.log('🔍 [loadMediaWindowPrefs] Loading prefs from:', file);
    return readJsonSync(file);
  } catch (e) {
    console.error('❌ [loadMediaWindowPrefs] Error:', e);
    captureElectronError(e, {
      contexts: { fn: { name: 'loadMediaWindowPrefs' } },
    });
    return null;
  }
}

function saveMediaWindowPrefs(prefs: Rectangle) {
  try {
    const file = join(app.getPath('userData'), 'media-window-prefs.json');
    console.log('🔍 [saveMediaWindowPrefs] Saving prefs to:', file);
    writeJsonSync(file, prefs);
  } catch (e) {
    console.error('❌ [saveMediaWindowPrefs] Error:', e);
    captureElectronError(e, {
      contexts: { fn: { name: 'saveMediaWindowPrefs' } },
    });
  }
}

const setWindowPosition = (displayNr?: number, fullscreen = true) => {
  console.log('🔍 [setWindowPosition] START - Called with:', {
    displayNr,
    fullscreen,
  });

  try {
    if (!mediaWindow) {
      console.log('❌ [setWindowPosition] No mediaWindow, returning');
      return;
    }

    const screens = getAllScreens();
    const targetDisplay = screens[displayNr ?? 0];
    if (!targetDisplay) {
      console.log(
        '❌ [setWindowPosition] Target display not found:',
        displayNr,
      );
      return;
    }

    const targetScreenBounds = targetDisplay.bounds;
    console.log(
      '🔍 [setWindowPosition] Target screen bounds:',
      targetScreenBounds,
    );

    const updateScreenAndPrefs = () => {
      console.log('🔍 [setWindowPosition] Sending screenChange event');
      sendToWindow(mainWindow, 'screenChange');
    };

    const setWindowBounds = (
      bounds: Partial<Electron.Rectangle>,
      fullScreen = false,
    ) => {
      console.log('🔍 [setWindowBounds] START - Called with:', {
        bounds,
        fullScreen,
      });

      if (!mediaWindow) {
        console.log('❌ [setWindowBounds] No mediaWindow, returning');
        return;
      }

      // Get current state
      const currentBounds = mediaWindow.getBounds();
      const wasFullscreen = mediaWindow.isFullScreen();
      console.log('🔍 [setWindowBounds] Current state:', {
        currentBounds,
        wasFullscreen,
      });

      // Set fullscreen state first if needed
      if (wasFullscreen !== fullScreen) {
        console.log(
          '🔍 [setWindowBounds] Changing fullscreen state:',
          wasFullscreen,
          '->',
          fullScreen,
        );
        mediaWindow.setFullScreen(fullScreen);
      } else {
        console.log(
          '🔍 [setWindowBounds] Fullscreen state unchanged:',
          fullScreen,
        );
      }

      // Set bounds
      console.log('🔍 [setWindowBounds] Setting bounds:', bounds);
      mediaWindow.setBounds(bounds);

      // Verify the changes
      const newBounds = mediaWindow.getBounds();
      const newFullscreen = mediaWindow.isFullScreen();
      console.log('🔍 [setWindowBounds] New state:', {
        newBounds,
        newFullscreen,
      });

      updateScreenAndPrefs();

      // Bring media window to front if it's visible
      if (mediaWindow.isVisible()) {
        console.log('🔍 [setWindowBounds] Bringing media window to front');
        mediaWindow.focus();
        mediaWindow.show();
      }

      console.log('🔍 [setWindowBounds] END - Changes applied');
    };

    const handleMacFullScreenTransition = (callback: () => void) => {
      if (PLATFORM === 'darwin' && mediaWindow?.isFullScreen()) {
        console.log(
          '🔍 [handleMacFullScreenTransition] macOS fullscreen transition needed',
        );
        mediaWindow?.once('leave-full-screen', () => {
          console.log(
            '🔍 [handleMacFullScreenTransition] Left fullscreen, executing callback',
          );
          callback();
        });
        mediaWindow?.setFullScreen(false);
      } else {
        console.log(
          '🔍 [handleMacFullScreenTransition] No transition needed, executing callback immediately',
        );
        callback();
      }
    };

    if (fullscreen) {
      console.log('🔍 [setWindowPosition] Going fullscreen');
      handleMacFullScreenTransition(() => {
        setWindowBounds(targetScreenBounds, true);
        try {
          saveMediaWindowPrefs(targetDisplay.bounds);
          console.log(
            '🔍 [setWindowPosition] Saved preferred display geometry:',
            targetDisplay.bounds,
          );
        } catch (e) {
          console.error(
            '❌ [setWindowPosition] Error saving preferred display geometry:',
            e,
          );
          captureElectronError(e, {
            contexts: { fn: { name: 'setWindowPosition.savePrefs' } },
          });
        }
      });
    } else {
      console.log('🔍 [setWindowPosition] Going windowed');

      // Calculate windowed bounds (HD_RESOLUTION)
      const newBounds = (() => {
        const maxWidth = Math.min(
          targetScreenBounds.width - 100,
          HD_RESOLUTION[0],
        );
        const maxHeight = Math.min(
          targetScreenBounds.height - 100,
          HD_RESOLUTION[1],
        );

        // If the full size doesn't fit, scale down proportionally
        const scaleX = maxWidth / HD_RESOLUTION[0];
        const scaleY = maxHeight / HD_RESOLUTION[1];
        const scale = Math.min(scaleX, scaleY, 1);

        const width = Math.floor(HD_RESOLUTION[0] * scale);
        const height = Math.floor(HD_RESOLUTION[1] * scale);

        const bounds = {
          height,
          width,
          x:
            targetScreenBounds.x +
            Math.floor((targetScreenBounds.width - width) / 2),
          y:
            targetScreenBounds.y +
            Math.floor((targetScreenBounds.height - height) / 2),
        };

        console.log('🔍 [setWindowPosition] Calculated windowed bounds:', {
          bounds,
          maxHeight,
          maxWidth,
          scale,
          scaleX,
          scaleY,
        });

        return bounds;
      })();

      handleMacFullScreenTransition(() => {
        setWindowBounds(newBounds, false);
      });
    }

    console.log('🔍 [setWindowPosition] END - All changes queued');
  } catch (err) {
    console.error('❌ [setWindowPosition] Error:', err);
    captureElectronError(err, {
      contexts: { fn: { name: 'setWindowPosition' } },
    });
  }
};

/**
 * Focuses the media window if it exists and is visible
 */
export function focusMediaWindow() {
  try {
    if (mediaWindow && !mediaWindow.isDestroyed() && mediaWindow.isVisible()) {
      console.log('🔍 [focusMediaWindow] Focusing media window');
      mediaWindow.focus();
      mediaWindow.show();
    } else {
      console.log(
        '🔍 [focusMediaWindow] Media window not available for focusing',
      );
    }
  } catch (err) {
    console.error('❌ [focusMediaWindow] Error:', err);
    captureElectronError(err, {
      contexts: { fn: { name: 'focusMediaWindow' } },
    });
  }
}
