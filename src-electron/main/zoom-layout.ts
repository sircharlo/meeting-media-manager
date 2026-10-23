import type {
  Display,
  ZoomLayoutPreferences,
  ZoomLayoutScreens,
  ZoomLayoutTargets,
  ZoomScreenRect,
} from 'src/types';

import { type BrowserWindow, screen } from 'electron';
import { PLATFORM } from 'src-electron/constants';
import { getAllScreens } from 'src-electron/main/screen';
import { captureElectronError } from 'src-electron/main/utils';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import { mediaWindowInfo } from 'src-electron/main/window/window-media';
import { timerWindowInfo } from 'src-electron/main/window/window-timer';
import {
  clampM3Share,
  DEFAULT_ZOOM_LAYOUT,
  m3ShareRange,
  splitWorkArea,
} from 'src/shared/zoom-layout';

// Works out where the Zoom Meeting Manager's window layout puts Zoom's
// meeting windows and M³'s main window on the screens connected now. The
// renderer hands the result to the Zoom helper, which places the windows in
// physical pixels: Windows only, like the helper, so screen.dipToScreenRect
// is there to turn Electron's DIPs into those.

/** Whether a window fills a display: full screen, or as good as. */
const fillsDisplay = (window: BrowserWindow | null, display: Display) => {
  if (!window || window.isDestroyed()) return false;
  try {
    if (window.isFullScreen()) return true;
    const bounds = window.getBounds();
    return (
      bounds.width >= display.bounds.width - 10 &&
      bounds.height >= display.bounds.height - 10
    );
  } catch (error) {
    captureElectronError(error, {
      contexts: { fn: { name: 'zoomLayout.fillsDisplay' } },
    });
    return false;
  }
};

/** A screen the media window fills: never Zoom's nor M³'s. */
const isMediaScreen = (display: Display, displays: Display[]) =>
  displays.length > 1 &&
  !!display.mediaWindow &&
  fillsDisplay(mediaWindowInfo.mediaWindow, display);

/** A screen the media window or the timer fills. */
const isPresentationScreen = (display: Display, displays: Display[]) =>
  isMediaScreen(display, displays) ||
  (displays.length > 1 &&
    !!display.timerWindow &&
    fillsDisplay(timerWindowInfo.timerWindow, display));

const sameBounds = (a: Electron.Rectangle, b: Electron.Rectangle) =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

const toPhysical = (rect: Electron.Rectangle): ZoomScreenRect => {
  const physical = screen.dipToScreenRect(null, rect);
  return {
    height: physical.height,
    width: physical.width,
    x: physical.x,
    y: physical.y,
  };
};

/** M³'s main window's handle (HWND), for the helper to place it. */
const mainWindowHandle = (): number | undefined => {
  const window = mainWindowInfo.mainWindow;
  if (!window || window.isDestroyed() || window.isFullScreen()) {
    return undefined;
  }
  const handle = window.getNativeWindowHandle();
  return handle.length >= 8
    ? Number(handle.readBigUInt64LE())
    : handle.readUInt32LE();
};

/** The screen chosen for Zoom, if it's connected and can be used. */
const chosenDisplay = (
  wanted: ZoomLayoutPreferences['display'],
  usable: Display[],
  m3Usable: Display,
) => {
  if (!wanted) return m3Usable;
  return (
    usable.find((d) => d.id === wanted.id) ??
    usable.find((d) => sameBounds(d.bounds, wanted.bounds))
  );
};

/**
 * Where M³ goes: on its own screen with Zoom alone on another (if it's to
 * fill it), or beside Zoom, which then only gets its share of the screen.
 */
const placeM3 = (
  targets: ZoomLayoutTargets,
  prefs: ZoomLayoutPreferences,
  zoomDisplay: Display,
  m3Display: Display,
) => {
  const m3Handle = mainWindowHandle();
  if (prefs.alone && zoomDisplay.id !== m3Display.id) {
    if (prefs.m3Fills && m3Handle !== undefined) {
      targets.m3 = toPhysical(m3Display.workArea);
      targets.m3Handle = m3Handle;
    }
    return;
  }
  const range = m3ShareRange(zoomDisplay.workArea, prefs.openParticipants);
  const split = splitWorkArea(
    targets.zoom,
    clampM3Share(prefs.m3Share, range),
    prefs.m3First,
  );
  targets.zoom = split.zoom;
  if (m3Handle !== undefined) {
    targets.m3 = split.m3;
    targets.m3Handle = m3Handle;
  }
  if (prefs.snapWithWindows && !range.vertical) {
    targets.snap = prefs.m3First ? 'zoom-right' : 'zoom-left';
  }
};

/** The media window's screen, which Zoom's second window covers. */
const mediaScreen = (displays: Display[], screens?: ZoomLayoutScreens) =>
  screens
    ? displays.find((d) => d.id === screens.media)
    : displays.find((d) => isMediaScreen(d, displays));

/**
 * Where Zoom's meeting window (and its second window, with Zoom's "Use dual
 * monitors" on) and M³'s main window go. Zoom goes on the screen chosen, or
 * shares M³'s should that one not be connected or be the media window's
 * (or the timer's); its second window goes over the media window's screen,
 * full screen, so hiding the media window shows it. Null when nothing can
 * be worked out (no screens, or not on Windows).
 *
 * `screens` names the media window's and the timer's screens as M³ is set
 * up (the renderer knows whether they're to be full screen); without it,
 * they're told by the windows filling their screens right now.
 */
export const getZoomLayoutTargets = (
  preferences: Partial<ZoomLayoutPreferences>,
  screens?: ZoomLayoutScreens,
): null | ZoomLayoutTargets => {
  if (PLATFORM !== 'win32') return null;
  const prefs = { ...DEFAULT_ZOOM_LAYOUT, ...preferences };
  const displays = getAllScreens();
  const taken = (d: Display) =>
    screens
      ? screens.presentation.includes(d.id)
      : isPresentationScreen(d, displays);
  const usable = displays.filter((d) => !taken(d));
  const m3Display = displays.find((d) => d.mainWindow) ?? displays[0];
  if (!m3Display || !usable.length) return null;
  const m3Usable = usable.includes(m3Display) ? m3Display : usable[0];
  if (!m3Usable) return null;

  const chosen = chosenDisplay(prefs.display, usable, m3Usable);
  const zoomDisplay = chosen ?? m3Usable;
  const targets: ZoomLayoutTargets = {
    displayId: zoomDisplay.id,
    fallback: !chosen,
    snap: null,
    zoom: toPhysical(zoomDisplay.workArea),
  };
  placeM3(targets, prefs, zoomDisplay, m3Display);

  const mediaDisplay = mediaScreen(displays, screens);
  if (mediaDisplay) targets.second = toPhysical(mediaDisplay.bounds);
  return targets;
};
