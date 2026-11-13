import type { MediaItem, PlaybackProblem } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import upath from 'upath';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

const errorCatcher = vi.fn();
vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: (...args: unknown[]) => errorCatcher(...args),
}));

vi.mock('boot/i18n', () => ({
  i18n: {
    global: {
      t: (key: string, values?: unknown) =>
        typeof values === 'object' && values && Object.keys(values).length
          ? `${key}:${JSON.stringify(values)}`
          : key,
    },
  },
}));

const meetingStart = vi.fn<() => Date | null>(() => null);
vi.mock('src/helpers/date', () => ({
  getTodaysMeetingStartDateTime: () => meetingStart(),
}));

const setupFFmpeg = vi.fn(async () => '/bin/ffmpeg');
vi.mock('src/helpers/fs', () => ({
  getThumbnailUrl: vi.fn(async () => 'file:///thumb.jpg'),
  setupFFmpeg: () => setupFFmpeg(),
}));

const updateNotice = vi.fn();
const createTemporaryNotification = vi.fn(() => updateNotice);
vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: (...args: unknown[]) =>
    createTemporaryNotification(...(args as [])),
}));

vi.mock('src/utils/fs', () => ({
  getConvertedMediaPath: async () => '/cache/Converted Media',
  getTempPath: async () => '/temp',
}));

const findPlaybackProblem = vi.fn<() => Promise<null | PlaybackProblem>>();
vi.mock('src/utils/media', () => ({
  findPlaybackProblem: () => findPlaybackProblem(),
  getMetadataFromMediaPath: vi.fn(async () => ({ format: { duration: 6 } })),
  isAudio: (path: string) => /\.(?:m4a|mp3|wav)$/i.test(path),
  isVideo: (path: string) => /\.(?:avi|mkv|mov|mp4)$/i.test(path),
}));

const currentState = reactive({
  currentCongregation: 'cong',
  mediaPlaying: { url: '' },
});
const jwStore = reactive({
  lookupPeriod: {} as Record<
    string,
    { mediaSections: { items: MediaItem[] }[] }[]
  >,
});
vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => currentState,
}));
vi.mock('stores/jw', () => ({ useJwStore: () => jwStore }));

const fs = {
  ensureDir: vi.fn(async () => undefined),
  move: vi.fn<
    (
      from: string,
      to: string,
      options?: { overwrite: boolean },
    ) => Promise<void>
  >(async () => undefined),
  pathExists: vi.fn<(path: string) => Promise<boolean>>(async () => true),
  remove: vi.fn<(path: string) => Promise<void>>(async () => undefined),
  rename: vi.fn<(from: string, to: string) => Promise<void>>(
    async () => undefined,
  ),
  stat: vi.fn<(path: string) => Promise<{ mtimeMs: number; size: number }>>(
    async () => ({ mtimeMs: 100, size: 2000 }),
  ),
};
const convertForPlayback = vi.fn(async () => ({ encoder: 'h264_qsv' }));
const cancelPlaybackConversion = vi.fn(async () => true);

const fileUrl = (path: string) => `file://${path}`;
const item = (path: string, overrides: Partial<MediaItem> = {}): MediaItem => ({
  duration: 60,
  fileUrl: fileUrl(path),
  isVideo: true,
  source: 'additional',
  title: upath.basename(path),
  type: 'media',
  uniqueId: `id-${upath.basename(path)}`,
  ...overrides,
});

const PICTURE: PlaybackProblem = { codec: '<hvc1>', missing: 'picture' };
const SOUND: PlaybackProblem = { codec: 'AC3', missing: 'sound' };

const load = async (items: MediaItem[]) => {
  jwStore.lookupPeriod = { cong: [{ mediaSections: [{ items }] }] };
  const helper = await import('../media-conversion');
  const { useMediaConversionStore } = await import('stores/media-conversion');
  return {
    helper,
    items: jwStore.lookupPeriod.cong?.[0]?.mediaSections[0]?.items ?? [],
    store: useMediaConversionStore(),
  };
};

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Lets the queue run to its end. */
const settle = async () => {
  const { useMediaConversionStore } = await import('stores/media-conversion');
  await vi.waitFor(() => {
    expect(useMediaConversionStore().activeJobs).toHaveLength(0);
  });
};

describe('media-conversion', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    setActivePinia(createPinia());
    currentState.mediaPlaying.url = '';
    fs.ensureDir.mockResolvedValue(undefined);
    fs.move.mockResolvedValue(undefined);
    fs.pathExists.mockResolvedValue(true);
    fs.remove.mockResolvedValue(undefined);
    fs.rename.mockResolvedValue(undefined);
    fs.stat.mockResolvedValue({ mtimeMs: 100, size: 2000 });
    setupFFmpeg.mockResolvedValue('/bin/ffmpeg');
    convertForPlayback.mockResolvedValue({ encoder: 'h264_qsv' });
    vi.stubGlobal('electronApi', {
      basename: upath.basename,
      cancelPlaybackConversion,
      changeExt: upath.changeExt,
      convertForPlayback,
      dirname: upath.dirname,
      extname: upath.extname,
      fileUrlToPath: (url: string) => url.replace(/^file:\/\//, ''),
      fs,
      join: upath.join,
      normalize: upath.normalize,
      onMediaConversionProgress: vi.fn(() => () => undefined),
      pathToFileURL: (path: string) => fileUrl(upath.normalize(path)),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkMediaPlayback', () => {
    it('checks a file once a session, and again once it changes', async () => {
      findPlaybackProblem.mockResolvedValue(PICTURE);
      const { helper, store } = await load([]);

      await helper.checkMediaPlayback(fileUrl('/media/a.mp4'));
      await helper.checkMediaPlayback(fileUrl('/media/a.mp4'));
      expect(findPlaybackProblem).toHaveBeenCalledTimes(1);
      expect(store.problemFor('/media/a.mp4')).toEqual(PICTURE);

      fs.stat.mockResolvedValue({ mtimeMs: 200, size: 2000 });
      findPlaybackProblem.mockResolvedValue(null);
      await helper.checkMediaPlayback(fileUrl('/media/a.mp4'));
      expect(findPlaybackProblem).toHaveBeenCalledTimes(2);
      expect(store.problemFor('/media/a.mp4')).toBeNull();
    });

    it('leaves files that are neither audio nor video alone', async () => {
      const { helper } = await load([]);
      await expect(
        helper.checkMediaPlayback(fileUrl('/media/a.jpg')),
      ).resolves.toBeNull();
      expect(findPlaybackProblem).not.toHaveBeenCalled();
    });
  });

  describe('the notice', () => {
    it('names the one file, or counts several, in one notice', async () => {
      vi.useFakeTimers();
      findPlaybackProblem.mockResolvedValue(PICTURE);
      const { helper } = await load([item('/add/a.mp4'), item('/add/b.mp4')]);

      await helper.checkMediaPlayback('/add/a.mp4', { notify: true });
      await helper.checkMediaPlayback('/add/b.mp4', { notify: true });
      await vi.advanceTimersByTimeAsync(1500);

      expect(createTemporaryNotification).toHaveBeenCalledTimes(1);
      expect(createTemporaryNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'media-cannot-play-here-notice-many:{"count":2}',
          timeout: 0,
          type: 'warning',
        }),
      );
    });

    it('drops a file once its conversion starts, and closes when none are left', async () => {
      vi.useFakeTimers();
      findPlaybackProblem.mockResolvedValue(PICTURE);
      convertForPlayback.mockReturnValue(
        new Promise<{ encoder: string }>(() => {
          // Never settles: the conversions stay under way.
        }),
      );
      const { helper, items } = await load([
        item('/add/a.mp4'),
        item('/add/b.mp4'),
      ]);
      await helper.checkMediaPlayback('/add/a.mp4', { notify: true });
      await helper.checkMediaPlayback('/add/b.mp4', { notify: true });
      await vi.advanceTimersByTimeAsync(1500);

      helper.startMediaConversion([items[0] as MediaItem]);
      await vi.advanceTimersByTimeAsync(0);
      expect(updateNotice).toHaveBeenLastCalledWith(
        expect.objectContaining({
          message: 'media-cannot-play-here-notice:{"title":"b.mp4"}',
        }),
      );

      helper.startMediaConversion([items[1] as MediaItem]);
      await vi.advanceTimersByTimeAsync(0);
      expect(updateNotice).toHaveBeenLastCalledWith();
    });
  });

  describe('requestMediaConversion', () => {
    it('asks about the files M³ can convert, not already converting', async () => {
      const { helper, items, store } = await load([
        item('/add/a.mp4'),
        item('/pubs/b.mp4', { source: 'dynamic' }),
      ]);
      helper.requestMediaConversion(items);
      expect(store.pendingConfirmation?.map((i) => i.uniqueId)).toEqual([
        'id-a.mp4',
      ]);
    });

    it('warns when the meeting starts within the hour', async () => {
      const { helper } = await load([]);
      meetingStart.mockReturnValue(new Date(Date.now() + 20 * 60_000));
      expect(helper.getMeetingSoonMinutes()).toBe(20);
      meetingStart.mockReturnValue(new Date(Date.now() + 3 * 3600_000));
      expect(helper.getMeetingSoonMinutes()).toBeNull();
    });
  });

  describe('converting', () => {
    it('replaces an imported MKV with an MP4 next to it, keeping the item', async () => {
      fs.pathExists.mockImplementation(
        async (path: string) => path !== '/add/2026/movie.mp4',
      );
      const { helper, items, store } = await load([
        item('/add/2026/movie.mkv'),
      ]);
      store.checks['/add/2026/movie.mkv'] = { key: '2000:100', problem: SOUND };

      helper.startMediaConversion(items);
      await settle();

      const [job] = store.jobs;
      expect(job?.status).toBe('done');
      expect(convertForPlayback).toHaveBeenCalledWith('/bin/ffmpeg', {
        durationSeconds: 60,
        id: job?.id,
        keepVideo: true,
        outputPath: `/temp/conversion-${job?.id}.mp4`,
        sourcePath: '/add/2026/movie.mkv',
      });
      // Beside its destination first, then over it in one step.
      const staging = `/add/2026/movie.mp4.${job?.id.slice(0, 8)}.converting`;
      expect(fs.move).toHaveBeenCalledWith(
        `/temp/conversion-${job?.id}.mp4`,
        staging,
        { overwrite: true },
      );
      expect(fs.rename).toHaveBeenCalledWith(staging, '/add/2026/movie.mp4');
      expect(fs.remove).toHaveBeenCalledWith('/add/2026/movie.mkv');
      // The thumbnail of what the original showed.
      expect(fs.remove).toHaveBeenCalledWith('/add/2026/movie.jpg');
      expect(items[0]?.fileUrl).toBe(fileUrl('/add/2026/movie.mp4'));
      expect(items[0]?.uniqueId).toBe('id-movie.mkv');
      expect(store.problemFor('/add/2026/movie.mp4')).toBeNull();
    });

    it("doesn't overwrite another file with the MP4's name", async () => {
      const { helper, items, store } = await load([item('/add/movie.mkv')]);
      store.checks['/add/movie.mkv'] = { key: '2000:100', problem: SOUND };

      helper.startMediaConversion(items);
      await settle();

      expect(String(fs.rename.mock.calls[0]?.[1])).toMatch(
        /^\/add\/movie-[0-9a-f]{8}\.mp4$/,
      );
    });

    it('converts an imported MP4 in place, never deleting it first', async () => {
      const { helper, items, store } = await load([item('/add/clip.mp4')]);
      store.checks['/add/clip.mp4'] = { key: '2000:100', problem: PICTURE };

      helper.startMediaConversion(items);
      await settle();

      expect(convertForPlayback).toHaveBeenCalledWith(
        '/bin/ffmpeg',
        expect.objectContaining({ keepVideo: false }),
      );
      // fs-extra's move with overwrite deletes its destination first.
      expect(fs.move).not.toHaveBeenCalledWith(
        expect.anything(),
        '/add/clip.mp4',
        expect.anything(),
      );
      expect(fs.rename).toHaveBeenCalledWith(
        expect.stringMatching(/^\/add\/clip\.mp4\.[0-9a-f]{8}\.converting$/),
        '/add/clip.mp4',
      );
      expect(fs.remove).not.toHaveBeenCalledWith('/add/clip.mp4');
      expect(store.jobs[0]?.status).toBe('done');
    });

    it.each([
      ['copying it beside the original', 'move'],
      ['putting it over the original', 'rename'],
    ] as const)(
      'keeps the original when %s fails',
      async (_step, failingStep) => {
        vi.useFakeTimers();
        fs[failingStep].mockRejectedValue(
          Object.assign(new Error('ENOSPC: no space left on device'), {
            code: 'ENOSPC',
          }),
        );
        const { helper, items, store } = await load([item('/add/clip.mp4')]);
        store.checks['/add/clip.mp4'] = { key: '2000:100', problem: PICTURE };

        helper.startMediaConversion(items);
        await vi.advanceTimersByTimeAsync(10_000);
        await settle();

        expect(store.jobs[0]?.status).toBe('failed');
        expect(fs.remove).not.toHaveBeenCalledWith('/add/clip.mp4');
        expect(fs.move).not.toHaveBeenCalledWith(
          expect.anything(),
          '/add/clip.mp4',
          expect.anything(),
        );
        // What was copied beside it is gone, and so is the conversion.
        expect(fs.remove).toHaveBeenCalledWith(
          expect.stringMatching(/^\/add\/clip\.mp4\.[0-9a-f]{8}\.converting$/),
        );
        expect(fs.remove).toHaveBeenCalledWith(
          expect.stringMatching(/^\/temp\/conversion-/),
        );
        expect(items[0]?.fileUrl).toBe(fileUrl('/add/clip.mp4'));
        expect(String(errorCatcher.mock.calls[0]?.[0])).toContain('ENOSPC');
      },
    );

    it('converts a sound-only file into an M4A, which the media window plays as sound', async () => {
      fs.pathExists.mockImplementation(
        async (path: string) => path !== '/add/song.m4a',
      );
      const { helper, items, store } = await load([
        item('/add/song.wav', { isAudio: true, isVideo: false }),
      ]);
      store.checks['/add/song.wav'] = { key: '2000:100', problem: SOUND };

      helper.startMediaConversion(items);
      await settle();

      const id = store.jobs[0]?.id;
      expect(convertForPlayback).toHaveBeenCalledWith(
        '/bin/ffmpeg',
        expect.objectContaining({ outputPath: `/temp/conversion-${id}.m4a` }),
      );
      expect(fs.rename).toHaveBeenCalledWith(
        expect.any(String),
        '/add/song.m4a',
      );
      expect(items[0]?.fileUrl).toBe(fileUrl('/add/song.m4a'));
      // A sound-only file has no thumbnail saved beside it.
      expect(fs.remove).not.toHaveBeenCalledWith('/add/song.jpg');
    });

    it('converts an M4A in place, and a watched one into an M4A copy', async () => {
      const { helper, items, store } = await load([
        item('/add/song.m4a', { isAudio: true, isVideo: false }),
        item('/watch/2026-11-13/hymn.wav', {
          isAudio: true,
          isVideo: false,
          source: 'watched',
        }),
      ]);
      store.checks['/add/song.m4a'] = { key: '2000:100', problem: SOUND };
      store.checks['/watch/2026-11-13/hymn.wav'] = {
        key: '2000:100',
        problem: SOUND,
      };

      helper.startMediaConversion(items);
      await settle();

      const destinations = fs.rename.mock.calls.map(([, to]) => to);
      expect(destinations[0]).toBe('/add/song.m4a');
      expect(destinations[1]).toMatch(
        /^\/cache\/Converted Media\/2026-11-13\/hymn-[0-9a-f]{12}\.m4a$/,
      );
    });

    it("keeps a watched file's copy in the cache, in its date's folder, and finds it again", async () => {
      const source = '/watch/2026-11-13/clip.avi';
      const { helper, items, store } = await load([
        item(source, { source: 'watched' }),
      ]);
      store.checks[source] = { key: '2000:100', problem: PICTURE };

      helper.startMediaConversion(items);
      await settle();

      const destination = String(fs.rename.mock.calls[0]?.[1]);
      expect(destination).toMatch(
        /^\/cache\/Converted Media\/2026-11-13\/clip-[0-9a-f]{12}\.mp4$/,
      );
      // Never half-copied under the name a re-scan looks for.
      expect(fs.move).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/\.converting$/),
        { overwrite: true },
      );
      expect(fs.remove).not.toHaveBeenCalledWith(source);
      expect(items[0]?.fileUrl).toBe(fileUrl(destination));
      // The folder watcher reports Windows paths with backslashes.
      await expect(
        helper.findWatchedConversion(String.raw`\watch\2026-11-13\clip.avi`),
      ).resolves.toBe(destination);
    });

    it('waits for a watched file to stop playing before its item plays the copy', async () => {
      const source = '/watch/2026-11-13/clip.avi';
      const { helper, items, store } = await load([
        item(source, { source: 'watched' }),
      ]);
      store.checks[source] = { key: '2000:100', problem: PICTURE };
      currentState.mediaPlaying.url = fileUrl(source);

      helper.startMediaConversion(items);
      await vi.waitFor(() => {
        expect(convertForPlayback).toHaveBeenCalled();
      });
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
      expect(items[0]?.fileUrl).toBe(fileUrl(source));
      expect(store.jobs[0]?.status).toBe('converting');

      currentState.mediaPlaying.url = '';
      await settle();
      expect(items[0]?.fileUrl).toMatch(/Converted Media/);
    });

    it("doesn't use a conversion of a file that changed meanwhile", async () => {
      const source = '/watch/2026-11-13/clip.avi';
      let finishConverting: (() => void) | undefined;
      convertForPlayback.mockImplementationOnce(
        () =>
          new Promise<{ encoder: string }>((resolve) => {
            finishConverting = () => resolve({ encoder: 'h264_qsv' });
          }),
      );
      const { helper, items, store } = await load([
        item(source, { source: 'watched' }),
      ]);
      store.checks[source] = { key: '2000:100', problem: PICTURE };

      helper.startMediaConversion(items);
      await vi.waitFor(() => {
        expect(finishConverting).toBeDefined();
      });
      // Synced again while it converted.
      fs.stat.mockResolvedValue({ mtimeMs: 500, size: 3000 });
      finishConverting?.();
      await settle();

      expect(store.jobs[0]?.status).toBe('failed');
      expect(store.jobs[0]?.error).toBe('media-conversion-failed-error');
      expect(fs.rename).not.toHaveBeenCalled();
      expect(items[0]?.fileUrl).toBe(fileUrl(source));
      expect(errorCatcher).not.toHaveBeenCalled();
    });

    it('waits for an imported file to stop playing before replacing it', async () => {
      const { helper, items, store } = await load([item('/add/clip.mp4')]);
      store.checks['/add/clip.mp4'] = { key: '2000:100', problem: SOUND };
      currentState.mediaPlaying.url = fileUrl('/add/clip.mp4');

      helper.startMediaConversion(items);
      await vi.waitFor(() => {
        expect(convertForPlayback).toHaveBeenCalled();
      });
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
      expect(fs.move).not.toHaveBeenCalled();

      currentState.mediaPlaying.url = '';
      await vi.waitFor(
        () => {
          expect(fs.move).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it('reports a failure without the file name', async () => {
      convertForPlayback.mockRejectedValue(
        new Error(
          'ffmpeg exited with code 1: /add/family video.mov: Invalid data',
        ),
      );
      const { helper, items, store } = await load([
        item('/add/family video.mov'),
      ]);
      store.checks['/add/family video.mov'] = {
        key: '2000:100',
        problem: PICTURE,
      };

      helper.startMediaConversion(items);
      await settle();

      expect(store.jobs[0]?.status).toBe('failed');
      expect(store.jobs[0]?.error).toBe('media-conversion-failed-error');
      const [error, context] = errorCatcher.mock.calls[0] ?? [];
      expect(String(error)).not.toContain('family video');
      expect(JSON.stringify(context)).not.toContain('family video');
      expect(context).toMatchObject({
        contexts: { fn: { codec: '<hvc1>', extension: 'mov' } },
      });
      expect(fs.remove).toHaveBeenCalledWith(
        expect.stringMatching(/^\/temp\/conversion-/),
      );
    });

    it('says why without reporting when the converter is missing', async () => {
      setupFFmpeg.mockResolvedValue('');
      const { helper, items, store } = await load([item('/add/clip.mp4')]);

      helper.startMediaConversion(items);
      await settle();

      expect(store.jobs[0]?.error).toBe('media-conversion-failed-no-converter');
      expect(errorCatcher).not.toHaveBeenCalled();
    });

    it('cancels a queued conversion before it starts, and stops a running one', async () => {
      let finishFirst: (() => void) | undefined;
      convertForPlayback.mockImplementationOnce(
        () =>
          new Promise<{ encoder: string }>((resolve) => {
            finishFirst = () => resolve({ encoder: 'h264_qsv' });
          }),
      );
      const { helper, items, store } = await load([
        item('/add/a.mp4'),
        item('/add/b.mp4'),
      ]);

      helper.startMediaConversion(items);
      await vi.waitFor(() => {
        expect(store.jobs[0]?.status).toBe('converting');
      });
      await helper.cancelMediaConversion(store.jobs[1]?.id ?? '');
      await helper.cancelMediaConversion(store.jobs[0]?.id ?? '');
      expect(cancelPlaybackConversion).toHaveBeenCalledWith(store.jobs[0]?.id);

      finishFirst?.();
      await settle();
      expect(store.jobs[1]?.status).toBe('cancelled');
      expect(convertForPlayback).toHaveBeenCalledTimes(1);
    });

    it('cancels while getting ready, before ffmpeg is asked for anything', async () => {
      let ffmpegReady: ((path: string) => void) | undefined;
      setupFFmpeg.mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            ffmpegReady = resolve;
          }),
      );
      const { helper, items, store } = await load([item('/add/clip.mp4')]);

      helper.startMediaConversion(items);
      await vi.waitFor(() => {
        expect(ffmpegReady).toBeDefined();
      });
      await helper.cancelMediaConversion(store.jobs[0]?.id ?? '');
      expect(store.jobs[0]?.status).toBe('cancelled');
      ffmpegReady?.('/bin/ffmpeg');
      await wait(50);

      expect(store.jobs[0]?.status).toBe('cancelled');
      expect(convertForPlayback).not.toHaveBeenCalled();
    });

    it("isn't undone by the conversion starting just after it", async () => {
      let tempReady: (() => void) | undefined;
      fs.ensureDir.mockImplementationOnce(
        () =>
          new Promise<undefined>((resolve) => {
            tempReady = () => resolve(undefined);
          }),
      );
      const { helper, items, store } = await load([item('/add/clip.mp4')]);

      helper.startMediaConversion(items);
      await vi.waitFor(() => {
        expect(tempReady).toBeDefined();
      });
      await helper.cancelMediaConversion(store.jobs[0]?.id ?? '');
      tempReady?.();
      await wait(50);

      expect(store.jobs[0]?.status).toBe('cancelled');
      expect(convertForPlayback).not.toHaveBeenCalled();
    });

    it('cancels at once while converting, and keeps what ffmpeg finished meanwhile out of place', async () => {
      let finishConverting: (() => void) | undefined;
      convertForPlayback.mockImplementationOnce(
        () =>
          new Promise<{ encoder: string }>((resolve) => {
            finishConverting = () => resolve({ encoder: 'h264_qsv' });
          }),
      );
      const { helper, items, store } = await load([item('/add/clip.mp4')]);

      helper.startMediaConversion(items);
      await vi.waitFor(() => {
        expect(finishConverting).toBeDefined();
      });
      const id = store.jobs[0]?.id ?? '';
      await helper.cancelMediaConversion(id);
      expect(store.jobs[0]?.status).toBe('cancelled');
      expect(cancelPlaybackConversion).toHaveBeenCalledWith(id);

      // ffmpeg was done before it heard.
      finishConverting?.();
      await vi.waitFor(() => {
        expect(fs.remove).toHaveBeenCalledWith(`/temp/conversion-${id}.mp4`);
      });
      expect(store.jobs[0]?.status).toBe('cancelled');
      expect(fs.move).not.toHaveBeenCalled();
      expect(fs.rename).not.toHaveBeenCalled();
    });

    it('cancels after converting, while waiting for the file to stop playing', async () => {
      const { helper, items, store } = await load([item('/add/clip.mp4')]);
      currentState.mediaPlaying.url = fileUrl('/add/clip.mp4');

      helper.startMediaConversion(items);
      await vi.waitFor(() => {
        expect(convertForPlayback).toHaveBeenCalled();
      });
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
      await helper.cancelMediaConversion(store.jobs[0]?.id ?? '');
      expect(store.jobs[0]?.status).toBe('cancelled');

      // It looks again a second later, and stops.
      await vi.waitFor(
        () => {
          expect(fs.remove).toHaveBeenCalledWith(
            expect.stringMatching(/^\/temp\/conversion-/),
          );
        },
        { timeout: 3000 },
      );
      expect(fs.move).not.toHaveBeenCalled();
      expect(items[0]?.fileUrl).toBe(fileUrl('/add/clip.mp4'));
    });

    it("keeps an imported picture named like the video, deleting only the video's own thumbnail", async () => {
      fs.pathExists.mockImplementation(
        async (path: string) => path !== '/add/talk.mp4',
      );
      const { helper, items, store } = await load([
        item('/add/talk.mkv'),
        item('/add/talk.jpg', { isImage: true, isVideo: false }),
        item('/add/clip.avi'),
      ]);
      store.checks['/add/talk.mkv'] = { key: '2000:100', problem: PICTURE };
      store.checks['/add/clip.avi'] = { key: '2000:100', problem: PICTURE };

      helper.startMediaConversion([items[0], items[2]] as MediaItem[]);
      await settle();

      expect(fs.remove).not.toHaveBeenCalledWith('/add/talk.jpg');
      expect(fs.remove).toHaveBeenCalledWith('/add/clip.jpg');
    });

    it('makes an item added from the website a local file, so nothing brings the original back', async () => {
      fs.pathExists.mockImplementation(
        async (path: string) => path !== '/add/video.mp4',
      );
      fs.stat.mockResolvedValue({ mtimeMs: 300, size: 1234 });
      const { helper, items, store } = await load([
        item('/add/video.avi', {
          filesize: 99_999,
          streamUrl: 'https://example.com/video.avi',
        }),
      ]);
      store.checks['/add/video.avi'] = { key: '1234:300', problem: PICTURE };

      helper.startMediaConversion(items);
      await settle();

      expect(store.jobs[0]?.status).toBe('done');
      expect(items[0]?.filesize).toBe(1234);
      expect(items[0]?.streamUrl).toBeUndefined();
    });
  });

  describe('markUnplayable', () => {
    it('says a sound-only file has no sound, and lets it still play', async () => {
      const { helper, store } = await load([]);
      await helper.markUnplayable(fileUrl('/add/song.m4a'));
      await helper.markUnplayable(fileUrl('/add/clip.mp4'));

      expect(store.problemFor('/add/song.m4a')).toEqual({
        codec: 'unknown',
        fromPlayback: true,
        missing: 'sound',
      });
      expect(store.problemFor('/add/clip.mp4')).toEqual({
        codec: 'unknown',
        fromPlayback: true,
        missing: 'picture',
      });
    });
  });

  describe('a notice closed some other way', () => {
    it('opens a new one for the next file, rather than updating the closed one', async () => {
      vi.useFakeTimers();
      findPlaybackProblem.mockResolvedValue(PICTURE);
      const { helper } = await load([item('/add/a.mp4'), item('/add/b.mp4')]);

      await helper.checkMediaPlayback('/add/a.mp4', { notify: true });
      await vi.advanceTimersByTimeAsync(1500);
      expect(createTemporaryNotification).toHaveBeenCalledTimes(1);

      // Switching profiles closes every notice.
      const [options] = createTemporaryNotification.mock
        .calls[0] as unknown as [{ onDismiss: () => void }];
      options.onDismiss();

      await helper.checkMediaPlayback('/add/b.mp4', { notify: true });
      await vi.advanceTimersByTimeAsync(1500);
      expect(createTemporaryNotification).toHaveBeenCalledTimes(2);
      expect(createTemporaryNotification).toHaveBeenLastCalledWith(
        expect.objectContaining({
          message: 'media-cannot-play-here-notice:{"title":"b.mp4"}',
        }),
      );
    });
  });

  describe('removeOrphanedConversions', () => {
    it('deletes the converted copies no item plays any more, and only those', async () => {
      const kept = '/cache/Converted Media/2026-11-13/b-0123456789ab.mp4';
      const { helper } = await load([
        item(kept, { source: 'watched', uniqueId: 'b' }),
      ]);

      await helper.removeOrphanedConversions([
        fileUrl('/cache/Converted Media/2026-11-13/a-0123456789ab.mp4'),
        fileUrl(kept),
        fileUrl('/watch/2026-11-13/c.mp4'),
        undefined,
      ]);

      expect(fs.remove.mock.calls.map(([path]) => path)).toEqual([
        '/cache/Converted Media/2026-11-13/a-0123456789ab.mp4',
        '/cache/Converted Media/2026-11-13/a-0123456789ab.jpg',
      ]);
    });
  });
});
