import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { cleanupFfmpegConversions, createVideoFromNonVideo } from '../ffmpeg';

vi.mock('fs-extra/esm', () => ({
  pathExists: vi.fn(async () => false),
  remove: vi.fn(async () => undefined),
}));

vi.mock('node:fs/promises', () => ({
  stat: vi.fn(async (p: string) => {
    if (p.endsWith('.mp4')) {
      return { isFile: () => true, mtimeMs: 200, size: 100 };
    }
    return { isFile: () => true, mtimeMs: 100, size: 100 };
  }),
}));

let ffmpegOnMap: Record<string, (...args: unknown[]) => void> = {};
const ffmpegChain = {
  inputFormat: vi.fn().mockReturnThis(),
  inputOptions: vi.fn().mockReturnThis(),
  kill: vi.fn(),
  loop: vi.fn().mockReturnThis(),
  noVideo: vi.fn().mockReturnThis(),
  on: vi
    .fn()
    .mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
      ffmpegOnMap[event] = cb;
      return ffmpegChain;
    }),
  outputOptions: vi.fn().mockReturnThis(),
  save: vi.fn().mockReturnThis(),
  size: vi.fn().mockReturnThis(),
  videoCodec: vi.fn().mockReturnThis(),
};

vi.mock('fluent-ffmpeg', () => ({
  default: Object.assign(
    function ffmpeg() {
      return ffmpegChain;
    },
    {
      setFfmpegPath: vi.fn(),
    },
  ),
}));

vi.mock('src-electron/main/image-size', () => ({
  getImageDimensions: vi.fn(async () => ({ height: 3000, width: 4000 })),
}));

// Reaching ffmpeg(...).on(...) goes through several chained awaits
// (assertValidFfmpegPath, shouldUseExistingConversion, a real dynamic
// import() of the mocked 'fluent-ffmpeg' module), which can take more than a
// couple of microtask ticks to settle under Vitest's module loader. Poll
// instead of assuming a fixed number of ticks.
const waitUntil = async (
  condition: () => boolean,
  maxAttempts = 50,
): Promise<void> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (condition()) return;
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  }
  throw new Error('waitUntil: condition was never met');
};

describe('ffmpeg.createVideoFromNonVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ffmpegOnMap = {};
  });

  it('short-circuits if output already exists', async () => {
    const { pathExists } = await import('fs-extra/esm');
    const pathExistsMock = pathExists as unknown as Mock<
      (p: string) => Promise<boolean>
    >;
    pathExistsMock.mockResolvedValue(true);
    const out = await createVideoFromNonVideo('/tmp/a.mp3', '/bin/ffmpeg');
    expect(out.endsWith('.mp4')).toBe(true);
  });

  it('writes converted files outside the source folder when outputDir is provided', async () => {
    const { pathExists } = await import('fs-extra/esm');
    const pathExistsMock = pathExists as unknown as Mock<
      (p: string) => Promise<boolean>
    >;
    pathExistsMock.mockResolvedValue(true);

    const out = await createVideoFromNonVideo(
      '/tmp/source/a.jpg',
      '/bin/ffmpeg',
      '/tmp/cache',
    );

    expect(out.startsWith('/tmp/cache/')).toBe(true);
    expect(out).not.toBe('/tmp/source/a.mp4');
    expect(out.endsWith('.mp4')).toBe(true);
  });

  it('converts image to mp4 - missing dimensions throws', async () => {
    const { pathExists } = await import('fs-extra/esm');
    const pathExistsMock = pathExists as unknown as Mock<
      (p: string) => Promise<boolean>
    >;
    pathExistsMock.mockResolvedValue(false);
    const imageSize = await import('src-electron/main/image-size');
    const getImageDimensionsMock =
      imageSize.getImageDimensions as unknown as Mock<
        (p: string) => Promise<{
          height?: number;
          orientation?: number;
          width?: number;
        }>
      >;
    getImageDimensionsMock.mockResolvedValue({
      height: undefined,
      orientation: undefined,
      width: undefined,
    });
    await expect(
      createVideoFromNonVideo('/tmp/a.jpg', '/bin/ffmpeg'),
    ).rejects.toThrow('Could not determine dimensions of image.');
  });

  it('refuses to use a path that is not an FFmpeg binary', async () => {
    await expect(
      createVideoFromNonVideo('/tmp/a.mp3', '/bin/some-other-tool'),
    ).rejects.toThrow('Refusing to use non-FFmpeg path');
  });

  it('refuses to use an FFmpeg path that is not a file', async () => {
    const fsPromises = await import('node:fs/promises');
    const statMock = fsPromises.stat as unknown as Mock<
      (p: string) => Promise<{ isFile: () => boolean }>
    >;
    statMock.mockResolvedValueOnce({ isFile: () => false });

    await expect(
      createVideoFromNonVideo('/tmp/a.mp3', '/bin/ffmpeg-directory'),
    ).rejects.toThrow('FFmpeg path is not a file');
  });

  // BE-3 (full-audit-2026-09-04.md): a failed conversion previously left its
  // partial output file in place, which shouldUseExistingConversion could
  // later mistake for a valid cached conversion.
  it('deletes the partial output file when the ffmpeg process reports an error', async () => {
    const { pathExists, remove } = await import('fs-extra/esm');
    (
      pathExists as unknown as Mock<(p: string) => Promise<boolean>>
    ).mockResolvedValue(false);

    const conversionPromise = createVideoFromNonVideo(
      '/tmp/be3-error.mp3',
      '/bin/ffmpeg',
    );
    // Let the async chain reach ffmpeg(...).save(...), registering onError.
    await waitUntil(() => typeof ffmpegOnMap.error === 'function');

    ffmpegOnMap.error?.(new Error('ffmpeg exploded'));

    await expect(conversionPromise).rejects.toThrow('ffmpeg exploded');
    expect(remove).toHaveBeenCalledWith('/tmp/be3-error.mp4');
  });

  it('resolves once the ffmpeg process reports completion', async () => {
    const { pathExists } = await import('fs-extra/esm');
    (
      pathExists as unknown as Mock<(p: string) => Promise<boolean>>
    ).mockResolvedValue(false);

    const conversionPromise = createVideoFromNonVideo(
      '/tmp/be3-success.mp3',
      '/bin/ffmpeg',
    );
    await waitUntil(() => typeof ffmpegOnMap.end === 'function');

    ffmpegOnMap.end?.();

    await expect(conversionPromise).resolves.toBe('/tmp/be3-success.mp4');
  });

  it('kills every in-progress ffmpeg command on cleanupFfmpegConversions', async () => {
    const { pathExists } = await import('fs-extra/esm');
    (
      pathExists as unknown as Mock<(p: string) => Promise<boolean>>
    ).mockResolvedValue(false);

    const conversionPromise = createVideoFromNonVideo(
      '/tmp/be3-cleanup.mp3',
      '/bin/ffmpeg',
    );
    await waitUntil(() => typeof ffmpegOnMap.error === 'function');

    cleanupFfmpegConversions();

    expect(ffmpegChain.kill).toHaveBeenCalledWith('SIGKILL');

    // Settle the still-pending conversion so it doesn't leak into other tests.
    ffmpegOnMap.error?.(new Error('killed'));
    await expect(conversionPromise).rejects.toThrow('killed');
  });
});
