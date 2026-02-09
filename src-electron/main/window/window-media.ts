import type { WindowState } from 'src-electron/main/window/window-state';

import { app, type BrowserWindow, screen } from 'electron';
import { pathExistsSync, readJsonSync } from 'fs-extra/esm';
import { readFileSync } from 'node:fs';
import { HD_RESOLUTION, PLATFORM } from 'src-electron/constants';
import { getAllScreens, getWindowScreen } from 'src-electron/main/screen';
import { captureElectronError, getIconPath } from 'src-electron/main/utils';
import {
  createWindow,
  sendToWindow,
} from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import { throttleWithTrailing } from 'src/shared/vanilla';
import upath from 'upath';

const { join } = upath;

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

// =============================================================================
// HELPER FUNCTIONS - Window State Detection
// =============================================================================

/**
 * Calculates target display info for automatic positioning
 */
function calculateAutoTarget(
  boundsInfo: WindowBoundsInfo,
  mediaWindow: BrowserWindow,
  screens: ReturnType<typeof getAllScreens>,
): null | TargetDisplayInfo {
  const mainWindowScreen = screens.findIndex((s) => s.mainWindow);
  const preferredIndex = getPreferredScreenFromPrefs(screens);

  // 1. Preferred Screen Strategy
  // Use preferred screen if applicable (and we have >= 3 screens)
  if (
    screens.length >= 3 &&
    preferredIndex !== -1 &&
    preferredIndex !== mainWindowScreen
  ) {
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
    return mainScreenTarget;
  }

  // 4. Single Screen Formatting
  const isFullscreenOrMaximized =
    boundsInfo.isEffectivelyFullscreen ||
    mediaWindow.isFullScreen() ||
    mediaWindow.isMaximized();

  // Handle single screen with fullscreen window
  if (screens.length === 1 && isFullscreenOrMaximized) {
    return {
      targetDisplayNr: 0,
      targetFullscreen: false,
    };
  }

  return null;
}

/**
 * Checks and notifies if screen configuration changed
 */
function checkAndNotifyScreenChange(
  screens: ReturnType<typeof getAllScreens>,
  lastScreensConfig: { value: string },
): void {
  const screensConfig = JSON.stringify(screens.map((s) => s.bounds));

  if (screensConfig !== lastScreensConfig.value) {
    notifyMainWindowAboutScreenOrWindowChange();
    lastScreensConfig.value = screensConfig;
  }
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

// =============================================================================
// HELPER FUNCTIONS - Screen Selection
// =============================================================================

/**
 * Determines the state properties for the media window
 */
function getMediaWindowState(
  boundsInfo: WindowBoundsInfo,
  isCurrentlyFullscreen: boolean,
  screens: ReturnType<typeof getAllScreens>,
): MediaWindowState {
  const shouldBeMaximizable = screens.length > 1;
  const alwaysOnTop =
    PLATFORM !== 'darwin' &&
    !!(boundsInfo.isEffectivelyFullscreen || isCurrentlyFullscreen);

  return {
    alwaysOnTop,
    isCurrentlyFullscreen,
    shouldBeMaximizable,
  };
}

/**
 * Gets the preferred screen from saved preferences
 */
function getPreferredScreenFromPrefs(
  screens: ReturnType<typeof getAllScreens>,
): number {
  if (screens.length <= 1) return -1;

  const mediaWindowPrefs = loadMediaWindowPrefs();
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
    // Handle single screen scenario
    if (screens.length === 1) {
      return {
        targetDisplayNr: 0,
        targetFullscreen: false,
      };
    }
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

/**
 * Determines if the window should move to fullscreen on another display
 */
function shouldMoveWindowedToFullscreen(
  boundsInfo: WindowBoundsInfo,
  mediaWindow: BrowserWindow,
  screens: ReturnType<typeof getAllScreens>,
): { shouldMove: boolean; targetDisplayNr?: number } {
  const isFullscreenOrMaximized =
    mediaWindow.isFullScreen() ||
    mediaWindow.isMaximized() ||
    boundsInfo.isEffectivelyFullscreen;

  if (isFullscreenOrMaximized) {
    return { shouldMove: false };
  }

  if (screens.length <= 1) {
    return { shouldMove: false };
  }

  const alternativeScreen = findAlternativeScreen(
    screens,
    boundsInfo.currentDisplayNr,
  );

  if (alternativeScreen === -1) {
    return { shouldMove: false };
  }

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
      return { ...target, targetFullscreen: false };
    }
    return {
      targetDisplayNr: alternativeScreen,
      targetFullscreen: true,
    };
  }

  return target;
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

let lastAlwaysOnTop: boolean | undefined;
let lastMaximizable: boolean | undefined;
let lastScreensConfig = '';
let hasInitialPositioningHappened = false;

export const moveMediaWindow = (displayNr?: number, fullscreen?: boolean) => {
  try {
    // Early exit validation
    if (!mediaWindowInfo.mediaWindow || !mainWindowInfo.mainWindow) {
      console.log(
        '❌ [moveMediaWindow] No mediaWindow or mainWindow, returning',
      );
      return;
    }

    const screens = getAllScreens();
    const lastScreensConfigRef = { value: lastScreensConfig };
    checkAndNotifyScreenChange(screens, lastScreensConfigRef);
    lastScreensConfig = lastScreensConfigRef.value;

    // Get current window state
    const boundsInfo = getWindowBoundsInfo(
      mediaWindowInfo.mediaWindow,
      screens,
    );
    const isCurrentlyFullscreen = mediaWindowInfo.mediaWindow.isFullScreen();

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

    console.log('🔍 [moveMediaWindow] START - Called with:', {
      displayNr,
      fullscreen,
    });

    lastAlwaysOnTop = lastStateRef.alwaysOnTop;
    lastMaximizable = lastStateRef.maximizable;

    // Determine target display and mode
    let targetInfo: null | TargetDisplayInfo = null;

    if (displayNr !== undefined && fullscreen !== undefined) {
      // Explicit parameters provided
      targetInfo = { targetDisplayNr: displayNr, targetFullscreen: fullscreen };
    } else {
      // Calculate automatic target
      targetInfo = calculateAutoTarget(
        boundsInfo,
        mediaWindowInfo.mediaWindow,
        screens,
      );
    }

    // Exit if no target determined
    if (!targetInfo) {
      console.log(
        '🔍 [moveMediaWindow] No target determined, keeping current position',
      );
      return;
    }

    // Validate target display
    if (
      targetInfo.targetDisplayNr < 0 ||
      targetInfo.targetDisplayNr >= screens.length
    ) {
      console.log(
        '❌ [moveMediaWindow] Invalid display number:',
        targetInfo.targetDisplayNr,
      );
      return;
    }

    // Validate and adjust target to prevent conflicts
    targetInfo = validateAndAdjustTarget(targetInfo, screens);

    console.log('🔍 [moveMediaWindow] Final target:', targetInfo);

    // Apply the changes
    setWindowPosition(targetInfo.targetDisplayNr, targetInfo.targetFullscreen);

    console.log('🔍 [moveMediaWindow] END - Changes applied');
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { name: 'moveMediaWindow' } },
    });
  }
};

export const moveMediaWindowThrottled = throttleWithTrailing(
  () => moveMediaWindow(),
  100,
);

// =============================================================================
// EXISTING FUNCTIONS (unchanged)
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

  // Check if only one screen is available and set to windowed mode with HD resolution
  const screens = getAllScreens();
  if (screens.length === 1 && screens[0]) {
    console.log(
      '🔍 [createMediaWindow] Only one screen available, checking if window needs repositioning',
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

      mediaWindowInfo.mediaWindow.setFullScreen(false);

      mediaWindowInfo.mediaWindow.setBounds({
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

  mediaWindowInfo.mediaWindow.on('closed', () => {
    mediaWindowInfo.mediaWindow = null;
  });

  hasInitialPositioningHappened = true;
}

/**
 * Fade in the media window with opacity transition
 * @param duration Transition duration in milliseconds (default: 300ms)
 */
export function fadeInMediaWindow(duration = 300): void {
  if (
    !mediaWindowInfo.mediaWindow ||
    mediaWindowInfo.mediaWindow.isDestroyed()
  ) {
    return;
  }

  try {
    // Check current opacity - only fade in if needed
    const currentOpacity = mediaWindowInfo.mediaWindow.getOpacity();

    // If already visible/opaque, just focus
    if (mediaWindowInfo.mediaWindow.isVisible() && currentOpacity >= 0.99) {
      console.log(
        '🔍 [fadeInMediaWindow] Window already visible/opaque, just focusing',
      );
      focusMediaWindow();
      return;
    }

    // Set initial opacity to current or 0 (whichever is higher)
    const startOpacity = Math.max(0, currentOpacity);
    mediaWindowInfo.mediaWindow.setOpacity(startOpacity);

    // Focus the window first
    focusMediaWindow();

    // Gradually increase opacity from current to 1
    const steps = Math.max(10, Math.floor(duration / 30));
    const stepDuration = duration / steps;
    const opacityRange = 1 - startOpacity;
    const opacityStep = opacityRange / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      const newOpacity = Math.min(startOpacity + currentStep * opacityStep, 1);

      try {
        if (
          !mediaWindowInfo.mediaWindow ||
          mediaWindowInfo.mediaWindow.isDestroyed()
        ) {
          clearInterval(fadeInterval);
          clearTimeout(fallbackTimeout);
          return;
        }

        mediaWindowInfo.mediaWindow.setOpacity(newOpacity);

        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          clearTimeout(fallbackTimeout);
          mediaWindowInfo.mediaWindow.setOpacity(1);
        }
      } catch {
        clearInterval(fadeInterval);
        clearTimeout(fallbackTimeout);
        if (
          mediaWindowInfo.mediaWindow &&
          !mediaWindowInfo.mediaWindow.isDestroyed()
        ) {
          focusMediaWindow();
          mediaWindowInfo.mediaWindow.setOpacity(1);
        }
      }
    }, stepDuration);

    // Fallback timeout
    const fallbackTimeout = setTimeout(() => {
      clearInterval(fadeInterval);
      if (
        mediaWindowInfo.mediaWindow &&
        !mediaWindowInfo.mediaWindow.isDestroyed()
      ) {
        focusMediaWindow();
        mediaWindowInfo.mediaWindow.setOpacity(1);
      }
    }, duration + 100);
  } catch {
    console.log('🔍 [fadeInMediaWindow] Error in fade in, focusing window');
    if (
      mediaWindowInfo.mediaWindow &&
      !mediaWindowInfo.mediaWindow.isDestroyed()
    ) {
      focusMediaWindow();
      mediaWindowInfo.mediaWindow.setOpacity(1);
    }
  }
}

/**
 * Fade out the media window with opacity transition
 * @param duration Transition duration in milliseconds (default: 300ms)
 */
export function fadeOutMediaWindow(duration = 300): Promise<void> {
  return new Promise((resolve) => {
    if (
      !mediaWindowInfo.mediaWindow ||
      mediaWindowInfo.mediaWindow.isDestroyed()
    ) {
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
          mediaWindowInfo.mediaWindow?.setOpacity(newOpacity);
        } catch {
          // Fallback: just hide the window normally
          if (
            mediaWindowInfo.mediaWindow &&
            !mediaWindowInfo.mediaWindow.isDestroyed()
          ) {
            mediaWindowInfo.mediaWindow.hide();
          }
          clearInterval(fadeInterval);
          resolve();
          return;
        }

        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          if (
            mediaWindowInfo.mediaWindow &&
            !mediaWindowInfo.mediaWindow.isDestroyed()
          ) {
            mediaWindowInfo.mediaWindow.hide();
            mediaWindowInfo.mediaWindow.setOpacity(0);
          }
          resolve();
        }
      }, stepDuration);

      // Fallback timeout
      setTimeout(() => {
        clearInterval(fadeInterval);
        if (
          mediaWindowInfo.mediaWindow &&
          !mediaWindowInfo.mediaWindow.isDestroyed()
        ) {
          mediaWindowInfo.mediaWindow.hide();
          mediaWindowInfo.mediaWindow.setOpacity(0);
        }
        resolve();
      }, duration + 100);
    } catch {
      // Fallback: just hide the window normally
      if (
        mediaWindowInfo.mediaWindow &&
        !mediaWindowInfo.mediaWindow.isDestroyed()
      ) {
        mediaWindowInfo.mediaWindow.hide();
        mediaWindowInfo.mediaWindow.setOpacity(0);
      }
      resolve();
    }
  });
}

const notifyMainWindowAboutScreenOrWindowChange = throttleWithTrailing(() => {
  console.log(
    '🔍 [notifyMainWindowAboutScreenOrWindowChange] Sending screenChange event',
  );
  sendToWindow(mainWindowInfo.mainWindow, 'screenChange');
}, 250);

function loadMediaWindowPrefs(): null | WindowState {
  let mediaWindowStateFile: string | undefined = undefined;
  try {
    mediaWindowStateFile = join(
      app.getPath('userData'),
      'media-window-state.json',
    );
    if (!pathExistsSync(mediaWindowStateFile)) {
      console.log(
        '🔍 [loadMediaWindowPrefs] File does not exist:',
        mediaWindowStateFile,
      );
      return null;
    }
    console.log(
      '🔍 [loadMediaWindowPrefs] Loading prefs from:',
      mediaWindowStateFile,
    );
    return readJsonSync(mediaWindowStateFile);
  } catch (e) {
    let fileContent: null | string = null;
    if (mediaWindowStateFile) {
      try {
        fileContent = readFileSync(mediaWindowStateFile, 'utf-8');
        return JSON.parse(fileContent);
      } catch (e) {
        captureElectronError(e, {
          contexts: {
            fn: { fileContent, name: 'loadMediaWindowPrefs (fallback)' },
          },
        });
      }
    }
    captureElectronError(e, {
      contexts: { fn: { fileContent, name: 'loadMediaWindowPrefs' } },
    });
    return null;
  }
}

let isMovingWindow = false;

const setWindowPosition = (displayNr?: number, fullscreen = true) => {
  console.log('🔍 [setWindowPosition] START - Called with:', {
    displayNr,
    fullscreen,
  });

  if (isMovingWindow) {
    console.log('🔍 [setWindowPosition] Already moving window, skipping');
    return;
  }

  try {
    if (!mediaWindowInfo.mediaWindow) {
      console.log('❌ [setWindowPosition] No mediaWindow, returning');
      isMovingWindow = false;
      return;
    }
    isMovingWindow = true;

    const screens = getAllScreens();
    const targetDisplay = screens[displayNr ?? 0];
    if (!targetDisplay) {
      console.log(
        '❌ [setWindowPosition] Target display not found:',
        displayNr,
      );
      isMovingWindow = false;
      return;
    }

    const targetScreenBounds = targetDisplay.bounds;
    console.log(
      '🔍 [setWindowPosition] Target screen bounds:',
      targetScreenBounds,
    );

    const setWindowBounds = (
      bounds: Partial<Electron.Rectangle>,
      fullScreen = false,
    ) => {
      console.log('🔍 [setWindowBounds] START - Called with:', {
        bounds,
        fullScreen,
      });

      if (!mediaWindowInfo.mediaWindow) {
        console.log('❌ [setWindowBounds] No mediaWindow, returning');
        isMovingWindow = false;
        return;
      }

      // Get current state
      const currentBounds = mediaWindowInfo.mediaWindow.getBounds();
      const wasFullscreen = mediaWindowInfo.mediaWindow.isFullScreen();
      console.log('🔍 [setWindowBounds] Current state:', {
        currentBounds,
        wasFullscreen,
      });

      // Set fullscreen state first if needed
      if (wasFullscreen === fullScreen) {
        console.log(
          '🔍 [setWindowBounds] Fullscreen state unchanged:',
          fullScreen,
        );
      } else {
        console.log(
          '🔍 [setWindowBounds] Changing fullscreen state:',
          wasFullscreen,
          '->',
          fullScreen,
        );
        mediaWindowInfo.mediaWindow.setFullScreen(fullScreen);
      }

      // Set bounds if changed
      const boundsChanged =
        currentBounds.x !== bounds.x ||
        currentBounds.y !== bounds.y ||
        currentBounds.width !== bounds.width ||
        currentBounds.height !== bounds.height;

      if (boundsChanged) {
        console.log('🔍 [setWindowBounds] Setting bounds:', bounds);
        mediaWindowInfo.mediaWindow.setBounds(bounds);
      } else {
        console.log(
          '🔍 [setWindowBounds] Bounds already correct, skipping setBounds',
        );
      }

      // Verify the changes
      const newBounds = mediaWindowInfo.mediaWindow.getBounds();
      const newFullscreen = mediaWindowInfo.mediaWindow.isFullScreen();
      console.log('🔍 [setWindowBounds] New state:', {
        newBounds,
        newFullscreen,
      });

      if (
        boundsChanged ||
        wasFullscreen !== fullScreen ||
        currentBounds.height === 0 // Force update if window was just created/shown
      ) {
        notifyMainWindowAboutScreenOrWindowChange();
      } else {
        console.log(
          '🔍 [setWindowBounds] No meaningful change, skipping renderer notification',
        );
      }

      // Focus media window
      focusMediaWindow();

      console.log('🔍 [setWindowBounds] END - Changes applied');
      isMovingWindow = false;
    };

    const handleMacFullScreenTransition = (callback: () => void) => {
      if (
        PLATFORM === 'darwin' &&
        mediaWindowInfo.mediaWindow?.isFullScreen()
      ) {
        console.log(
          '🔍 [handleMacFullScreenTransition] macOS fullscreen transition needed',
        );
        mediaWindowInfo.mediaWindow?.once('leave-full-screen', () => {
          console.log(
            '🔍 [handleMacFullScreenTransition] Left fullscreen, executing callback',
          );
          callback();
        });
        mediaWindowInfo.mediaWindow?.setFullScreen(false);
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
          console.log(
            '🔍 [setWindowPosition] Preferred display geometry will be saved shortly',
            targetDisplay.bounds,
          );
        } catch (e) {
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
      mediaWindowInfo.mediaWindow &&
      !mediaWindowInfo.mediaWindow.isDestroyed()
    ) {
      const screens = getAllScreens();
      if (screens.length > 1) {
        console.log('🔍 [focusMediaWindow] Focusing media window');
        mediaWindowInfo.mediaWindow.show();
        mediaWindowInfo.mediaWindow.focus();
      } else {
        console.log(
          '🔍 [focusMediaWindow] Single screen, showing inactive to prevent focus steal',
        );
        mediaWindowInfo.mediaWindow.showInactive();
      }
    } else {
      console.log(
        '🔍 [focusMediaWindow] Media window not available for focusing',
      );
    }
  } catch (err) {
    captureElectronError(err, {
      contexts: { fn: { name: 'focusMediaWindow' } },
    });
  }
}
