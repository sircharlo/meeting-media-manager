import type { Display } from 'src/types';

import { computed, type Ref } from 'vue';

/**
 * Geometry for the miniature "which screen?" map shared by the media display
 * and timer popups: the virtual desktop spanning every display, and each
 * display's rectangle as percentages of it.
 */
export const useScreenLayout = (screenList: Ref<Display[] | undefined>) => {
  // Virtual desktop extents across all displays (in physical pixels as provided by Electron)
  const virtualBounds = computed(() => {
    const list = screenList.value;
    if (!list || list.length === 0) {
      return { height: 9, width: 16, x: 0, y: 0 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const d of list) {
      const b = d.bounds;
      if (!b) continue;
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    return { height, width, x: minX, y: minY };
  });

  // Percentage-based rectangles for each screen relative to the virtual desktop
  const screenRects = computed(() => {
    const vb = virtualBounds.value;
    const list = screenList.value ?? [];
    return list.map((d) => {
      const b = d.bounds;
      const left = ((b.x - vb.x) / vb.width) * 100;
      const top = ((b.y - vb.y) / vb.height) * 100;
      const width = (b.width / vb.width) * 100;
      const height = (b.height / vb.height) * 100;
      return {
        height: Number.isFinite(height) ? height : 0,
        left: Number.isFinite(left) ? left : 0,
        top: Number.isFinite(top) ? top : 0,
        width: Number.isFinite(width) ? width : 0,
      };
    });
  });

  return { screenRects, virtualBounds };
};
