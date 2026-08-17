import type { MultimediaItem } from 'src/types';

import { fetchRaw } from 'src/utils/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const errorCatcherMock = vi.fn();
const createTemporaryNotificationMock = vi.fn();
const logMock = vi.fn();
const updateLookupPeriodMock = vi.fn();
const extractNestedZipEntryMock = vi.fn();
const getZipEntriesMock = vi.fn();
const closeSqliteConnectionMock = vi.fn(async () => undefined);
const closeSqliteConnectionsMock = vi.fn(async () => undefined);
const unzipMock = vi.fn();
const statMock = vi.fn();
const removeMock = vi.fn();
const copyMock = vi.fn();
const readdirMock = vi.fn();
const pathExistsMock = vi.fn();
const joinMock = vi.fn((...parts: string[]) => parts.join('/'));
const basenameMock = vi.fn(
  (value: string) => value.split(/[\\/]/).pop() ?? value,
);
const ensureDirMock = vi.fn();
const formatDateMock = vi.fn();
const getTempPathMock = vi.fn(async () => '/tmp');
const isUsablePathMock = vi.fn(async () => true);
const currentStateStore = {
  currentCongregation: '',
  currentLangObject: undefined as undefined | { isSignLanguage?: boolean },
  currentSettings: {} as Record<string, unknown>,
  extractedFiles: {} as Record<string, string | undefined>,
  getMeetingType: vi.fn(),
};
const jwStore = {
  jwMepsLanguages: { list: [] as { LanguageId: number; Symbol: string }[] },
  lookupPeriod: {},
  urlVariables: {},
};

vi.mock('boot/globals', () => ({
  queues: {},
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
  MAX_SONGS: 0,
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
  isReplacedByMemorial: vi.fn(),
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
  createTemporaryNotification: createTemporaryNotificationMock,
}));

vi.mock('src/helpers/usage', () => ({
  updateLastUsedDate: vi.fn(),
}));

vi.mock('src/shared/vanilla', () => ({
  log: logMock,
  sanitizeFilename: vi.fn(),
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
  dateFromString: vi.fn(),
  datesAreSame: vi.fn(),
  formatDate: formatDateMock,
  getDateDiff: vi.fn(),
  getSpecificWeekday: vi.fn(),
  isInPast: vi.fn(),
  subtractFromDate: vi.fn(),
}));

vi.mock('src/utils/fs', () => ({
  findFile: vi.fn(),
  getPublicationDirectory: vi.fn(),
  getTempPath: getTempPathMock,
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

describe('jw-media helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    currentStateStore.currentCongregation = '';
    currentStateStore.currentLangObject = undefined;
    currentStateStore.currentSettings = {};
    currentStateStore.extractedFiles = {};
    currentStateStore.getMeetingType.mockReturnValue(null);
    jwStore.lookupPeriod = {};
    jwStore.jwMepsLanguages = { list: [] };

    extractNestedZipEntryMock.mockResolvedValue({ path: '/tmp/db.db' });
    getZipEntriesMock.mockResolvedValue({});
    unzipMock.mockResolvedValue([]);
    statMock.mockRejectedValue(
      Object.assign(new Error('missing'), { code: 'ENOENT' }),
    );
    removeMock.mockResolvedValue(undefined);
    readdirMock.mockResolvedValue(['contents']);

    vi.stubGlobal('electronApi', {
      basename: basenameMock,
      changeExt: vi.fn(),
      closeSqliteConnection: closeSqliteConnectionMock,
      closeSqliteConnections: closeSqliteConnectionsMock,
      dirname: vi.fn(),
      downloadFile: vi.fn(),
      executeQuery: vi.fn(),
      extname: vi.fn(() => '.jpg'),
      extractNestedZipEntry: extractNestedZipEntryMock,
      fileUrlToPath: vi.fn(),
      fs: {
        copy: copyMock,
        ensureDir: ensureDirMock,
        pathExists: pathExistsMock,
        readdir: readdirMock,
        remove: removeMock,
        rename: vi.fn(),
        stat: statMock,
      },
      getZipEntries: getZipEntriesMock,
      isUsablePath: isUsablePathMock,
      join: joinMock,
      pathToFileURL: vi.fn(),
      readdir: readdirMock,
      setElectronUrlVariables: vi.fn(),
      unzip: unzipMock,
    });
  });

  it('closes sqlite connections before removing files when force-unzipping', async () => {
    const { unzipJwpub } = await import('../jw-media');

    await expect(
      unzipJwpub('/tmp/publication.jwpub', '/tmp/out', true),
    ).rejects.toThrow('JWPUB does not contain contents entry');

    expect(closeSqliteConnectionsMock).toHaveBeenCalled();

    const sqliteCallOrder =
      closeSqliteConnectionsMock.mock.invocationCallOrder[0];
    const removeCallOrder = removeMock.mock.invocationCallOrder[0];

    expect(sqliteCallOrder).toBeDefined();
    expect(removeCallOrder).toBeDefined();
    expect(sqliteCallOrder ?? 0).toBeLessThan(removeCallOrder ?? 0);
  });

  it('closes the identification db connection before removing its temp dir', async () => {
    getZipEntriesMock.mockResolvedValue({ contents: 100 });
    const { identifyJwpub } = await import('../jw-media');

    await identifyJwpub('/tmp/publication.jwpub');

    expect(closeSqliteConnectionMock).toHaveBeenCalledWith('/tmp/db.db');

    const closeCallOrder =
      closeSqliteConnectionMock.mock.invocationCallOrder[0];
    const removeCallOrder = removeMock.mock.invocationCallOrder[0];

    expect(closeCallOrder).toBeDefined();
    expect(removeCallOrder).toBeDefined();
    expect(closeCallOrder ?? 0).toBeLessThan(removeCallOrder ?? 0);
  });

  it('captures diagnostics when a jwpub is missing the contents entry', async () => {
    const { unzipJwpub } = await import('../jw-media');

    await expect(
      unzipJwpub('/tmp/publication.jwpub', '/tmp/out'),
    ).rejects.toThrow('JWPUB does not contain contents entry');

    expect(logMock).toHaveBeenCalledWith(
      '[jwpubExtractor] Unable to read extracted contents zip at /tmp/out/contents.',
      'mediaPlayback',
      'error',
      expect.objectContaining({
        contentsFile: {
          errorCode: 'ENOENT',
          exists: false,
        },
        outputDirectory: {
          entryCount: 1,
          sampleEntries: ['contents'],
        },
        parentJwpubEntries: {
          contentsSize: undefined,
          entryCount: 0,
          sampleEntries: [],
          totalUncompressedSize: 0,
        },
        parentJwpubFile: {
          errorCode: 'ENOENT',
          exists: false,
        },
      }),
    );

    expect(errorCatcherMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'JWPUB does not contain contents entry',
      }),
      expect.objectContaining({
        contexts: expect.objectContaining({
          fn: expect.objectContaining({
            name: 'jwpubExtractor missing contents entry',
          }),
          jwpubContentsDiagnostics: expect.objectContaining({
            outputDirectory: expect.objectContaining({
              entryCount: 1,
            }),
          }),
        }),
      }),
    );
  });

  it('stages user-provided jwpub files into app temp before reading', async () => {
    const { stageUserJwpubForRead } = await import('../jw-media');

    await expect(
      stageUserJwpubForRead(String.raw`D:\English\S-418mp-26_E_002.jwpub`),
    ).resolves.toBe('/tmp/jwpub-import-uuid/S-418mp-26_E_002.jwpub');

    expect(copyMock).toHaveBeenCalledWith(
      String.raw`D:\English\S-418mp-26_E_002.jwpub`,
      '/tmp/jwpub-import-uuid/S-418mp-26_E_002.jwpub',
    );
  });

  it('warns without reporting when a user-provided jwpub cannot be staged', async () => {
    const error = Object.assign(new Error('missing source'), {
      code: 'ENOENT',
    });
    copyMock.mockRejectedValue(error);
    const { stageUserJwpubForRead } = await import('../jw-media');

    await expect(
      stageUserJwpubForRead(String.raw`D:\English\S-418mp-26_E_002.jwpub`),
    ).resolves.toBeUndefined();

    expect(createTemporaryNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        group: 'jwpubFileUnavailable',
        type: 'warning',
      }),
    );
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('warns without reporting when a staged jwpub becomes unavailable while extracting', async () => {
    const error = Object.assign(new Error('missing during extraction'), {
      code: 'ENOENT',
    });
    getZipEntriesMock.mockRejectedValue(error);
    const { unzipJwpub } = await import('../jw-media');

    await expect(
      unzipJwpub('/tmp/jwpub-import-uuid/S-418mp-26_E_002.jwpub', '/tmp/out'),
    ).rejects.toMatchObject({ code: 'ENOENT' });

    expect(createTemporaryNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        group: 'jwpubFileUnavailable',
        type: 'warning',
      }),
    );
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('does not report a copy failure that is expected flakiness on a cloud-synced additional-media destination', async () => {
    const { trimFilepathAsNeeded } = await import('src/utils/fs');
    const { sanitizeId } = await import('src/utils/general');

    vi.mocked(trimFilepathAsNeeded).mockImplementation((p: string) => p);
    vi.mocked(sanitizeId).mockImplementation((value: string) => value);
    (
      currentStateStore as unknown as {
        getDatedAdditionalMediaDirectory: () => Promise<string>;
      }
    ).getDatedAdditionalMediaDirectory = vi.fn(
      async () =>
        String.raw`C:\Users\test\OneDrive\Pictures\Additional Media\cong\20260801`,
    );
    pathExistsMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    copyMock.mockRejectedValue(
      Object.assign(new Error('UNKNOWN: unknown error, copyfile'), {
        code: 'UNKNOWN',
      }),
    );

    const { copyToDatedAdditionalMedia } = await import('../jw-media');

    await expect(
      copyToDatedAdditionalMedia(
        String.raw`C:\Users\test\OneDrive\Desktop\photo.jpeg`,
        undefined,
      ),
    ).resolves.toBe('');

    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('creates watched folders for meeting days with dynamic media', async () => {
    const meetingDate = new Date('2026-06-14T12:00:00.000Z');
    const childDynamicDate = new Date('2026-06-21T12:00:00.000Z');
    const noDynamicDate = new Date('2026-06-28T12:00:00.000Z');
    const nonMeetingDate = new Date('2026-07-05T12:00:00.000Z');
    currentStateStore.currentCongregation = 'abc';
    currentStateStore.currentSettings = {
      enableFolderWatcher: true,
      folderToWatch: '/watch',
    };
    currentStateStore.getMeetingType.mockImplementation((date: Date) => {
      return date === nonMeetingDate ? null : 'we';
    });
    formatDateMock.mockImplementation((date: Date) => {
      if (date === meetingDate) return '2026-06-14';
      if (date === childDynamicDate) return '2026-06-21';
      if (date === noDynamicDate) return '2026-06-28';
      return '2026-07-05';
    });
    jwStore.lookupPeriod = {
      abc: [
        {
          date: meetingDate,
          mediaSections: [
            {
              items: [{ source: 'dynamic' }],
            },
          ],
        },
        {
          date: childDynamicDate,
          mediaSections: [
            {
              items: [
                {
                  children: [{ source: 'dynamic' }],
                  source: 'additional',
                },
              ],
            },
          ],
        },
        {
          date: noDynamicDate,
          mediaSections: [
            {
              items: [{ source: 'additional' }],
            },
          ],
        },
        {
          date: nonMeetingDate,
          mediaSections: [
            {
              items: [{ source: 'dynamic' }],
            },
          ],
        },
      ],
    };

    const { ensureWatchedMeetingDayFolders } = await import('../jw-media');

    await ensureWatchedMeetingDayFolders();

    expect(ensureDirMock).toHaveBeenCalledTimes(2);
    expect(ensureDirMock).toHaveBeenCalledWith('/watch/2026-06-14');
    expect(ensureDirMock).toHaveBeenCalledWith('/watch/2026-06-21');
  });

  it('skips creating watched folders when the watch folder is not a usable path', async () => {
    currentStateStore.currentCongregation = 'abc';
    currentStateStore.currentSettings = {
      enableFolderWatcher: true,
      // What a native folder picker can hand back in rare cases when
      // browsing "Network" without fully selecting a share.
      folderToWatch: String.raw`\\?`,
    };
    jwStore.lookupPeriod = {};
    isUsablePathMock.mockResolvedValueOnce(false);

    const { ensureWatchedMeetingDayFolders } = await import('../jw-media');

    await ensureWatchedMeetingDayFolders();

    expect(isUsablePathMock).toHaveBeenCalledWith(String.raw`\\?`);
    expect(ensureDirMock).not.toHaveBeenCalled();
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('tolerates a mapped-drive EINVAL when creating a watched folder', async () => {
    const meetingDate = new Date('2026-06-14T12:00:00.000Z');
    currentStateStore.currentCongregation = 'abc';
    currentStateStore.currentSettings = {
      enableFolderWatcher: true,
      // A Google Drive Stream-style virtual drive letter can briefly
      // unmount, making even the drive root fail recursive mkdir.
      folderToWatch: String.raw`H:\Meu Drive\MIDIAS Cong Leste`,
    };
    currentStateStore.getMeetingType.mockReturnValue('we');
    formatDateMock.mockReturnValue('2026-06-14');
    jwStore.lookupPeriod = {
      abc: [
        {
          date: meetingDate,
          mediaSections: [{ items: [{ source: 'dynamic' }] }],
        },
      ],
    };
    ensureDirMock.mockRejectedValueOnce(
      Object.assign(new Error("EINVAL: invalid argument, mkdir 'H:'"), {
        code: 'EINVAL',
        syscall: 'mkdir',
      }),
    );

    const { ensureWatchedMeetingDayFolders } = await import('../jw-media');

    await ensureWatchedMeetingDayFolders();

    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('updates the lookup period before fetching meeting media', async () => {
    currentStateStore.currentCongregation = 'abc';
    currentStateStore.currentSettings = {};
    jwStore.lookupPeriod = { abc: [] };
    jwStore.urlVariables = {
      base: 'jw.org',
      mediator: 'https://b.jw-cdn.org/apis/mediator',
    };

    const { fetchMedia } = await import('../jw-media');

    await fetchMedia();

    expect(updateLookupPeriodMock).toHaveBeenCalledOnce();
  });

  it('accepts valid https mediator and pubMedia URLs scraped from the base site', async () => {
    jwStore.urlVariables = {};
    vi.mocked(fetchRaw).mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          '<div id="pageConfig" data-mediator_url="https://b.jw-cdn.org/apis/mediator" data-pubmedia_url="https://b.jw-cdn.org/apis/pub-media"></div>',
        ),
    } as Response);

    const { setUrlVariables } = await import('../jw-media');
    await setUrlVariables('jw.org');

    expect(jwStore.urlVariables).toEqual({
      base: 'jw.org',
      mediator: 'https://b.jw-cdn.org/apis/mediator',
      pubMedia: 'https://b.jw-cdn.org/apis/pub-media',
    });
  });

  it('discards a scraped mediator URL that is not https and resets url variables', async () => {
    jwStore.urlVariables = {};
    vi.mocked(fetchRaw).mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          '<div id="pageConfig" data-mediator_url="javascript:alert(1)" data-pubmedia_url="https://b.jw-cdn.org/apis/pub-media"></div>',
        ),
    } as Response);

    const { setUrlVariables } = await import('../jw-media');
    await setUrlVariables('jw.org');

    expect(jwStore.urlVariables).toEqual({
      base: 'jw.org',
      mediator: '',
      pubMedia: '',
    });
  });

  it('excludes CBS videos from configured publications but keeps CBS images and non-CBS videos', async () => {
    currentStateStore.currentSettings = { excludeCbsPubs: ['WCG'] };

    const { isCoWeek, isMwMeetingDay, isWeMeetingDay } =
      await import('src/helpers/date');
    const { convertImageIfNeeded } = await import('src/utils/converters');
    const { sanitizeId } = await import('src/utils/general');
    const { isLikelyFile } = await import('src/utils/media');

    vi.mocked(isMwMeetingDay).mockReturnValue(true);
    vi.mocked(isWeMeetingDay).mockReturnValue(false);
    vi.mocked(isCoWeek).mockReturnValue(false);
    vi.mocked(convertImageIfNeeded).mockImplementation(
      async (path) => path as string,
    );
    vi.mocked(sanitizeId).mockImplementation((value: string) => value);
    vi.mocked(isLikelyFile).mockReturnValue(false);
    formatDateMock.mockReturnValue('20260615');

    const baseItem = (overrides: Partial<MultimediaItem>): MultimediaItem => ({
      BeginParagraphOrdinal: 0,
      Caption: '',
      CategoryType: 1,
      DocumentId: 1,
      FilePath: '/tmp/file',
      Label: 'Label',
      MajorType: 1,
      MimeType: 'video/mp4',
      MultimediaId: 1,
      TargetParagraphNumberLabel: 0,
      ...overrides,
    });

    // Not in the CBS paragraph range: kept even though it's a wcg video.
    const earlyWcgVideo = baseItem({
      BeginParagraphOrdinal: 5,
      KeySymbol: 'wcg',
    });
    // In the CBS paragraph range and a video from an excluded pub: dropped
    // before mapping/downloading.
    const cbsWcgVideo = baseItem({
      BeginParagraphOrdinal: 24,
      KeySymbol: 'wcg',
    });
    // In the CBS paragraph range but an image, not a video: kept.
    const cbsWcgImage = baseItem({
      BeginParagraphOrdinal: 24,
      IssueTagNumber: 1001,
      KeySymbol: 'wcg',
      MimeType: 'image/jpeg',
    });
    // Real-world case: a video embedded in the wcg reading, but sourced from
    // a different publication (a video compilation). ExtractSymbol carries
    // the reading's own pub ('wcg'), while KeySymbol is the video's own
    // source pub ('jwbcov21') - exclusion must key off ExtractSymbol.
    const cbsVideoFromDifferentSourcePub = baseItem({
      BeginParagraphOrdinal: 24,
      ExtractSymbol: 'wcg',
      IssueTagNumber: 1002,
      KeySymbol: 'jwbcov21',
    });
    // Last item (defines lastParagraph); unrelated pub, kept.
    const lastVideo = baseItem({
      BeginParagraphOrdinal: 25,
      KeySymbol: 'xyz',
    });

    const { dynamicMediaMapper } = await import('../jw-media');

    const result = await dynamicMediaMapper(
      [
        earlyWcgVideo,
        cbsWcgVideo,
        cbsWcgImage,
        cbsVideoFromDifferentSourcePub,
        lastVideo,
      ],
      new Date('2026-06-15'),
      'dynamic',
    );

    expect(errorCatcherMock).not.toHaveBeenCalled();

    const pubMediaIds = result.map((m) => m.pubMediaId);
    expect(pubMediaIds).toContain('wcg');
    expect(pubMediaIds).toContain('wcg_1001');
    expect(pubMediaIds).toContain('xyz');
    expect(pubMediaIds).not.toContain('jwbcov21_1002');
    expect(result).toHaveLength(3);
  });

  it('keeps a video from an excluded CBS publication when it is not actually part of the CBS (e.g. a manual import)', async () => {
    currentStateStore.currentSettings = { excludeCbsPubs: ['wcg'] };

    const { isCoWeek, isMwMeetingDay, isWeMeetingDay } =
      await import('src/helpers/date');
    const { convertImageIfNeeded } = await import('src/utils/converters');
    const { sanitizeId } = await import('src/utils/general');
    const { isLikelyFile } = await import('src/utils/media');

    vi.mocked(isMwMeetingDay).mockReturnValue(true);
    vi.mocked(isWeMeetingDay).mockReturnValue(false);
    vi.mocked(isCoWeek).mockReturnValue(false);
    vi.mocked(convertImageIfNeeded).mockImplementation(
      async (path) => path as string,
    );
    vi.mocked(sanitizeId).mockImplementation((value: string) => value);
    vi.mocked(isLikelyFile).mockReturnValue(false);
    formatDateMock.mockReturnValue('20260615');

    const baseItem = (overrides: Partial<MultimediaItem>): MultimediaItem => ({
      BeginParagraphOrdinal: 0,
      Caption: '',
      CategoryType: 1,
      DocumentId: 1,
      FilePath: '/tmp/file',
      Label: 'Label',
      MajorType: 1,
      MimeType: 'video/mp4',
      MultimediaId: 1,
      TargetParagraphNumberLabel: 0,
      ...overrides,
    });

    // Same paragraph ordinal as the CBS example above, but manually imported
    // (source: 'additional'), so it isn't actually part of the CBS and
    // should not be excluded.
    const manuallyImportedWcgVideo = baseItem({
      BeginParagraphOrdinal: 24,
      KeySymbol: 'wcg',
    });
    const lastVideo = baseItem({
      BeginParagraphOrdinal: 25,
      KeySymbol: 'xyz',
    });

    const { dynamicMediaMapper } = await import('../jw-media');

    const result = await dynamicMediaMapper(
      [manuallyImportedWcgVideo, lastVideo],
      new Date('2026-06-15'),
      'additional',
    );

    expect(errorCatcherMock).not.toHaveBeenCalled();

    const pubMediaIds = result.map((m) => m.pubMediaId);
    expect(pubMediaIds).toContain('wcg');
    expect(result).toHaveLength(2);
    expect(result.find((m) => m.pubMediaId === 'wcg')?.cbs).toBe(false);
  });

  describe('processMissingMediaInfo language resolution for sign-language congregations', () => {
    // A video embedded inside a nested extract publication (e.g. a lesson
    // pulled in from "lff", referencing a clip from "lrc") that isn't
    // available in the congregation's sign language, but does carry a
    // different, real sign language (here ASL) on its own MepsLanguageIndex.
    const nestedExtractVideo: MultimediaItem = {
      BeginParagraphOrdinal: 20,
      Caption: '',
      CategoryType: 1,
      DocumentId: 21,
      FilePath: '',
      IssueTagNumber: 0,
      KeySymbol: 'lrc',
      Label: '',
      MajorType: 1,
      MepsLanguageIndex: 420,
      MimeType: 'video/mp4',
      MultimediaId: 391,
      TargetParagraphNumberLabel: 0,
      Track: 1,
    };

    const getLoggedLanguageResolution = () =>
      logMock.mock.calls.find(
        (call) => call[0] === '[processMissingMediaInfo] Language resolution',
      )?.[3];

    beforeEach(() => {
      currentStateStore.currentSettings = { lang: 'LSQ', langFallback: 'F' };
      currentStateStore.currentLangObject = { isSignLanguage: true };
      jwStore.jwMepsLanguages = { list: [{ LanguageId: 420, Symbol: 'ASL' }] };
    });

    it('trusts a nested extract video language once verified against that extract database', async () => {
      const { processMissingMediaInfo } = await import('../jw-media');

      await processMissingMediaInfo({
        allMedia: [{ ...nestedExtractVideo }],
        // What getDocumentExtractItems now contributes: language data read
        // directly from the nested extract's own database (see
        // getExtractMultimedia / getMepsLanguagesByMediaItem in sqlite.ts).
        mepsLanguagesByMediaItem: [
          {
            IssueTagNumber: 0,
            KeySymbol: 'lrc',
            MepsLanguageIndex: 420,
            Track: 1,
          },
        ],
      });

      expect(getLoggedLanguageResolution()).toMatchObject({
        langsWritten: ['LSQ', 'ASL', 'F'],
      });
    });

    it('falls back straight to the configured fallback language when the nested video language cannot be verified', async () => {
      const { processMissingMediaInfo } = await import('../jw-media');

      await processMissingMediaInfo({
        allMedia: [{ ...nestedExtractVideo }],
        // No cross-reference data available for this KeySymbol at all (the
        // pre-fix behavior, and still correct when a MepsLanguageIndex truly
        // can't be verified for a sign-language congregation).
        mepsLanguagesByMediaItem: [],
      });

      expect(getLoggedLanguageResolution()).toMatchObject({
        langsWritten: ['LSQ', 'F'],
      });
    });
  });
});
