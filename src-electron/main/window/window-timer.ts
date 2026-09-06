import type { BrowserWindow } from 'electron';
import type { Display } from 'src/types/electron';

import {
  HD_RESOLUTION,
  PLATFORM,
  WINDOW_MOVE_THROTTLE_MS,
} from 'src-electron/constants';
import { getAllScreens, getWindowScreen } from 'src-electron/main/screen';
import { captureElectronError, getIconPath } from 'src-electron/main/utils';
import {
  createWindow,
  loadWindowPrefs,
} from 'src-electron/main/window/window-base';
import { normalizeWindowBounds } from 'src-electron/main/window/window-bounds';
import { log, throttleWithTrailing } from 'src/shared/vanilla';

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
      '[createTimerWindow] Only one screen available, checking if window needs repositioning',
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

    log('[createTimerWindow] Window position check:', 'timer', 'log', {
      currentBounds,
      isSmallerThanScreen,
      isWithinScreenBounds,
      screenBounds,
    });

    // Only reposition if window is not already properly positioned
    if (!isWithinScreenBounds || !isSmallerThanScreen) {
      log(
        '[createTimerWindow] Window needs repositioning, setting to windowed mode with HD resolution',
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

      log('[createTimerWindow] Set windowed bounds:', 'timer', 'log', {
        height: windowedHeight,
        scale,
        width: windowedWidth,
        x,
        y,
      });
    } else {
      log(
        '[createTimerWindow] Window already properly positioned, keeping current bounds',
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
  WINDOW_MOVE_THROTTLE_MS,
);

export const moveTimerWindow = async (
  displayNr?: number,
  fullscreen?: boolean,
) => {
  log('[moveTimerWindow] START - Called with:', 'timer', 'log', {
    displayNr,
    fullscreen,
  });

  try {
    const timerWindow = timerWindowInfo.timerWindow;
    if (!timerWindow?.isVisible()) {
      log(
        '[moveTimerWindow] Timer window not available or not visible',
        'timer',
        'log',
      );
      return;
    }

    const screens = getAllScreens();
    log('[moveTimerWindow] Available screens:', 'timer', 'log', screens.length);

    const mainWindowScreen = screens.findIndex((s) => s.mainWindow);
    const preferredIndex = await getPreferredTimerScreenIndex(screens);
    const requestedTarget = getRequestedTimerTarget(displayNr, fullscreen);
    const explicitTarget = getExplicitTimerTarget(screens, requestedTarget);
    const target =
      explicitTarget ??
      (requestedTarget.needsAutoMove
        ? getAutomaticTimerTarget(timerWindow, screens, {
            mainWindowScreen,
            preferredIndex,
          })
        : null);

    if (!target) return;

    log('[moveTimerWindow] Target state:', 'timer', 'log', {
      targetDisplayNr: target.displayNr,
      targetFullscreen: target.fullscreen,
      targetScreen: screens[target.displayNr]?.bounds,
    });

    if (!isValidTimerTarget(target, screens)) {
      log(
        '[moveTimerWindow] Invalid display number:',
        'timer',
        'error',
        target.displayNr,
      );
      return;
    }

    const finalTarget = avoidMainScreenFullscreen(
      target,
      screens,
      mainWindowScreen,
    );
    const targetScreen = screens[finalTarget.displayNr];
    if (!targetScreen) {
      log('[moveTimerWindow] Target screen not found', 'timer', 'error');
      return;
    }

    log('[moveTimerWindow] Final target:', 'timer', 'log', {
      targetDisplayNr: finalTarget.displayNr,
      targetFullscreen: finalTarget.fullscreen,
      targetScreen: targetScreen.bounds,
    });

    await setTimerWindowPosition(finalTarget.displayNr, finalTarget.fullscreen);

    log('[moveTimerWindow] END - Changes applied', 'timer', 'log');
  } catch (e) {
    log('[moveTimerWindow] Error:', 'timer', 'error', e);
  }
};

interface TimerMoveRequest {
  displayNr?: number;
  fullscreen?: boolean;
  needsAutoMove: boolean;
}

interface TimerMoveTarget {
  displayNr: number;
  fullscreen: boolean;
}

const avoidMainScreenFullscreen = (
  target: TimerMoveTarget,
  screens: Display[],
  mainWindowScreen: number,
): TimerMoveTarget => {
  if (!target.fullscreen || target.displayNr !== mainWindowScreen) {
    return target;
  }

  if (screens.length <= 1) return target;

  log(
    '[moveTimerWindow] Preventing fullscreen on main window screen, switching to alternative',
    'timer',
    'log',
  );
  const alternativeScreen = screens.findIndex((s) => !s.mainWindow);
  if (alternativeScreen === -1) {
    log(
      '[moveTimerWindow] No alternative screen, going windowed',
      'timer',
      'log',
    );
    return { ...target, fullscreen: false };
  }

  log(
    '[moveTimerWindow] Switched to screen:',
    'timer',
    'log',
    alternativeScreen,
  );
  return { ...target, displayNr: alternativeScreen };
};

const findAlternativeTimerScreen = (
  screens: Display[],
  currentDisplayNr: number,
) => {
  const alternativeScreen = screens.findIndex(
    (s, index) => !s.mainWindow && index !== currentDisplayNr,
  );
  if (alternativeScreen !== -1) {
    log(
      '[moveTimerWindow] Moving fullscreen timer window to alternative screen:',
      'timer',
      'log',
      alternativeScreen,
    );
    return alternativeScreen;
  }

  const anyAlternativeScreen = screens.findIndex((s) => !s.mainWindow);
  if (anyAlternativeScreen !== -1) {
    log(
      '[moveTimerWindow] Moving fullscreen timer window to any alternative screen:',
      'timer',
      'log',
      anyAlternativeScreen,
    );
    return anyAlternativeScreen;
  }

  log(
    '[moveTimerWindow] No alternative screens available, keeping current position',
    'timer',
    'log',
  );
  return null;
};

const getAutomaticTimerTarget = (
  timerWindow: BrowserWindow,
  screens: Display[],
  options: {
    mainWindowScreen: number;
    preferredIndex: number;
  },
): null | TimerMoveTarget => {
  log(
    '[moveTimerWindow] No parameters provided - checking if timer window should move',
    'timer',
    'log',
  );

  const isCurrentlyFullscreen = timerWindow.isFullScreen();
  if (!isCurrentlyFullscreen) {
    log(
      '[moveTimerWindow] Timer window is windowed and no explicit target was provided; keeping current bounds',
      'timer',
      'log',
    );
    return null;
  }

  const currentBounds = timerWindow.getBounds();
  const currentDisplayNr = getWindowScreen(timerWindow);
  logCurrentTimerScreenState(screens, {
    currentBounds,
    currentDisplayNr,
    isCurrentlyFullscreen,
    mainWindowScreen: options.mainWindowScreen,
  });
  logPreferredTimerScreenUse(screens, options);

  if (currentDisplayNr === options.mainWindowScreen) {
    log(
      '[moveTimerWindow] Timer window is on main window screen, moving to alternative',
      'timer',
      'log',
    );
    const alternativeScreen = findAlternativeTimerScreen(
      screens,
      currentDisplayNr,
    );
    return alternativeScreen === null
      ? null
      : { displayNr: alternativeScreen, fullscreen: true };
  }

  log(
    '[moveTimerWindow] Timer window is already on different screen, checking if it should stay fullscreen',
    'timer',
    'log',
  );

  if (screens.length === 1) {
    log(
      '[moveTimerWindow] Only one screen available, setting fullscreen timer window to windowed',
      'timer',
      'log',
    );
    return { displayNr: 0, fullscreen: false };
  }

  log(
    '[moveTimerWindow] Multiple screens available, keeping current position',
    'timer',
    'log',
  );
  return null;
};

const getExplicitTimerTarget = (
  screens: Display[],
  request: TimerMoveRequest,
): null | TimerMoveTarget => {
  if (request.fullscreen === undefined) return null;

  const fullscreen = coerceTimerFullscreenMode(request.fullscreen, screens);
  const displayNr = getFullscreenTimerDisplayNr(
    request.displayNr,
    fullscreen,
    screens,
  );
  if (displayNr === undefined) return null;

  return { displayNr, fullscreen };
};

const getFullscreenTimerDisplayNr = (
  displayNr: number | undefined,
  fullscreen: boolean,
  screens: Display[],
) => {
  if (!fullscreen || screens.length < 3) return displayNr;

  const targetScreen = displayNr === undefined ? undefined : screens[displayNr];
  if (!targetScreen?.mainWindow && !targetScreen?.mediaWindow) {
    return displayNr;
  }

  const nonMainNonMediaScreen = screens.findIndex(
    (screen) => !screen.mainWindow && !screen.mediaWindow,
  );
  if (nonMainNonMediaScreen === -1) return displayNr;

  log(
    '[moveTimerWindow] Auto-selected non-main, non-media screen for fullscreen timer',
    'timer',
    'log',
    nonMainNonMediaScreen,
  );
  return nonMainNonMediaScreen;
};

const getPreferredTimerScreenIndex = async (screens: Display[]) => {
  const timerWindowPrefs = await loadWindowPrefs('timer');
  if (!timerWindowPrefs) {
    log(
      '[moveTimerWindow] No preferred display geometry found',
      'timer',
      'log',
    );
    return -1;
  }

  const preferredIndex = screens.findIndex((s) => {
    const b = s.bounds;
    return (
      b.x === timerWindowPrefs.x &&
      b.y === timerWindowPrefs.y &&
      b.width === timerWindowPrefs.width &&
      b.height === timerWindowPrefs.height
    );
  });
  if (preferredIndex === -1) {
    log('[moveTimerWindow] Preferred display index not found', 'timer', 'log');
  } else {
    log(
      '[moveTimerWindow] Preferred display index:',
      'timer',
      'log',
      preferredIndex,
    );
  }

  return preferredIndex;
};

const getRequestedTimerTarget = (
  displayNr?: number,
  fullscreen?: boolean,
): TimerMoveRequest => ({
  displayNr,
  fullscreen,
  needsAutoMove: displayNr === undefined || fullscreen === undefined,
});

const coerceTimerFullscreenMode = (fullscreen: boolean, screens: Display[]) => {
  if (!fullscreen || screens.length > 2) return fullscreen;

  log(
    '[moveTimerWindow] Forcing windowed mode because there are two or fewer screens',
    'timer',
    'log',
  );
  return false;
};

const isValidTimerTarget = (target: TimerMoveTarget, screens: Display[]) =>
  target.displayNr >= 0 && target.displayNr < screens.length;

const logCurrentTimerScreenState = (
  screens: Display[],
  state: {
    currentBounds: Electron.Rectangle;
    currentDisplayNr: number;
    isCurrentlyFullscreen: boolean;
    mainWindowScreen: number;
  },
) => {
  log('[moveTimerWindow] Current state:', 'timer', 'log', {
    currentBounds: state.currentBounds,
    currentDisplayNr: state.currentDisplayNr,
    currentScreen: screens[state.currentDisplayNr]?.bounds,
    isCurrentlyFullscreen: state.isCurrentlyFullscreen,
  });

  log('[moveTimerWindow] Screen analysis:', 'timer', 'log', {
    currentDisplayNr: state.currentDisplayNr,
    mainWindowScreen: state.mainWindowScreen,
    screens: screens.map((s, i) => ({
      index: i,
      mainWindow: s.mainWindow,
      timerWindow: s.timerWindow,
    })),
  });
};

const logPreferredTimerScreenUse = (
  screens: Display[],
  options: {
    mainWindowScreen: number;
    preferredIndex: number;
  },
) => {
  if (
    screens.length > 3 &&
    options.preferredIndex !== -1 &&
    options.preferredIndex !== options.mainWindowScreen &&
    !screens[options.preferredIndex]?.mediaWindow
  ) {
    log('[moveTimerWindow] Using preferred screen:', 'timer', 'log', {
      preferredIndex: options.preferredIndex,
    });
    return;
  }

  log(
    '[moveTimerWindow] Not using preferred screen (must be >3 displays and not main/media)',
    'timer',
    'log',
  );
};

// Calculates windowed bounds - timer window should be smaller than media
// window, positioned in the bottom-right corner of the target screen.
const getWindowedTimerBounds = (targetScreenBounds: Electron.Rectangle) => {
  const timerWidth = Math.min(400, Math.floor(targetScreenBounds.width * 0.3)); // 30% of screen width, max 400px
  const timerHeight = Math.min(
    200,
    Math.floor(targetScreenBounds.height * 0.2),
  ); // 20% of screen height, max 200px

  return {
    height: timerHeight,
    width: timerWidth,
    x: targetScreenBounds.x + targetScreenBounds.width - timerWidth - 20, // 20px margin
    y: targetScreenBounds.y + targetScreenBounds.height - timerHeight - 60, // 60px margin from bottom
  };
};

// BE-17 (full-audit-2026-09-05.md): mirrors window-media.ts's isMovingWindow
// mutex + event-driven wait for the fullscreen transition to actually
// complete before releasing the lock - without it, a second call arriving
// while a macOS fullscreen animation (300-500ms+) is still running could
// apply bounds/fullscreen mid-transition. Deliberately simplified relative
// to the media window's mechanism: no "preferred screen"/explicit-vs-
// automatic request priority, just last-request-wins queueing - enough to
// stop two overlapping transitions from corrupting each other, which is the
// actual bug class here; the media window's fuller mechanism exists for
// reasons (multi-screen preference, explicit user action winning over an
// automatic resync) that don't have an equivalent on this simpler window.
let isMovingTimerWindow = false;
let pendingTimerWindowPosition: null | {
  displayNr?: number;
  fullscreen: boolean;
} = null;
const TIMER_FULLSCREEN_TRANSITION_TIMEOUT_MS = 5000;

const setTimerWindowPosition = (
  displayNr?: number,
  fullscreen = false,
): Promise<void> => {
  return new Promise<void>((resolve) => {
    log('[setTimerWindowPosition] START - Called with:', 'timer', 'log', {
      displayNr,
      fullscreen,
      isMovingTimerWindow,
    });

    if (isMovingTimerWindow) {
      pendingTimerWindowPosition = { displayNr, fullscreen };
      log(
        '[setTimerWindowPosition] Already moving window, queueing latest request',
        'timer',
        'log',
      );
      resolve();
      return;
    }

    isMovingTimerWindow = true;
    let lockReleased = false;
    const releaseLock = () => {
      if (lockReleased) return;
      lockReleased = true;
      isMovingTimerWindow = false;
      resolve();

      const nextRequest = pendingTimerWindowPosition;
      pendingTimerWindowPosition = null;
      if (nextRequest) {
        void setTimerWindowPosition(
          nextRequest.displayNr,
          nextRequest.fullscreen,
        );
      }
    };

    try {
      if (!timerWindowInfo.timerWindow) {
        log(
          '[setTimerWindowPosition] No timerWindowInfo.timerWindow, returning',
          'timer',
          'error',
        );
        releaseLock();
        return;
      }

      const screens = getAllScreens();
      const targetDisplay = screens[displayNr ?? 0];
      if (!targetDisplay) {
        log(
          '[setTimerWindowPosition] Target display not found:',
          'timer',
          'error',
          displayNr,
        );
        releaseLock();
        return;
      }

      const targetScreenBounds = targetDisplay.bounds;
      log(
        '[setTimerWindowPosition] Target screen bounds:',
        'timer',
        'log',
        targetScreenBounds,
      );

      const showInactiveIfVisible = () => {
        if (timerWindowInfo.timerWindow?.isVisible()) {
          log(
            '[setTimerWindowPosition] Refreshing visible timer window without stealing focus',
            'timer',
            'log',
          );
          timerWindowInfo.timerWindow.showInactive();
        }
      };

      const applyFullscreenTimer = () => {
        if (!timerWindowInfo.timerWindow) {
          releaseLock();
          return;
        }

        log('[setTimerWindowPosition] Going fullscreen', 'timer', 'log');
        const normalizedBounds = normalizeWindowBounds(targetScreenBounds);
        if (!normalizedBounds) {
          log(
            '[setTimerWindowPosition] Unsafe target screen bounds, skipping fullscreen transition',
            'timer',
            'warn',
            targetScreenBounds,
          );
          releaseLock();
          return;
        }

        timerWindowInfo.timerWindow.setBounds(normalizedBounds);

        function enterFullScreenHandler() {
          clearTimeout(fallbackTimeout);
          log(
            '[setTimerWindowPosition] enter-full-screen received - transition complete',
            'timer',
            'log',
          );
          showInactiveIfVisible();
          releaseLock();
        }

        // Safety net: some window managers can silently ignore a fullscreen
        // request without destroying the window, in which case
        // enter-full-screen never fires and isMovingTimerWindow would
        // otherwise stay locked forever.
        const fallbackTimeout = setTimeout(() => {
          if (!timerWindowInfo.timerWindow) return;
          timerWindowInfo.timerWindow.removeListener(
            'enter-full-screen',
            enterFullScreenHandler,
          );
          log(
            '[setTimerWindowPosition] Timed out waiting for enter-full-screen - releasing lock',
            'timer',
            'warn',
          );
          releaseLock();
        }, TIMER_FULLSCREEN_TRANSITION_TIMEOUT_MS);

        timerWindowInfo.timerWindow.once(
          'enter-full-screen',
          enterFullScreenHandler,
        );
        timerWindowInfo.timerWindow.setFullScreen(true);
      };

      const applyWindowedTimer = () => {
        if (!timerWindowInfo.timerWindow) {
          releaseLock();
          return;
        }

        log('[setTimerWindowPosition] Going windowed', 'timer', 'log');
        const bounds = getWindowedTimerBounds(targetScreenBounds);
        log(
          '[setTimerWindowPosition] Calculated windowed bounds:',
          'timer',
          'log',
          { bounds },
        );

        const normalizedBounds = normalizeWindowBounds(bounds);
        if (!normalizedBounds) {
          log(
            '[setTimerWindowPosition] Unsafe windowed bounds, skipping setBounds',
            'timer',
            'warn',
            bounds,
          );
          releaseLock();
          return;
        }

        timerWindowInfo.timerWindow.setBounds(normalizedBounds);
        showInactiveIfVisible();
        releaseLock();
      };

      // Must exit any existing fullscreen before moving to a (potentially
      // different) screen and re-entering fullscreen, or applying windowed
      // bounds - setting bounds mid-fullscreen-transition is exactly the
      // race this fix closes.
      const leaveFullscreenTimer = (callback: () => void) => {
        if (!timerWindowInfo.timerWindow) {
          releaseLock();
          return;
        }

        if (!timerWindowInfo.timerWindow.isFullScreen()) {
          callback();
          return;
        }

        log(
          '[setTimerWindowPosition] Window is fullscreen - waiting for leave-full-screen before proceeding',
          'timer',
          'log',
        );

        function leaveFullScreenHandler() {
          clearTimeout(fallbackTimeout);
          if (!timerWindowInfo.timerWindow) {
            releaseLock();
            return;
          }
          callback();
        }

        // Safety net mirroring applyFullscreenTimer's: some window managers
        // can silently ignore a fullscreen-exit request without destroying
        // the window, in which case leave-full-screen never fires and
        // isMovingTimerWindow would otherwise stay locked forever.
        const fallbackTimeout = setTimeout(() => {
          if (!timerWindowInfo.timerWindow) return;
          timerWindowInfo.timerWindow.removeListener(
            'leave-full-screen',
            leaveFullScreenHandler,
          );
          log(
            '[setTimerWindowPosition] Timed out waiting for leave-full-screen - releasing lock',
            'timer',
            'warn',
          );
          releaseLock();
        }, TIMER_FULLSCREEN_TRANSITION_TIMEOUT_MS);

        timerWindowInfo.timerWindow.once(
          'leave-full-screen',
          leaveFullScreenHandler,
        );
        timerWindowInfo.timerWindow.setFullScreen(false);
      };

      if (fullscreen) {
        leaveFullscreenTimer(applyFullscreenTimer);
      } else {
        leaveFullscreenTimer(applyWindowedTimer);
      }
    } catch (err) {
      releaseLock();
      captureElectronError(err, {
        contexts: { fn: { name: 'setTimerWindowPosition' } },
      });
      log('[setTimerWindowPosition] Error:', 'timer', 'error', err);
    }
  });
};

export const __testables = {
  getWindowedTimerBounds,
};
