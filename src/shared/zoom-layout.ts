import type { ZoomLayoutPreferences, ZoomScreenRect } from 'src/types';

// How M³ shares a screen between its main window and Zoom's meeting window
// (the Zoom Meeting Manager's window layout): the setup assistant draws it,
// the main process places the windows by it.

export const DEFAULT_ZOOM_LAYOUT: ZoomLayoutPreferences = {
  alone: false,
  display: null,
  enabled: false,
  keepInPlace: true,
  m3Fills: false,
  m3First: true,
  m3Share: 0.4,
  openParticipants: true,
  showParticipantsWhileSharing: true,
  snapWithWindows: false,
};

// The smallest each window gets, in DIPs. Zoom's: measured on Zoom Workplace
// 7.2 (it keeps a bigger minimum width while its participants list is
// docked, so Windows' own snapping gave it 972 instead of 960).
export const ZOOM_MIN_SIZE = { height: 381, width: 887 };
export const ZOOM_MIN_WIDTH_WITH_PARTICIPANTS = 972;
export const M3_MIN_SIZE = { height: 450, width: 500 };

/** Where the divider clicks into place: ¼ ⅓ ⅖ ½ ⅗ ⅔ ¾ of the screen for M³. */
export const ZOOM_LAYOUT_SNAP_POINTS = [
  1 / 4,
  1 / 3,
  2 / 5,
  1 / 2,
  3 / 5,
  2 / 3,
  3 / 4,
];

/** How close (a share of the screen) the divider must come to click in. */
const SNAP_MAGNET = 0.018;

interface Size {
  height: number;
  width: number;
}

/** A portrait screen is shared top and bottom rather than side by side. */
export const isPortrait = (area: Size) => area.height > area.width;

export interface M3ShareRange {
  /** M³'s largest share: Zoom keeps its minimum size. */
  max: number;
  /** M³'s smallest share: its own minimum size. */
  min: number;
  /** Top and bottom rather than side by side. */
  vertical: boolean;
}

/**
 * The shares of a screen M³ can take next to Zoom, from its own minimum
 * size to what leaves Zoom its own (bigger with Zoom's participants list).
 */
export const m3ShareRange = (
  area: Size,
  participantsOpen: boolean,
): M3ShareRange => {
  if (isPortrait(area)) {
    return {
      max: 1 - ZOOM_MIN_SIZE.height / area.height,
      min: M3_MIN_SIZE.height / area.height,
      vertical: true,
    };
  }
  const zoomMin = participantsOpen
    ? ZOOM_MIN_WIDTH_WITH_PARTICIPANTS
    : ZOOM_MIN_SIZE.width;
  return {
    max: 1 - zoomMin / area.width,
    min: M3_MIN_SIZE.width / area.width,
    vertical: false,
  };
};

/** Whether the screen is big enough for both windows at their smallest. */
export const fitsBoth = (range: M3ShareRange) => range.min <= range.max;

/**
 * A share kept within range. On a screen too small for both, Zoom keeps
 * its minimum size and M³ gets the rest (Windows lets its window shrink).
 */
export const clampM3Share = (share: number, range: M3ShareRange) => {
  if (!fitsBoth(range)) return Math.max(0, range.max);
  return Math.min(range.max, Math.max(range.min, share));
};

/**
 * A share from the divider: within range, and clicked onto the nearest
 * snap point when that close (unless `free`, e.g. with Alt held).
 */
export const snapM3Share = (
  share: number,
  range: M3ShareRange,
  free = false,
) => {
  const clamped = clampM3Share(share, range);
  if (free) return clamped;
  const point = ZOOM_LAYOUT_SNAP_POINTS.find(
    (p) =>
      Math.abs(p - clamped) < SNAP_MAGNET && p >= range.min && p <= range.max,
  );
  return point ?? clamped;
};

/**
 * M³'s and Zoom's rectangles on a screen's work area: M³ on its side, Zoom
 * on the rest, rounded once at the split so they meet without a gap.
 */
export const splitWorkArea = (
  area: ZoomScreenRect,
  m3Share: number,
  m3First: boolean,
): { m3: ZoomScreenRect; zoom: ZoomScreenRect } => {
  if (isPortrait(area)) {
    const m3Height = Math.round(area.height * m3Share);
    const zoomHeight = area.height - m3Height;
    const m3 = { ...area, height: m3Height };
    const zoom = { ...area, height: zoomHeight };
    if (m3First) zoom.y = area.y + m3Height;
    else m3.y = area.y + zoomHeight;
    return { m3, zoom };
  }
  const m3Width = Math.round(area.width * m3Share);
  const zoomWidth = area.width - m3Width;
  const m3 = { ...area, width: m3Width };
  const zoom = { ...area, width: zoomWidth };
  if (m3First) zoom.x = area.x + m3Width;
  else m3.x = area.x + zoomWidth;
  return { m3, zoom };
};

/** Whether two rectangles are the same, give or take a few pixels. */
export const sameScreenRect = (
  a: null | undefined | ZoomScreenRect,
  b: null | undefined | ZoomScreenRect,
  tolerance = 4,
) =>
  !!a &&
  !!b &&
  Math.abs(a.x - b.x) <= tolerance &&
  Math.abs(a.y - b.y) <= tolerance &&
  Math.abs(a.width - b.width) <= tolerance &&
  Math.abs(a.height - b.height) <= tolerance;
