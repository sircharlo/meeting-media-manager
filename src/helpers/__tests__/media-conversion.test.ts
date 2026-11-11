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
  isAudio: (path: string) => /\.(?:m4a|mp3)$/i.test(path),
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
  remove: vi.fn(async () => undefined),
  stat: vi.fn(async () => ({ mtimeMs: 100, size: 2000 })),
};
const convertForPlayback = vi.fn(async () => undefined);
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
    fs.pathExists.mockResolvedValue(true);
    fs.stat.mockResolvedValue({ mtimeMs: 100, size: 2000 });
    setupFFmpeg.mockResolvedValue('/bin/ffmpeg');
    convertForPlayback.mockResolvedValue(undefined);
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
        new Promise(() => {
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
      expect(fs.move).toHaveBeenCalledWith(
        `/temp/conversion-${job?.id}.mp4`,
        '/add/2026/movie.mp4',
        { overwrite: true },
      );
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

      expect(String(fs.move.mock.calls[0]?.[1])).toMatch(
        /^\/add\/movie-[0-9a-f]{8}\.mp4$/,
      );
    });

    it('converts an imported MP4 in place', async () => {
      const { helper, items, store } = await load([item('/add/clip.mp4')]);
      store.checks['/add/clip.mp4'] = { key: '2000:100', problem: PICTURE };

      helper.startMediaConversion(items);
      await settle();

      expect(convertForPlayback).toHaveBeenCalledWith(
        '/bin/ffmpeg',
        expect.objectContaining({ keepVideo: false }),
      );
      expect(fs.move).toHaveBeenCalledWith(
        expect.stringMatching(/^\/temp\/conversion-/),
        '/add/clip.mp4',
        { overwrite: true },
      );
      expect(fs.remove).not.toHaveBeenCalledWith('/add/clip.mp4');
    });

    it("keeps a watched file's copy in the cache, in its date's folder, and finds it again", async () => {
      const source = '/watch/2026-11-13/clip.avi';
      const { helper, items, store } = await load([
        item(source, { source: 'watched' }),
      ]);
      store.checks[source] = { key: '2000:100', problem: PICTURE };

      helper.startMediaConversion(items);
      await settle();

      const destination = String(fs.move.mock.calls[0]?.[1]);
      expect(destination).toMatch(
        /^\/cache\/Converted Media\/2026-11-13\/clip-[0-9a-f]{12}\.mp4$/,
      );
      expect(fs.remove).not.toHaveBeenCalledWith(source);
      expect(items[0]?.fileUrl).toBe(fileUrl(destination));
      // The folder watcher reports Windows paths with backslashes.
      await expect(
        helper.findWatchedConversion(String.raw`\watch\2026-11-13\clip.avi`),
      ).resolves.toBe(destination);
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
          new Promise<undefined>((resolve) => {
            finishFirst = () => resolve(undefined);
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
  });
});
