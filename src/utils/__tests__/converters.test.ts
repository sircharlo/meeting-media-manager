import { errorCatcher } from 'src/helpers/error-catcher';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { convertImageIfNeeded } from '../converters';

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

// converters.ts takes these out of electronApi when it's imported.
const heicApi = vi.hoisted(() => {
  const api = {
    convertHeic: vi.fn<(image: unknown) => Promise<ArrayBuffer>>(),
    readFile: vi.fn(async () => Buffer.from([1, 2, 3])),
    writeFile: vi.fn(async () => undefined),
  };
  const { electronApi } = globalThis;
  globalThis.electronApi = {
    ...electronApi,
    convertHeic: api.convertHeic,
    fs: {
      ...electronApi.fs,
      readFile: api.readFile,
      writeFile: api.writeFile,
    },
  } as unknown as typeof electronApi;
  return api;
});

// happy-dom never loads image sources, so stand in an Image that fails to
// load the way Chromium did for MMM-V2-3KY.
class FailingImage {
  onerror: ((event: Event) => unknown) | null = null;
  onload: (() => unknown) | null = null;
  set src(_value: string) {
    setTimeout(() => this.onerror?.(new Event('error')), 0);
  }
}

describe('convertImageIfNeeded with a HEIC', () => {
  const filepath = '/photos/IMG_0001.heic';

  beforeEach(() => {
    heicApi.convertHeic.mockReset();
    heicApi.writeFile.mockClear();
  });

  it('writes the JPEG beside the photo and returns its path', async () => {
    heicApi.convertHeic.mockResolvedValue(
      new Uint8Array([0xff, 0xd8, 0xff]).buffer,
    );

    await expect(convertImageIfNeeded(filepath)).resolves.toBe(
      '/photos/IMG_0001.jpg',
    );
    expect(heicApi.writeFile).toHaveBeenCalledOnce();
  });

  // MMM-V2-3NN, #10340: this used to leave a 0-byte .jpg and return it as if
  // it were the converted image.
  it('keeps the HEIC and writes nothing when it could not be decoded', async () => {
    heicApi.convertHeic.mockResolvedValue(new ArrayBuffer(0));

    await expect(convertImageIfNeeded(filepath)).resolves.toBe(filepath);
    expect(heicApi.writeFile).not.toHaveBeenCalled();
  });
});

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
