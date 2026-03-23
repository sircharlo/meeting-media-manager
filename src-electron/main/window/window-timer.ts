import { app, type BrowserWindow, type Rectangle } from 'electron';
import { pathExistsSync, readJsonSync, writeJsonSync } from 'fs-extra/esm';
import { join } from 'node:path';
import { HD_RESOLUTION, PLATFORM } from 'src-electron/constants';
import { getAllScreens, getWindowScreen } from 'src-electron/main/screen';
import { getIconPath } from 'src-electron/main/utils';
import { createWindow } from 'src-electron/main/window/window-base';
import { log, throttleWithTrailing } from 'src/shared/vanilla';

export let timerWindow: BrowserWindow | null = null;

/**
 * Creates the timer window
 */
export function createTimerWindow() {
  // If the window is already open, just focus it
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.showInactive();
    return;
  }

  // Create the browser window
  timerWindow = createWindow('timer', {
    alwaysOnTop: false,
    backgroundColor: 'black',
    focusable: true,
    frame: false,
    height: HD_RESOLUTION[1],
    icon: getIconPath('media-player'), // TODO: change icon
    minHeight: 110,
    minWidth: 195,
    opacity: 1,
    roundedCorners: PLATFORM === 'darwin',
    thickFrame: false,
    title: 'Timer - M³',
    width: HD_RESOLUTION[0],
  });

  timerWindow.once('ready-to-show', () => {
    timerWindow?.showInactive();
  });

  // For timer, maybe no aspect ratio, or 16/9 as well? Let's keep for now.

  // Check if only one screen is available and set to windowed mode with HD resolution
  const screens = getAllScreens();
  if (screens.length === 1 && screens[0]) {
    log(
      '🔍 [createTimerWindow] Only one screen available, checking if window needs repositioning',
    );

    // Get current window bounds
    const currentBounds = timerWindow.getBounds();
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

    log('🔍 [createTimerWindow] Window position check:', {
      currentBounds,
      isSmallerThanScreen,
      isWithinScreenBounds,
      screenBounds,
    });

    // Only reposition if window is not already properly positioned
    if (!isWithinScreenBounds || !isSmallerThanScreen) {
      log(
        '🔍 [createTimerWindow] Window needs repositioning, setting to windowed mode with HD resolution',
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

      timerWindow.setFullScreen(false);

      timerWindow.setBounds({
        height: windowedHeight,
        width: windowedWidth,
        x,
        y,
      });

      log('🔍 [createTimerWindow] Set windowed bounds:', {
        height: windowedHeight,
        scale,
        width: windowedWidth,
        x,
        y,
      });
    } else {
      log(
        '🔍 [createTimerWindow] Window already properly positioned, keeping current bounds',
      );
    }
  }

  timerWindow.on('closed', () => {
    timerWindow = null;
  });
}

export const moveTimerWindowThrottled = throttleWithTrailing(
  () => moveTimerWindow(),
  100,
);

export const moveTimerWindow = (displayNr?: number, fullscreen = false) => {
  log('🔍 [moveTimerWindow] START - Called with:', {
    displayNr,
    fullscreen,
  });

  try {
    if (!timerWindow || !timerWindow.isVisible()) {
      log('🔍 [moveTimerWindow] Timer window not available or not visible');
      return;
    }

    const screens = getAllScreens();
    log('🔍 [moveTimerWindow] Available screens:', screens.length);

    // Get current window state
    const currentBounds = timerWindow.getBounds();
    const currentDisplayNr = getWindowScreen(timerWindow);

    // Determine target display and mode
    let targetDisplayNr = displayNr;
    let targetFullscreen = fullscreen;

    let preferredIndex = -1;
    const timerWindowPrefs = loadTimerWindowPrefs();
    if (timerWindowPrefs) {
      preferredIndex = screens.findIndex((s) => {
        const b = s.bounds;
        return (
          b.x === timerWindowPrefs.x &&
          b.y === timerWindowPrefs.y &&
          b.width === timerWindowPrefs.width &&
          b.height === timerWindowPrefs.height
        );
      });
      if (preferredIndex !== -1) {
        log('🔍 [moveTimerWindow] Preferred display index:', preferredIndex);
      } else {
        log('🔍 [moveTimerWindow] Preferred display index not found');
      }
    } else {
      log('🔍 [moveTimerWindow] No preferred display geometry found');
    }

    if (targetDisplayNr === undefined || targetFullscreen === undefined) {
      log(
        '🔍 [moveTimerWindow] No parameters provided - checking if timer window should move',
      );

      // Check if timer window is fullscreen
      const isCurrentlyFullscreen = timerWindow.isFullScreen();

      log('🔍 [moveTimerWindow] Current state:', {
        currentBounds,
        currentDisplayNr,
        currentScreen: screens[currentDisplayNr]?.bounds,
        isCurrentlyFullscreen,
      });

      // If timer window is fullscreen, check if it needs to move
      const mainWindowScreen = screens.findIndex((s) => s.mainWindow);

      log('🔍 [moveTimerWindow] Screen analysis:', {
        currentDisplayNr,
        mainWindowScreen,
        screens: screens.map((s, i) => ({
          index: i,
          mainWindow: s.mainWindow,
          timerWindow: s.timerWindow,
        })),
      });

      // Prefer saved screen when applicable (fullscreen, 3+ displays, saved exists)
      if (
        isCurrentlyFullscreen &&
        screens.length >= 3 &&
        preferredIndex !== -1 &&
        preferredIndex !== mainWindowScreen
      ) {
        targetDisplayNr = preferredIndex;
        targetFullscreen = true;
        log('🔍 [moveTimerWindow] Using preferred screen:', {
          preferredIndex,
        });
      } else {
        log('🔍 [moveTimerWindow] Not using preferred screen');
      }

      // Only move if timer window is on the same screen as main window
      if (currentDisplayNr === mainWindowScreen) {
        log(
          '🔍 [moveTimerWindow] Timer window is on main window screen, moving to alternative',
        );

        // Find an alternative screen
        const alternativeScreen = screens.findIndex(
          (s, index) => !s.mainWindow && index !== currentDisplayNr,
        );

        if (alternativeScreen !== -1) {
          targetDisplayNr = alternativeScreen;
          targetFullscreen = true;
          log(
            '🔍 [moveTimerWindow] Moving fullscreen timer window to alternative screen:',
            targetDisplayNr,
          );
        } else {
          // If no alternative found, try any non-main window screen
          const anyAlternativeScreen = screens.findIndex((s) => !s.mainWindow);
          if (anyAlternativeScreen !== -1) {
            targetDisplayNr = anyAlternativeScreen;
            targetFullscreen = true;
            log(
              '🔍 [moveTimerWindow] Moving fullscreen timer window to any alternative screen:',
              targetDisplayNr,
            );
          } else {
            log(
              '🔍 [moveTimerWindow] No alternative screens available, keeping current position',
            );
            return;
          }
        }
      } else {
        log(
          '🔍 [moveTimerWindow] Timer window is already on different screen, checking if it should stay fullscreen',
        );

        // If fullscreen but only one screen available, go windowed
        if (screens.length === 1) {
          log(
            '🔍 [moveTimerWindow] Only one screen available, setting fullscreen timer window to windowed',
          );
          targetDisplayNr = 0; // Use the only available screen
          targetFullscreen = false;
        } else {
          log(
            '🔍 [moveTimerWindow] Multiple screens available, keeping current position',
          );
          return;
        }
      }
    }

    log('🔍 [moveTimerWindow] Target state:', {
      targetDisplayNr,
      targetFullscreen,
      targetScreen: screens[targetDisplayNr]?.bounds,
    });

    // Validate target display
    if (targetDisplayNr < 0 || targetDisplayNr >= screens.length) {
      log('❌ [moveTimerWindow] Invalid display number:', targetDisplayNr);
      return;
    }

    const targetScreen = screens[targetDisplayNr];
    if (!targetScreen) {
      log('❌ [moveTimerWindow] Target screen not found');
      return;
    }

    // Prevent fullscreen on same monitor as main window
    const mainWindowScreen = screens.findIndex((s) => s.mainWindow);
    if (
      targetFullscreen &&
      targetDisplayNr === mainWindowScreen &&
      screens.length > 1
    ) {
      log(
        '🔍 [moveTimerWindow] Preventing fullscreen on main window screen, switching to alternative',
      );
      const alternativeScreen = screens.findIndex((s) => !s.mainWindow);
      if (alternativeScreen !== -1) {
        targetDisplayNr = alternativeScreen;
        log('🔍 [moveTimerWindow] Switched to screen:', targetDisplayNr);
      } else {
        targetFullscreen = false;
        log('🔍 [moveTimerWindow] No alternative screen, going windowed');
      }
    }

    log('🔍 [moveTimerWindow] Final target:', {
      targetDisplayNr,
      targetFullscreen,
      targetScreen: targetScreen?.bounds,
    });

    // Apply the changes
    setTimerWindowPosition(targetDisplayNr, targetFullscreen);

    log('🔍 [moveTimerWindow] END - Changes applied');
  } catch (e) {
    log('❌ [moveTimerWindow] Error:', e);
  }
};

function loadTimerWindowPrefs(): null | Rectangle {
  try {
    const file = join(app.getPath('userData'), 'timer-window-prefs.json');
    if (!pathExistsSync(file)) {
      log('🔍 [loadTimerWindowPrefs] File does not exist:', file);
      return null;
    }
    log('🔍 [loadTimerWindowPrefs] Loading prefs from:', file);
    return readJsonSync(file);
  } catch (e) {
    log('❌ [loadTimerWindowPrefs] Error:', e);
    return null;
  }
}

function saveTimerWindowPrefs(prefs: Rectangle) {
  try {
    const file = join(app.getPath('userData'), 'timer-window-prefs.json');
    log('🔍 [saveTimerWindowPrefs] Saving prefs to:', file);
    writeJsonSync(file, prefs);
  } catch (e) {
    log('❌ [saveTimerWindowPrefs] Error:', e);
  }
}

const setTimerWindowPosition = (displayNr?: number, fullscreen = false) => {
  log('🔍 [setTimerWindowPosition] START - Called with:', {
    displayNr,
    fullscreen,
  });

  try {
    if (!timerWindow) {
      log('❌ [setTimerWindowPosition] No timerWindow, returning');
      return;
    }

    const screens = getAllScreens();
    const targetDisplay = screens[displayNr ?? 0];
    if (!targetDisplay) {
      log('❌ [setTimerWindowPosition] Target display not found:', displayNr);
      return;
    }

    const targetScreenBounds = targetDisplay.bounds;
    log(
      '🔍 [setTimerWindowPosition] Target screen bounds:',
      targetScreenBounds,
    );

    if (fullscreen) {
      log('🔍 [setTimerWindowPosition] Going fullscreen');
      timerWindow.setBounds(targetScreenBounds);
      timerWindow.setFullScreen(true);
      try {
        saveTimerWindowPrefs(targetDisplay.bounds);
        log(
          '🔍 [setTimerWindowPosition] Saved preferred display geometry:',
          targetDisplay.bounds,
        );
      } catch (e) {
        log(
          '❌ [setTimerWindowPosition] Error saving preferred display geometry:',
          e,
        );
      }
    } else {
      log('🔍 [setTimerWindowPosition] Going windowed');

      // Calculate windowed bounds - timer window should be smaller than media window
      const timerWidth = Math.min(
        400,
        Math.floor(targetScreenBounds.width * 0.3),
      ); // 30% of screen width, max 400px
      const timerHeight = Math.min(
        200,
        Math.floor(targetScreenBounds.height * 0.2),
      ); // 20% of screen height, max 200px

      // Position timer window in bottom right corner of the target screen
      const x =
        targetScreenBounds.x + targetScreenBounds.width - timerWidth - 20; // 20px margin
      const y =
        targetScreenBounds.y + targetScreenBounds.height - timerHeight - 60; // 60px margin from bottom

      const bounds = {
        height: timerHeight,
        width: timerWidth,
        x,
        y,
      };

      log('🔍 [setTimerWindowPosition] Calculated windowed bounds:', {
        bounds,
      });

      timerWindow.setFullScreen(false);
      timerWindow.setBounds(bounds);
      saveTimerWindowPrefs(targetDisplay.bounds);
    }

    // Bring timer window to front if it's visible
    if (timerWindow.isVisible()) {
      log(
        '🔍 [setTimerWindowPosition] Refreshing visible timer window without stealing focus',
      );
      timerWindow.showInactive();
    }

    log('🔍 [setTimerWindowPosition] END - All changes queued');
  } catch (err) {
    log('❌ [setTimerWindowPosition] Error:', err);
  }
};
