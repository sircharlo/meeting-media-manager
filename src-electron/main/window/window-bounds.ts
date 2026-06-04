const MAX_CHROMIUM_SAFE_AREA = 2_147_483_647;
const MAX_CHROMIUM_SAFE_COORDINATE = 2_147_483_647;
const MIN_WINDOW_SIZE = 1;

/**
 * Ensures bounds passed to Electron are safe positive integers.
 *
 * Chromium stores gfx::Size area in a checked signed 32-bit integer. Passing an
 * extreme surface size can trip a fatal compositor CHECK in gfx::Size::GetArea.
 */
export function normalizeWindowBounds(
  bounds: Partial<Electron.Rectangle>,
): Electron.Rectangle | null {
  const x = Math.floor(bounds.x ?? 0);
  const y = Math.floor(bounds.y ?? 0);
  const width = Math.floor(bounds.width ?? 0);
  const height = Math.floor(bounds.height ?? 0);

  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width < MIN_WINDOW_SIZE || height < MIN_WINDOW_SIZE) return null;
  if (
    Math.abs(x) > MAX_CHROMIUM_SAFE_COORDINATE ||
    Math.abs(y) > MAX_CHROMIUM_SAFE_COORDINATE
  ) {
    return null;
  }
  if (width > Math.floor(MAX_CHROMIUM_SAFE_AREA / height)) return null;

  return { height, width, x, y };
}
