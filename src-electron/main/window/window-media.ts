import type { BrowserWindow } from 'electron';

import { getAllScreens, getWindowScreen } from 'main/screen';
import { captureElectronError, getIconPath } from 'main/utils';
import { createWindow, sendToWindow } from 'main/window/window-base';
import { mainWindow } from 'main/window/window-main';
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
    backgroundColor: 'black',
    frame: false,
    height: HD_RESOLUTION[1],
    icon: getIconPath('media-player'),
    minHeight: 110,
    minWidth: 195,
    roundedCorners: PLATFORM === 'darwin',
    thickFrame: false,
    title: 'Media Player - M³',
    width: HD_RESOLUTION[0],
  });

  // Force aspect ratio
  mediaWindow.setAspectRatio(16 / 9);

  mediaWindow.on('closed', () => {
    mediaWindow = null;
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

    // Set maximizable based on screen count
    mediaWindow.setMaximizable(screens.length > 1);

    // Get current window state
    const currentBounds = mediaWindow.getBounds();
    const currentDisplayNr = getWindowScreen(mediaWindow);
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

    if (targetDisplayNr === undefined || targetFullscreen === undefined) {
      console.log(
        '🔍 [moveMediaWindow] No parameters provided - checking if media window should move',
      );

      // Check if media window is fullscreen, maximized, or effectively fullscreen
      const currentScreen = screens[currentDisplayNr];
      const screenBounds = currentScreen?.bounds;
      const isEffectivelyFullscreen =
        screenBounds &&
        currentBounds.width >= screenBounds.width - 10 &&
        currentBounds.height >= screenBounds.height - 10;

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
          '🔍 [moveMediaWindow] Media window is windowed, not moving',
        );
        return;
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
          '🔍 [moveMediaWindow] Media window is already on different screen, not moving',
        );
        return;
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
    captureElectronError(e);
  }
};

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

      const alwaysOnTop = PLATFORM !== 'darwin' && fullScreen;
      console.log('🔍 [setWindowBounds] Always on top:', alwaysOnTop);

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

      // Set always on top
      console.log('🔍 [setWindowBounds] Setting always on top:', alwaysOnTop);
      mediaWindow.setAlwaysOnTop(alwaysOnTop);

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

        const bounds = {
          height: Math.floor(HD_RESOLUTION[1] * scale),
          width: Math.floor(HD_RESOLUTION[0] * scale),
          x: targetScreenBounds.x + 50,
          y: targetScreenBounds.y + 50,
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
    captureElectronError(err);
  }
};
