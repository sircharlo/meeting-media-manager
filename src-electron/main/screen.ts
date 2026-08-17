import type { Display } from 'src/types/electron';

import { app, type BrowserWindow, screen } from 'electron';
import { getDisplayMatchingSafe } from 'src-electron/main/screen-utils';
import { captureElectronError } from 'src-electron/main/utils';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import {
  mediaWindowInfo,
  moveMediaWindowThrottled,
} from 'src-electron/main/window/window-media';
import {
  moveTimerWindowThrottled,
  timerWindowInfo,
} from 'src-electron/main/window/window-timer';
import { log } from 'src/shared/vanilla';

let isScreenListenerInitialized = false;

/**
 * Handles screen changes by moving open presentation windows if necessary
 */
const onDisplayChanged = () => {
  invalidateScreensSnapshot();
  try {
    moveMediaWindowThrottled();
    moveTimerWindowThrottled();
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { name: 'onDisplayChanged' } },
    });
  }
};

export const initScreenListeners = () => {
  if (isScreenListenerInitialized) {
    log(
      '[initScreenListeners] Already initialized, skipping',
      'electronScreen',
      'log',
    );
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

      log(
        '[initScreenListeners] Screen listeners initialized',
        'electronScreen',
        'log',
      );
    })
    .catch((e) => {
      isScreenListenerInitialized = false;
      captureElectronError(e, {
        contexts: { fn: { name: 'initScreenListeners.whenReady' } },
      });
    });
};

// =============================================================================
// Resilient display lookup
// =============================================================================

// `screen.getAllDisplays()` and `screen.getDisplayMatching()` are synchronous
// native calls that can block the main-process event loop on Windows while the
// display topology is changing (projector connect/disconnect, Zoom screen
// share, remote desktop, DPI change). When that happens every other IPC
// handler — including "hide media display" — freezes too, because the single
// main-process event loop can no longer run.
//
// JavaScript can't interrupt a synchronous native call, so we make the lookups
// resilient in two ways instead:
//   1. Snapshot the result and reuse it for a short TTL, invalidated whenever a
//      display event fires. The many internal callers (moveMediaWindow,
//      focusMediaWindow, getWindowScreen, and the renderer's getAllScreens IPC)
//      then share one lookup instead of each re-hitting the screen module.
//   2. Guard each window-to-display match so it is performed at most once per
//      window, never on a destroyed window, and never on invalid bounds.

interface ScreensSnapshot {
  at: number;
  displays: Display[];
}

const SCREENS_CACHE_TTL_MS = 250;

let screensSnapshot: null | ScreensSnapshot = null;

const invalidateScreensSnapshot = () => {
  screensSnapshot = null;
};

/**
 * Returns the id of the display the given window currently sits on, or
 * `undefined` when there is nothing safe to match (missing/destroyed window or
 * invalid bounds). The synchronous `screen.getDisplayMatching()` lookup is
 * performed at most once, through {@link getDisplayMatchingSafe}.
 */
const getDisplayIdForWindow = (
  window: BrowserWindow | null | undefined,
): number | undefined => {
  if (!window || window.isDestroyed()) return undefined;

  let bounds: Electron.Rectangle;
  try {
    bounds = window.getBounds();
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { name: 'getDisplayIdForWindow', step: 'getBounds' } },
    });
    return undefined;
  }

  return getDisplayMatchingSafe(bounds)?.id;
};

export const getAllScreens = (): Display[] => {
  const now = Date.now();
  if (screensSnapshot && now - screensSnapshot.at < SCREENS_CACHE_TTL_MS) {
    return screensSnapshot.displays;
  }

  const displays: Display[] = screen
    .getAllDisplays()
    .sort((a, b) => a.bounds.x + a.bounds.y - (b.bounds.x + b.bounds.y));

  const mainWindowDisplayId = getDisplayIdForWindow(mainWindowInfo.mainWindow);
  const mediaWindowDisplayId = getDisplayIdForWindow(
    mediaWindowInfo.mediaWindow,
  );
  const timerWindowDisplayId = getDisplayIdForWindow(
    timerWindowInfo.timerWindow,
  );

  for (const display of displays) {
    if (
      mainWindowDisplayId !== undefined &&
      display.id === mainWindowDisplayId
    ) {
      display.mainWindow = true;
      try {
        display.mainWindowBounds = mainWindowInfo.mainWindow?.getBounds();
      } catch (e) {
        captureElectronError(e, {
          contexts: {
            fn: { name: 'getAllScreens', window: 'mainWindowBounds' },
          },
        });
      }
    }

    if (
      mediaWindowDisplayId !== undefined &&
      display.id === mediaWindowDisplayId
    ) {
      display.mediaWindow = true;
    }

    if (
      timerWindowDisplayId !== undefined &&
      display.id === timerWindowDisplayId
    ) {
      display.timerWindow = true;
    }
  }

  screensSnapshot = { at: now, displays };
  return displays;
};

export const getWindowScreen = (window: BrowserWindow | null) => {
  const displayId = getDisplayIdForWindow(window);
  if (displayId === undefined) return 0;
  const allScreens = getAllScreens();
  return allScreens.findIndex((display) => display.id === displayId);
};
