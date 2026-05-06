import { app, type BrowserWindow, type Rectangle } from 'electron';
import { pathExistsSync, readJsonSync, writeJsonSync } from 'fs-extra/esm';
import { HD_RESOLUTION, PLATFORM } from 'src-electron/constants';
import { getAllScreens, getWindowScreen } from 'src-electron/main/screen';
import { getIconPath } from 'src-electron/main/utils';
import { createWindow } from 'src-electron/main/window/window-base';
import { log, throttleWithTrailing } from 'src/shared/vanilla';
import { join } from 'upath';

export const timerWindowInfo: {
  timerWindow: BrowserWindow | null;
} = {
  timerWindow: null,
};

/**
 * Creates the timer window
 */
export function createTimerWindow() {
  // If the window is already open, just focus it
  if (
    timerWindowInfo.timerWindow &&
    !timerWindowInfo.timerWindow.isDestroyed()
  ) {
    timerWindowInfo.timerWindow.showInactive();
    return;
  }

  // Create the browser window
  timerWindowInfo.timerWindow = createWindow('timer', {
    alwaysOnTop: false,
    backgroundColor: 'black',
    focusable: true,
    frame: false,
    height: HD_RESOLUTION[1],
    icon: getIconPath('timer'),
    minHeight: 110,
    minWidth: 195,
    opacity: 1,
    roundedCorners: PLATFORM === 'darwin',
    thickFrame: false,
    title: 'Timer - M³',
    width: HD_RESOLUTION[0],
  });

  timerWindowInfo.timerWindow.once('ready-to-show', () => {
    timerWindowInfo.timerWindow?.showInactive();
  });

  // For timer, maybe no aspect ratio, or 16/9 as well? Let's keep for now.

  // Check if only one screen is available and set to windowed mode with HD resolution
  const screens = getAllScreens();
  if (screens.length === 1 && screens[0]) {
    log(
      '🔍 [createTimerWindow] Only one screen available, checking if window needs repositioning',
      'timer',
      'log',
    );

    // Get current window bounds
    const currentBounds = timerWindowInfo.timerWindow.getBounds();
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

    log('🔍 [createTimerWindow] Window position check:', 'timer', 'log', {
      currentBounds,
      isSmallerThanScreen,
      isWithinScreenBounds,
      screenBounds,
    });

    // Only reposition if window is not already properly positioned
    if (!isWithinScreenBounds || !isSmallerThanScreen) {
      log(
        '🔍 [createTimerWindow] Window needs repositioning, setting to windowed mode with HD resolution',
        'timer',
        'log',
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

      timerWindowInfo.timerWindow.setFullScreen(false);

      timerWindowInfo.timerWindow.setBounds({
        height: windowedHeight,
        width: windowedWidth,
        x,
        y,
      });

      log('🔍 [createTimerWindow] Set windowed bounds:', 'timer', 'log', {
        height: windowedHeight,
        scale,
        width: windowedWidth,
        x,
        y,
      });
    } else {
      log(
        '🔍 [createTimerWindow] Window already properly positioned, keeping current bounds',
        'timer',
        'log',
      );
    }
  }

  timerWindowInfo.timerWindow.on('closed', () => {
    timerWindowInfo.timerWindow = null;
  });
}

export const moveTimerWindowThrottled = throttleWithTrailing(
  () => moveTimerWindow(),
  100,
);

export const moveTimerWindow = (displayNr?: number, fullscreen?: boolean) => {
  log('🔍 [moveTimerWindow] START - Called with:', 'timer', 'log', {
    displayNr,
    fullscreen,
  });

  try {
    if (!timerWindowInfo.timerWindow?.isVisible()) {
      log(
        '🔍 [moveTimerWindow] Timer window not available or not visible',
        'timer',
        'log',
      );
      return;
    }

    const screens = getAllScreens();
    log(
      '🔍 [moveTimerWindow] Available screens:',
      'timer',
      'log',
      screens.length,
    );

    // Get current window state
    const currentBounds = timerWindowInfo.timerWindow.getBounds();
    const currentDisplayNr = getWindowScreen(timerWindowInfo.timerWindow);

    // Determine target display and mode.
    // NOTE:
    // - fullscreen can be undefined when this function is called without an explicit mode.
    // - that "undefined" state is intentionally handled later in the "auto-decide" branch.
    let targetDisplayNr = displayNr;
    let targetFullscreen = fullscreen;
    const mainWindowScreen = screens.findIndex((s) => s.mainWindow);

    // Timer fullscreen only makes practical sense with 3+ screens:
    // with 1-2 screens, fullscreen would overlap main/media responsibilities.
    if (targetFullscreen && screens.length <= 2) {
      targetFullscreen = false;
      log(
        '🔍 [moveTimerWindow] Forcing windowed mode because there are two or fewer screens',
        'timer',
        'log',
      );
    }

    // If fullscreen is explicitly requested and we have 3+ screens,
    // immediately avoid main/media displays.
    if (
      targetFullscreen &&
      screens.length >= 3 &&
      (targetDisplayNr === undefined ||
        screens[targetDisplayNr]?.mainWindow ||
        screens[targetDisplayNr]?.mediaWindow)
    ) {
      const nonMainNonMediaScreen = screens.findIndex(
        (screen) => !screen.mainWindow && !screen.mediaWindow,
      );
      if (nonMainNonMediaScreen !== -1) {
        targetDisplayNr = nonMainNonMediaScreen;
        log(
          '🔍 [moveTimerWindow] Auto-selected non-main, non-media screen for fullscreen timer',
          'timer',
          'log',
          targetDisplayNr,
        );
      }
    }

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
      if (preferredIndex === -1) {
        log(
          '🔍 [moveTimerWindow] Preferred display index not found',
          'timer',
          'log',
        );
      } else {
        log(
          '🔍 [moveTimerWindow] Preferred display index:',
          'timer',
          'log',
          preferredIndex,
        );
      }
    } else {
      log(
        '🔍 [moveTimerWindow] No preferred display geometry found',
        'timer',
        'log',
      );
    }

    if (targetDisplayNr === undefined || targetFullscreen === undefined) {
      log(
        '🔍 [moveTimerWindow] No parameters provided - checking if timer window should move',
        'timer',
        'log',
      );

      // Check if timer window is fullscreen
      const isCurrentlyFullscreen = timerWindowInfo.timerWindow.isFullScreen();

      // Keep user-defined windowed size/position when no explicit move request was made.
      // This avoids unexpected resizing when unrelated actions (e.g. media playback)
      // trigger a generic timer-window sync.
      if (!isCurrentlyFullscreen) {
        log(
          '🔍 [moveTimerWindow] Timer window is windowed and no explicit target was provided; keeping current bounds',
          'timer',
          'log',
        );
        return;
      }

      log('🔍 [moveTimerWindow] Current state:', 'timer', 'log', {
        currentBounds,
        currentDisplayNr,
        currentScreen: screens[currentDisplayNr]?.bounds,
        isCurrentlyFullscreen,
      });

      log('🔍 [moveTimerWindow] Screen analysis:', 'timer', 'log', {
        currentDisplayNr,
        mainWindowScreen,
        screens: screens.map((s, i) => ({
          index: i,
          mainWindow: s.mainWindow,
          timerWindow: s.timerWindow,
        })),
      });

      // Prefer saved screen ONLY when there are more than 3 displays.
      //
      // Why > 3 instead of >= 3?
      // - With exactly 3 displays, there is typically only one valid fullscreen target
      //   (non-main, non-media), so preference does not add useful choice.
      // - With 4+ displays, preference meaningfully captures operator intent.
      if (
        isCurrentlyFullscreen &&
        screens.length > 3 &&
        preferredIndex !== -1 &&
        preferredIndex !== mainWindowScreen &&
        !screens[preferredIndex]?.mediaWindow
      ) {
        targetDisplayNr = preferredIndex;
        targetFullscreen = true;
        log('🔍 [moveTimerWindow] Using preferred screen:', 'timer', 'log', {
          preferredIndex,
        });
      } else {
        log(
          '🔍 [moveTimerWindow] Not using preferred screen (must be >3 displays and not main/media)',
          'timer',
          'log',
        );
      }

      // Only move if timer window is on the same screen as main window
      if (currentDisplayNr === mainWindowScreen) {
        log(
          '🔍 [moveTimerWindow] Timer window is on main window screen, moving to alternative',
          'timer',
          'log',
        );

        // Find an alternative screen
        const alternativeScreen = screens.findIndex(
          (s, index) => !s.mainWindow && index !== currentDisplayNr,
        );

        if (alternativeScreen === -1) {
          // If no alternative found, try any non-main window screen
          const anyAlternativeScreen = screens.findIndex((s) => !s.mainWindow);
          if (anyAlternativeScreen === -1) {
            log(
              '🔍 [moveTimerWindow] No alternative screens available, keeping current position',
              'timer',
              'log',
            );
            return;
          } else {
            targetDisplayNr = anyAlternativeScreen;
            targetFullscreen = true;
            log(
              '🔍 [moveTimerWindow] Moving fullscreen timer window to any alternative screen:',
              'timer',
              'log',
              targetDisplayNr,
            );
          }
        } else {
          targetDisplayNr = alternativeScreen;
          targetFullscreen = true;
          log(
            '🔍 [moveTimerWindow] Moving fullscreen timer window to alternative screen:',
            'timer',
            'log',
            targetDisplayNr,
          );
        }
      } else {
        log(
          '🔍 [moveTimerWindow] Timer window is already on different screen, checking if it should stay fullscreen',
          'timer',
          'log',
        );

        // If fullscreen but only one screen available, go windowed
        if (screens.length === 1) {
          log(
            '🔍 [moveTimerWindow] Only one screen available, setting fullscreen timer window to windowed',
            'timer',
            'log',
          );
          targetDisplayNr = 0; // Use the only available screen
          targetFullscreen = false;
        } else {
          log(
            '🔍 [moveTimerWindow] Multiple screens available, keeping current position',
            'timer',
            'log',
          );
          return;
        }
      }
    }

    log('🔍 [moveTimerWindow] Target state:', 'timer', 'log', {
      targetDisplayNr,
      targetFullscreen,
      targetScreen: screens[targetDisplayNr]?.bounds,
    });

    // Validate target display
    if (targetDisplayNr < 0 || targetDisplayNr >= screens.length) {
      log(
        '❌ [moveTimerWindow] Invalid display number:',
        'timer',
        'error',
        targetDisplayNr,
      );
      return;
    }

    const targetScreen = screens[targetDisplayNr];
    if (!targetScreen) {
      log('❌ [moveTimerWindow] Target screen not found', 'timer', 'error');
      return;
    }

    // Prevent fullscreen on same monitor as main window
    if (
      targetFullscreen &&
      targetDisplayNr === mainWindowScreen &&
      screens.length > 1
    ) {
      log(
        '🔍 [moveTimerWindow] Preventing fullscreen on main window screen, switching to alternative',
        'timer',
        'log',
      );
      const alternativeScreen = screens.findIndex((s) => !s.mainWindow);
      if (alternativeScreen === -1) {
        targetFullscreen = false;
        log(
          '🔍 [moveTimerWindow] No alternative screen, going windowed',
          'timer',
          'log',
        );
      } else {
        targetDisplayNr = alternativeScreen;
        log(
          '🔍 [moveTimerWindow] Switched to screen:',
          'timer',
          'log',
          targetDisplayNr,
        );
      }
    }

    log('🔍 [moveTimerWindow] Final target:', 'timer', 'log', {
      targetDisplayNr,
      targetFullscreen,
      targetScreen: targetScreen?.bounds,
    });

    // Apply the changes
    setTimerWindowPosition(targetDisplayNr, targetFullscreen);

    log('🔍 [moveTimerWindow] END - Changes applied', 'timer', 'log');
  } catch (e) {
    log('❌ [moveTimerWindow] Error:', 'timer', 'error', e);
  }
};

function loadTimerWindowPrefs(): null | Rectangle {
  try {
    const file = join(app.getPath('userData'), 'timer-window-prefs.json');
    if (!pathExistsSync(file)) {
      log(
        '🔍 [loadTimerWindowPrefs] File does not exist:',
        'timer',
        'log',
        file,
      );
      return null;
    }
    log('🔍 [loadTimerWindowPrefs] Loading prefs from:', 'timer', 'log', file);
    return readJsonSync(file);
  } catch (e) {
    log('❌ [loadTimerWindowPrefs] Error:', 'timer', 'error', e);
    return null;
  }
}

function saveTimerWindowPrefs(prefs: Rectangle) {
  try {
    const file = join(app.getPath('userData'), 'timer-window-prefs.json');
    log('🔍 [saveTimerWindowPrefs] Saving prefs to:', 'timer', 'log', file);
    writeJsonSync(file, prefs);
  } catch (e) {
    log('❌ [saveTimerWindowPrefs] Error:', 'timer', 'error', e);
  }
}

const setTimerWindowPosition = (displayNr?: number, fullscreen = false) => {
  log('🔍 [setTimerWindowPosition] START - Called with:', 'timer', 'log', {
    displayNr,
    fullscreen,
  });

  try {
    if (!timerWindowInfo.timerWindow) {
      log(
        '❌ [setTimerWindowPosition] No timerWindowInfo.timerWindow, returning',
        'timer',
        'error',
      );
      return;
    }

    const screens = getAllScreens();
    const targetDisplay = screens[displayNr ?? 0];
    if (!targetDisplay) {
      log(
        '❌ [setTimerWindowPosition] Target display not found:',
        'timer',
        'error',
        displayNr,
      );
      return;
    }

    const targetScreenBounds = targetDisplay.bounds;
    log(
      '🔍 [setTimerWindowPosition] Target screen bounds:',
      'timer',
      'log',
      targetScreenBounds,
    );

    if (fullscreen) {
      log('🔍 [setTimerWindowPosition] Going fullscreen', 'timer', 'log');
      timerWindowInfo.timerWindow.setBounds(targetScreenBounds);
      timerWindowInfo.timerWindow.setFullScreen(true);
      try {
        saveTimerWindowPrefs(targetDisplay.bounds);
        log(
          '🔍 [setTimerWindowPosition] Saved preferred display geometry:',
          'timer',
          'log',
          targetDisplay.bounds,
        );
      } catch (e) {
        log(
          '❌ [setTimerWindowPosition] Error saving preferred display geometry:',
          'timer',
          'error',
          e,
        );
      }
    } else {
      log('🔍 [setTimerWindowPosition] Going windowed', 'timer', 'log');

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

      log(
        '🔍 [setTimerWindowPosition] Calculated windowed bounds:',
        'timer',
        'log',
        {
          bounds,
        },
      );

      timerWindowInfo.timerWindow.setFullScreen(false);
      timerWindowInfo.timerWindow.setBounds(bounds);
      saveTimerWindowPrefs(targetDisplay.bounds);
    }

    // Bring timer window to front if it's visible
    if (timerWindowInfo.timerWindow.isVisible()) {
      log(
        '🔍 [setTimerWindowPosition] Refreshing visible timer window without stealing focus',
        'timer',
        'log',
      );
      timerWindowInfo.timerWindow.showInactive();
    }

    log('🔍 [setTimerWindowPosition] END - All changes queued', 'timer', 'log');
  } catch (err) {
    log('❌ [setTimerWindowPosition] Error:', 'timer', 'error', err);
  }
};
