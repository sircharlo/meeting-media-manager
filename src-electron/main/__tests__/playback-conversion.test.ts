import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

// What `ffmpeg -i <file>` and `ffmpeg -filters` print, per test.
let fileDescription = '';
let filterList = '';

vi.mock('node:child_process', () => ({
  execFile: vi.fn(
    (
      _path: string,
      args: string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      callback(
        new Error('exit 1'),
        '',
        args.includes('-filters') ? filterList : fileDescription,
      );
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
}));

const request = {
  id: 'job-1',
  outputPath: '/tmp/out.mp4',
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
  beforeEach(() => {
    vi.clearAllMocks();
    listeners = {};
    fileDescription = `Input #0, mov,mp4: \n  Duration: 00:01:00.00, start: 0.000000\n${SDR_VIDEO}`;
    filterList = FILTERS_WITH_ZSCALE;
  });

  describe('getConversionOptions', () => {
    it('re-encodes the picture to H.264 and the sound to AAC, with half the threads given', async () => {
      const { getConversionOptions } = await importModule();
      const options = getConversionOptions({
        keepVideo: false,
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
        keepVideo: true,
        threads: 2,
        toneMap: false,
      });
      expect(options[options.indexOf('-c:v') + 1]).toBe('copy');
      expect(options).not.toContain('-vf');
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
  });
});
