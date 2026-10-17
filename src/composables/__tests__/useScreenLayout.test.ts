import type { Display } from 'src/types';

import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useScreenLayout } from '../useScreenLayout';

const display = (
  id: number,
  x: number,
  y: number,
  width: number,
  height: number,
) => ({ bounds: { height, width, x, y }, id }) as Display;

describe('useScreenLayout', () => {
  it('falls back to a 16:9 desktop when there are no screens', () => {
    const { screenRects, virtualBounds } = useScreenLayout(ref<Display[]>([]));
    expect(virtualBounds.value).toEqual({ height: 9, width: 16, x: 0, y: 0 });
    expect(screenRects.value).toEqual([]);
  });

  it('spans every screen and places each one as percentages of that span', () => {
    // A 1920x1080 primary with a second 1920x1080 screen to its left, offset
    // down by 360px (negative x, like a real left-hand monitor).
    const screens = ref<Display[]>([
      display(1, 0, 0, 1920, 1080),
      display(2, -1920, 360, 1920, 1080),
    ]);
    const { screenRects, virtualBounds } = useScreenLayout(screens);

    expect(virtualBounds.value).toEqual({
      height: 1440,
      width: 3840,
      x: -1920,
      y: 0,
    });
    expect(screenRects.value).toEqual([
      { height: 75, left: 50, top: 0, width: 50 },
      { height: 75, left: 0, top: 25, width: 50 },
    ]);
  });

  it('recomputes when the screen list changes', () => {
    const screens = ref<Display[]>([display(1, 0, 0, 1000, 500)]);
    const { screenRects, virtualBounds } = useScreenLayout(screens);
    expect(screenRects.value).toEqual([
      { height: 100, left: 0, top: 0, width: 100 },
    ]);

    screens.value = [...screens.value, display(2, 1000, 0, 1000, 500)];
    expect(virtualBounds.value.width).toBe(2000);
    expect(screenRects.value[1]).toEqual({
      height: 100,
      left: 50,
      top: 0,
      width: 50,
    });
  });
});
