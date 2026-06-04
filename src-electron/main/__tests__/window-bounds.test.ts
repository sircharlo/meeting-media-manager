import { describe, expect, it } from 'vitest';

import { normalizeWindowBounds } from '../window/window-bounds';

describe('window bounds normalization', () => {
  it('allows bounds whose area fits in Chromium signed int storage', () => {
    expect(
      normalizeWindowBounds({
        height: 46_340,
        width: 46_340,
        x: 0,
        y: 0,
      }),
    ).toEqual({
      height: 46_340,
      width: 46_340,
      x: 0,
      y: 0,
    });
  });

  it('rejects bounds whose area would overflow Chromium signed int storage', () => {
    expect(
      normalizeWindowBounds({
        height: 46_341,
        width: 46_341,
        x: 0,
        y: 0,
      }),
    ).toBeNull();
  });
});
