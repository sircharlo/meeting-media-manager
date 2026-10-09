import { screen } from 'electron';
import { captureElectronError } from 'src-electron/main/utils';

/**
 * Whether `bounds` describe a real, positive-area rectangle that is safe to
 * hand to the synchronous Electron `screen` APIs. Those APIs can block the
 * main-process event loop on Windows while the display topology is changing
 * (projector connect/disconnect, Zoom screen share, remote desktop, DPI
 * change), so callers should skip windows whose bounds are missing, NaN, or
 * zero-sized instead of asking `screen.getDisplayMatching` to resolve them.
 *
 * Intentionally *not* the same validation as `normalizeWindowBounds` in
 * `src-electron/main/window/window-bounds.ts`: that one also clamps against
 * Chromium's INT32 area/coordinate limits because its result is handed to
 * window creation/setBounds. Here the rectangle is only used to look up a
 * display, so huge-but-finite bounds are still safe to pass through - only
 * missing/NaN/zero-sized garbage is rejected.
 */
export const hasValidScreenBounds = (
  bounds: Electron.Rectangle | undefined,
): bounds is Electron.Rectangle =>
  !!bounds &&
  Number.isFinite(bounds.x) &&
  Number.isFinite(bounds.y) &&
  Number.isFinite(bounds.width) &&
  Number.isFinite(bounds.height) &&
  bounds.width > 0 &&
  bounds.height > 0;

/**
 * Resolves the display for `bounds` without letting an invalid rectangle (or a
 * thrown error) escape to callers. Returns `undefined` when there is nothing
 * safe to match.
 */
export const getDisplayMatchingSafe = (
  bounds: Electron.Rectangle | undefined,
): Electron.Display | undefined => {
  if (!hasValidScreenBounds(bounds)) return undefined;
  try {
    return screen.getDisplayMatching(bounds);
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { name: 'getDisplayMatchingSafe' } },
    });
    return undefined;
  }
};
