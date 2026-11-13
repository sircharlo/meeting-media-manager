import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest';

// What `ffmpeg -i <file>`, `-filters` and `-encoders` print, per test, and
// the encoders whose one-frame test fails on this "computer".
let fileDescription = '';
let filterList = '';
let encoderList = '';
let failingEncoders = new Set<string>();

const ffmpegOutputFor = (args: string[]) => {
  if (args.includes('-filters')) return filterList;
  if (args.includes('-encoders')) return encoderList;
  return fileDescription;
};

vi.mock('node:child_process', () => ({
  execFile: vi.fn(
    (
      _path: string,
      args: string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      // A one-frame test encode, to nowhere.
      if (args.includes('null')) {
        const encoder = args[args.indexOf('-c:v') + 1] ?? '';
        callback(
          failingEncoders.has(encoder)
            ? new Error('Cannot load nvcuda.dll')
            : null,
          '',
          '',
        );
        return;
      }
      callback(new Error('exit 1'), '', ffmpegOutputFor(args));
    },
  ),
}));

vi.mock('node:os', () => ({
  availableParallelism: () => 12,
  constants: { priority: { PRIORITY_BELOW_NORMAL: 10 } },
  setPriority: vi.fn(),
}));

interface FakeCommand {
  ffmpegProc: { pid: number };
  inputOptions: Mock<(options: string[]) => FakeCommand>;
  kill: Mock<(signal: string) => void>;
  on: Mock<(event: string, listener: Listener) => FakeCommand>;
  outputOptions: Mock<(options: string[]) => FakeCommand>;
  save: Mock<(output: string) => void>;
}
type Listener = (...args: unknown[]) => void;
let listeners: Record<string, Listener> = {};
let finish: { reject: (error: Error) => void; resolve: () => void };
const command: FakeCommand = {
  ffmpegProc: { pid: 4321 },
  inputOptions: vi.fn(() => command),
  kill: vi.fn(() => {
    finish.reject(new Error('ffmpeg was killed with signal SIGKILL'));
  }),
  on: vi.fn((event: string, listener: Listener) => {
    listeners[event] = listener;
    return command;
  }),
  outputOptions: vi.fn(() => command),
  save: vi.fn(),
};

vi.mock('fluent-ffmpeg', () => ({
  default: Object.assign(() => command, { setFfmpegPath: vi.fn() }),
}));

vi.mock('src-electron/main/ffmpeg', () => ({
  assertValidFfmpegPath: vi.fn(async () => undefined),
  runFfmpegCommand: vi.fn(
    () =>
      new Promise<void>((resolve, reject) => {
        finish = { reject, resolve };
      }),
  ),
  wasStoppedAtQuit: vi.fn(() => false),
}));

// The app's Temp folder is in the shared data folder here; the per-user one
// is where it falls back to.
vi.mock('src-electron/main/fs', () => ({
  getAppDataPath: vi.fn(async () => '/app-data'),
}));
vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/user-data') },
}));

const request = {
  id: 'job-1',
  outputPath: '/app-data/Temp/conversion-job-1.mp4',
  sourcePath: '/media/clip.mov',
};

const SDR_VIDEO =
  '  Stream #0:0[0x1](und): Video: hevc (Main) (hvc1 / 0x31637668), yuv420p(tv, bt709), 1920x1080';
const HLG_VIDEO =
  '  Stream #0:0[0x1](und): Video: hevc (Main 10) (hvc1 / 0x31637668), yuv420p10le(tv, bt2020nc/bt2020/arib-std-b67), 3840x2160';
const FILTERS_WITH_ZSCALE =
  ' ... tonemap           V->V       Conversion to/from different dynamic ranges.\n .SC zscale            V->V       Apply resizing, colorspace and bit depth conversion.';

const importModule = async () => {
  vi.resetModules();
  return import('../playback-conversion');
};

/** Waits until fluent-ffmpeg would have been asked to run. */
const started = async () => {
  await vi.waitFor(() => {
    expect(listeners.start).toBeDefined();
  });
};

const videoFiltersOf = () => {
  const options = command.outputOptions.mock.calls[0]?.[0] as string[];
  const index = options.indexOf('-vf');
  return index === -1 ? null : options[index + 1];
};

describe('playback-conversion', () => {
  const platform = process.platform;
  const setPlatform = (value: NodeJS.Platform) => {
    Object.defineProperty(process, 'platform', { configurable: true, value });
  };

  afterEach(() => {
    setPlatform(platform);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    listeners = {};
    encoderList = '';
    failingEncoders = new Set();
    setPlatform('win32');
    fileDescription = `Input #0, mov,mp4: \n  Duration: 00:01:00.00, start: 0.000000\n${SDR_VIDEO}`;
    filterList = FILTERS_WITH_ZSCALE;
  });

  describe('getConversionOptions', () => {
    it('re-encodes the picture to H.264 and the sound to AAC, with half the threads given', async () => {
      const { getConversionOptions } = await importModule();
      const options = getConversionOptions({
        encoder: { name: 'libx264', options: ['-crf', '20'] },
        threads: 6,
        toneMap: false,
      });
      expect(options).toEqual(
        expect.arrayContaining(['libx264', 'aac', '+faststart', 'mp4']),
      );
      expect(options[options.indexOf('-threads') + 1]).toBe('6');
      // The first picture that isn't cover art, and sound only if there is any.
      expect(options).toEqual(expect.arrayContaining(['0:V:0?', '0:a:0?']));
    });

    it('copies the picture when only the sound needs converting', async () => {
      const { getConversionOptions } = await importModule();
      const options = getConversionOptions({
        encoder: null,
        threads: 2,
        toneMap: false,
      });
      expect(options[options.indexOf('-c:v') + 1]).toBe('copy');
      expect(options).not.toContain('-vf');
    });

    it('keeps the filters to the threads given too', async () => {
      const { getConversionOptions, getInputOptions } = await importModule();
      const options = getConversionOptions({
        encoder: { name: 'libx264', options: [] },
        threads: 6,
        toneMap: true,
      });
      expect(options[options.indexOf('-filter_threads') + 1]).toBe('6');
      // The decoder's are the input's: ffmpeg's -threads applies to the file
      // it comes before.
      expect(getInputOptions(6)).toEqual(['-threads', '6']);
    });

    it('leaves the picture out of a sound-only file', async () => {
      const { getConversionOptions } = await importModule();
      const options = getConversionOptions({
        audioOnly: true,
        encoder: null,
        threads: 2,
        toneMap: false,
      });
      expect(options).toContain('-vn');
      expect(options).not.toContain('-c:v');
      expect(options).not.toContain('0:V:0?');
      expect(options).toEqual(expect.arrayContaining(['0:a:0?', 'aac']));
    });
  });

  describe('getVideoFilters', () => {
    it('fits Full HD without scaling up, with square pixels in 8-bit 4:2:0', async () => {
      const { getVideoFilters } = await importModule();
      expect(getVideoFilters(false)).toBe(
        "scale=w='min(1920,iw)':h='min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,format=yuv420p",
      );
    });

    it('tone-maps HDR first when asked to', async () => {
      const { getVideoFilters } = await importModule();
      expect(getVideoFilters(true)).toMatch(/^zscale=t=linear.*tonemap=/);
    });
  });

  describe('convertForPlayback', () => {
    it('reports progress from ffmpeg time marks, at most twice a second, then 100', async () => {
      vi.useFakeTimers();
      const { convertForPlayback } = await importModule();
      const progress: number[] = [];
      const conversion = convertForPlayback(
        '/bin/ffmpeg',
        { ...request, durationSeconds: 120 },
        ({ percent }) => progress.push(percent),
      );
      await started();

      vi.setSystemTime(10_000);
      listeners.stderr?.(
        'frame=  100 fps= 50 q=28.0 time=00:00:30.00 bitrate=1',
      );
      listeners.stderr?.(
        'frame=  101 fps= 50 q=28.0 time=00:00:31.00 bitrate=1',
      );
      vi.setSystemTime(11_000);
      listeners.stderr?.(
        'frame=  300 fps= 50 q=28.0 time=00:01:30.00 bitrate=1',
      );
      finish.resolve();
      await conversion;

      expect(progress).toEqual([25, 75, 100]);
      vi.useRealTimers();
    });

    it("takes the duration from ffmpeg's description when it wasn't given", async () => {
      const { convertForPlayback } = await importModule();
      const progress: number[] = [];
      const conversion = convertForPlayback('/bin/ffmpeg', request, (p) =>
        progress.push(p.percent),
      );
      await started();
      listeners.stderr?.('frame=1 time=00:00:15.00 bitrate=1');
      finish.resolve();
      await conversion;
      expect(progress[0]).toBe(25);
    });

    it('runs below normal priority', async () => {
      const { setPriority } = await import('node:os');
      const { convertForPlayback } = await importModule();
      const conversion = convertForPlayback('/bin/ffmpeg', request, vi.fn());
      await started();
      listeners.start?.();
      finish.resolve();
      await conversion;
      expect(setPriority).toHaveBeenCalledWith(4321, 10);
    });

    it('tone-maps an HDR video when this ffmpeg can', async () => {
      fileDescription = `  Duration: 00:00:06.00\n${HLG_VIDEO}`;
      const { convertForPlayback } = await importModule();
      const conversion = convertForPlayback('/bin/ffmpeg', request, vi.fn());
      await started();
      finish.resolve();
      await conversion;
      expect(videoFiltersOf()).toContain('tonemap=');
    });

    it('converts an HDR video without tone-mapping when this ffmpeg has no zscale', async () => {
      fileDescription = `  Duration: 00:00:06.00\n${HLG_VIDEO}`;
      filterList = ' ... scale  V->V  Scale the input video size';
      const { convertForPlayback } = await importModule();
      const conversion = convertForPlayback('/bin/ffmpeg', request, vi.fn());
      await started();
      finish.resolve();
      await conversion;
      expect(videoFiltersOf()).not.toContain('tonemap=');
    });

    it('rejects as cancelled once cancelled, and kills ffmpeg', async () => {
      const {
        cancelPlaybackConversion,
        CONVERSION_CANCELLED,
        convertForPlayback,
      } = await importModule();
      const conversion = convertForPlayback('/bin/ffmpeg', request, vi.fn());
      await started();

      expect(cancelPlaybackConversion('job-1')).toBe(true);
      await expect(conversion).rejects.toThrow(CONVERSION_CANCELLED);
      expect(command.kill).toHaveBeenCalledWith('SIGKILL');
      expect(cancelPlaybackConversion('job-1')).toBe(false);
    });

    it('stops ffmpeg as it starts when cancelled before it had', async () => {
      const { cancelPlaybackConversion, convertForPlayback } =
        await importModule();
      const conversion = convertForPlayback('/bin/ffmpeg', request, vi.fn());
      await started();
      // Still checking ffmpeg's capabilities: no process to stop yet.
      command.kill.mockImplementationOnce(() => undefined);
      cancelPlaybackConversion('job-1');

      listeners.start?.();
      await expect(conversion).rejects.toThrow('conversion-cancelled');
      expect(command.kill).toHaveBeenCalledTimes(2);
    });

    it('passes other failures on as they are', async () => {
      const { convertForPlayback } = await importModule();
      const conversion = convertForPlayback('/bin/ffmpeg', request, vi.fn());
      await started();
      finish.reject(new Error('ffmpeg exited with code 1: Invalid data'));
      await expect(conversion).rejects.toThrow('Invalid data');
    });

    it('is cancelled before ffmpeg starts, while the file is still being looked at', async () => {
      const { runFfmpegCommand } = await import('src-electron/main/ffmpeg');
      const {
        cancelPlaybackConversion,
        CONVERSION_CANCELLED,
        convertForPlayback,
      } = await importModule();
      const conversion = convertForPlayback('/bin/ffmpeg', request, vi.fn());

      expect(cancelPlaybackConversion('job-1')).toBe(true);
      await expect(conversion).rejects.toThrow(CONVERSION_CANCELLED);
      expect(runFfmpegCommand).not.toHaveBeenCalled();
      expect(cancelPlaybackConversion('job-1')).toBe(false);
    });

    it('decodes on the threads given too', async () => {
      const { convertForPlayback } = await importModule();
      const conversion = convertForPlayback('/bin/ffmpeg', request, vi.fn());
      await started();
      finish.resolve();
      await conversion;
      expect(command.inputOptions).toHaveBeenCalledWith(['-threads', '6']);
      const options = command.outputOptions.mock.calls[0]?.[0] ?? [];
      expect(options[options.indexOf('-filter_threads') + 1]).toBe('6');
    });

    it('converts only the sound into an .m4a, without choosing a video encoder', async () => {
      encoderList = ' V..... h264_qsv             H.264 (Intel Quick Sync)';
      const { convertForPlayback } = await importModule();
      const conversion = convertForPlayback(
        '/bin/ffmpeg',
        { ...request, outputPath: '/app-data/Temp/conversion-job-1.m4a' },
        vi.fn(),
      );
      await started();
      finish.resolve();

      await expect(conversion).resolves.toEqual({ encoder: 'none' });
      const options = command.outputOptions.mock.calls[0]?.[0] ?? [];
      expect(options).toContain('-vn');
      expect(options).not.toContain('-c:v');
      const { execFile } = await import('node:child_process');
      expect(
        vi
          .mocked(execFile)
          .mock.calls.some((call) =>
            (call[1] as string[]).includes('-encoders'),
          ),
      ).toBe(false);
    });

    it.each([
      [
        'outside the temp folder',
        { outputPath: '/media/clip.mp4' },
        "Refusing to convert into /media, not the app's temp folder (/user-data/Temp, /app-data/Temp)",
      ],
      [
        'in a folder under it',
        { outputPath: '/app-data/Temp/../Publications/x.mp4' },
        "Refusing to convert into /app-data/Publications, not the app's temp folder",
      ],
      [
        'of another kind',
        { outputPath: '/app-data/Temp/conversion-job-1.mkv' },
        'Refusing to convert into a ".mkv" file, not .mp4 or .m4a',
      ],
      [
        'over the file converted',
        {
          outputPath: '/app-data/Temp/clip.mp4',
          sourcePath: '/APP-DATA/Temp/clip.mp4',
        },
        'Refusing to convert a file over itself',
      ],
      [
        'relative',
        { outputPath: 'conversion-job-1.mp4' },
        'Refusing to convert: outputPath isn\'t an absolute path: "conversion-job-1.mp4"',
      ],
      [
        'without a source',
        { sourcePath: undefined },
        "Refusing to convert: sourcePath isn't an absolute path: undefined",
      ],
    ])(
      'refuses an output %s, before ffmpeg is run',
      async (_case, changes, message) => {
        const { convertForPlayback } = await importModule();
        await expect(
          convertForPlayback(
            '/bin/ffmpeg',
            { ...request, ...changes } as typeof request,
            vi.fn(),
          ),
        ).rejects.toThrow(message);
        const { execFile } = await import('node:child_process');
        expect(execFile).not.toHaveBeenCalled();
      },
    );

    it('takes an output in the per-user temp folder the app falls back to', async () => {
      const { convertForPlayback } = await importModule();
      const conversion = convertForPlayback(
        '/bin/ffmpeg',
        { ...request, outputPath: '/user-data/Temp/conversion-job-1.mp4' },
        vi.fn(),
      );
      await started();
      finish.resolve();
      await expect(conversion).resolves.toBeDefined();
    });
  });

  describe('choosing the encoder', () => {
    // As \`ffmpeg -encoders\` lists them: every one it was built with.
    const ALL_WINDOWS_ENCODERS = [
      ' V....D libx264              libx264 H.264 / AVC / MPEG-4 AVC',
      ' V....D h264_amf             AMD AMF H.264 Encoder (codec h264)',
      ' V....D h264_nvenc           NVIDIA NVENC H.264 encoder (codec h264)',
      ' V..... h264_qsv             H.264 (Intel Quick Sync Video acceleration)',
    ].join('\n');

    /** Converts, letting its ffmpeg run finish. */
    const convert = async (options: { keepVideo?: boolean } = {}) => {
      const { runFfmpegCommand } = await import('src-electron/main/ffmpeg');
      const runs = vi.mocked(runFfmpegCommand).mock.calls.length;
      const { convertForPlayback } = await import('../playback-conversion');
      const conversion = convertForPlayback(
        '/bin/ffmpeg',
        { ...request, ...options },
        vi.fn(),
      );
      await vi.waitFor(() => {
        expect(runFfmpegCommand).toHaveBeenCalledTimes(runs + 1);
      });
      finish.resolve();
      return conversion;
    };

    const encoderUsed = () => {
      const options = command.outputOptions.mock.calls.at(-1)?.[0] ?? [];
      return options[options.indexOf('-c:v') + 1];
    };

    beforeEach(() => {
      vi.resetModules();
      encoderList = ALL_WINDOWS_ENCODERS;
    });

    it('uses the best graphics-card encoder that works on this computer', async () => {
      failingEncoders = new Set(['h264_nvenc']);
      await expect(convert()).resolves.toEqual({ encoder: 'h264_qsv' });
      expect(encoderUsed()).toBe('h264_qsv');
      expect(command.outputOptions.mock.calls[0]?.[0]).toEqual(
        expect.arrayContaining(['-global_quality', '21']),
      );
    });

    it('only tries the ones this ffmpeg was built with, once', async () => {
      encoderList = ' V..... h264_qsv             H.264 (Intel Quick Sync)';
      await convert();
      await convert();
      const { execFile } = await import('node:child_process');
      const tried = vi
        .mocked(execFile)
        .mock.calls.map((call) => call[1] as string[])
        .filter((args) => args.includes('null'))
        .map((args) => args[args.indexOf('-c:v') + 1]);
      expect(tried).toEqual(['h264_qsv']);
    });

    it('uses x264 when no graphics-card encoder works', async () => {
      failingEncoders = new Set(['h264_amf', 'h264_nvenc', 'h264_qsv']);
      await expect(convert()).resolves.toEqual({ encoder: 'libx264' });
    });

    it('uses x264 where M³ knows no graphics-card encoder', async () => {
      setPlatform('freebsd');
      await expect(convert()).resolves.toEqual({ encoder: 'libx264' });
    });

    it('copies the picture without choosing an encoder when only the sound needs converting', async () => {
      await expect(convert({ keepVideo: true })).resolves.toEqual({
        encoder: 'copy',
      });
      const { execFile } = await import('node:child_process');
      expect(
        vi
          .mocked(execFile)
          .mock.calls.some((call) =>
            (call[1] as string[]).includes('-encoders'),
          ),
      ).toBe(false);
    });

    it('converts again with x264 when the graphics card fails on the real file, and keeps to x264', async () => {
      const { runFfmpegCommand } = await import('src-electron/main/ffmpeg');
      const { convertForPlayback } = await import('../playback-conversion');
      const progress: number[] = [];
      const conversion = convertForPlayback('/bin/ffmpeg', request, (p) =>
        progress.push(p.percent),
      );
      await started();
      finish.reject(
        new Error('ffmpeg exited with code 1: Error during encoding'),
      );
      await vi.waitFor(() => {
        expect(runFfmpegCommand).toHaveBeenCalledTimes(2);
      });
      finish.resolve();

      await expect(conversion).resolves.toEqual({ encoder: 'libx264' });
      expect(progress).toEqual([0, 100]);
      // The next file goes straight to x264.
      await expect(convert()).resolves.toEqual({ encoder: 'libx264' });
      expect(runFfmpegCommand).toHaveBeenCalledTimes(3);
    });

    it("doesn't convert again once cancelled", async () => {
      const { runFfmpegCommand } = await import('src-electron/main/ffmpeg');
      const { cancelPlaybackConversion, convertForPlayback } =
        await import('../playback-conversion');
      const conversion = convertForPlayback('/bin/ffmpeg', request, vi.fn());
      await started();
      cancelPlaybackConversion('job-1');
      await expect(conversion).rejects.toThrow('conversion-cancelled');
      expect(runFfmpegCommand).toHaveBeenCalledTimes(1);
    });

    it('takes ffmpeg killed as the app quits for a cancel, not the graphics card failing', async () => {
      const { runFfmpegCommand, wasStoppedAtQuit } =
        await import('src-electron/main/ffmpeg');
      const { CONVERSION_CANCELLED, convertForPlayback } =
        await import('../playback-conversion');
      const conversion = convertForPlayback('/bin/ffmpeg', request, vi.fn());
      await started();
      vi.mocked(wasStoppedAtQuit).mockReturnValueOnce(true);
      finish.reject(new Error('ffmpeg was killed with signal SIGKILL'));

      await expect(conversion).rejects.toThrow(CONVERSION_CANCELLED);
      expect(runFfmpegCommand).toHaveBeenCalledTimes(1);
      // Still the graphics card's encoder for the next file.
      await expect(convert()).resolves.toEqual({ encoder: 'h264_nvenc' });
    });
  });
});
