import { describe, expect, it } from 'vitest';

import {
  clampM3Share,
  fitsBoth,
  m3ShareRange,
  sameScreenRect,
  snapM3Share,
  splitWorkArea,
} from '../zoom-layout';

const HD = { height: 1032, width: 1920, x: 0, y: 0 };
const ULTRAWIDE = { height: 1392, width: 3440, x: 0, y: 0 };
const PORTRAIT = { height: 1920, width: 1080, x: 1920, y: -420 };

describe('m3ShareRange', () => {
  it('leaves M³ and Zoom their smallest widths side by side', () => {
    const range = m3ShareRange(ULTRAWIDE, false);
    expect(range.vertical).toBe(false);
    expect(range.min).toBeCloseTo(500 / 3440);
    expect(range.max).toBeCloseTo(1 - 887 / 3440);
  });

  it('keeps Zoom wider while its participants list is docked', () => {
    expect(m3ShareRange(HD, true).max).toBeCloseTo(1 - 972 / 1920);
    expect(m3ShareRange(HD, true).max).toBeLessThan(
      m3ShareRange(HD, false).max,
    );
  });

  it('shares a portrait screen top and bottom, by height', () => {
    const range = m3ShareRange(PORTRAIT, true);
    expect(range.vertical).toBe(true);
    expect(range.min).toBeCloseTo(450 / 1920);
    expect(range.max).toBeCloseTo(1 - 381 / 1920);
  });
});

describe('clampM3Share', () => {
  it('keeps a share within range', () => {
    const range = m3ShareRange(HD, true);
    expect(clampM3Share(0.1, range)).toBeCloseTo(range.min);
    expect(clampM3Share(0.9, range)).toBeCloseTo(range.max);
    expect(clampM3Share(0.4, range)).toBe(0.4);
  });

  it('leaves Zoom its minimum on a screen too small for both', () => {
    const range = m3ShareRange({ height: 768, width: 1280 }, true);
    expect(fitsBoth(range)).toBe(false);
    expect(clampM3Share(0.5, range)).toBeCloseTo(1 - 972 / 1280);
  });
});

describe('snapM3Share', () => {
  const range = m3ShareRange(ULTRAWIDE, false);

  it('clicks onto a snap point when close to it', () => {
    expect(snapM3Share(0.34, range)).toBe(1 / 3);
    expect(snapM3Share(0.49, range)).toBe(1 / 2);
  });

  it('stays put away from the snap points, or when dragged freely', () => {
    expect(snapM3Share(0.45, range)).toBe(0.45);
    expect(snapM3Share(0.34, range, true)).toBe(0.34);
  });

  it('never clicks onto a point out of range', () => {
    const narrow = m3ShareRange({ height: 860, width: 1440 }, true);
    // ⅓ is just over M³'s largest share next to a docked participants list.
    expect(narrow.max).toBeLessThan(1 / 3);
    expect(snapM3Share(0.33, narrow)).toBeCloseTo(narrow.max);
  });
});

describe('splitWorkArea', () => {
  it('puts M³ on the left and Zoom on the rest, meeting without a gap', () => {
    const { m3, zoom } = splitWorkArea(ULTRAWIDE, 0.4, true);
    expect(m3).toEqual({ height: 1392, width: 1376, x: 0, y: 0 });
    expect(zoom).toEqual({ height: 1392, width: 2064, x: 1376, y: 0 });
  });

  it('puts M³ on the right when asked', () => {
    const { m3, zoom } = splitWorkArea({ ...HD, x: -1920 }, 1 / 3, false);
    expect(zoom).toEqual({ height: 1032, width: 1280, x: -1920, y: 0 });
    expect(m3).toEqual({ height: 1032, width: 640, x: -640, y: 0 });
  });

  it('shares a portrait screen top and bottom', () => {
    const { m3, zoom } = splitWorkArea(PORTRAIT, 0.4, true);
    expect(m3).toEqual({ height: 768, width: 1080, x: 1920, y: -420 });
    expect(zoom).toEqual({ height: 1152, width: 1080, x: 1920, y: 348 });
  });
});

describe('sameScreenRect', () => {
  it('allows a few pixels either way', () => {
    const rect = { height: 100, width: 100, x: 10, y: 10 };
    expect(sameScreenRect(rect, { ...rect, x: 13 })).toBe(true);
    expect(sameScreenRect(rect, { ...rect, width: 110 })).toBe(false);
    expect(sameScreenRect(rect, { ...rect, x: 11 }, 0)).toBe(false);
    expect(sameScreenRect(rect, null)).toBe(false);
  });
});
