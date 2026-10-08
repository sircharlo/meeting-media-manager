import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDisplayMatching = vi.fn();
const captureElectronError = vi.fn();

vi.mock('electron', () => ({
  screen: {
    getDisplayMatching,
  },
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError,
}));

describe('screen-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing, NaN and zero-sized rectangles', async () => {
    const { hasValidScreenBounds } = await import('../screen-utils');

    expect(hasValidScreenBounds(undefined)).toBe(false);
    expect(hasValidScreenBounds({ height: 0, width: 100, x: 0, y: 0 })).toBe(
      false,
    );
    expect(hasValidScreenBounds({ height: 100, width: 0, x: 0, y: 0 })).toBe(
      false,
    );
    expect(
      hasValidScreenBounds({ height: 100, width: Number.NaN, x: 0, y: 0 }),
    ).toBe(false);
    expect(hasValidScreenBounds({ height: 100, width: 100, x: 0, y: 0 })).toBe(
      true,
    );
  });

  it('returns undefined for invalid bounds without touching the screen API', async () => {
    const { getDisplayMatchingSafe } = await import('../screen-utils');

    expect(
      getDisplayMatchingSafe({ height: 0, width: 100, x: 0, y: 0 }),
    ).toBeUndefined();
    expect(getDisplayMatching).not.toHaveBeenCalled();
  });

  it('returns the matched display for valid bounds', async () => {
    getDisplayMatching.mockReturnValue({ id: 2 });

    const { getDisplayMatchingSafe } = await import('../screen-utils');

    expect(
      getDisplayMatchingSafe({ height: 100, width: 100, x: 0, y: 0 }),
    ).toEqual({ id: 2 });
    expect(getDisplayMatching).toHaveBeenCalledOnce();
  });

  it('reports and swallows a thrown lookup error', async () => {
    const error = new Error('screen lookup failed');
    getDisplayMatching.mockImplementation(() => {
      throw error;
    });

    const { getDisplayMatchingSafe } = await import('../screen-utils');

    expect(
      getDisplayMatchingSafe({ height: 100, width: 100, x: 0, y: 0 }),
    ).toBeUndefined();
    expect(captureElectronError).toHaveBeenCalledWith(error, {
      contexts: { fn: { name: 'getDisplayMatchingSafe' } },
    });
  });
});
