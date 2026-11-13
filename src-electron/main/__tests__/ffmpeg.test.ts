import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
  cleanupFfmpegConversions,
  createVideoFromNonVideo,
  type RunnableFfmpegCommand,
  wasStoppedAtQuit,
} from '../ffmpeg';

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

// The app's Temp folders: the shared one, and the per-user one.
vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/user-data') },
}));
vi.mock('src-electron/main/fs', () => ({
  getAppDataPath: vi.fn(async () => '/app-data'),
}));
const TEMP = '/app-data/Temp';
// What a file converts into there: its name, and a hash of its path.
const convertedIn = (folder: string, name: string) =>
  expect.stringMatching(new RegExp(`^${folder}/${name}-[0-9a-f]{8}\\.mp4$`));

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
    const out = await createVideoFromNonVideo(
      '/tmp/a.mp3',
      '/bin/ffmpeg',
      TEMP,
    );
    expect(out).toEqual(convertedIn(TEMP, 'a'));
  });

  it.each([TEMP, `${TEMP}/`, '/user-data/Temp'])(
    'writes the converted file into the app temp folder %s, not beside the source',
    async (folder) => {
      const { pathExists } = await import('fs-extra/esm');
      (pathExists as unknown as Mock).mockResolvedValue(true);

      const out = await createVideoFromNonVideo(
        '/tmp/source/a.jpg',
        '/bin/ffmpeg',
        folder,
      );

      expect(out).toEqual(convertedIn(folder.replace(/\/$/, ''), 'a'));
    },
  );

  // ffmpeg overwrites its output and a failed run deletes it: nothing is
  // written, nor deleted, anywhere else.
  it.each([
    {
      folder: undefined,
      message:
        "Refusing to convert: outputDir isn't an absolute path: undefined",
      original: '/tmp/a.mp3',
    },
    {
      folder: '/tmp/cache',
      message:
        "Refusing to convert into /tmp/cache, not the app's temp folder (/user-data/Temp, /app-data/Temp)",
      original: '/tmp/a.mp3',
    },
    {
      folder: `${TEMP}/sub`,
      message: `Refusing to convert into ${TEMP}/sub, not the app's temp folder`,
      original: '/tmp/a.mp3',
    },
    {
      folder: TEMP,
      message:
        'Refusing to convert: originalFile isn\'t an absolute path: "a.mp3"',
      original: 'a.mp3',
    },
  ])(
    'refuses to convert $original into $folder',
    async ({ folder, message, original }) => {
      const { remove } = await import('fs-extra/esm');

      await expect(
        createVideoFromNonVideo(
          original,
          '/bin/ffmpeg',
          folder as unknown as string,
        ),
      ).rejects.toThrow(message);
      expect(ffmpegChain.save).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    },
  );

  // Only .mp3 used to take the audio path: the others went down the image
  // path and failed there.
  it.each(['mp3', 'wav', 'flac', 'ogg', 'M4A'])(
    'converts a .%s file as audio, not as an image',
    async (extension) => {
      const { pathExists } = await import('fs-extra/esm');
      (pathExists as unknown as Mock).mockResolvedValue(false);
      const imageSize = await import('src-electron/main/image-size');
      const conversion = createVideoFromNonVideo(
        `/tmp/audio-${extension}.${extension}`,
        '/bin/ffmpeg',
        TEMP,
      );
      await waitUntil(() => !!ffmpegOnMap.end);
      ffmpegOnMap.end?.();
      await conversion;
      expect(ffmpegChain.noVideo).toHaveBeenCalledTimes(1);
      expect(imageSize.getImageDimensions).not.toHaveBeenCalled();
    },
  );

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
      createVideoFromNonVideo('/tmp/a.jpg', '/bin/ffmpeg', TEMP),
    ).rejects.toThrow('Could not determine dimensions of image.');
  });

  it('refuses to use a path that is not an FFmpeg binary', async () => {
    await expect(
      createVideoFromNonVideo('/tmp/a.mp3', '/bin/some-other-tool', TEMP),
    ).rejects.toThrow('Refusing to use non-FFmpeg path');
  });

  it('refuses to use an FFmpeg path that is not a file', async () => {
    const fsPromises = await import('node:fs/promises');
    const statMock = fsPromises.stat as unknown as Mock<
      (p: string) => Promise<{ isFile: () => boolean }>
    >;
    statMock.mockResolvedValueOnce({ isFile: () => false });

    await expect(
      createVideoFromNonVideo('/tmp/a.mp3', '/bin/ffmpeg-directory', TEMP),
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
      TEMP,
    );
    // Let the async chain reach ffmpeg(...).save(...), registering onError.
    await waitUntil(() => typeof ffmpegOnMap.error === 'function');

    ffmpegOnMap.error?.(new Error('ffmpeg exploded'));

    await expect(conversionPromise).rejects.toThrow('ffmpeg exploded');
    expect(remove).toHaveBeenCalledWith(convertedIn(TEMP, 'be3-error'));
  });

  // MMM-V2-3M7: AVERROR(ENOSPC), reported as 4294967268 on Windows and 228
  // elsewhere, is a full disk.
  it.each([4294967268, 228])(
    'reports ffmpeg exit code %i as a full disk',
    async (exitCode) => {
      const conversionPromise = createVideoFromNonVideo(
        `/tmp/disk-full-${exitCode}.mp3`,
        '/bin/ffmpeg',
        TEMP,
      );
      await waitUntil(() => typeof ffmpegOnMap.error === 'function');

      ffmpegOnMap.error?.(
        new Error(`ffmpeg exited with code ${exitCode}: Conversion failed!`),
      );

      await expect(conversionPromise).rejects.toMatchObject({
        code: 'ENOSPC',
        message: `ENOSPC: no space left on device, ffmpeg exited with code ${exitCode}: Conversion failed!`,
      });
    },
  );

  it('leaves other ffmpeg exit codes as they are', async () => {
    const conversionPromise = createVideoFromNonVideo(
      '/tmp/out-of-memory.mp3',
      '/bin/ffmpeg',
      TEMP,
    );
    await waitUntil(() => typeof ffmpegOnMap.error === 'function');

    const error = new Error('ffmpeg exited with code 4294967284: frame=0');
    ffmpegOnMap.error?.(error);

    await expect(conversionPromise).rejects.toBe(error);
  });

  it('resolves once the ffmpeg process reports completion', async () => {
    const { pathExists } = await import('fs-extra/esm');
    (
      pathExists as unknown as Mock<(p: string) => Promise<boolean>>
    ).mockResolvedValue(false);

    const conversionPromise = createVideoFromNonVideo(
      '/tmp/be3-success.mp3',
      '/bin/ffmpeg',
      TEMP,
    );
    await waitUntil(() => typeof ffmpegOnMap.end === 'function');

    ffmpegOnMap.end?.();

    await expect(conversionPromise).resolves.toEqual(
      convertedIn(TEMP, 'be3-success'),
    );
  });

  it('kills every in-progress ffmpeg command on cleanupFfmpegConversions', async () => {
    const { pathExists } = await import('fs-extra/esm');
    (
      pathExists as unknown as Mock<(p: string) => Promise<boolean>>
    ).mockResolvedValue(false);

    const conversionPromise = createVideoFromNonVideo(
      '/tmp/be3-cleanup.mp3',
      '/bin/ffmpeg',
      TEMP,
    );
    await waitUntil(() => typeof ffmpegOnMap.error === 'function');
    const command = ffmpegChain as unknown as RunnableFfmpegCommand;
    expect(wasStoppedAtQuit(command)).toBe(false);

    cleanupFfmpegConversions();

    expect(ffmpegChain.kill).toHaveBeenCalledWith('SIGKILL');
    // Its run failing is the app quitting, not ffmpeg (see playback-conversion).
    expect(wasStoppedAtQuit(command)).toBe(true);

    // Settle the still-pending conversion so it doesn't leak into other tests.
    ffmpegOnMap.error?.(new Error('killed'));
    await expect(conversionPromise).rejects.toThrow('killed');
  });
});
