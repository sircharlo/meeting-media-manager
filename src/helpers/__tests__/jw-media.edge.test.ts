import { fetchPubMediaLinks } from 'src/utils/api';
import { findBestResolution, isMediaLink } from 'src/utils/jw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const errorCatcherMock = vi.fn();
const logMock = vi.fn();
const updateLookupPeriodMock = vi.fn();
const formatDateMock = vi.fn(
  (date: Date) => date.toISOString().split('T')[0] ?? '',
);
const isInPastMock = vi.fn(() => false);
const pathExistsMock = vi.fn(async () => false);
const statMock = vi.fn();
const downloadFileMock = vi.fn();
const joinMock = vi.fn((...parts: string[]) => parts.join('/'));
const basenameMock = vi.fn(
  (value: string) => value.split(/[\\/]/).pop() ?? value,
);
const extnameMock = vi.fn(() => '.mp4');
const isUsablePathMock = vi.fn(async () => true);

const currentStateStore = {
  currentCongregation: '',
  currentLangObject: undefined as undefined | { isSignLanguage?: boolean },
  currentSettings: {} as Record<string, unknown>,
  currentSongbook: undefined as
    undefined | { fileformat?: string; pub?: string },
  downloadProgress: {} as Record<
    string,
    {
      complete?: boolean;
      error?: boolean;
      filename?: string;
      loaded?: number;
      total?: number;
    }
  >,
  extractedFiles: {} as Record<string, string | undefined>,
  getMeetingType: vi.fn((): null | string => null),
  meetingCheckStatus: {} as Record<string, string>,
};

const jwStore = {
  jwLanguages: { list: [] as { isSignLanguage?: boolean; langcode: string }[] },
  jwMepsLanguages: { list: [] as { LanguageId: number; Symbol: string }[] },
  jwSongs: {} as Record<string, undefined | { list: unknown[]; updated: Date }>,
  lookupPeriod: {} as Record<string, unknown[]>,
  urlVariables: {} as Record<string, string>,
};

vi.mock('boot/globals', () => ({
  queues: { meetings: {} as Record<string, unknown> },
}));

vi.mock('boot/i18n', () => ({
  i18n: {
    global: {
      t: vi.fn((key: string) => key),
    },
  },
}));

vi.mock('src/constants/jw', () => ({
  FEB_2023: '',
  FOOTNOTE_TARGET_PARAGRAPH: 0,
  LAST_SONG_ORDINAL: 0,
  LONG_MEDIA_DURATION: 0,
  MAX_SONGS: 100,
}));

vi.mock('src/constants/media', () => ({
  JPG_EXTENSIONS: ['jpg'],
}));

vi.mock('src/constants/mepslangs', () => ({
  default: {},
}));

vi.mock('src/helpers/date', () => ({
  isCoWeek: vi.fn(),
  isMwMeetingDay: vi.fn(),
  isReplacedByMemorial: vi.fn(() => false),
  isWeMeetingDay: vi.fn(),
  updateLookupPeriod: updateLookupPeriodMock,
}));

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: errorCatcherMock,
}));

vi.mock('src/helpers/export-media', () => ({
  exportAllDays: vi.fn(),
}));

vi.mock('src/helpers/fs', () => ({
  getRendererPlatform: vi.fn(() => 'win32'),
  getSubtitlesUrl: vi.fn(),
  getThumbnailUrl: vi.fn(),
  registerMediaProviders: vi.fn(),
}));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

vi.mock('src/helpers/usage', () => ({
  updateLastUsedDate: vi.fn(),
}));

vi.mock('src/shared/vanilla', () => ({
  log: logMock,
  sanitizeFilename: vi.fn((value: string) => value),
  uuid: vi.fn(() => 'uuid'),
}));

vi.mock('src/utils/api', () => ({
  clearFetchCache: vi.fn(),
  fetchMediaItems: vi.fn(),
  fetchPubMediaLinks: vi.fn(),
  fetchRaw: vi.fn(),
}));

vi.mock('src/utils/converters', () => ({
  convertImageIfNeeded: vi.fn(),
}));

vi.mock('src/utils/date', () => ({
  dateFromString: vi.fn((value: Date) => value),
  datesAreSame: vi.fn(),
  formatDate: formatDateMock,
  getDateDiff: vi.fn(() => 0),
  getSpecificWeekday: vi.fn((date: Date) => date),
  isInPast: isInPastMock,
  subtractFromDate: vi.fn(),
}));

vi.mock('src/utils/fs', () => ({
  findFile: vi.fn(),
  getPublicationDirectory: vi.fn(async () => '/pub-dir'),
  getTempPath: vi.fn(async () => '/tmp'),
  trimFilepathAsNeeded: vi.fn(),
}));

vi.mock('src/utils/general', () => ({
  sanitizeId: vi.fn(),
}));

vi.mock('src/utils/jw', () => ({
  findBestResolution: vi.fn(),
  getPubId: vi.fn(),
  isMediaLink: vi.fn(),
}));

vi.mock('src/utils/media', () => ({
  getMetadataFromMediaPath: vi.fn(),
  isAudio: vi.fn(),
  isImage: vi.fn(),
  isJwPlaylist: vi.fn(),
  isJwpub: vi.fn(() => true),
  isLikelyFile: vi.fn(),
  isSong: vi.fn(),
  isVideo: vi.fn(),
}));

vi.mock('src/utils/sqlite', () => ({
  addFullFilePathToMultimediaItem: vi.fn(),
  findDb: vi.fn(async () => undefined),
  getDocumentExtractItems: vi.fn(),
  getDocumentMultimediaItems: vi.fn(),
  getMediaVideoMarkers: vi.fn(),
  getMepsLanguagesByMediaItem: vi.fn(),
  getPublicationInfoFromDb: vi.fn(),
  registerSqliteProviders: vi.fn(),
  tableExists: vi.fn(),
}));

vi.mock('src/utils/time', () => ({
  timeToSeconds: vi.fn(),
}));

vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => currentStateStore,
}));

vi.mock('stores/jw', () => ({
  replaceMissingMediaByPubMediaId: vi.fn(),
  shouldUpdateList: vi.fn(),
  useJwStore: () => jwStore,
}));

vi.mock('../media-sections', () => ({
  createMeetingSections: vi.fn(),
}));

describe('jw-media edge cases', () => {
  describe('paragraph number detection', () => {
    it.each([
      ['Korean-shaped reference', '(11항 참조)', '11'],
      ['Spanish-shaped reference', '(Vea el párrafo 7)', '7'],
      ['Russian-shaped reference', '(Смотрите абзац 6.)', '6'],
    ])(
      '%s uses the numeric reference fragment',
      async (_name, caption, expected) => {
        const { getParagraphNumbers } = await import('../jw-media');

        expect(getParagraphNumbers(Number(expected), caption)).toBe(
          Number(expected),
        );
      },
    );

    it('returns no tag value for a stray multilingual caption number', async () => {
      const { getParagraphNumbers } = await import('../jw-media');

      expect(getParagraphNumbers('', '삽화 가: 40개 이상의 셈어식 이름')).toBe(
        '',
      );
      expect(getParagraphNumbers('', 'Picture A: about 1500 B.C.E.')).toBe('');
      expect(
        getParagraphNumbers('', 'Picture B: about 80 kilometers to Jogbehah'),
      ).toBe('');
    });

    it('supports explicit paragraph symbols and ranges without translated words', async () => {
      const { getParagraphNumbers } = await import('../jw-media');

      expect(getParagraphNumbers('', '¶ 11-12')).toBe('11-12');
      expect(getParagraphNumbers('', 'P. 3')).toBe(3);
      expect(getParagraphNumbers(4, 'Vea los párrafos 4 y 5')).toBe('4 y 5');
      expect(getParagraphNumbers(4, 'Смотрите абзацы 4, 5.')).toBe('4, 5');
    });
  });

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    currentStateStore.currentCongregation = '';
    currentStateStore.currentLangObject = undefined;
    currentStateStore.currentSettings = {};
    currentStateStore.currentSongbook = { fileformat: 'MP4', pub: 'sjjm' };
    currentStateStore.downloadProgress = {};
    currentStateStore.extractedFiles = {};
    currentStateStore.getMeetingType.mockReturnValue(null);
    currentStateStore.meetingCheckStatus = {};
    jwStore.lookupPeriod = {};
    jwStore.jwSongs = {};
    jwStore.jwMepsLanguages = { list: [] };
    jwStore.jwLanguages = { list: [] };
    isInPastMock.mockReturnValue(false);
    pathExistsMock.mockResolvedValue(false);
    isUsablePathMock.mockResolvedValue(true);
    formatDateMock.mockImplementation(
      (date: Date) => date.toISOString().split('T')[0] ?? '',
    );

    vi.stubGlobal('electronApi', {
      basename: basenameMock,
      changeExt: vi.fn(),
      dirname: vi.fn(),
      downloadFile: downloadFileMock,
      executeQuery: vi.fn(() => []),
      extname: extnameMock,
      extractNestedZipEntry: vi.fn(),
      fileUrlToPath: vi.fn(),
      fs: {
        copy: vi.fn(),
        ensureDir: vi.fn(),
        pathExists: pathExistsMock,
        readdir: vi.fn(async () => []),
        remove: vi.fn(),
        rename: vi.fn(),
        stat: statMock,
      },
      getZipEntries: vi.fn(),
      isUsablePath: isUsablePathMock,
      join: joinMock,
      pathToFileURL: vi.fn((path: string) => `file://${path}`),
      readdir: vi.fn(async () => []),
      setElectronUrlVariables: vi.fn(),
      unzip: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('background-music library cache fallback', () => {
    it('falls back to the persisted song list when the live fetch fails', async () => {
      vi.mocked(fetchPubMediaLinks).mockResolvedValue(null);
      vi.mocked(isMediaLink).mockReturnValue(true);
      vi.mocked(findBestResolution).mockImplementation((links) => links?.[0]);

      const cachedSongs = [
        {
          file: { url: 'https://cdn/sjjm_E_001.mp4' },
          filesize: 1000,
          title: 'Song 1',
          track: 1,
        },
        {
          file: { url: 'https://cdn/sjjm_E_002.mp4' },
          filesize: 2000,
          title: 'Song 2',
          track: 2,
        },
      ];
      jwStore.jwSongs = { E: { list: cachedSongs, updated: new Date() } };

      const { fetchBackgroundMusicSongLibrary } = await import('../jw-media');
      const result = await fetchBackgroundMusicSongLibrary('E');

      expect(result.length).toBeGreaterThan(0);
      expect(result.map((s) => s.track)).toEqual(
        expect.arrayContaining([1, 2]),
      );
    });

    it('returns an empty library when there is nothing cached to fall back to either', async () => {
      vi.mocked(fetchPubMediaLinks).mockResolvedValue(null);
      jwStore.jwSongs = {};

      const { fetchBackgroundMusicSongLibrary } = await import('../jw-media');
      const result = await fetchBackgroundMusicSongLibrary('E');

      expect(result).toEqual([]);
    });

    it('prefers the live result over the cache when the live fetch succeeds', async () => {
      vi.mocked(isMediaLink).mockReturnValue(true);
      vi.mocked(findBestResolution).mockImplementation((links) => links?.[0]);
      vi.mocked(fetchPubMediaLinks).mockResolvedValue({
        files: {
          E: {
            MP4: [
              {
                file: { url: 'https://cdn/live.mp4' },
                filesize: 500,
                title: 'Live song',
                track: 9,
              },
            ],
          },
        },
      } as never);

      jwStore.jwSongs = {
        E: {
          list: [
            {
              file: { url: 'https://cdn/cached.mp4' },
              filesize: 1000,
              title: 'Cached song',
              track: 1,
            },
          ],
          updated: new Date(),
        },
      };

      const { fetchBackgroundMusicSongLibrary } = await import('../jw-media');
      const result = await fetchBackgroundMusicSongLibrary('E');

      expect(result.map((s) => s.track)).toContain(9);
      expect(result.map((s) => s.track)).not.toContain(1);
    });
  });

  describe('fetchMedia queue handling', () => {
    it('leaves an already-complete cached day untouched while another day in the same batch fails', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const completeDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const cachedSections = [
        {
          config: { uniqueId: 'imported-media' },
          items: [{ source: 'watched', uniqueId: 'existing-1' }],
        },
      ];

      currentStateStore.currentCongregation = 'cong-1';
      currentStateStore.getMeetingType.mockReturnValue('we');
      jwStore.urlVariables = {
        base: 'jw.org',
        mediator: 'https://b.jw-cdn.org/apis/mediator',
      };
      jwStore.lookupPeriod = {
        'cong-1': [
          {
            date: completeDate,
            mediaSections: cachedSections,
            status: 'complete',
          },
          {
            date: futureDate,
            mediaSections: [],
            status: null,
          },
        ],
      };

      const { fetchMedia } = await import('../jw-media');
      await fetchMedia();

      const days = jwStore.lookupPeriod['cong-1'] as {
        date: Date;
        mediaSections: unknown[];
        status: null | string;
      }[];
      const completeDay = days.find((d) => d.date === completeDate);
      const refreshedDay = days.find((d) => d.date === futureDate);

      // The already-complete day was never a refresh candidate, so its
      // cached mediaSections must survive completely untouched.
      expect(completeDay?.status).toBe('complete');
      expect(completeDay?.mediaSections).toBe(cachedSections);

      // The other day was refreshed; with no real db/mediator wiring in
      // this test it resolves as an error, but it must resolve - not hang.
      expect(refreshedDay?.status).toBe('error');

      // Neither day's meetingCheckStatus is left stuck on 'checking'.
      expect(Object.values(currentStateStore.meetingCheckStatus)).not.toContain(
        'checking',
      );
    });

    it('does not leave meetingCheckStatus stuck on checking when formatDate throws mid-batch', async () => {
      const dayA = { date: new Date(), mediaSections: [], status: null };
      const dayB = {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        mediaSections: [],
        status: null,
      };

      currentStateStore.currentCongregation = 'cong-1';
      currentStateStore.getMeetingType.mockReturnValue('we');
      jwStore.urlVariables = {
        base: 'jw.org',
        mediator: 'https://b.jw-cdn.org/apis/mediator',
      };
      jwStore.lookupPeriod = { 'cong-1': [dayA, dayB] };

      // First call (dedupe pass) succeeds normally; the second real call -
      // marking dayB 'checking' - throws, matching a malformed date mid-batch.
      let calls = 0;
      formatDateMock.mockImplementation((date: Date) => {
        calls++;
        if (calls > 2 && date === dayB.date) {
          throw new Error('malformed date');
        }
        return date.toISOString().split('T')[0] ?? '';
      });

      const { fetchMedia } = await import('../jw-media');
      await fetchMedia();

      expect(errorCatcherMock).toHaveBeenCalled();
      expect(Object.values(currentStateStore.meetingCheckStatus)).not.toContain(
        'checking',
      );
    });
  });

  describe('stalled download detection', () => {
    it('resolves as an error after sustained zero progress instead of hanging forever', async () => {
      vi.useFakeTimers();
      downloadFileMock.mockResolvedValue({ key: 'dl-1', saveDir: '/dir' });
      currentStateStore.downloadProgress = { 'dl-1': {} };

      const { downloadFileIfNeeded } = await import('../jw-media');
      const promise = downloadFileIfNeeded({
        dir: '/dir',
        size: 1000,
        url: 'https://cdn/file.mp4',
      });

      // Let the download start and the initial progress entry get seeded.
      await vi.advanceTimersByTimeAsync(0);

      // Zero progress for the whole stall window.
      await vi.advanceTimersByTimeAsync(46000);

      const result = await promise;
      expect(result).toEqual({ error: true, path: expect.any(String) });
    });

    it('does not treat a genuinely slow (but progressing) download as stalled', async () => {
      vi.useFakeTimers();
      downloadFileMock.mockResolvedValue({ key: 'dl-2', saveDir: '/dir' });
      currentStateStore.downloadProgress = { 'dl-2': {} };
      statMock.mockResolvedValue({ size: 1000 });

      const { downloadFileIfNeeded } = await import('../jw-media');
      const promise = downloadFileIfNeeded({
        dir: '/dir',
        size: 1000,
        url: 'https://cdn/file.mp4',
      });

      await vi.advanceTimersByTimeAsync(0);

      // Trickle in progress well inside the stall window each time, so it
      // never goes 45s without an update, then finish.
      for (let i = 1; i <= 4; i++) {
        currentStateStore.downloadProgress['dl-2'] = {
          ...currentStateStore.downloadProgress['dl-2'],
          loaded: i * 100,
        };
        await vi.advanceTimersByTimeAsync(20000);
      }
      pathExistsMock.mockResolvedValue(true);
      currentStateStore.downloadProgress['dl-2'] = {
        ...currentStateStore.downloadProgress['dl-2'],
        complete: true,
      };
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result).toMatchObject({ new: true });
    });
  });
});
