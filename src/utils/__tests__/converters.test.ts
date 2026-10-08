import { errorCatcher } from 'src/helpers/error-catcher';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { convertImageIfNeeded } from '../converters';

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

// happy-dom never loads image sources, so stand in an Image that fails to
// load the way Chromium did for MMM-V2-3KY.
class FailingImage {
  onerror: ((event: Event) => unknown) | null = null;
  onload: (() => unknown) | null = null;
  set src(_value: string) {
    setTimeout(() => this.onerror?.(new Event('error')), 0);
  }
}

describe('convertImageIfNeeded with an SVG that fails to load', () => {
  beforeEach(() => {
    vi.mocked(errorCatcher).mockClear();
    vi.stubGlobal('Image', FailingImage);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      {} as unknown as CanvasRenderingContext2D,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // A rejection here used to escape to dynamicMediaMapper's Promise.all and
  // empty the entire meeting's media list, not just this one image.
  it('resolves with the original path instead of rejecting', async () => {
    const filepath = '/missing/folder/1102025915_T_seg_02.svg';

    await expect(convertImageIfNeeded(filepath)).resolves.toBe(filepath);
  });

  it('reports the failure with the file state for diagnosis', async () => {
    const filepath = '/missing/folder/1102025915_T_seg_02.svg';

    await convertImageIfNeeded(filepath);

    expect(errorCatcher).toHaveBeenCalledWith(
      expect.objectContaining({
        message: `Failed to load SVG: ${filepath}`,
      }),
      {
        contexts: {
          fn: {
            file: { statError: 'ENOENT' },
            filepath,
            name: 'convertSvgToJpg',
          },
        },
      },
    );
  });
});
