import { type BrowserWindow, screen } from 'electron';
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
  sendToWindow,
} from 'src-electron/main/window/window-base';
import { normalizeWindowBounds } from 'src-electron/main/window/window-bounds';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import { log, throttleWithTrailing } from 'src/shared/vanilla';

export const mediaWindowInfo = {
  mediaWindow: null as BrowserWindow | null,
};

// =============================================================================
// HELPER TYPES
// =============================================================================

interface MediaWindowState {
  alwaysOnTop: boolean;
  isCurrentlyFullscreen: boolean;
  shouldBeMaximizable: boolean;
}

interface TargetDisplayInfo {
  targetDisplayNr: number;
  targetFullscreen: boolean;
}

interface WindowBoundsInfo {
  currentBounds: Electron.Rectangle;
  currentDisplayNr: number;
  isEffectivelyFullscreen: boolean;
  screenBounds: Electron.Rectangle | undefined;
}

const isFullscreenOrMaximized = (
  boundsInfo: WindowBoundsInfo,
  mediaWindow: BrowserWindow,
) => {
  // If there's no bounds info or media window, return false
  if (!(boundsInfo || mediaWindow)) return false;

  // Return true if the media window is fullscreen or maximized
  return (
    boundsInfo.isEffectivelyFullscreen ||
    mediaWindow.isFullScreen() ||
    mediaWindow.isMaximized()
  );
};

/**
 * Calculates target display info for automatic positioning
 */
async function calculateAutoTarget(
  boundsInfo: WindowBoundsInfo,
  mediaWindow: BrowserWindow,
  screens: ReturnType<typeof getAllScreens>,
): Promise<null | TargetDisplayInfo> {
  const mainWindowScreen = screens.findIndex((s) => s.mainWindow);
  const preferredIndex = await getPreferredScreenFromPrefs(screens);

  // 1. Preferred Screen Strategy
  // Use preferred screen if applicable (and we have >= 3 screens)
  if (
    screens.length >= 3 &&
    preferredIndex !== -1 &&
    preferredIndex !== mainWindowScreen
  ) {
    // Idempotency: already fullscreen on preferred screen → nothing to do
    if (
      boundsInfo.currentDisplayNr === preferredIndex &&
      (boundsInfo.isEffectivelyFullscreen || mediaWindow.isFullScreen())
    ) {
      log(
        '[calculateAutoTarget] Already fullscreen on preferred screen, skipping',
        'electronWindow',
        'debug',
        { preferredIndex },
      );
      return null;
    }

    log(
      '[calculateAutoTarget] Using preferred screen strategy',
      'electronWindow',
      'debug',
      { preferredIndex },
    );
    return {
      targetDisplayNr: preferredIndex,
      targetFullscreen: true,
    };
  }

  // 2. Windowed -> Fullscreen Strategy
  // Check if windowed and should move to fullscreen
  const windowedCheck = shouldMoveWindowedToFullscreen(
    boundsInfo,
    mediaWindow,
    screens,
  );
  if (windowedCheck.shouldMove && windowedCheck.targetDisplayNr !== undefined) {
    log(
      '[calculateAutoTarget] Using windowed->fullscreen strategy',
      'electronWindow',
      'debug',
      { targetDisplayNr: windowedCheck.targetDisplayNr },
    );
    return {
      targetDisplayNr: windowedCheck.targetDisplayNr,
      targetFullscreen: true,
    };
  }

  // 3. Main Screen Escape Strategy
  // Check if on main screen and needs to move
  const mainScreenTarget = getTargetWhenOnMainScreen(
    screens,
    boundsInfo.currentDisplayNr,
    mainWindowScreen,
  );

  if (mainScreenTarget) {
    log(
      '[calculateAutoTarget] Using main-screen-escape strategy',
      'electronWindow',
      'debug',
      { mainScreenTarget },
    );
    return mainScreenTarget;
  }

  // 4. Single Screen Formatting

  // Handle single screen with fullscreen window
  if (
    screens.length === 1 &&
    isFullscreenOrMaximized(boundsInfo, mediaWindow)
  ) {
    log(
      '[calculateAutoTarget] Single screen + fullscreen: going windowed',
      'electronWindow',
      'debug',
    );
    return {
      targetDisplayNr: 0,
      targetFullscreen: false,
    };
  }

  log('[calculateAutoTarget] No target determined', 'electronWindow', 'debug');
  return null;
}

// =============================================================================
// HELPER FUNCTIONS - Window State Detection
// =============================================================================

/**
 * Checks and notifies if screen configuration changed
 */
function checkAndNotifyScreenChange(
  screens: ReturnType<typeof getAllScreens>,
  lastScreensConfig: { value: string },
): boolean {
  const screensConfig = JSON.stringify(screens.map((s) => s.bounds));

  if (screensConfig !== lastScreensConfig.value) {
    notifyMainWindowAboutScreenOrWindowChange();
    lastScreensConfig.value = screensConfig;
    return true;
  }

  return false;
}

/**
 * Finds an alternative screen that doesn't contain the main window
 */
function findAlternativeScreen(
  screens: ReturnType<typeof getAllScreens>,
  currentDisplayNr: number,
): number {
  // Try to find a screen without main window, different from current
  const alternativeScreen = screens.findIndex(
    (s, index) => !s.mainWindow && index !== currentDisplayNr,
  );

  if (alternativeScreen !== -1) return alternativeScreen;

  // Fallback: any screen without main window
  return screens.findIndex((s) => !s.mainWindow);
}

/**
 * Determines the state properties for the media window
 */
function getMediaWindowState(
  boundsInfo: WindowBoundsInfo,
  isCurrentlyFullscreen: boolean,
  screens: ReturnType<typeof getAllScreens>,
): MediaWindowState {
  const shouldBeMaximizable = screens.length > 1;
  // NOTE: alwaysOnTop is intentionally kept platform-agnostic here.
  // On macOS, alwaysOnTop with 'screen-saver' level can interfere with
  // the native fullscreen animation if issues arise, this is a candidate
  // to gate behind PLATFORM !== 'darwin'.
  const alwaysOnTop = !!(
    boundsInfo.isEffectivelyFullscreen || isCurrentlyFullscreen
  );

  return {
    alwaysOnTop,
    isCurrentlyFullscreen,
    shouldBeMaximizable,
  };
}

// =============================================================================
// HELPER FUNCTIONS - Screen Selection
// =============================================================================

/**
 * Gets the preferred screen from saved preferences
 */
async function getPreferredScreenFromPrefs(
  screens: ReturnType<typeof getAllScreens>,
): Promise<number> {
  if (screens.length <= 1) return -1;

  const mediaWindowPrefs = await loadWindowPrefs('media');
  if (!mediaWindowPrefs) return -1;

  const preferredScreen = screen.getDisplayMatching({
    height: mediaWindowPrefs.height,
    width: mediaWindowPrefs.width,
    x: mediaWindowPrefs.x || 0,
    y: mediaWindowPrefs.y || 0,
  });

  const preferredIndex = screens.findIndex((s) => s.id === preferredScreen?.id);
  return preferredIndex;
}

/**
 * Determines the target display when window needs to move from main window screen
 */
function getTargetWhenOnMainScreen(
  screens: ReturnType<typeof getAllScreens>,
  currentDisplayNr: number,
  mainWindowScreen: number,
): null | TargetDisplayInfo {
  if (currentDisplayNr !== mainWindowScreen) {
    return null;
  }

  const alternativeScreen = findAlternativeScreen(screens, currentDisplayNr);

  if (alternativeScreen === -1) {
    if (screens.length === 1) {
      return {
        targetDisplayNr: 0,
        targetFullscreen: false,
      };
    }
    return null;
  }

  // Idempotency: already on the alternative screen (not on main) → nothing to do
  // Note: currentDisplayNr === mainWindowScreen is guaranteed here, so if
  // alternativeScreen !== mainWindowScreen this check is always false —
  // but it makes the intent explicit and guards against future refactors.
  if (currentDisplayNr === alternativeScreen) {
    return null;
  }

  return {
    targetDisplayNr: alternativeScreen,
    targetFullscreen: true,
  };
}

/**
 * Gets comprehensive information about the current window bounds
 */
function getWindowBoundsInfo(
  mediaWindow: BrowserWindow,
  screens: ReturnType<typeof getAllScreens>,
): WindowBoundsInfo {
  const currentBounds = mediaWindow.getBounds();
  const currentDisplayNr = getWindowScreen(mediaWindow);
  const currentScreen = screens[currentDisplayNr];
  const screenBounds = currentScreen?.bounds;
  const isEffectivelyFullscreen = isWindowEffectivelyFullscreen(
    currentBounds,
    screenBounds,
  );

  return {
    currentBounds,
    currentDisplayNr,
    isEffectivelyFullscreen,
    screenBounds,
  };
}

/**
 * Checks if the window is effectively fullscreen by comparing bounds
 */
function isWindowEffectivelyFullscreen(
  windowBounds: Electron.Rectangle,
  screenBounds: Electron.Rectangle | undefined,
): boolean {
  if (!screenBounds) return false;
  return (
    windowBounds.width >= screenBounds.width - 10 &&
    windowBounds.height >= screenBounds.height - 10
  );
}

function shouldKeepWindowedWithoutExplicitTarget(
  displayNr: number | undefined,
  fullscreen: boolean | undefined,
  isEffectivelyFullscreen: boolean,
  initialPositioningComplete: boolean,
  screenConfigChanged: boolean,
): boolean {
  const hasExplicitTarget = displayNr !== undefined && fullscreen !== undefined;
  return (
    !hasExplicitTarget &&
    !isEffectivelyFullscreen &&
    initialPositioningComplete &&
    !screenConfigChanged
  );
}

/**
 * Determines if the window should move to fullscreen on another display
 */
function shouldMoveWindowedToFullscreen(
  boundsInfo: WindowBoundsInfo,
  mediaWindow: BrowserWindow,
  screens: ReturnType<typeof getAllScreens>,
): { shouldMove: boolean; targetDisplayNr?: number } {
  // If the media window is already fullscreen or maximized, don't move it
  if (isFullscreenOrMaximized(boundsInfo, mediaWindow)) {
    return { shouldMove: false };
  }

  // If there's only one screen, don't move the media window
  if (screens.length <= 1) {
    return { shouldMove: false };
  }

  // Find an alternative screen that doesn't contain the main window
  const alternativeScreen = findAlternativeScreen(
    screens,
    boundsInfo.currentDisplayNr,
  );

  // If there's no alternative screen, don't move the media window
  if (alternativeScreen === -1) {
    return { shouldMove: false };
  }

  // Idempotency: if the media window is already fullscreen on the alternative screen, don't move it
  if (
    boundsInfo.currentDisplayNr === alternativeScreen &&
    (boundsInfo.isEffectivelyFullscreen || mediaWindow.isFullScreen())
  ) {
    return { shouldMove: false };
  }

  // Move the media window to fullscreen on the alternative screen
  return { shouldMove: true, targetDisplayNr: alternativeScreen };
}

// =============================================================================
// HELPER FUNCTIONS - Window State Management
// =============================================================================

/**
 * Updates window properties based on state
 */
function updateWindowProperties(
  mediaWindow: BrowserWindow,
  currentState: MediaWindowState,
  lastState: { alwaysOnTop?: boolean; maximizable?: boolean },
): void {
  if (lastState.maximizable !== currentState.shouldBeMaximizable) {
    mediaWindow.setMaximizable(currentState.shouldBeMaximizable);
    lastState.maximizable = currentState.shouldBeMaximizable;
  }

  if (lastState.alwaysOnTop !== currentState.alwaysOnTop) {
    mediaWindow.setAlwaysOnTop(
      currentState.alwaysOnTop,
      currentState.alwaysOnTop ? 'screen-saver' : undefined,
    );
    lastState.alwaysOnTop = currentState.alwaysOnTop;
  }
}

/**
 * Validates and adjusts target display to prevent conflicts
 */
function validateAndAdjustTarget(
  target: TargetDisplayInfo,
  screens: ReturnType<typeof getAllScreens>,
): TargetDisplayInfo {
  const mainWindowScreen = screens.findIndex((s) => s.mainWindow);

  // Prevent fullscreen on same monitor as main window
  if (
    target.targetFullscreen &&
    target.targetDisplayNr === mainWindowScreen &&
    screens.length > 1
  ) {
    const alternativeScreen = screens.findIndex((s) => !s.mainWindow);
    if (alternativeScreen === -1) {
      log(
        '[validateAndAdjustTarget] No alternative screen found, going windowed on main screen',
        'electronWindow',
        'debug',
      );
      return { ...target, targetFullscreen: false };
    }
    log(
      '[validateAndAdjustTarget] Redirected away from main window screen',
      'electronWindow',
      'debug',
      { from: target.targetDisplayNr, to: alternativeScreen },
    );
    return {
      targetDisplayNr: alternativeScreen,
      targetFullscreen: true,
    };
  }

  return target;
}

export const __testables = {
  calculateAutoTarget,
  findAlternativeScreen,
  getMediaWindowState,
  getPreferredScreenFromPrefs,
  getTargetWhenOnMainScreen,
  isWindowEffectivelyFullscreen,
  normalizeWindowBounds,
  shouldKeepWindowedWithoutExplicitTarget,
  shouldMoveWindowedToFullscreen,
  validateAndAdjustTarget,
};

// =============================================================================
// MAIN FUNCTION
// =============================================================================

let lastAlwaysOnTop: boolean | undefined;
let lastMaximizable: boolean | undefined;
let lastScreensConfig = '';
let hasInitialPositioningHappened = false;

export const moveMediaWindow = async (
  displayNr?: number,
  fullscreen?: boolean,
) => {
  try {
    // Early exit validation
    if (!mediaWindowInfo.mediaWindow || !mainWindowInfo.mainWindow) {
      log(
        '[moveMediaWindow] No mediaWindow or mainWindow, returning',
        'electronWindow',
        'log',
      );
      return;
    }

    const screens = getAllScreens();
    const lastScreensConfigRef = { value: lastScreensConfig };
    const screenConfigChanged = checkAndNotifyScreenChange(
      screens,
      lastScreensConfigRef,
    );
    lastScreensConfig = lastScreensConfigRef.value;

    // Get current window state
    const boundsInfo = getWindowBoundsInfo(
      mediaWindowInfo.mediaWindow,
      screens,
    );
    const isCurrentlyFullscreen = boundsInfo.isEffectivelyFullscreen;

    // Update window properties
    const windowState = getMediaWindowState(
      boundsInfo,
      isCurrentlyFullscreen,
      screens,
    );
    const lastStateRef = {
      alwaysOnTop: lastAlwaysOnTop,
      maximizable: lastMaximizable,
    };
    updateWindowProperties(
      mediaWindowInfo.mediaWindow,
      windowState,
      lastStateRef,
    );

    if (screens.length === 1 && hasInitialPositioningHappened) {
      return; // Already positioned on single screen
    }

    log('[moveMediaWindow] Called', 'electronWindow', 'log', {
      displayNr,
      fullscreen,
      isEffectivelyFullscreen: boundsInfo.isEffectivelyFullscreen,
      isMovingWindow,
      screenCount: screens.length,
    });

    lastAlwaysOnTop = lastStateRef.alwaysOnTop;
    lastMaximizable = lastStateRef.maximizable;

    // Determine target display and mode
    let targetInfo: null | TargetDisplayInfo = null;
    const hasExplicitTarget =
      displayNr !== undefined && fullscreen !== undefined;

    // Keep user-defined windowed size/position when no explicit move request was made.
    // This prevents unrelated window sync events (e.g. starting a new media item)
    // from forcing a manually windowed media window back to fullscreen.
    if (
      shouldKeepWindowedWithoutExplicitTarget(
        displayNr,
        fullscreen,
        boundsInfo.isEffectivelyFullscreen,
        hasInitialPositioningHappened,
        screenConfigChanged,
      )
    ) {
      log(
        '[moveMediaWindow] Media window is windowed and no explicit target was provided; keeping current bounds',
        'electronWindow',
        'log',
      );
      return;
    }

    if (hasExplicitTarget) {
      // Explicit parameters provided
      targetInfo = { targetDisplayNr: displayNr, targetFullscreen: fullscreen };
    } else {
      // Calculate automatic target
      targetInfo = await calculateAutoTarget(
        boundsInfo,
        mediaWindowInfo.mediaWindow,
        screens,
      );
    }

    // Exit if no target determined
    if (!targetInfo) {
      log(
        '[moveMediaWindow] No target determined, keeping current position',
        'electronWindow',
        'log',
      );
      return;
    }

    // Validate target display
    if (
      targetInfo.targetDisplayNr < 0 ||
      targetInfo.targetDisplayNr >= screens.length
    ) {
      log(
        '[moveMediaWindow] Invalid display number:',
        'electronWindow',
        'log',
        targetInfo.targetDisplayNr,
      );
      return;
    }

    // Validate and adjust target to prevent conflicts
    targetInfo = validateAndAdjustTarget(targetInfo, screens);

    log('[moveMediaWindow] Resolved target', 'electronWindow', 'debug', {
      targetDisplayNr: targetInfo.targetDisplayNr,
      targetFullscreen: targetInfo.targetFullscreen,
    });

    // Apply the changes
    setWindowPosition(targetInfo.targetDisplayNr, targetInfo.targetFullscreen);
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { name: 'moveMediaWindow' } },
    });
  } finally {
    notifyMainWindowAboutScreenOrWindowChange();
  }
};

export const moveMediaWindowThrottled = throttleWithTrailing(
  () => moveMediaWindow(),
  WINDOW_MOVE_THROTTLE_MS,
);

// =============================================================================
// WINDOW CREATION & ANIMATION
// =============================================================================

/**
 * Creates the media window
 */
export function createMediaWindow() {
  // If the window is already open, just focus it
  if (
    mediaWindowInfo.mediaWindow &&
    !mediaWindowInfo.mediaWindow.isDestroyed()
  ) {
    focusMediaWindow();
    return;
  }

  // Create the browser window
  mediaWindowInfo.mediaWindow = createWindow('media', {
    alwaysOnTop: false, // Not always on top by default
    backgroundColor: 'black',
    frame: false,
    height: HD_RESOLUTION[1],
    icon: getIconPath('media-player'),
    maximizable: false, // Not maximizable by default
    minHeight: 110,
    minWidth: 195,
    opacity: 1,
    roundedCorners: PLATFORM === 'darwin',
    thickFrame: false,
    title: 'Media Player - M³',
    width: HD_RESOLUTION[0],
  });

  // Force aspect ratio
  mediaWindowInfo.mediaWindow.setAspectRatio(16 / 9);

  mediaWindowInfo.mediaWindow.on('enter-full-screen', () => {
    log('[mediaWindow event] enter-full-screen', 'electronWindow', 'debug', {
      bounds: mediaWindowInfo.mediaWindow?.getBounds(),
      isMovingWindow,
      platform: PLATFORM,
    });
  });

  mediaWindowInfo.mediaWindow.on('leave-full-screen', () => {
    log('[mediaWindow event] leave-full-screen', 'electronWindow', 'debug', {
      bounds: mediaWindowInfo.mediaWindow?.getBounds(),
      isMovingWindow,
      platform: PLATFORM,
    });
  });

  // Check if only one screen is available and set to windowed mode with HD resolution
  const screens = getAllScreens();
  if (screens.length === 1 && screens[0]) {
    log(
      '[createMediaWindow] Only one screen available, checking if window needs repositioning',
      'electronWindow',
      'log',
    );

    // Get current window bounds
    const currentBounds = mediaWindowInfo.mediaWindow.getBounds();
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

    // Only reposition if window is not already properly positioned
    if (!isWithinScreenBounds || !isSmallerThanScreen) {
      log(
        '[createMediaWindow] Window needs repositioning, setting to windowed mode with HD resolution',
        'electronWindow',
        'log',
      );

      // Set windowed bounds to HD resolution
      const maxWidth = screenBounds.width * 0.5; // 50% of screen width
      const maxHeight = screenBounds.height * 0.5; // 50% of screen height

      // Calculate scale to fit HD resolution within screen bounds
      const scaleX = maxWidth / HD_RESOLUTION[0];
      const scaleY = maxHeight / HD_RESOLUTION[1];

      // Don't scale up, only down
      const scale = Math.min(scaleX, scaleY, 1);

      const windowedWidth = Math.floor(HD_RESOLUTION[0] * scale);
      const windowedHeight = Math.floor(HD_RESOLUTION[1] * scale);

      // Center the window on the screen
      const x =
        screenBounds.x + Math.floor((screenBounds.width - windowedWidth) / 2);
      const y =
        screenBounds.y + Math.floor((screenBounds.height - windowedHeight) / 2);

      const applyWindowedBounds = () => {
        // Check if window is still valid
        if (
          !mediaWindowInfo.mediaWindow ||
          mediaWindowInfo.mediaWindow.isDestroyed()
        ) {
          isMovingWindow = false;
          return;
        }

        log(
          '[createMediaWindow] Applying windowed bounds',
          'electronWindow',
          'debug',
          { height: windowedHeight, width: windowedWidth, x, y },
        );

        mediaWindowInfo.mediaWindow.setBounds({
          height: windowedHeight,
          width: windowedWidth,
          x,
          y,
        });
        isMovingWindow = false;
      };

      isMovingWindow = true;

      // On all platforms, if fullscreen, wait for leave-full-screen before
      // applying bounds fullscreen exit is async on macOS and the event
      // is emitted on all platforms, so this is safe everywhere.
      if (mediaWindowInfo.mediaWindow.isFullScreen()) {
        log(
          '[createMediaWindow] Window is fullscreen, waiting for leave-full-screen before repositioning',
          'electronWindow',
          'debug',
        );
        mediaWindowInfo.mediaWindow.once(
          'leave-full-screen',
          applyWindowedBounds,
        );
        mediaWindowInfo.mediaWindow.setFullScreen(false);
      } else {
        applyWindowedBounds();
      }
    } else {
      log(
        '[createMediaWindow] Window already properly positioned, keeping current bounds',
        'electronWindow',
        'log',
      );
    }
  }

  mediaWindowInfo.mediaWindow.on('closed', () => {
    isMovingWindow = false;
    mediaWindowInfo.mediaWindow = null;
  });

  hasInitialPositioningHappened = true;
}

/**
 * Fade the media window in or out with opacity transition
 * @param direction Fade direction ('in' or 'out')
 * @param duration Transition duration in milliseconds (default: 300ms)
 */
export function fadeMediaWindow(direction: 'in' | 'out', duration = 300): void {
  const win = mediaWindowInfo.mediaWindow;

  if (!win || win.isDestroyed()) return;

  const targetOpacity = direction === 'in' ? 1 : 0;

  try {
    const startOpacity = Math.max(0, win.getOpacity());

    if (isMediaWindowAtFadeTarget(win, direction, startOpacity)) {
      completeMediaWindowFade(win, direction, targetOpacity);
      return;
    }

    if (direction === 'in') {
      win.setOpacity(startOpacity);
      focusMediaWindow();
    }

    const opacityRange = Math.abs(targetOpacity - startOpacity);

    const steps = Math.max(10, Math.floor(duration / 30));
    const stepDuration = duration / steps;
    const opacityStep = opacityRange / steps;

    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;

      const newOpacity =
        direction === 'in'
          ? Math.min(startOpacity + currentStep * opacityStep, 1)
          : Math.max(startOpacity - currentStep * opacityStep, 0);

      try {
        if (!win || win.isDestroyed()) {
          clearInterval(fadeInterval);
          clearTimeout(fallbackTimeout);
          return;
        }

        win.setOpacity(newOpacity);

        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          clearTimeout(fallbackTimeout);
          completeMediaWindowFade(win, direction, targetOpacity);
        }
      } catch {
        clearInterval(fadeInterval);
        clearTimeout(fallbackTimeout);
        completeMediaWindowFade(win, direction, targetOpacity);
      }
    }, stepDuration);

    const fallbackTimeout = setTimeout(() => {
      clearInterval(fadeInterval);
      completeMediaWindowFade(win, direction, targetOpacity);
    }, duration + WINDOW_MOVE_THROTTLE_MS);
  } catch {
    completeMediaWindowFade(win, direction, targetOpacity);
  }
}

const completeMediaWindowFade = (
  win: BrowserWindow | null,
  direction: 'in' | 'out',
  targetOpacity: number,
) => {
  if (!win || win.isDestroyed()) return;

  win.setOpacity(targetOpacity);
  if (direction === 'in') {
    focusMediaWindow();
    return;
  }

  win.hide();
};

const isMediaWindowAtFadeTarget = (
  win: BrowserWindow,
  direction: 'in' | 'out',
  startOpacity: number,
) =>
  (direction === 'in' && win.isVisible() && startOpacity >= 0.99) ||
  (direction === 'out' && startOpacity <= 0.01);

const notifyMainWindowAboutScreenOrWindowChange = throttleWithTrailing(() => {
  sendToWindow(mainWindowInfo.mainWindow, 'screenChange');
}, 250);

// =============================================================================
// WINDOW POSITIONING
// =============================================================================

/**
 * Whether a window move/fullscreen transition is currently in progress.
 *
 * LOCKING RULES — this flag must be treated like a mutex:
 *   - Set to `true` as the very first thing inside `setWindowPosition`, before
 *     any async work begins.
 *   - Released (`false`) ONLY inside a terminal callback:
 *       • `enter-full-screen` handler  (fullscreen target)
 *       • after `setBounds` returns    (windowed target, via leaveFullscreen callback
 *         or directly when already windowed)
 *       • any error / early-exit path
 *   - NEVER released mid-transition to "hand off" to a callback — that created
 *     the race condition where a second `moveMediaWindow` call could start while
 *     a macOS fullscreen animation was still running.
 */
let isMovingWindow = false;

const setWindowPosition = (displayNr?: number, fullscreen = true) => {
  log('[setWindowPosition] Requested', 'electronWindow', 'debug', {
    displayNr,
    fullscreen,
    isMovingWindow,
    platform: PLATFORM,
  });

  // Guard: if a transition is already in flight, drop this request.
  // moveMediaWindowThrottled will re-fire once the throttle window passes,
  // and by then isMovingWindow will have been cleared by the terminal callback.
  if (isMovingWindow) {
    log(
      '[setWindowPosition] Already moving window, skipping',
      'electronWindow',
      'log',
    );
    return;
  }

  // Acquire the lock immediately, before any async work.
  isMovingWindow = true;

  try {
    if (
      !mediaWindowInfo.mediaWindow ||
      mediaWindowInfo.mediaWindow.isDestroyed()
    ) {
      log(
        '[setWindowPosition] No mediaWindow, returning',
        'electronWindow',
        'log',
      );
      isMovingWindow = false;
      return;
    }

    const screens = getAllScreens();
    const targetDisplay = screens[displayNr ?? 0];
    if (!targetDisplay) {
      log(
        '[setWindowPosition] Target display not found:',
        'electronWindow',
        'log',
        displayNr,
      );
      isMovingWindow = false;
      return;
    }

    const targetScreenBounds = targetDisplay.bounds;

    // -------------------------------------------------------------------------
    // applyFullscreen
    //
    // Moves the window to the target screen's bounds then enters fullscreen.
    // Must only be called when the window is already in a windowed state
    // (i.e. after leaveFullscreen has settled, or if it was never fullscreen).
    //
    // On all platforms, fullscreen entry is treated as async: we wait for
    // enter-full-screen before releasing isMovingWindow, so any subsequent
    // moveMediaWindow call that arrives while the animation runs is dropped
    // by the guard above and will retry on the next throttle tick.
    // -------------------------------------------------------------------------
    const applyFullscreen = () => {
      if (
        !mediaWindowInfo.mediaWindow ||
        mediaWindowInfo.mediaWindow.isDestroyed()
      ) {
        log(
          '[applyFullscreen] Window gone before fullscreen could be applied',
          'electronWindow',
          'debug',
        );
        isMovingWindow = false;
        return;
      }

      const normalizedBounds = normalizeWindowBounds(targetScreenBounds);
      if (!normalizedBounds) {
        log(
          '[applyFullscreen] Unsafe target screen bounds, skipping fullscreen transition',
          'electronWindow',
          'warn',
          targetScreenBounds,
        );
        isMovingWindow = false;
        return;
      }

      log(
        '[applyFullscreen] Moving to target screen bounds before entering fullscreen',
        'electronWindow',
        'debug',
        normalizedBounds,
      );
      mediaWindowInfo.mediaWindow.setBounds(normalizedBounds);

      // Wait for the fullscreen animation to complete on ALL platforms.
      // On Windows the event fires synchronously (effectively), on macOS it is
      // genuinely async — using the event means we're safe on both.
      mediaWindowInfo.mediaWindow.once('enter-full-screen', () => {
        log(
          '[applyFullscreen] enter-full-screen received — transition complete',
          'electronWindow',
          'debug',
          { bounds: mediaWindowInfo.mediaWindow?.getBounds() },
        );
        isMovingWindow = false;
        focusMediaWindow();
      });

      log(
        '[applyFullscreen] Calling setFullScreen(true)',
        'electronWindow',
        'debug',
      );
      mediaWindowInfo.mediaWindow.setFullScreen(true);
    };

    // -------------------------------------------------------------------------
    // applyWindowed
    //
    // Applies a calculated windowed rect to the target screen.
    // Must only be called when the window is already in a windowed state
    // (i.e. after leaveFullscreen has settled, or if it was never fullscreen).
    // -------------------------------------------------------------------------
    const applyWindowed = () => {
      if (
        !mediaWindowInfo.mediaWindow ||
        mediaWindowInfo.mediaWindow.isDestroyed()
      ) {
        log(
          '[applyWindowed] Window gone before windowed bounds could be applied',
          'electronWindow',
          'debug',
        );
        isMovingWindow = false;
        return;
      }

      const safeWindowSizeBuffer = 100;
      const safeAvailableWidth = Math.max(
        1,
        targetScreenBounds.width - safeWindowSizeBuffer,
      );
      const safeAvailableHeight = Math.max(
        1,
        targetScreenBounds.height - safeWindowSizeBuffer,
      );
      const maxWidth = Math.min(safeAvailableWidth, HD_RESOLUTION[0]);
      const maxHeight = Math.min(safeAvailableHeight, HD_RESOLUTION[1]);

      const scaleX = maxWidth / HD_RESOLUTION[0];
      const scaleY = maxHeight / HD_RESOLUTION[1];
      const scale = Math.min(scaleX, scaleY, 1);

      const width = Math.floor(HD_RESOLUTION[0] * scale);
      const height = Math.floor(HD_RESOLUTION[1] * scale);
      const newBounds = {
        height,
        width,
        x:
          targetScreenBounds.x +
          Math.floor((targetScreenBounds.width - width) / 2),
        y:
          targetScreenBounds.y +
          Math.floor((targetScreenBounds.height - height) / 2),
      };

      const normalizedBounds = normalizeWindowBounds(newBounds);
      if (!normalizedBounds) {
        log(
          '[applyWindowed] Invalid bounds, skipping setBounds',
          'electronWindow',
          'log',
          newBounds,
        );
        isMovingWindow = false;
        return;
      }

      const currentBounds = mediaWindowInfo.mediaWindow.getBounds();
      const boundsChanged =
        currentBounds.x !== normalizedBounds.x ||
        currentBounds.y !== normalizedBounds.y ||
        currentBounds.width !== normalizedBounds.width ||
        currentBounds.height !== normalizedBounds.height;

      if (boundsChanged) {
        log(
          '[applyWindowed] Applying windowed bounds',
          'electronWindow',
          'debug',
          normalizedBounds,
        );
        mediaWindowInfo.mediaWindow.setBounds(normalizedBounds);
      } else {
        log(
          '[applyWindowed] Bounds unchanged, skipping setBounds',
          'electronWindow',
          'debug',
        );
      }

      focusMediaWindow();
      isMovingWindow = false;
    };

    // -------------------------------------------------------------------------
    // leaveFullscreen
    //
    // Exits fullscreen (if currently fullscreen) then calls `callback` once the
    // window has fully left fullscreen. On all platforms we use the
    // leave-full-screen event so we never apply bounds mid-animation.
    //
    // If the window is already windowed, `callback` is invoked synchronously.
    // -------------------------------------------------------------------------
    const leaveFullscreen = (callback: () => void) => {
      if (
        !mediaWindowInfo.mediaWindow ||
        mediaWindowInfo.mediaWindow.isDestroyed()
      ) {
        log('[leaveFullscreen] No mediaWindow', 'electronWindow', 'debug');
        isMovingWindow = false;
        return;
      }

      const currentlyFullscreen =
        mediaWindowInfo.mediaWindow.isFullScreen() ||
        isWindowEffectivelyFullscreen(
          mediaWindowInfo.mediaWindow.getBounds(),
          screens[getWindowScreen(mediaWindowInfo.mediaWindow)]?.bounds,
        );

      if (currentlyFullscreen) {
        log(
          '[leaveFullscreen] Window is fullscreen — waiting for leave-full-screen before proceeding',
          'electronWindow',
          'debug',
          {
            isEffectivelyFullscreen: isWindowEffectivelyFullscreen(
              mediaWindowInfo.mediaWindow.getBounds(),
              screens[getWindowScreen(mediaWindowInfo.mediaWindow)]?.bounds,
            ),
            isFullScreen: mediaWindowInfo.mediaWindow.isFullScreen(),
          },
        );

        // NOTE: isMovingWindow stays true through this async gap.
        // Any concurrent moveMediaWindow call will be dropped by the guard.
        mediaWindowInfo.mediaWindow.once('leave-full-screen', () => {
          if (
            !mediaWindowInfo.mediaWindow ||
            mediaWindowInfo.mediaWindow.isDestroyed()
          ) {
            log(
              '[leaveFullscreen] Window destroyed during leave-full-screen transition',
              'electronWindow',
              'debug',
            );
            isMovingWindow = false;
            return;
          }

          log(
            '[leaveFullscreen] leave-full-screen received — proceeding with callback',
            'electronWindow',
            'debug',
            { bounds: mediaWindowInfo.mediaWindow.getBounds() },
          );
          callback();
        });

        log(
          '[leaveFullscreen] Calling setFullScreen(false)',
          'electronWindow',
          'debug',
        );
        mediaWindowInfo.mediaWindow.setFullScreen(false);
      } else {
        log(
          '[leaveFullscreen] Window already windowed — invoking callback directly',
          'electronWindow',
          'debug',
        );
        callback();
      }
    };

    // -------------------------------------------------------------------------
    // Dispatch: route to the right transition path
    // -------------------------------------------------------------------------
    if (fullscreen) {
      // Must exit any existing fullscreen before moving to a (potentially
      // different) screen and re-entering fullscreen.
      leaveFullscreen(applyFullscreen);
    } else {
      leaveFullscreen(applyWindowed);
    }
  } catch (err) {
    isMovingWindow = false;
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
    if (
      !mediaWindowInfo.mediaWindow ||
      mediaWindowInfo.mediaWindow.isDestroyed()
    ) {
      log(
        '[focusMediaWindow] Media window not available for focusing',
        'electronWindow',
        'log',
      );
      return;
    }

    const screens = getAllScreens();
    if (screens.length === 1) {
      log(
        '[focusMediaWindow] Single screen, showing inactive to prevent focus steal',
        'electronWindow',
        'log',
      );
      mediaWindowInfo.mediaWindow.showInactive();
      return;
    }

    log('[focusMediaWindow] Focusing media window', 'electronWindow', 'log');
    mediaWindowInfo.mediaWindow.show();
    mediaWindowInfo.mediaWindow.focus();
  } catch (err) {
    captureElectronError(err, {
      contexts: { fn: { name: 'focusMediaWindow' } },
    });
  }
}
