import type {
  DateInfo,
  DocumentItem,
  DownloadedFile,
  FileDownloader,
  ImageSizes,
  ImageTypeSizes,
  JwLangCode,
  JwLangSymbol,
  JwMepsLanguage,
  JwPlaylistItem,
  MediaItem,
  MediaItemsMediatorFile,
  MediaLink,
  MediaSectionIdentifier,
  MultimediaExtractItem,
  MultimediaItem,
  PlaylistTagItem,
  Publication,
  PublicationFetcher,
  PublicationFiles,
  SongItem,
} from 'src/types';

import { queues } from 'boot/globals';
import { i18n } from 'boot/i18n';
import {
  FEB_2023,
  FOOTNOTE_TARGET_PARAGRAPH,
  LAST_SONG_ORDINAL,
  LONG_MEDIA_DURATION,
  MAX_SONGS,
} from 'src/constants/jw';
import { JPG_EXTENSIONS } from 'src/constants/media';
import mepslangs from 'src/constants/mepslangs';
import {
  isCoWeek,
  isMwMeetingDay,
  isReplacedByMemorial,
  isWeMeetingDay,
  updateLookupPeriod,
} from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { exportAllDays } from 'src/helpers/export-media';
import {
  getSubtitlesUrl,
  getThumbnailUrl,
  registerMediaProviders,
} from 'src/helpers/fs';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { updateLastUsedDate } from 'src/helpers/usage';
import { isPossiblyNetworkFolderPath } from 'src/shared/filesystem-errors';
import { NETWORK_ERROR_CODES } from 'src/shared/network-errors';
import { log, sanitizeFilename, uuid } from 'src/shared/vanilla';
import {
  clearFetchCache,
  fetchMediaItems,
  fetchPubMediaLinks,
  fetchRaw,
} from 'src/utils/api';
import { convertImageIfNeeded } from 'src/utils/converters';
import {
  dateFromString,
  datesAreSame,
  formatDate,
  getDateDiff,
  getSpecificWeekday,
  isInPast,
  subtractFromDate,
} from 'src/utils/date';
import {
  findFile,
  getPublicationDirectory,
  getTempPath,
  trimFilepathAsNeeded,
} from 'src/utils/fs';
import { sanitizeId } from 'src/utils/general';
import { findBestResolution, getPubId, isMediaLink } from 'src/utils/jw';
import {
  getMetadataFromMediaPath,
  isAudio,
  isImage,
  isJwPlaylist,
  isJwpub,
  isLikelyFile,
  isSong,
  isVideo,
} from 'src/utils/media';
import {
  addFullFilePathToMultimediaItem,
  findDb,
  getDocumentExtractItems,
  getDocumentMultimediaItems,
  getMediaVideoMarkers,
  getMepsLanguagesByMediaItem,
  getPublicationInfoFromDb,
  registerSqliteProviders,
  tableExists,
} from 'src/utils/sqlite';
import { timeToSeconds } from 'src/utils/time';
import { useCurrentStateStore } from 'stores/current-state';
import {
  replaceMissingMediaByPubMediaId,
  shouldUpdateList,
  useJwStore,
} from 'stores/jw';

import { createMeetingSections } from './media-sections';

const {
  basename,
  changeExt,
  dirname,
  downloadFile,
  executeQuery,
  extname,
  extractNestedZipEntry,
  fileUrlToPath,
  fs,
  getZipEntries,
  isUsablePath: isUsablePathRaw,
  join,
  pathToFileURL,
  readdir,
  setElectronUrlVariables,
  unzip,
} = globalThis.electronApi;
const { copy, ensureDir, exists, pathExists, remove, rename, stat } = fs;

const backgroundMusicLibraryCache = new Map<string, Promise<SongItem[]>>();
const publicationMediaLinksCache = new Map<string, Promise<MediaLink[]>>();

const mediaItemIsDynamic = (item?: MediaItem): boolean => {
  if (!item) return false;
  if (item.source === 'dynamic') return true;
  return item.children?.some(mediaItemIsDynamic) ?? false;
};

export const ensureWatchedMeetingDayFolders = async () => {
  try {
    const currentStateStore = useCurrentStateStore();
    const { currentCongregation, currentSettings } = currentStateStore;
    const watchFolder = currentSettings?.folderToWatch;
    if (
      !currentCongregation ||
      !currentSettings?.enableFolderWatcher ||
      !watchFolder
    ) {
      return;
    }

    const jwStore = useJwStore();
    const days = jwStore.lookupPeriod[currentCongregation] ?? [];
    const meetingDayFolders = days
      .filter((day) => {
        if (!day.date || !currentStateStore.getMeetingType(day.date)) {
          return false;
        }

        return Object.values(day.mediaSections ?? {}).some((section) =>
          section.items?.some(mediaItemIsDynamic),
        );
      })
      .map((day) => formatDate(day.date, 'YYYY-MM-DD'));

    for (const folderName of new Set(meetingDayFolders)) {
      await ensureDir(join(watchFolder, folderName));
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'ensureWatchedMeetingDayFolders',
        },
      },
    });
  }
};

const getBackgroundMusicLibraryCacheKey = (publication: PublicationFetcher) =>
  [
    publication.langwritten,
    publication.pub,
    publication.fileformat,
    publication.maxTrack,
    useCurrentStateStore().currentSettings?.maxRes,
  ].join(':');

const getBestPublicationMediaLinks = (
  mediaLinks: MediaLink[],
  publication: PublicationFetcher,
) => {
  const currentStateStore = useCurrentStateStore();
  const filteredMediaItemLinks: MediaLink[] = [];

  for (const mediaItemLink of mediaLinks) {
    const currentTrack = mediaItemLink.track;
    if (!filteredMediaItemLinks.some((m) => m.track === currentTrack)) {
      const bestItem = findBestResolution(
        mediaLinks.filter((m) => m.track === currentTrack),
        currentStateStore.currentSettings?.maxRes,
      );
      if (isMediaLink(bestItem)) filteredMediaItemLinks.push(bestItem);
    }
  }

  return filteredMediaItemLinks.filter((mediaLink) =>
    extname(mediaLink?.file?.url)?.includes(
      publication?.fileformat?.toLowerCase() ?? '',
    ),
  );
};

const getPublicationMediaLinks = async (
  publication: PublicationFetcher,
): Promise<MediaLink[]> => {
  const cacheKey = getBackgroundMusicLibraryCacheKey(publication);

  if (!publicationMediaLinksCache.has(cacheKey)) {
    publicationMediaLinksCache.set(
      cacheKey,
      (async () => {
        const publicationInfo = await getPubMediaLinks(publication);
        if (!publication.fileformat || !publicationInfo?.files) return [];

        const mediaLinks = (
          publication.langwritten
            ? publicationInfo.files[publication.langwritten]?.[
                publication.fileformat
              ] || []
            : []
        )
          .filter((element) => isMediaLink(element))
          .filter(
            (mediaLink) =>
              !publication.maxTrack || mediaLink.track < publication.maxTrack,
          );

        const bestLinks = getBestPublicationMediaLinks(mediaLinks, publication);
        if (!bestLinks.length) {
          publicationMediaLinksCache.delete(cacheKey);
        }

        return bestLinks;
      })().catch((error: unknown) => {
        publicationMediaLinksCache.delete(cacheKey);
        throw error;
      }),
    );
  }

  return publicationMediaLinksCache.get(cacheKey) ?? [];
};

const getExpectedDownloadPath = async (
  dir: string,
  url: string,
): Promise<string> => join(dir, sanitizeFilename(basename(url)));

const getValidLocalSongPath = async (song: SongItem): Promise<string> => {
  try {
    if (!song.path || !(await exists(song.path))) return '';

    if (!song.filesize) return song.path;

    const statistics = await stat(song.path);
    if (statistics.size === song.filesize) return song.path;

    log(
      `[${new Date().toISOString()}] Background music local file size mismatch`,
      'backgroundMusic',
      'debug',
      {
        expectedSize: song.filesize,
        localSize: statistics.size,
        path: song.path,
        title: song.title,
        track: song.track,
      },
    );
    return '';
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'getValidLocalSongPath', song } },
    });
    return '';
  }
};

const isUsablePathCache = new Map<string, boolean>();
const inFlight = new Map<string, Promise<boolean>>();

type InvalidJwpubRedownloadStatus = 'attempted' | 'failed' | 'recovered';

const VERSE_NUMBER_PATTERN = /\b\w+\s+(\d+:\d+|\d+)\b/g;

const trackInvalidJwpubRedownload = async (
  status: InvalidJwpubRedownloadStatus,
  data?: { path?: string; publication?: null | string },
) => {
  const { addBreadcrumb, setTag } = await import('@sentry/vue');
  setTag('invalid_jwpub_redownload_attempted', status);
  addBreadcrumb({
    category: 'downloads.jwpub',
    data: {
      path: data?.path,
      publication: data?.publication,
      status,
    },
    level: status === 'failed' ? 'error' : 'warning',
    message: 'invalid-jwpub-redownload-attempted',
  });
};

const getMemorialMediaCacheKey = (
  langwritten: JwLangCode,
  memorialDate?: null | string,
) => `${langwritten}:${memorialDate || 'none'}`;

const memorialMediaCache = new Map<
  string,
  { bg: string; introVideos: MultimediaItem[] }
>();

const memorialMediaInFlight = new Map<
  string,
  Promise<undefined | { bg: string; introVideos: MultimediaItem[] }>
>();

const isMemorialMeetingDate = (
  meetingDate?: string,
  memorialDate?: null | string,
) => {
  if (!meetingDate || !memorialDate) return false;
  return datesAreSame(meetingDate, memorialDate);
};

const isUsablePath = async (path: string) => {
  if (isUsablePathCache.has(path)) {
    return isUsablePathCache.get(path);
  }

  if (!inFlight.has(path)) {
    const promise = isUsablePathRaw(path)
      .then((result) => {
        isUsablePathCache.set(path, result);
        inFlight.delete(path);
        return result;
      })
      .catch((err) => {
        inFlight.delete(path);
        throw err;
      });

    inFlight.set(path, promise);
  }

  return inFlight.get(path);
};

export const getJwLangCode = (mepsId?: number): JwLangCode | null => {
  if (mepsId === undefined) return null;
  const jwStore = useJwStore();
  const match = jwStore.jwMepsLanguages.list.find(
    (l) => l.LanguageId === mepsId,
  );
  if (match) return match.Symbol;
  return mepslangs[mepsId] || null;
};

const getJwLangId = (symbol?: JwLangCode): number | undefined => {
  if (symbol === undefined) return undefined;
  const jwStore = useJwStore();
  const match = jwStore.jwMepsLanguages.list.find((l) => l.Symbol === symbol);
  if (match) return match.LanguageId;
  const entry = Object.entries(mepslangs).find(([, value]) => value === symbol);
  return entry ? Number.parseInt(entry[0], 10) : undefined;
};

const ongoingUnzips = new Map<string, Promise<string | undefined>>();
const ZIP_ENTRY_DIAGNOSTIC_LIMIT = 50;
const MAX_IDENTIFY_IN_MEMORY_CONTENTS_SIZE = 150000000; // 150 MB

const isCloudStoragePath = (path: string) => {
  const normalizedPath = path.replaceAll('\\', '/').toLowerCase();
  return (
    normalizedPath.includes('/library/mobile documents/') ||
    normalizedPath.includes('/icloud drive/') ||
    normalizedPath.includes('/dropbox/') ||
    normalizedPath.includes('/onedrive') ||
    normalizedPath.includes('/google drive/')
  );
};

const isCloudStorageReadError = (error: unknown) => {
  const errorCode = (error as { code?: string })?.code;
  if (errorCode && NETWORK_ERROR_CODES.has(errorCode)) return true;

  const message = error instanceof Error ? error.message : String(error);
  return /connection timed out|resource busy|temporarily unavailable/i.test(
    message,
  );
};

interface DirectoryDiagnostic {
  entryCount?: number;
  errorCode?: string;
  sampleEntries?: string[];
}

interface PathDiagnostic {
  errorCode?: string;
  exists: boolean;
  size?: number;
}

interface ZipEntriesDiagnostic {
  contentsSize?: number;
  entryCount: number;
  sampleEntries: string[];
  totalUncompressedSize: number;
}

const getErrorCode = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
};

const getPathDiagnostic = async (path: string): Promise<PathDiagnostic> => {
  try {
    const pathStats = await stat(path);
    return { exists: true, size: pathStats.size };
  } catch (error) {
    return { errorCode: getErrorCode(error), exists: false };
  }
};

const isJwpubFileUnavailableError = (error: unknown, jwpubPath: string) => {
  const errorCode = getErrorCode(error);
  if (errorCode === 'ENOENT') return true;
  if (isCloudStorageReadError(error)) return true;
  return (
    isPossiblyNetworkFolderPath(dirname(jwpubPath)) &&
    ['EINVAL', 'UNKNOWN'].includes(errorCode ?? '')
  );
};

const warnJwpubUnavailable = (jwpubPath: string, error: unknown) => {
  if (!isJwpubFileUnavailableError(error, jwpubPath)) return false;

  const t = i18n.global.t;

  createTemporaryNotification({
    caption: t('jwpub-file-unavailable-caption'),
    group: 'jwpubFileUnavailable',
    message: t('jwpub-file-unavailable-message'),
    timeout: 15000,
    type: 'warning',
  });

  return true;
};

export const stageUserJwpubForRead = async (jwpubPath: string) => {
  const tempDir = await getTempPath();
  const stagingDir = join(tempDir, `jwpub-import-${uuid()}`);
  const stagedPath = join(stagingDir, basename(jwpubPath));

  await ensureDir(stagingDir);
  try {
    await copy(jwpubPath, stagedPath);
  } catch (error) {
    if (warnJwpubUnavailable(jwpubPath, error)) return undefined;
    throw error;
  }

  return stagedPath;
};

const summarizeZipEntries = (
  entries: Record<string, number>,
): ZipEntriesDiagnostic => {
  let totalUncompressedSize = 0;
  for (const size of Object.values(entries)) {
    totalUncompressedSize += size;
  }

  return {
    contentsSize: entries.contents,
    entryCount: Object.keys(entries).length,
    sampleEntries: Object.keys(entries).slice(0, ZIP_ENTRY_DIAGNOSTIC_LIMIT),
    totalUncompressedSize,
  };
};

const getDirectoryDiagnostic = async (
  directoryPath: string,
): Promise<DirectoryDiagnostic> => {
  try {
    const entries = await readdir(directoryPath);
    return {
      entryCount: entries.length,
      sampleEntries: entries.slice(0, ZIP_ENTRY_DIAGNOSTIC_LIMIT),
    };
  } catch (error) {
    return { errorCode: getErrorCode(error) };
  }
};

const collectContentsExtractionDiagnostics = async (
  contentsPath: string,
  jwpubPath: string,
  outputPath: string,
) => {
  const diagnostics: {
    contentsFile: PathDiagnostic;
    outputDirectory: DirectoryDiagnostic;
    parentJwpubEntries?: ZipEntriesDiagnostic;
    parentJwpubEntriesErrorCode?: string;
    parentJwpubFile: PathDiagnostic;
  } = {
    contentsFile: await getPathDiagnostic(contentsPath),
    outputDirectory: await getDirectoryDiagnostic(outputPath),
    parentJwpubFile: await getPathDiagnostic(jwpubPath),
  };

  try {
    diagnostics.parentJwpubEntries = summarizeZipEntries(
      await getZipEntries(jwpubPath),
    );
  } catch (error) {
    diagnostics.parentJwpubEntriesErrorCode = getErrorCode(error);
  }

  return diagnostics;
};

const reportContentsExtractionError = async (
  error: unknown,
  contentsPath: string,
  jwpubPath: string,
  outputPath: string,
  name: string,
) => {
  const diagnostics = await collectContentsExtractionDiagnostics(
    contentsPath,
    jwpubPath,
    outputPath,
  );

  log(
    `[jwpubExtractor] Unable to read extracted contents zip at ${contentsPath}.`,
    'mediaPlayback',
    'error',
    diagnostics,
  );

  await errorCatcher(error, {
    contexts: {
      fn: {
        args: {
          contentsPath,
          jwpubPath,
          outputPath,
        },
        name,
      },
      jwpubContentsDiagnostics: diagnostics,
    },
  });
};

const getMediaFromJwPlaylist = async (
  jwPlaylistPath: string,
  selectedDateValue: Date,
  destPath: string,
) => {
  try {
    if (!jwPlaylistPath) return [];
    const outputPath = join(destPath, basename(jwPlaylistPath));
    await unzip(jwPlaylistPath, outputPath);
    const dbFile = await findDb(outputPath);
    if (!dbFile) return [];
    let playlistName = '';
    try {
      const playlistNameQuery = executeQuery<PlaylistTagItem>(
        dbFile,
        'SELECT Name FROM Tag ORDER BY TagId ASC LIMIT 1;',
      );
      if (playlistNameQuery[0]) {
        playlistName = playlistNameQuery[0].Name + ' - ';
      }
    } catch (error) {
      await errorCatcher(error, {
        contexts: {
          fn: {
            args: {
              destPath,
              jwPlaylistPath,
              selectedDateValue,
            },
            name: 'getMediaFromJwPlaylist playlistNameQuery',
          },
        },
      });
    }
    const playlistItems = executeQuery<JwPlaylistItem>(
      dbFile,
      `SELECT
        pi.PlaylistItemId,
        pi.Label,
        pi.StartTrimOffsetTicks,
        pi.EndTrimOffsetTicks,
        pi.Accuracy,
        pi.EndAction,
        pi.ThumbnailFilePath,
        plm.BaseDurationTicks,
        pim.DurationTicks,
        im.OriginalFilename,
        im.FilePath AS IndependentMediaFilePath,
        im.MimeType,
        im.Hash,
        l.LocationId,
        l.BookNumber,
        l.ChapterNumber,
        l.DocumentId,
        l.Track,
        l.IssueTagNumber,
        l.KeySymbol,
        l.MepsLanguage,
        l.Type,
        l.Title
      FROM
        PlaylistItem pi
      LEFT JOIN
        PlaylistItemIndependentMediaMap pim ON pi.PlaylistItemId = pim.PlaylistItemId
      LEFT JOIN
        IndependentMedia im ON pim.IndependentMediaId = im.IndependentMediaId
      LEFT JOIN
        PlaylistItemLocationMap plm ON pi.PlaylistItemId = plm.PlaylistItemId
      LEFT JOIN
        Location l ON plm.LocationId = l.LocationId`,
    );
    const playlistMediaItems: MultimediaItem[] = await Promise.all(
      playlistItems.map(async (item, i) => {
        item.ThumbnailFilePath = item.ThumbnailFilePath
          ? join(outputPath, item.ThumbnailFilePath)
          : '';
        if (
          item.ThumbnailFilePath &&
          !JPG_EXTENSIONS.includes(
            extname(item.ThumbnailFilePath).toLowerCase().replace('.', ''),
          ) &&
          (await pathExists(item.ThumbnailFilePath))
        ) {
          try {
            await rename(
              item.ThumbnailFilePath,
              item.ThumbnailFilePath + '.jpg',
            );
            item.ThumbnailFilePath += '.jpg';
          } catch (error) {
            await errorCatcher(error, {
              contexts: {
                fn: {
                  args: {
                    item,
                    outputPath,
                  },
                  name: 'getMediaFromJwPlaylist rename thumbnail',
                },
              },
            });
          }
        }
        const durationTicks =
          item?.BaseDurationTicks || item?.DurationTicks || 0;
        const EndTime =
          durationTicks &&
          item?.EndTrimOffsetTicks &&
          durationTicks >= item.EndTrimOffsetTicks
            ? (durationTicks - item.EndTrimOffsetTicks) / 10000 / 1000
            : null;

        const StartTime =
          item.StartTrimOffsetTicks && item.StartTrimOffsetTicks >= 0
            ? item.StartTrimOffsetTicks / 10000 / 1000
            : null;

        const VerseNumbers = globalThis.electronApi
          .executeQuery<{
            Label: string;
          }>(
            dbFile,
            `SELECT
            Label
          FROM
            PlaylistItemMarker
          WHERE
            PlaylistItemId = ?`,
            [item.PlaylistItemId],
          )
          .map((v) =>
            Number.parseInt(
              Array.from(
                v.Label.matchAll(VERSE_NUMBER_PATTERN),
                (m) => m[1],
              )[0] ?? '0',
            ),
          );

        const playlistItemName = `${i + 1} - ${item.Label}`;

        const returnItem: MultimediaItem = {
          BeginParagraphOrdinal: 0,
          BookNumber: item.BookNumber,
          Caption: '',
          CategoryType: 0,
          ChapterNumber: item.ChapterNumber,
          DocumentId: 0,
          EndTime: EndTime ?? undefined,
          FilePath: item.IndependentMediaFilePath
            ? join(outputPath, item.IndependentMediaFilePath)
            : '',
          IssueTagNumber: item.IssueTagNumber,
          KeySymbol: item.KeySymbol,
          Label: `${playlistName}${playlistItemName}`,
          MajorType: 0,
          MepsLanguageIndex: item.MepsLanguage,
          MimeType: item.MimeType,
          MultimediaId: 0,
          Repeat: item.EndAction === 3,
          StartTime: StartTime ?? undefined,
          TargetParagraphNumberLabel: 0,
          ThumbnailFilePath: item.ThumbnailFilePath || '',
          Track: item.Track,
          VerseNumbers,
        };
        return returnItem;
      }),
    );

    await processMissingMediaInfo({
      allMedia: playlistMediaItems,
      keepMediaLabels: true,
      meetingDate: formatDate(selectedDateValue, 'YYYYMMDD'),
    });
    const mappedPlaylistMediaItems = await dynamicMediaMapper(
      playlistMediaItems.filter((m) => m.KeySymbol !== 'nwt'),
      selectedDateValue,
      'playlist',
    );
    return mappedPlaylistMediaItems;
  } catch (error) {
    await errorCatcher(error, {
      contexts: {
        fn: {
          args: {
            destPath,
            jwPlaylistPath,
            selectedDateValue,
          },
          name: 'getMediaFromJwPlaylist',
        },
      },
    });
    return [];
  }
};

const warnCloudJwpubUnavailable = (jwpubPath: string, error: unknown) => {
  if (!isCloudStoragePath(jwpubPath) || !isCloudStorageReadError(error)) return;

  const t = i18n.global.t;

  createTemporaryNotification({
    caption: t('cloud-file-unavailable-caption'),
    group: 'cloudJwpubUnavailable',
    message: t('cloud-file-unavailable-message'),
    timeout: 15000,
    type: 'warning',
  });
};

const isInMemoryZipGuardError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /Reached max\. (entry )?size \(failsafe\)/.test(message);
};

const extractIdentificationDb = async (
  jwpubPath: string,
  tempExplodePath: string,
  contentsSize: number,
) => {
  if (contentsSize <= MAX_IDENTIFY_IN_MEMORY_CONTENTS_SIZE) {
    try {
      const { path } = await extractNestedZipEntry(
        jwpubPath,
        'contents',
        tempExplodePath,
        { innerEntryNameSuffix: '.db' },
      );
      return path;
    } catch (error) {
      if (!isInMemoryZipGuardError(error)) throw error;
      log(
        `[identifyJwpub] In-memory contents read exceeded limits for ${jwpubPath}. Falling back to disk extraction.`,
        'mediaPlayback',
        'warn',
        error,
      );
    }
  }

  await ensureDir(tempExplodePath);
  await unzip(jwpubPath, tempExplodePath, { includes: ['contents'] });
  const contentsPath = join(tempExplodePath, 'contents');
  const contentsEntries = await getZipEntries(contentsPath);
  const dbName = Object.keys(contentsEntries).find((n) => n.endsWith('.db'));
  if (!dbName) return;

  await unzip(contentsPath, tempExplodePath, { includes: [dbName] });
  return join(tempExplodePath, dbName);
};

/**
 * Efficiently identifies a JWPUB file by peeking into its metadata
 * without full extraction.
 */
export async function identifyJwpub(jwpubPath: string) {
  const tempDir = await getTempPath();
  if (!tempDir) return;

  const extractionId = uuid();
  const tempExplodePath = join(tempDir, `identify-${extractionId}`);

  try {
    // 1. Peek at JWPUB to find 'contents'
    let jwpubEntries: Record<string, number>;
    try {
      jwpubEntries = await getZipEntries(jwpubPath);
    } catch (error) {
      log(
        `[identifyJwpub] Error reading JWPUB entries for ${jwpubPath}:`,
        'mediaPlayback',
        'error',
        error,
      );
      warnCloudJwpubUnavailable(jwpubPath, error);
      return;
    }
    if (!jwpubEntries['contents']) return;

    // 2. For small publications, read 'contents' in memory and write only the inner .db file to temp.
    // Huge publications fall back to streamed disk extraction to avoid RAM spikes.
    const dbPath = await extractIdentificationDb(
      jwpubPath,
      tempExplodePath,
      jwpubEntries.contents,
    );
    if (!dbPath) return;

    // 3. Get publication info
    return getPublicationInfoFromDb(dbPath);
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          args: { jwpubPath },
          name: 'identifyJwpub',
        },
      },
    });
    return undefined;
  } finally {
    // Cleanup
    await remove(tempExplodePath).catch(() => undefined);
  }
}

const extractContentsFromJwpub = async (
  jwpubPath: string,
  outputPath: string,
) => {
  const contentsPath = join(outputPath, 'contents');
  let jwpubEntries: Record<string, number>;
  try {
    jwpubEntries = await getZipEntries(jwpubPath);
  } catch (error) {
    log(
      `[jwpubExtractor] Error reading JWPUB entries for ${jwpubPath}:`,
      'mediaPlayback',
      'error',
      error,
    );
    warnCloudJwpubUnavailable(jwpubPath, error);
    // If we can't read the entries to even start extraction, the file might be locked, damaged, or still downloading from cloud storage.
    // Cloud-managed placeholders should not be deleted because the provider may hydrate them after this attempt.
    if (!isCloudStorageReadError(error)) {
      await remove(jwpubPath).catch(() => undefined);
    }
    throw error;
  }
  const hasContentsEntry = Object.hasOwn(jwpubEntries, 'contents');
  const expectedContentsSize = jwpubEntries['contents'];

  if (!hasContentsEntry) {
    const error = new Error('JWPUB does not contain contents entry');
    await reportContentsExtractionError(
      error,
      contentsPath,
      jwpubPath,
      outputPath,
      'jwpubExtractor missing contents entry',
    );
    throw error;
  }

  // First, only extract 'contents' from the JWPUB zip if it doesn't exist or is the wrong size
  const contentsStats = await stat(contentsPath).catch(() => undefined);

  if (contentsStats?.size !== expectedContentsSize) {
    if (contentsStats) {
      log(
        `[jwpubExtractor] contents size mismatch: path ${contentsPath}, expected ${expectedContentsSize}, got ${contentsStats.size}. Re-extracting contents from ${jwpubPath}.`,
        'mediaPlayback',
        'warn',
      );
    }
    try {
      await unzip(jwpubPath, outputPath, {
        includes: ['contents'],
      });
    } catch (error) {
      warnCloudJwpubUnavailable(jwpubPath, error);
      // If unzipping the JWPUB fails, it's likely corrupted.
      // Remove it to force a re-download on next attempt unless cloud storage may still be hydrating the file.
      if (isCloudStorageReadError(error)) throw error;

      await remove(jwpubPath).catch((removeError) =>
        errorCatcher(removeError, {
          contexts: {
            fn: {
              args: {
                jwpubPath,
                outputPath,
              },
              name: 'jwpubExtractor remove corrupt jwpub',
            },
          },
        }),
      );
      throw error;
    }
  }
};

const extractDbFromContents = async (outputPath: string, jwpubPath: string) => {
  // Then, extract 'contents' into the output directory if needed
  // We check if the database exists and has the correct size to determine if we need to unzip
  const contentsPath = join(outputPath, 'contents');
  const dbFile = await findDb(outputPath);
  let contentsEntries: Record<string, number>;

  try {
    contentsEntries = await getZipEntries(contentsPath);
  } catch (error) {
    await reportContentsExtractionError(
      error,
      contentsPath,
      jwpubPath,
      outputPath,
      'jwpubExtractor read contents entries',
    );
    throw error;
  }
  let expectedDbSize = 0;
  let expectedDbName = '';

  for (const [name, size] of Object.entries(contentsEntries)) {
    if (name.endsWith('.db')) {
      expectedDbSize = size;
      expectedDbName = name;
      break;
    }
  }

  const dbStats = dbFile
    ? await stat(dbFile).catch(() => undefined)
    : undefined;
  if (dbStats?.size !== expectedDbSize) {
    if (dbStats) {
      log(
        `[jwpubExtractor] DB size mismatch: path ${dbFile}, expected ${expectedDbSize} (${expectedDbName}), got ${dbStats.size}. Re-extracting the contents from ${contentsPath}.`,
        'mediaPlayback',
        'warn',
      );
    }
    try {
      await unzip(contentsPath, outputPath);
      const dbFileAfterUnzip = await findDb(outputPath);
      if (!dbFileAfterUnzip) throw new Error('DB still not found after unzip');
    } catch (error) {
      // If unzipping contents fails, it might be corrupted.
      // Remove it so it can be re-extracted next time.
      await remove(contentsPath).catch((removeError) =>
        errorCatcher(removeError, {
          contexts: {
            fn: {
              args: {
                jwpubPath,
                outputPath,
              },
              name: 'jwpubExtractor remove contents',
            },
          },
        }),
      );
      // Also remove the source JWPUB as it's the progenitor of the corrupt contents
      await remove(jwpubPath);
      throw error;
    }
  }
};

const jwpubExtractor = async (jwpubPath: string, outputPath: string) => {
  try {
    await extractContentsFromJwpub(jwpubPath, outputPath);
    await extractDbFromContents(outputPath, jwpubPath);

    return outputPath;
  } catch (error) {
    // If anything fails, clean up the output directory to avoid partial extractions
    try {
      await remove(outputPath);
    } catch (removeError) {
      await errorCatcher(removeError, {
        contexts: {
          fn: {
            args: {
              jwpubPath,
              outputPath,
            },
            name: 'jwpubExtractor cleanup output error',
          },
        },
      });
    }

    if (warnJwpubUnavailable(jwpubPath, error)) {
      log(
        `[jwpubExtractor] JWPUB unavailable while extracting ${jwpubPath}.`,
        'mediaPlayback',
        'warn',
        error,
      );
    } else {
      await errorCatcher(error, {
        contexts: {
          fn: {
            args: {
              jwpubPath,
              outputPath,
            },
            name: 'jwpubExtractor',
          },
        },
      });
    }

    // We MUST throw the error so the caller knows extraction failed.
    throw error;
  }
};

export const unzipJwpub = async (
  jwpubPath: string,
  outputPath?: string,
  force = false,
) => {
  try {
    const currentState = useCurrentStateStore();
    if (!isJwpub(jwpubPath)) return jwpubPath;
    if (!outputPath) {
      outputPath = join(await getTempPath(), basename(jwpubPath));
    }

    const cacheKey = `${jwpubPath}->${outputPath}`;

    // If force, clear the output directory before filling it
    if (force) {
      try {
        await remove(outputPath);
      } catch (e) {
        await errorCatcher(e, {
          contexts: {
            fn: {
              args: {
                jwpubPath,
                outputPath,
              },
              name: 'unzipJwpub remove',
            },
          },
        });
      }
    }

    let unzipPromise = ongoingUnzips.get(cacheKey);

    if (!unzipPromise || force) {
      unzipPromise = (async () => {
        if (!currentState.extractedFiles[outputPath] || force) {
          // jwpubExtractor now throws on failure
          currentState.extractedFiles[outputPath] = await jwpubExtractor(
            jwpubPath,
            outputPath,
          );
        }
        return currentState.extractedFiles[outputPath];
      })();
      ongoingUnzips.set(cacheKey, unzipPromise);
    }

    try {
      return await unzipPromise;
    } finally {
      ongoingUnzips.delete(cacheKey);
    }
  } catch (error) {
    if (!warnJwpubUnavailable(jwpubPath, error)) {
      await errorCatcher(error, {
        contexts: {
          fn: {
            args: {
              jwpubPath,
              outputPath,
            },
            name: 'unzipJwpub',
          },
        },
      });
    }
    throw error;
  }
};

export const copyToDatedAdditionalMedia = async (
  filepathToCopy: string,
  section: MediaSectionIdentifier | undefined,
  addToAdditionMediaMap?: boolean,
) => {
  const currentStateStore = useCurrentStateStore();
  const jwStore = useJwStore();
  const datedAdditionalMediaDir =
    await currentStateStore.getDatedAdditionalMediaDirectory();

  await updateLastUsedDate(
    datedAdditionalMediaDir,
    currentStateStore.selectedDate,
  );

  try {
    if (!filepathToCopy || !(await exists(filepathToCopy))) return '';
    let datedAdditionalMediaPath = join(
      datedAdditionalMediaDir,
      basename(filepathToCopy),
    );
    datedAdditionalMediaPath = trimFilepathAsNeeded(datedAdditionalMediaPath);
    const uniqueId = sanitizeId(
      formatDate(currentStateStore.selectedDate, 'YYYYMMDD') +
        '-' +
        pathToFileURL(datedAdditionalMediaPath),
    );
    if (await exists(datedAdditionalMediaPath)) {
      if (filepathToCopy !== datedAdditionalMediaPath) {
        try {
          await remove(datedAdditionalMediaPath);
        } catch (e) {
          errorCatcher(e);
        }
        jwStore.removeFromAdditionMediaMap(
          uniqueId,
          currentStateStore.currentCongregation,
          currentStateStore.selectedDateObject,
        );
      }
    }
    if (filepathToCopy !== datedAdditionalMediaPath) {
      await copy(filepathToCopy, datedAdditionalMediaPath);
    }
    if (addToAdditionMediaMap) {
      await addToAdditionMediaMapFromPath(
        datedAdditionalMediaPath,
        section,
        uniqueId,
      );
    }
    return datedAdditionalMediaPath;
  } catch (error) {
    errorCatcher(error);
    return '';
  }
};

export const createMediaItemFromPath = async (
  additionalFilePath: string,
  uniqueId?: string,
  additionalInfo?: {
    duration?: number;
    filesize?: number;
    song?: string;
    thumbnailUrl?: string;
    title?: string;
    url?: string;
  },
  customDuration?: { max: number; min: number },
): Promise<MediaItem | undefined> => {
  try {
    if (!additionalFilePath) return undefined;
    const currentStateStore = useCurrentStateStore();
    const video = isVideo(additionalFilePath);
    const audio = isAudio(additionalFilePath);
    const metadata =
      video || audio
        ? await getMetadataFromMediaPath(additionalFilePath)
        : undefined;

    const duration = additionalInfo?.duration || metadata?.format.duration || 0;
    const title =
      additionalInfo?.title ||
      metadata?.common.title ||
      basename(additionalFilePath).replace(extname(additionalFilePath), '');

    if (!uniqueId) {
      uniqueId = sanitizeId(
        formatDate(currentStateStore.selectedDate, 'YYYYMMDD') +
          '-' +
          pathToFileURL(additionalFilePath),
      );
    }

    return {
      customDuration:
        customDuration?.min === 0 && customDuration?.max === 0
          ? undefined
          : customDuration,
      duration,
      filesize: additionalInfo?.filesize,
      fileUrl: pathToFileURL(additionalFilePath),
      isAudio: audio,
      isImage: isImage(additionalFilePath),
      isVideo: video,
      sortOrderOriginal: -1,
      source: 'additional',
      streamUrl: additionalInfo?.url,
      tag: {
        type: additionalInfo?.song ? 'song' : undefined,
        value: additionalInfo?.song ?? undefined,
      },
      thumbnailUrl:
        additionalInfo?.thumbnailUrl ??
        (await getThumbnailUrl(additionalFilePath, true)),
      title,
      type: 'media',
      uniqueId,
    };
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          additionalFilePath,
          additionalInfo,
          name: 'createMediaItemFromPath',
          uniqueId,
        },
      },
    });
    return undefined;
  }
};

export const addToAdditionMediaMapFromPath = async (
  additionalFilePath: string,
  section: MediaSectionIdentifier = 'imported-media',
  uniqueId?: string,
  additionalInfo?: {
    duration?: number;
    filesize?: number;
    song?: string;
    thumbnailUrl?: string;
    title?: string;
    url?: string;
  },
  customDuration?: { max: number; min: number },
) => {
  try {
    const item = await createMediaItemFromPath(
      additionalFilePath,
      uniqueId,
      additionalInfo,
      customDuration,
    );
    if (!item) return undefined;

    const currentStateStore = useCurrentStateStore();
    const jwStore = useJwStore();
    log(
      `🔄 [addToAdditionMediaMapFromPath] Adding media to section: ${section}`,
      'mediaProcessing',
      'info',
    );
    jwStore.addToAdditionMediaMap(
      [item],
      section,
      currentStateStore.currentCongregation,
      currentStateStore.selectedDateObject,
      isCoWeek(currentStateStore.selectedDateObject?.date),
    );
    return item.uniqueId;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          additionalFilePath,
          additionalInfo,
          name: 'addToAdditionMediaMapFromPath',
          uniqueId,
        },
      },
    });
    return undefined;
  }
};

export const addJwpubDocumentMediaToFiles = async (
  dbPath: string,
  document: DocumentItem,
  section: MediaSectionIdentifier | undefined,
  pubFolder?: PublicationFetcher,
  meetingDate?: string,
  selectedMultimediaIds?: number[],
) => {
  const jwStore = useJwStore();
  const { addToAdditionMediaMap } = jwStore;
  const currentStateStore = useCurrentStateStore();
  try {
    if (!dbPath) return;
    const publication = getPublicationInfoFromDb(dbPath);
    const multimediaItems = getDocumentMultimediaItems(
      {
        db: dbPath,
        docId: document.DocumentId,
      },
      currentStateStore.currentSettings?.includePrinted,
    );
    const filteredMultimediaItems = selectedMultimediaIds
      ? multimediaItems.filter((item) =>
          selectedMultimediaIds.includes(item.MultimediaId),
        )
      : multimediaItems;
    for (let i = 0; i < filteredMultimediaItems.length; i++) {
      const item = filteredMultimediaItems[i];
      if (item) {
        filteredMultimediaItems[i] = await addFullFilePathToMultimediaItem(
          item,
          pubFolder ?? publication,
        );
      }
    }
    await processMissingMediaInfo({
      allMedia: filteredMultimediaItems,
      meetingDate: meetingDate || currentStateStore.selectedDate,
    });
    const mediaItems = currentStateStore.selectedDateObject
      ? await dynamicMediaMapper(
          filteredMultimediaItems,
          currentStateStore.selectedDateObject?.date,
          'additional',
        )
      : [];
    addToAdditionMediaMap(
      mediaItems,
      section,
      currentStateStore.currentCongregation,
      currentStateStore.selectedDateObject,
      isCoWeek(currentStateStore.selectedDateObject?.date),
    );
  } catch (e) {
    errorCatcher(e);
  }
};

interface DownloadProgress {
  filename?: string;
  meetingDate?: string;
  progressCategory: FileDownloader['progressCategory'];
}

const pollUntilDownloaded = (
  downloadId: string,
  destinationPath: string,
  remoteSize: number,
  currentStateStore: ReturnType<typeof useCurrentStateStore>,
): Promise<DownloadedFile> =>
  new Promise<DownloadedFile>((resolve) => {
    const interval = setInterval(() => {
      if (currentStateStore.downloadProgress[downloadId]?.error) {
        clearInterval(interval);
        resolve({ error: true, path: destinationPath });
        return;
      }
      if (!currentStateStore.downloadProgress[downloadId]?.complete) return;
      clearInterval(interval);
      void resolveDownloadedFile(destinationPath, remoteSize, resolve);
    }, 500);
  });

const resolveDownloadedFile = async (
  destinationPath: string,
  remoteSize: number,
  resolve: (value: DownloadedFile) => void,
) => {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await exists(destinationPath)) {
      const statistics = await stat(destinationPath);
      const hasExpectedSize = remoteSize <= 0 || statistics.size === remoteSize;
      if (statistics.size > 0 && hasExpectedSize) {
        resolve({ new: true, path: destinationPath });
        return;
      }
    }
    await new Promise((settle) => {
      setTimeout(settle, 200);
    });
  }
  resolve({ error: true, path: destinationPath });
};

export const downloadFileIfNeeded = async ({
  dir,
  filename,
  lowPriority,
  meetingDate,
  progressCategory,
  size,
  url,
}: FileDownloader): Promise<DownloadedFile> => {
  if (!url) {
    return {
      new: false,
      path: '',
    };
  }

  let destinationPath = '';

  try {
    const currentStateStore = useCurrentStateStore();
    const dirIsUsable = await isUsablePath(dir);
    if (!dirIsUsable) throw new Error('Unusable path');
    if (!filename) filename = basename(url);
    filename = sanitizeFilename(filename);
    destinationPath = join(dir, filename);
    const remoteSize: number =
      size ||
      (await fetchRaw(url, { method: 'HEAD' }, true)
        .then((response) => {
          return +(response?.headers?.get('content-length') || 0);
        })
        .catch(() => 0));
    if (await exists(destinationPath)) {
      const statistics = await stat(destinationPath);
      const localSize = statistics.size;
      if (remoteSize > 0 && localSize === remoteSize) {
        return {
          new: false,
          path: destinationPath,
        };
      }
    }
    const downloadId = await downloadFile(url, dir, filename, lowPriority);

    // Seed meeting date on progress right away so UI can group even before onDownloadStarted
    if (downloadId) {
      const seed = (currentStateStore.downloadProgress[downloadId] ??
        {}) as DownloadProgress;

      currentStateStore.downloadProgress[downloadId] = {
        ...seed,
        filename,
        meetingDate: seed.meetingDate ?? meetingDate,
        progressCategory: seed.progressCategory ?? progressCategory,
      } as never;
    }

    if (!downloadId) {
      return { error: true, path: destinationPath };
    }

    const result = await pollUntilDownloaded(
      downloadId,
      destinationPath,
      remoteSize,
      currentStateStore,
    );
    return result;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          dir,
          filename,
          lowPriority,
          meetingDate,
          name: 'downloadFileIfNeeded',
          size,
          url,
        },
      },
    });
    return {
      error: true,
      path: destinationPath,
    };
  }
};

const checkMissingDynamicMediaFile = async (
  media: MediaItem,
  mediaIndex: number,
) => {
  const shouldCheckFile =
    !media?.children?.length && media?.source === 'dynamic' && media?.fileUrl;
  const fileExists =
    shouldCheckFile && (await pathExists(fileUrlToPath(media.fileUrl)));
  const isMissing = shouldCheckFile && !fileExists;

  if (isMissing) {
    log(
      `    ❌ Missing media file at media[${mediaIndex}]: ${media.fileUrl}`,
      'mediaFetching',
      'error',
    );
  }

  return isMissing;
};

const fetchMeetingMediaForDay = async (
  dayDate: Date,
  meetingType: null | string,
) => {
  if (meetingType === 'we') {
    log('🌅 Fetching weekend meeting media', 'mediaFetching', 'info');
    return await getWeMedia(dayDate);
  }

  if (meetingType === 'mw') {
    log('🌆 Fetching midweek meeting media', 'mediaFetching', 'info');
    return await getMwMedia(dayDate);
  }

  return null;
};

const getMeetingDayRefreshCandidate = async (
  day: DateInfo,
  index: number,
  meteredConnection: boolean,
) => {
  const currentStateStore = useCurrentStateStore();
  const meetingType = currentStateStore.getMeetingType(day.date);
  if (!meetingType) return null;

  if (markPastErroredMeetingComplete(day)) return null;
  if (shouldSkipMeteredMeeting(day, index, meteredConnection)) return null;

  const hasIncompleteOrErrorMeeting = day.status !== 'complete';
  if (hasIncompleteOrErrorMeeting) {
    logIncompleteMeeting(day, index, meetingType);
  }

  const allMedia = Object.values(day.mediaSections ?? {}).flatMap(
    (section) => section.items || [],
  );
  const missingMediaCheckResults = await Promise.all(
    allMedia.map((media, mediaIndex) =>
      checkMissingDynamicMediaFile(media, mediaIndex),
    ),
  );
  const hasMissingMediaFile = missingMediaCheckResults.includes(true);
  if (hasMissingMediaFile) {
    day.status = null;
  }

  const hasDuplicates = hasDuplicateMediaUniqueIds(allMedia);
  const shouldRefresh =
    hasIncompleteOrErrorMeeting || hasMissingMediaFile || hasDuplicates;
  if (shouldRefresh) {
    log(
      `✅ Day ${index + 1} - ${day.date.toISOString().split('T')[0]} to be refreshed`,
      'mediaFetching',
      'info',
    );
  }

  return shouldRefresh ? day : null;
};

const getMeetingTypeDescription = (meetingType: null | string) => {
  switch (meetingType) {
    case 'mw':
      return 'Midweek';
    case 'we':
      return 'Weekend';
    default:
      return 'Unknown';
  }
};

const hasDuplicateMediaUniqueIds = (allMedia: MediaItem[]) => {
  const uniqueIds = allMedia.map((m) => m.uniqueId);
  const hasDuplicates = uniqueIds.length > new Set(uniqueIds).size;

  if (hasDuplicates) {
    log(
      `⚠️ Duplicate uniqueIds found: ${uniqueIds.length} total, ${new Set(uniqueIds).size} unique`,
      'mediaFetching',
      'error',
    );
  }

  return hasDuplicates;
};

const logIncompleteMeeting = (
  day: DateInfo,
  index: number,
  meetingType: string,
) => {
  log(
    `📅 Day ${index + 1} - ${day.date.toISOString().split('T')[0]}`,
    'mediaFetching',
    'info',
  );
  log(
    `🔍 Incomplete or error meeting detected: ${meetingType} - ${day.status}`,
    'mediaFetching',
    'info',
  );
};

const markPastErroredMeetingComplete = (day: DateInfo) => {
  if (!isInPast(day.date) || !day.status || day.status === 'complete') {
    return false;
  }

  log(
    `⏭️ Skipping refresh for past meeting with ${day.status} status: ${day.date.toISOString().split('T')[0]}`,
    'mediaFetching',
    'info',
  );
  day.status = 'complete';
  return true;
};

const processQueuedMeetingDay = async (day: DateInfo) => {
  const currentStateStore = useCurrentStateStore();
  const meetingType = currentStateStore.getMeetingType(day.date);
  log(
    `📅 Processing ${getMeetingTypeDescription(meetingType)} Meeting - ${day.date.toISOString().split('T')[0]}`,
    'mediaFetching',
    'info',
  );

  const fetchResult = await fetchMeetingMediaForDay(day.date, meetingType);
  if (!fetchResult) {
    log('❌ Failed to fetch media', 'mediaFetching', 'error');
    day.status = isInPast(day.date) ? 'complete' : 'error';
    return;
  }

  log('✅ Media fetched successfully', 'mediaFetching', 'info');
  day.mediaSections ??= [];
  createMeetingSections(day);
  replaceMissingMediaByPubMediaId(day, fetchResult.media);
  updateFetchedMeetingDayStatus(day, fetchResult.error);
};

const shouldSkipMeteredMeeting = (
  day: DateInfo,
  index: number,
  meteredConnection: boolean,
) => {
  if (!meteredConnection || getDateDiff(day.date, new Date(), 'days') <= 1) {
    return false;
  }

  log(
    `Skipping day ${index + 1} - ${day.date.toISOString().split('T')[0]} because metered connection is enabled and target date is after tomorrow`,
    'mediaFetching',
    'info',
  );
  return true;
};

const updateFetchedMeetingDayStatus = (day: DateInfo, error: boolean) => {
  if (error && isInPast(day.date)) {
    log(
      `⚠️ Silencing meeting media fetch error for past date ${formatDate(day.date, 'YYYY/MM/DD')}`,
      'mediaFetching',
      'warn',
    );
    day.status = 'complete';
    return;
  }

  day.status = error ? 'error' : 'complete';
};

export const fetchMedia = async () => {
  try {
    const currentStateStore = useCurrentStateStore();
    if (
      !currentStateStore.currentCongregation ||
      !!currentStateStore.currentSettings?.disableMediaFetching
    ) {
      log(
        '⏭️ Media fetching disabled or no congregation',
        'mediaFetching',
        'info',
      );
      return;
    }

    const jwStore = useJwStore();

    if (!jwStore.urlVariables.base || !jwStore.urlVariables.mediator) {
      log(
        '⚠️ Missing URL variables for media fetching',
        'mediaFetching',
        'warn',
      );
      return;
    }

    updateLookupPeriod();

    const dedupeDays = (days: DateInfo[]) => {
      try {
        const dayMap = new Map<string, DateInfo>();

        for (const day of days) {
          const dateKey = new Date(day.date).toISOString().split('T')[0]; // Use yyyy-mm-dd format as key
          if (!dateKey) continue;

          if (dayMap.has(dateKey)) {
            const existing = dayMap.get(dateKey);
            if (!existing) continue;

            const preferCurrent =
              day.status === 'complete' ||
              (existing.status === 'error' && day.status === 'error');

            if (preferCurrent) {
              dayMap.set(dateKey, day);
            }
          } else {
            dayMap.set(dateKey, day);
          }
        }

        return Array.from(dayMap.values());
      } catch (error) {
        errorCatcher(error);
        return days;
      }
    };

    const rawDays =
      jwStore.lookupPeriod[currentStateStore.currentCongregation] || [];
    const uniqueDays = dedupeDays(rawDays);

    if (uniqueDays.length !== rawDays.length) {
      log(
        `📊 Reduced days from ${rawDays.length} to ${uniqueDays.length}`,
        'mediaFetching',
        'info',
      );
      jwStore.lookupPeriod[currentStateStore.currentCongregation] = uniqueDays;
    }

    log(`🔍 Day Analysis`, 'mediaFetching', 'info');
    const meetingsToFetch = (
      await Promise.all(
        jwStore.lookupPeriod[currentStateStore.currentCongregation]?.map(
          (day, index) =>
            getMeetingDayRefreshCandidate(
              day,
              index,
              !!currentStateStore.currentSettings?.meteredConnection,
            ),
        ) || [],
      )
    ).filter((day) => !!day);

    meetingsToFetch.forEach((day) => {
      day.status = null;
    });
    if (queues.meetings[currentStateStore.currentCongregation]) {
      queues.meetings[currentStateStore.currentCongregation]?.start();
    } else {
      const { default: PQueue } = await import('p-queue');
      queues.meetings[currentStateStore.currentCongregation] = new PQueue({
        concurrency: 2,
      });

      const q = queues.meetings[currentStateStore.currentCongregation];
      if (q) {
        const updateCount = () => {
          currentStateStore.fetchingMeetingsCount = q.size + q.pending;
        };
        q.on('add', updateCount);
        q.on('active', updateCount);
        q.on('completed', updateCount);
        q.on('idle', () => {
          currentStateStore.fetchingMeetingsCount = 0;
        });
      }
    }
    const queue = queues.meetings[currentStateStore.currentCongregation];
    if (meetingsToFetch.length) {
      log(
        `📋 Meetings to process: ${meetingsToFetch.length}`,
        'mediaFetching',
        'info',
      );
    }
    for (const day of meetingsToFetch) {
      try {
        queue
          ?.add(async () => processQueuedMeetingDay(day))
          .catch((error) => {
            log('❌ Error during media processing:', 'mediaFetching', 'error');
            day.status = isInPast(day.date) ? 'complete' : 'error';
            throw error;
          });
      } catch (error) {
        errorCatcher(error);
        day.status = 'error';
      }
    }
    await queue?.onIdle();
    await ensureWatchedMeetingDayFolders();
    downloadBackgroundMusic();
    log('✅ All media processing completed', 'mediaFetching', 'info');
    queue?.clear();
    exportAllDays();
  } catch (error) {
    log('❌ Error in fetchMedia:', 'mediaFetching', 'error');
    errorCatcher(error);
  }
};

export const getDbFromJWPUB = async (
  publication: PublicationFetcher,
  meetingDate?: string,
  progressCategory?: FileDownloader['progressCategory'],
) => {
  try {
    const jwpub = await downloadJwpub(
      publication,
      meetingDate,
      progressCategory,
    );
    if (jwpub.error) return null;
    const publicationDirectory = await getPublicationDirectory(publication);
    if (jwpub.new || !(await findDb(publicationDirectory))) {
      await unzipJwpub(jwpub.path, publicationDirectory);
    }
    const dbFile = await findDb(publicationDirectory);
    return dbFile ?? null;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          args: { meetingDate, publication },
          name: 'getDbFromJWPUB',
        },
      },
    });
    return null;
  }
};

export const resolveFilePath = async (
  targetPath: string,
): Promise<string | undefined> => {
  try {
    if (!targetPath) return undefined;

    // Check if the file exists
    if (await exists(targetPath)) return targetPath;

    // If it doesn't exist, try to find it (handling missing extension)
    const dir = dirname(targetPath);
    const name = basename(targetPath, extname(targetPath));

    if (await pathExists(dir)) {
      const files = await readdir(dir);
      const match = files.find((file) => {
        const fileNameWithoutExt = basename(file.name, extname(file.name));
        return fileNameWithoutExt === name;
      });

      if (match) {
        return join(dir, match.name);
      }
    }

    return undefined;
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

export const resolveMultimediaPreviewPath = async (
  item: MultimediaItem,
): Promise<string | undefined> => {
  try {
    // Determine the preferred path
    const targetPath = isImage(item.FilePath)
      ? item.FilePath
      : item.LinkedPreviewFilePath;

    if (!targetPath) return undefined;

    return resolveFilePath(targetPath);
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

interface StudyBibleMediaResult {
  bibleBookDocumentsEndAtId: null | number;
  bibleBookDocumentsStartAtId: null | number;
  mediaItems: MultimediaItem[];
}

interface StudyBibleResult {
  nwtDb: null | string;
  nwtStyDb: null | string;
  nwtStyDb_E: null | string;
  nwtStyPublication: null | PublicationFetcher;
  nwtStyPublication_E: PublicationFetcher;
}

const studyBibleNwtStyPublication_E: PublicationFetcher = {
  fileformat: 'JWPUB',
  langwritten: 'E',
  pub: 'nwtsty',
};

const studyBibleCache = new Map<string, Promise<StudyBibleResult>>();
const studyBibleBooksCache = new Map<
  string,
  Promise<Record<number, MultimediaItem>>
>();
const studyBibleCategoriesCache = new Map<
  string,
  Promise<{ Title: string }[]>
>();
const studyBibleMediaCache = new Map<string, Promise<StudyBibleMediaResult>>();

const getEmptyStudyBibleResult = (): StudyBibleResult => ({
  nwtDb: null,
  nwtStyDb: null,
  nwtStyDb_E: null,
  nwtStyPublication: null,
  nwtStyPublication_E: studyBibleNwtStyPublication_E,
});

const getStudyBibleCacheKey = (
  cacheFolder: null | string | undefined,
  languages: JwLangCode[],
) => [cacheFolder || 'default', languages.join(':') || 'none'].join(':');

const getStudyBibleLanguages = () => {
  const currentStateStore = useCurrentStateStore();
  return [
    ...new Set([
      currentStateStore.currentSettings?.lang,
      currentStateStore.currentSettings?.langFallback,
    ]),
  ].filter((l): l is JwLangCode => !!l);
};

const getCurrentStudyBibleCacheKey = () => {
  const currentStateStore = useCurrentStateStore();
  return getStudyBibleCacheKey(
    currentStateStore.currentSettings?.cacheFolder,
    getStudyBibleLanguages(),
  );
};

const getStudyBibleMediaCacheKey = (
  bookNumber?: number,
  chapterNumber?: number,
) =>
  [
    getCurrentStudyBibleCacheKey(),
    bookNumber ?? 'all-books',
    chapterNumber ?? 'all-chapters',
  ].join(':');

const getStudyBible = async () => {
  const languages = getStudyBibleLanguages();
  const cacheKey = getStudyBibleCacheKey(
    useCurrentStateStore().currentSettings?.cacheFolder,
    languages,
  );

  if (!studyBibleCache.has(cacheKey)) {
    studyBibleCache.set(
      cacheKey,
      (async (): Promise<StudyBibleResult> => {
        const nwtStyDb_E_Promise = getDbFromJWPUB(
          studyBibleNwtStyPublication_E,
          undefined,
          'study-bible',
        );

        const nwtStyPromise = (async () => {
          let nwtStyDb: null | string = null;
          let nwtStyPublication: null | PublicationFetcher = null;

          for (const langwritten of languages) {
            if (langwritten === 'E') {
              nwtStyDb = await nwtStyDb_E_Promise;
              nwtStyPublication = studyBibleNwtStyPublication_E;
              break;
            }

            nwtStyPublication = {
              fileformat: 'JWPUB',
              langwritten,
              pub: 'nwtsty',
            };
            nwtStyDb = await getDbFromJWPUB(
              nwtStyPublication,
              undefined,
              'study-bible',
            );
            if (nwtStyDb) break;
          }

          const nwtStyDb_E = await nwtStyDb_E_Promise;

          if (!nwtStyDb) {
            nwtStyPublication = studyBibleNwtStyPublication_E;
            nwtStyDb = nwtStyDb_E;
          }

          return {
            nwtStyDb,
            nwtStyDb_E,
            nwtStyPublication,
            nwtStyPublication_E: studyBibleNwtStyPublication_E,
          };
        })();

        // Fallback to NWT if NWTSTY is missing (for book names)
        const nwtPromise = (async () => {
          for (const langwritten of languages) {
            const nwtPublication: PublicationFetcher = {
              fileformat: 'JWPUB',
              langwritten,
              pub: 'nwt',
            };
            const nwtDb = await getDbFromJWPUB(
              nwtPublication,
              undefined,
              'study-bible',
            );
            if (nwtDb) return nwtDb;
          }

          return null;
        })();

        const [nwtStyResult, nwtDb] = await Promise.all([
          nwtStyPromise,
          nwtPromise,
        ]);

        const result = {
          nwtDb,
          ...nwtStyResult,
        };

        if (!result.nwtDb && !result.nwtStyDb && !result.nwtStyDb_E) {
          studyBibleCache.delete(cacheKey);
        }

        return result;
      })().catch((error: unknown) => {
        studyBibleCache.delete(cacheKey);
        errorCatcher(error);
        return getEmptyStudyBibleResult();
      }),
    );
  }

  return studyBibleCache.get(cacheKey) ?? getEmptyStudyBibleResult();
};

export const getStudyBibleBooks: () => Promise<
  Record<number, MultimediaItem>
> = async () => {
  const cacheKey = getCurrentStudyBibleCacheKey();
  if (!studyBibleBooksCache.has(cacheKey)) {
    studyBibleBooksCache.set(
      cacheKey,
      getStudyBibleBooksUncached().then((result) => {
        if (!Object.keys(result).length) {
          studyBibleBooksCache.delete(cacheKey);
        }

        return result;
      }),
    );
  }

  return studyBibleBooksCache.get(cacheKey) ?? {};
};

const getStudyBibleBooksUncached: () => Promise<
  Record<number, MultimediaItem>
> = async () => {
  try {
    const {
      nwtDb,
      nwtStyDb,
      nwtStyDb_E,
      nwtStyPublication,
      nwtStyPublication_E,
    } = await getStudyBible();
    if (!nwtStyDb || !nwtStyPublication) return {};

    const bibleBooksQuery = `
      SELECT DISTINCT
          Document.*, 
          BibleBook.*, 
          SummaryDocument.DocumentId AS SummaryDocumentId,
          CoverMultimedia.FilePath AS CoverPictureFilePath
      FROM 
          Document
      INNER JOIN 
          BibleBook ON BibleBook.BookDocumentId = Document.DocumentId
      LEFT JOIN 
          Document AS SummaryDocument ON SummaryDocument.DocumentId = BibleBook.IntroDocumentId
      LEFT JOIN 
          DocumentMultimedia ON 
              DocumentMultimedia.DocumentId IN (Document.DocumentId, SummaryDocument.DocumentId)
      LEFT JOIN 
          Multimedia AS CoverMultimedia ON 
              CoverMultimedia.CategoryType = 9 AND CoverMultimedia.MultimediaId = DocumentMultimedia.MultimediaId
      WHERE 
          Document.Type = 2;
    `;

    const bibleBookItems = executeQuery<MultimediaItem>(
      nwtStyDb,
      bibleBooksQuery,
    );

    if (nwtStyDb_E && nwtStyDb_E !== nwtStyDb) {
      const englishBookItems = executeQuery<MultimediaItem>(
        nwtStyDb_E,
        bibleBooksQuery,
      );

      englishBookItems.forEach((englishItem) => {
        const styItem = bibleBookItems.find(
          (item) => englishItem.BibleBookId === item.BibleBookId,
        );
        if (styItem && !styItem.CoverPictureFilePath) {
          styItem.MepsLanguageIndex = englishItem.MepsLanguageIndex;
          styItem.CoverPictureFilePath = englishItem.CoverPictureFilePath;
        }
      });
    }

    if (nwtDb) {
      const bibleBooksSimpleQuery = `
      SELECT ChapterNumber, Title
      FROM 
          Document
      WHERE
          Class = 1
    `;

      const bibleBookLocalNames = executeQuery<{
        ChapterNumber: number;
        Title: string;
      }>(nwtDb, bibleBooksSimpleQuery);

      bibleBookLocalNames.forEach((localItem) => {
        const styItem = bibleBookItems.find(
          (item) =>
            Number(item.BibleBookId) === Number(localItem.ChapterNumber),
        );
        if (styItem) {
          styItem.Title = localItem.Title;
        } else {
          // Add missing book from NWT
          bibleBookItems.push({
            BibleBookId: localItem.ChapterNumber,
            CoverPictureFilePath: '',
            FilePath: '',
            // Add other necessary default properties
            MepsLanguageIndex: 0, // Default to English
            Title: localItem.Title,
          } as MultimediaItem);
        }
      });
    }

    const chapterCountsQuery = `
      SELECT BookNumber, COUNT(*) as ChapterCount 
      FROM BibleChapter 
      GROUP BY BookNumber
    `;
    const chapterCounts = executeQuery<{
      BookNumber: number;
      ChapterCount: number;
    }>(nwtStyDb, chapterCountsQuery);

    if (nwtDb) {
      const chapterCountsNwt = executeQuery<{
        BookNumber: number;
        ChapterCount: number;
      }>(nwtDb, chapterCountsQuery);

      chapterCountsNwt.forEach((nwtCount) => {
        if (!chapterCounts.some((c) => c.BookNumber === nwtCount.BookNumber)) {
          chapterCounts.push(nwtCount);
        }
      });
    }

    chapterCounts.forEach((countItem) => {
      const styItem = bibleBookItems.find(
        (item) => countItem.BookNumber === item.BibleBookId,
      );
      if (styItem) {
        styItem.ChapterCount = countItem.ChapterCount;
      }
    });

    const bibleBooksObject = Object.fromEntries(
      await Promise.all(
        bibleBookItems
          .filter((item) => !!item.BibleBookId && !!item.ChapterCount)
          .map(async (item) => [
            item.BibleBookId,
            await addFullFilePathToMultimediaItem(
              item,
              item.MepsLanguageIndex === 0
                ? nwtStyPublication_E
                : nwtStyPublication,
            ),
          ]),
      ),
    );
    return bibleBooksObject;
  } catch (error) {
    errorCatcher(error);
    return {};
  }
};

export const getStudyBibleCategories = async () => {
  const cacheKey = getCurrentStudyBibleCacheKey();
  if (!studyBibleCategoriesCache.has(cacheKey)) {
    studyBibleCategoriesCache.set(
      cacheKey,
      getStudyBibleCategoriesUncached().then((result) => {
        if (!result.length) {
          studyBibleCategoriesCache.delete(cacheKey);
        }

        return result;
      }),
    );
  }

  return studyBibleCategoriesCache.get(cacheKey) ?? [];
};

const getStudyBibleCategoriesUncached = async () => {
  try {
    const { nwtStyDb, nwtStyPublication } = await getStudyBible();
    if (!nwtStyDb || !nwtStyPublication) return [];

    const bibleMediaCategoriesQuery = `
      select Title
      from PublicationViewItem
      where PublicationViewId = 2
        and DefaultDocumentId < 0
        and ParentPublicationViewItemId < 0
    `;

    const bibleMediaCategories = executeQuery<{ Title: string }>(
      nwtStyDb,
      bibleMediaCategoriesQuery,
    );

    return bibleMediaCategories;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

export const getStudyBibleMedia = async (
  bookNumber?: number,
  chapterNumber?: number,
) => {
  const cacheKey = getStudyBibleMediaCacheKey(bookNumber, chapterNumber);
  if (!studyBibleMediaCache.has(cacheKey)) {
    studyBibleMediaCache.set(
      cacheKey,
      getStudyBibleMediaUncached(bookNumber, chapterNumber).then((result) => {
        if (
          result.bibleBookDocumentsEndAtId === null &&
          result.bibleBookDocumentsStartAtId === null
        ) {
          studyBibleMediaCache.delete(cacheKey);
        }

        return result;
      }),
    );
  }

  return (
    studyBibleMediaCache.get(cacheKey) ??
    Promise.resolve({
      bibleBookDocumentsEndAtId: null,
      bibleBookDocumentsStartAtId: null,
      mediaItems: [],
    })
  );
};

const getStudyBibleMediaUncached = async (
  bookNumber?: number,
  chapterNumber?: number,
): Promise<StudyBibleMediaResult> => {
  try {
    const { nwtStyDb, nwtStyDb_E, nwtStyPublication, nwtStyPublication_E } =
      await getStudyBible();
    if (!nwtStyDb || !nwtStyPublication) throw new Error('No study bible');

    const bibleBookMediaItemsQuery = `
        SELECT 
          vmm.MultimediaId,
          bc.BookNumber,
          bc.ChapterNumber,
          bv.Label AS VerseLabel,
          m.*,
          CASE 
              WHEN m.CategoryType = -1 THEN CoverMultimedia.FilePath
              ELSE ''
          END AS CoverPictureFilePath
        FROM 
            VerseMultimediaMap vmm
        INNER JOIN 
            BibleChapter bc ON vmm.BibleVerseId BETWEEN bc.FirstVerseId AND bc.LastVerseId
        INNER JOIN 
            BibleVerse bv ON vmm.BibleVerseId = bv.BibleVerseId
        INNER JOIN 
            Multimedia m ON vmm.MultimediaId = m.MultimediaId
        LEFT JOIN 
            Multimedia AS CoverMultimedia ON CoverMultimedia.MultimediaId = m.LinkMultimediaId
        WHERE 
            m.CategoryType NOT IN (9, 10, 17)
      ${bookNumber === undefined ? '' : `AND bc.BookNumber = ?`}
      ${chapterNumber === undefined ? '' : `AND bc.ChapterNumber = ?`}
      ORDER BY bc.ChapterNumber, bv.BibleVerseId
    `;

    const bibleBookMediaItemsParams = [bookNumber, chapterNumber].filter(
      (v) => v !== undefined,
    );
    const bibleBookMediaItems = executeQuery<MultimediaItem>(
      nwtStyDb,
      bibleBookMediaItemsQuery,
      bibleBookMediaItemsParams,
    );

    // Fetch "Related" items (Introduction, etc.)
    const bibleBookRelatedMediaItemsQuery = `
      SELECT 
          m.MultimediaId,
          d.ChapterNumber AS BookNumber,
          0 AS ChapterNumber,
          NULL AS VerseLabel,
          m.*,
          CASE 
              WHEN m.CategoryType = -1 THEN CoverMultimedia.FilePath
              ELSE ''
          END AS CoverPictureFilePath
      FROM 
          Document d
      JOIN 
          DocumentMultimedia dm ON d.DocumentId = dm.DocumentId
      JOIN 
          Multimedia m ON dm.MultimediaId = m.MultimediaId
      LEFT JOIN 
          Multimedia AS CoverMultimedia ON CoverMultimedia.MultimediaId = m.LinkMultimediaId
      WHERE 
          m.CategoryType NOT IN (9, 10, 17)
    ${bookNumber === undefined ? '' : `AND d.ChapterNumber = ?`}
    ORDER BY m.MultimediaId
    `;

    const bibleBookRelatedMediaItemsParams =
      bookNumber === undefined ? [] : [bookNumber];
    const bibleBookRelatedMediaItems = executeQuery<MultimediaItem>(
      nwtStyDb,
      bibleBookRelatedMediaItemsQuery,
      bibleBookRelatedMediaItemsParams,
    );

    const filteredMediaItems = getStudyBibleMediaItemsForChapter(
      bibleBookMediaItems,
      bibleBookRelatedMediaItems,
      chapterNumber,
    );

    // Fallback to English
    if (nwtStyDb_E && nwtStyDb_E !== nwtStyDb) {
      const englishBibleBookMediaItems = executeQuery<MultimediaItem>(
        nwtStyDb_E,
        bibleBookMediaItemsQuery,
        bibleBookMediaItemsParams,
      );

      const englishBibleBookRelatedMediaItems = executeQuery<MultimediaItem>(
        nwtStyDb_E,
        bibleBookRelatedMediaItemsQuery,
        bibleBookRelatedMediaItemsParams,
      );

      mergeEnglishStudyBibleItems(
        filteredMediaItems,
        getStudyBibleMediaItemsForChapter(
          englishBibleBookMediaItems,
          englishBibleBookRelatedMediaItems,
          chapterNumber,
        ),
        nwtStyPublication.langwritten,
      );
    }

    return {
      bibleBookDocumentsEndAtId: 0, // Not really needed anymore with new logic
      bibleBookDocumentsStartAtId: 0,
      mediaItems: await Promise.all(
        filteredMediaItems.map((item) =>
          prepareStudyBibleMediaItem(item, {
            english: nwtStyPublication_E,
            localized: nwtStyPublication,
          }),
        ),
      ),
    };
  } catch (error) {
    errorCatcher(error);
    return {
      bibleBookDocumentsEndAtId: null,
      bibleBookDocumentsStartAtId: null,
      mediaItems: [],
    };
  }
};

const getStudyBibleMediaItemsForChapter = (
  bibleBookMediaItems: MultimediaItem[],
  bibleBookRelatedMediaItems: MultimediaItem[],
  chapterNumber?: number,
) => {
  if (chapterNumber === 0) return [...bibleBookRelatedMediaItems];
  if (chapterNumber && chapterNumber > 0) return [...bibleBookMediaItems];

  return [...bibleBookMediaItems, ...bibleBookRelatedMediaItems];
};

const mergeEnglishStudyBibleItems = (
  filteredMediaItems: MultimediaItem[],
  englishItems: MultimediaItem[],
  localizedLang: string,
) => {
  for (const englishItem of englishItems) {
    const localizedPath = englishItem.FilePath.replace(
      '_E_',
      `_${localizedLang}_`,
    );
    const hasLocalizedItem = filteredMediaItems.some(
      (item) => localizedPath === item.FilePath,
    );
    if (!hasLocalizedItem) {
      filteredMediaItems.push({
        ...englishItem,
        MepsLanguageIndex: 0,
      });
    }
  }
};

const prepareStudyBibleMediaItem = async (
  item: MultimediaItem,
  publications: {
    english?: PublicationFetcher;
    localized: PublicationFetcher;
  },
) => {
  const publication =
    item.MepsLanguageIndex === 0
      ? (publications.english ?? publications.localized)
      : publications.localized;

  if (!item.KeySymbol && publication?.pub) {
    item.KeySymbol = publication.pub;
  }

  const isVideo = item.CategoryType === -1 || item.MimeType?.includes('video');
  const itemWithPath = await addFullFilePathToMultimediaItem(item, publication);
  const updatedItem = isVideo
    ? { ...itemWithPath, FilePath: '' }
    : itemWithPath;
  updatedItem.VerseNumber = item.VerseLabel
    ? Number.parseInt(
        new RegExp(/>(\d+)</).exec(item.VerseLabel)?.[1] || '',
        10,
      )
    : null;
  return updatedItem;
};

export const getBibleMedia = async (
  force = false,
  langwritten?: JwLangCode,
) => {
  try {
    const currentStateStore = useCurrentStateStore();
    const jwStore = useJwStore();

    const lang = langwritten ?? currentStateStore.currentSettings?.lang;
    if (!lang) return;

    if (!force) {
      const bibleFilesList = jwStore.jwBibleFiles?.[lang];
      if (bibleFilesList && !shouldUpdateList(bibleFilesList, 3)) {
        return bibleFilesList.list;
      }
    }

    const publication: PublicationFetcher = {
      booknum: 0,
      fileformat: currentStateStore.currentLangObject?.isSignLanguage
        ? 'MP4'
        : 'MP3',
      issue: '',
      langwritten: '',
      pub: 'nwt',
    };
    const languages = getBibleMediaLanguages(langwritten);
    const { backupNameNeeded, returnedItems } = await fetchBibleBookMedia(
      publication,
      languages,
    );
    await applyBibleBookBackupNames(returnedItems, backupNameNeeded);

    jwStore.jwBibleFiles[lang] = {
      list: returnedItems,
      updated: new Date(),
    };
    return returnedItems;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

const applyBibleBookBackupNames = async (
  returnedItems: Partial<Publication>[],
  backupNameNeeded: number[],
) => {
  if (!backupNameNeeded.length) return;

  const { nwtDb, nwtStyDb } = await getStudyBible();
  if (!(nwtStyDb || nwtDb)) return;

  const bibleBookLocalNames = getLocalBibleBookNames(nwtStyDb || nwtDb || '');
  for (const booknum of backupNameNeeded) {
    const pubName = bibleBookLocalNames.find(
      (item) => item.ChapterNumber === booknum,
    )?.Title;
    returnedItems[booknum - 1] = {
      booknum,
      pubName,
    };
  }
};

const fetchBibleBookMedia = async (
  publication: PublicationFetcher,
  languages: JwLangCode[],
) => {
  const returnedItems: Partial<Publication>[] = [];
  const backupNameNeeded: number[] = [];

  for (const booknum of Array.from({ length: 66 }, (_, i) => i + 1)) {
    const { items, needsBackupName } = await fetchBibleBookMediaForLanguages(
      publication,
      booknum,
      languages,
    );
    returnedItems.push(...items);

    if (needsBackupName) {
      backupNameNeeded.push(booknum);
      returnedItems.push({ booknum });
    }
  }

  return { backupNameNeeded, returnedItems };
};

const fetchBibleBookMediaForLanguages = async (
  publication: PublicationFetcher,
  booknum: number,
  languages: JwLangCode[],
) => {
  const items: Publication[] = [];

  for (const lang of languages) {
    publication.booknum = booknum;
    publication.langwritten = lang;
    const bibleMediaItems = await getPubMediaLinks(publication);
    if (!bibleMediaItems) return { items, needsBackupName: true };

    items.push(bibleMediaItems);
  }

  return { items, needsBackupName: false };
};

const getBibleMediaLanguages = (langwritten?: JwLangCode) => {
  const currentStateStore = useCurrentStateStore();
  return [
    ...new Set(
      langwritten
        ? [langwritten]
        : [
            currentStateStore.currentSettings?.lang,
            currentStateStore.currentSettings?.langFallback,
          ],
    ),
  ].filter((l): l is JwLangCode => !!l);
};

const getLocalBibleBookNames = (db: string) =>
  executeQuery<{
    ChapterNumber: number;
    Title: string;
  }>(
    db,
    `
      SELECT ChapterNumber, Title
      FROM 
          Document
      WHERE
          Class = 1
    `,
  );

export const getMemorialMedia = async (
  forceRefetch = false,
): Promise<undefined | { bg: string; introVideos: MultimediaItem[] }> => {
  try {
    const currentStateStore = useCurrentStateStore();
    const memorialDate = currentStateStore.currentSettings?.memorialDate;
    const year = new Date().getFullYear().toString().substring(2);
    const languages = [
      ...new Set([
        currentStateStore.currentSettings?.lang,
        currentStateStore.currentSettings?.langFallback,
      ]),
    ].filter((l): l is JwLangCode => !!l);

    for (const langwritten of languages) {
      const cacheKey = getMemorialMediaCacheKey(langwritten, memorialDate);

      if (forceRefetch) {
        memorialMediaCache.delete(cacheKey);
        memorialMediaInFlight.delete(cacheKey);
      }

      if (memorialMediaCache.has(cacheKey)) {
        return memorialMediaCache.get(cacheKey);
      }

      if (memorialMediaInFlight.has(cacheKey)) {
        return memorialMediaInFlight.get(cacheKey);
      }

      const fetchPromise = (async () => {
        try {
          const pub: PublicationFetcher = {
            fileformat: 'JWPUB',
            langwritten,
            pub: `mi${year}`,
          };
          const db = await getDbFromJWPUB(pub);

          if (!db) return undefined;

          const hasDocMM = tableExists(db, 'DocumentMultimedia');
          const joinDocMM = hasDocMM
            ? 'INNER JOIN DocumentMultimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId '
            : '';

          const bgItems = executeQuery<MultimediaItem>(
            db,
            `SELECT * FROM Multimedia ${joinDocMM} WHERE Multimedia.CategoryType = 26`,
          );

          const videoItems = executeQuery<MultimediaItem>(
            db,
            `SELECT * FROM Multimedia ${joinDocMM} WHERE Multimedia.CategoryType = -1` +
              (hasDocMM
                ? ' AND DocumentMultimedia.BeginParagraphOrdinal IS NULL'
                : ''),
          );

          if (!bgItems[0] && !videoItems.length) return undefined;

          const results: {
            bg: string;
            introVideos: MultimediaItem[];
          } = {
            bg: '',
            introVideos: [],
          };

          if (bgItems[0]) {
            const item = await addFullFilePathToMultimediaItem(bgItems[0], pub);
            results.bg = item.FilePath;
          }

          if (videoItems.length) {
            for (const item of videoItems) {
              const parsedItem = await addFullFilePathToMultimediaItem(
                item,
                pub,
              );
              results.introVideos.push(parsedItem);
            }

            await processMissingMediaInfo({
              allMedia: results.introVideos,
              isDynamicMedia: true,
              meetingDate: memorialDate,
            });
          }

          if (results.bg || results.introVideos.length) {
            memorialMediaCache.set(cacheKey, results);
          }
          return results;
        } finally {
          memorialMediaInFlight.delete(cacheKey);
        }
      })();

      memorialMediaInFlight.set(cacheKey, fetchPromise);
      const result = await fetchPromise;
      if (result) return result;
    }
  } catch (e) {
    errorCatcher(e);
  }
};

export const getMemorialBackground = async () => {
  const result = await getMemorialMedia();
  return result?.bg;
};

const getWtIssue = async (
  monday: Date,
  weeksInPast: number,
  langwritten?: JwLangCode,
  lookupDate?: Date,
  lastChance = false,
): Promise<{
  db: string;
  docId: number;
  issueString: string;
  publication: PublicationFetcher;
  weekNr: number;
}> => {
  const defaultResult: {
    db: string;
    docId: number;
    issueString: string;
    publication: PublicationFetcher;
    weekNr: number;
  } = {
    db: '',
    docId: -1,
    issueString: '',
    publication: {
      langwritten: '',
      pub: '',
    },
    weekNr: -1,
  };
  try {
    const issue = subtractFromDate(monday, {
      days: weeksInPast * 7,
    });
    const issueString = formatDate(issue, 'YYYYMM') + '00';
    if (!langwritten) throw new Error('No language selected');
    const publication = {
      issue: issueString,
      langwritten,
      pub: 'w',
    };
    const db = await getDbFromJWPUB(
      publication,
      formatDate(lookupDate ?? monday, 'YYYYMMDD'),
    );
    if (!db) throw new Error('No db file found: ' + issueString);
    const datedTexts = executeQuery<{ FirstDateOffset: number }>(
      db,
      'SELECT FirstDateOffset FROM DatedText',
    );
    const weekNr = datedTexts
      ? datedTexts.findIndex((weekItem) => {
          const mondayAsNumber = Number.parseInt(
            formatDate(monday, 'YYYYMMDD'),
          );
          return weekItem.FirstDateOffset === mondayAsNumber;
        })
      : -1;
    if (weekNr === -1) {
      return defaultResult;
    }
    const docId =
      executeQuery<{ DocumentId: number }>(
        db,
        `SELECT Document.DocumentId FROM Document WHERE Document.Class=40 LIMIT 1 OFFSET ${weekNr}`,
      )[0]?.DocumentId ?? -1;
    return { db, docId, issueString, publication, weekNr };
  } catch (e) {
    if (lastChance) errorCatcher(e);
    return defaultResult;
  }
};

const getParagraphNumbers = (
  paragraphLabel: number | string,
  caption: string,
) => {
  try {
    if (!caption) return paragraphLabel || '';

    const numbers = [...caption.matchAll(/\d+/g)]
      .map((m) => Number.parseInt(m[0]))
      .filter((n) => n > 0 && n < 100);

    if (numbers.length === 0) return paragraphLabel || '';
    if (numbers.length === 1) return numbers[0];

    // If paragraphLabel exists but isn't in caption, return it
    if (paragraphLabel && !numbers.includes(Number(paragraphLabel))) {
      return paragraphLabel;
    }

    const first = numbers[0];
    const last = numbers.at(-1);

    // Check if it's a simple range (no numbers between first and last that break the sequence)
    const between = numbers.slice(1, -1);
    if (first && last && between.some((n) => n > last || n < first))
      return last;

    // Try to extract the range string
    const rangeMatch = new RegExp(`${first}.*?${last}`).exec(caption);
    if (rangeMatch && rangeMatch[0]?.length <= 15) return rangeMatch[0];

    return paragraphLabel || '';
  } catch (e) {
    errorCatcher(e);
    return paragraphLabel || '';
  }
};

const getTagType = (
  isSongItem: boolean | string,
  paragraphNumbers: number | string | undefined,
) => {
  if (isSongItem) return 'song';
  if (paragraphNumbers) return 'paragraph';
  return undefined;
};

const getTagValue = (
  isSongItem: boolean | string,
  paragraphNumbers: number | string | undefined,
) => {
  if (isSongItem) return isSongItem;
  if (paragraphNumbers) return paragraphNumbers;
  return undefined;
};

export const dynamicMediaMapper = async (
  allMedia: MultimediaItem[],
  lookupDate: Date,
  source: 'additional' | 'dynamic' | 'playlist' | 'watched',
): Promise<MediaItem[]> => {
  const currentStateStore = useCurrentStateStore();
  const { currentSettings } = currentStateStore;

  try {
    const calculatedSource = source === 'playlist' ? 'additional' : source;
    const isMeetingMw = isMwMeetingDay(lookupDate);
    const isMeetingWe = isWeMeetingDay(lookupDate);
    const isAdditional = calculatedSource === 'additional';

    const lastParagraph = allMedia.at(-1)?.BeginParagraphOrdinal || 0;

    // --- Determine middle song paragraph ----------------------------------
    const songs = allMedia.filter((element) => isSong(element));
    const middleSongParagraph =
      !isAdditional && isMeetingMw && songs.length >= 2
        ? songs[1]?.BeginParagraphOrdinal || 0
        : 0;

    // --- Helper: resolve duration -----------------------------------------
    const resolveDuration = async (
      m: MultimediaItem,
      isVideo: boolean,
      isAudio: boolean,
    ) => {
      if (!isVideo && !isAudio) return 0;

      if (m.Duration) return m.Duration;

      if (await exists(m.FilePath)) {
        const meta = await getMetadataFromMediaPath(m.FilePath);
        if (meta?.format.duration) return meta.format.duration;
      }

      if (!m.KeySymbol) return 0;

      const lang = currentSettings?.lang || currentSettings?.langFallback;
      if (!lang) return 0;

      const mediaInfo = await getJwMediaInfo({
        langwritten: lang,
        pub: m.KeySymbol,
        ...(m.Track && { track: m.Track }),
        ...(m.IssueTagNumber && { issue: m.IssueTagNumber }),
        fileformat: isVideo ? 'MP4' : 'MP3',
      });

      return mediaInfo?.duration || 0;
    };

    // --- Helper: generate pubMediaId --------------------------------------
    const createPubMediaId = (m: MultimediaItem) => {
      const base =
        m.KeySymbol || m.IssueTagNumber
          ? [m.KeySymbol, m.IssueTagNumber]
          : [m.MepsDocumentId];

      const extra = [
        m.MepsLanguageIndex === undefined
          ? ''
          : getJwLangCode(m.MepsLanguageIndex),
        m.Track,
      ];

      return [...base, ...extra].filter(Boolean).join('_');
    };

    const mapperContext = {
      calculatedSource,
      currentSettings,
      isAdditional,
      isMeetingMw,
      isMeetingWe,
      lastParagraph,
      lookupDate,
      middleSongParagraph,
      pinyinActive: currentStateStore.pinyinActive,
      resolveDuration,
    };

    // --- Map media ---------------------------------------------------------
    const mediaItems = await Promise.all(
      allMedia.map((m, index) =>
        mapDynamicMediaItem(m, index, mapperContext, createPubMediaId),
      ),
    );

    // --- Group by extractCaption ------------------------------------------
    const grouped = Object.values(
      mediaItems.reduce<Record<string, MediaItem>>((acc, item) => {
        if (!item.extractCaption) {
          acc[item.uniqueId] = acc[item.uniqueId] || item;
          return acc;
        }

        acc[item.extractCaption] ??= {
          cbs: item.cbs,
          children: [],
          extractCaption: item.extractCaption,
          sortOrderOriginal: item.sortOrderOriginal,
          source: item.source,
          title: item.extractCaption,
          type: 'media',
          uniqueId: `group-${item.extractCaption}`,
        };

        acc[item.extractCaption]?.children?.push(item);
        return acc;
      }, {}),
    ).sort((a, b) => {
      const aOrder =
        typeof a.sortOrderOriginal === 'number' ? a.sortOrderOriginal : 0;
      const bOrder =
        typeof b.sortOrderOriginal === 'number' ? b.sortOrderOriginal : 0;
      return aOrder - bOrder;
    });

    // --- CO Week modifications --------------------------------------------
    if (isCoWeek(lookupDate)) {
      // Hide the last song for both MW and WE meetings during the CO visit
      const nonAdditional = grouped.filter((m) => m.source !== 'additional');

      const lastSong = nonAdditional.at(-1);
      if (lastSong) lastSong.hidden = true;

      // Hide CBS media
      const cbsMedia = nonAdditional.filter((m) => m.cbs);
      cbsMedia.forEach((m) => {
        m.hidden = true;
        m.children?.forEach((c) => {
          c.hidden = true;
        });
      });
    }

    return grouped;
  } catch (e) {
    errorCatcher(e);
    return [];
  }
};

const getDynamicMediaFileUrl = async (
  media: MultimediaItem,
  pubMediaId: string,
  context: {
    currentSettings: ReturnType<typeof useCurrentStateStore>['currentSettings'];
    pinyinActive: boolean;
  },
) => {
  const fileUrl = isLikelyFile(media.FilePath)
    ? pathToFileURL(media.FilePath)
    : pubMediaId;

  const pinyinPath = getPinyinSongPath(media, context);
  if (pinyinPath && (await pathExists(pinyinPath))) {
    return pathToFileURL(pinyinPath);
  }

  return fileUrl;
};

const getDynamicMediaSection = (
  media: MultimediaItem,
  context: {
    isAdditional: boolean;
    isMeetingMw: boolean;
    isMeetingWe: boolean;
    middleSongParagraph: number;
  },
): MediaSectionIdentifier => {
  if (context.isMeetingMw && context.middleSongParagraph > 0) {
    return getMidweekDynamicMediaSection(media, context.middleSongParagraph);
  }

  if (!context.isAdditional) return 'wt';
  return context.isMeetingWe ? 'pt' : 'imported-media';
};

const getMidweekDynamicMediaSection = (
  media: MultimediaItem,
  middleSongParagraph: number,
): MediaSectionIdentifier => {
  if (media.BeginParagraphOrdinal >= middleSongParagraph) return 'lac';
  if (media.BeginParagraphOrdinal >= 18) return 'ayfm';
  return 'tgw';
};

const getPinyinSongPath = (
  media: MultimediaItem,
  context: {
    currentSettings: ReturnType<typeof useCurrentStateStore>['currentSettings'];
    pinyinActive: boolean;
  },
) => {
  const { currentSettings } = context;
  if (
    !media.KeySymbol?.includes('sjj') ||
    !media.Track ||
    currentSettings?.lang !== 'CHS' ||
    !currentSettings?.enablePinyinSongs ||
    !context.pinyinActive ||
    !currentSettings?.pinyinSongFolder
  ) {
    return '';
  }

  const trackNum = String(media.Track).padStart(3, '0');
  return join(
    currentSettings.pinyinSongFolder,
    `sjjm_s-Pi_CHS_${trackNum}_r720P.mp4`,
  );
};

const mapDynamicMediaItem = async (
  media: MultimediaItem,
  index: number,
  context: {
    calculatedSource: 'additional' | 'dynamic' | 'watched';
    currentSettings: ReturnType<typeof useCurrentStateStore>['currentSettings'];
    isAdditional: boolean;
    isMeetingMw: boolean;
    isMeetingWe: boolean;
    lastParagraph: number;
    lookupDate: Date;
    middleSongParagraph: number;
    pinyinActive: boolean;
    resolveDuration: (
      media: MultimediaItem,
      isVideo: boolean,
      isAudio: boolean,
    ) => Promise<number>;
  },
  createPubMediaId: (media: MultimediaItem) => string,
) => {
  media.FilePath = await convertImageIfNeeded(media.FilePath);

  const pubMediaId = createPubMediaId(media);
  const isSongItem = isSong(media);
  const fileUrl = await getDynamicMediaFileUrl(media, pubMediaId, context);
  const isVideoFile =
    media.MimeType?.includes('video') || isVideo(media.FilePath);
  const isAudioFile =
    media.MimeType?.includes('audio') || isAudio(media.FilePath);
  const duration = await context.resolveDuration(
    media,
    isVideoFile,
    isAudioFile,
  );
  const customDuration =
    media.StartTime || media.EndTime
      ? {
          max: media.EndTime ?? duration,
          min: media.StartTime ?? 0,
        }
      : undefined;
  const paragraphNumbers = getParagraphNumbers(
    media.TargetParagraphNumberLabel,
    media.Caption,
  );
  const tagType = getTagType(isSongItem, paragraphNumbers);
  const tagValue = getTagValue(isSongItem, paragraphNumbers);
  const tag = tagType ? { type: tagType, value: tagValue } : undefined;
  const datePart = formatDate(context.lookupDate, 'YYYYMMDD');
  const durationPart =
    context.isAdditional && (customDuration?.min || customDuration?.max)
      ? `${customDuration.min ?? ''}_${customDuration.max ?? ''}-`
      : '';
  const uniqueId = sanitizeId(`${datePart}-${durationPart}${fileUrl}`);
  const thumbnailUrl =
    media.ThumbnailUrl ||
    pathToFileURL(media.LinkedPreviewFilePath || '') ||
    (await getThumbnailUrl(media.ThumbnailFilePath || media.FilePath));

  return {
    cbs:
      !context.isAdditional &&
      context.isMeetingMw &&
      media.BeginParagraphOrdinal >= context.lastParagraph - 2 &&
      media.BeginParagraphOrdinal < context.lastParagraph,
    customDuration,
    duration,
    extractCaption: media.ExtractCaption,
    fileUrl,
    isAudio: isAudioFile,
    isImage: isImage(media.FilePath),
    isVideo: isVideoFile,
    markers: media.VideoMarkers,
    originalSection: getDynamicMediaSection(media, context),
    pubMediaId,
    repeat: !!media.Repeat,
    sortOrderOriginal: media.BeginParagraphOrdinal || index,
    source: context.calculatedSource,
    streamUrl: media.StreamUrl,
    subtitlesUrl: isVideoFile ? await getSubtitlesUrl(media, duration) : '',
    tag,
    thumbnailUrl,
    title: isSongItem
      ? media.Label.replace(/^\d+\.\s*/, '')
      : media.Label || media.Caption,
    type: 'media',
    uniqueId,
  } as MediaItem;
};

export const watchedItemMapper: (
  parentDate: string,
  watchedItemPath: string,
) => Promise<MediaItem[] | undefined> = async (parentDate, watchedItemPath) => {
  try {
    if (!parentDate || !watchedItemPath) return undefined;

    const dateString = parentDate.replaceAll('-', '');

    const fileUrl = pathToFileURL(watchedItemPath);

    const video = isVideo(watchedItemPath);
    const audio = isAudio(watchedItemPath);
    const image = isImage(watchedItemPath);

    if (!(video || audio || image)) {
      if (isJwPlaylist(watchedItemPath)) {
        return await getWatchedPlaylistItems(
          watchedItemPath,
          parentDate,
          dateString,
        );
      }
      return undefined;
    }

    const metadata =
      video || audio
        ? await getMetadataFromMediaPath(watchedItemPath)
        : undefined;

    const duration = metadata?.format.duration || 0;
    const title = metadata?.common.title || basename(watchedItemPath);

    const uniqueId = sanitizeId(
      formatDate(parentDate, 'YYYYMMDD') + '-' + fileUrl,
    );
    const thumbnailUrl = await getThumbnailUrl(watchedItemPath);

    // Parse section information and order from filename or section order file
    const filename = basename(watchedItemPath);
    const { order, section } = await getWatchedMediaPlacement({
      filename,
      parentDate,
      watchedItemPath,
    });

    return [
      {
        duration,
        fileUrl,
        isAudio: audio,
        isImage: image,
        isVideo: video,
        originalSection: section,
        sortOrderOriginal: order ?? Number.MAX_SAFE_INTEGER,
        source: 'watched',
        thumbnailUrl,
        title,
        type: 'media',
        uniqueId,
      },
    ];
  } catch (e) {
    errorCatcher(e);
    return undefined;
  }
};

const getDefaultWatchedSection = (
  parentDate: string,
): MediaSectionIdentifier | undefined => {
  const meetingDate = dateFromString(parentDate);
  const isCo = isCoWeek(meetingDate);

  if (isWeMeetingDay(meetingDate) && !isCo) return 'pt';
  if (isMwMeetingDay(meetingDate)) return isCo ? 'circuit-overseer' : 'lac';
  return undefined;
};

const getLegacyWatchedSection = (
  filename: string,
): MediaSectionIdentifier | undefined => {
  const sectionMatch = new RegExp(/^Section-([^-]+) - /).exec(filename);
  return sectionMatch?.[1];
};

const getWatchedMediaPlacement = async ({
  filename,
  parentDate,
  watchedItemPath,
}: {
  filename: string;
  parentDate: string;
  watchedItemPath: string;
}) => {
  const sectionInfo = await getWatchedMediaSectionInfoSafe({
    filename,
    parentDate,
    watchedItemPath,
  });

  return {
    order: sectionInfo?.order,
    section:
      sectionInfo?.section ||
      getLegacyWatchedSection(filename) ||
      getDefaultWatchedSection(parentDate),
  };
};

const getWatchedMediaSectionInfoSafe = async ({
  filename,
  parentDate,
  watchedItemPath,
}: {
  filename: string;
  parentDate: string;
  watchedItemPath: string;
}) => {
  try {
    const watchedDayFolder = dirname(watchedItemPath);
    log(`watchedDayFolder: ${watchedDayFolder}`, 'watchedFolder', 'info');
    if (!watchedDayFolder) return null;

    const { getWatchedMediaSectionInfo } =
      await import('src/helpers/media-sections');
    const sectionInfo = await getWatchedMediaSectionInfo(
      watchedDayFolder,
      filename,
    );
    log(`sectionInfo: ${JSON.stringify(sectionInfo)}`, 'watchedFolder', 'info');
    return sectionInfo;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          filename,
          name: 'watchedItemMapper',
          parentDate,
          watchedItemPath,
        },
      },
    });
    return null;
  }
};

const getWatchedPlaylistItems = async (
  watchedItemPath: string,
  parentDate: string,
  dateString: string,
) => {
  const currentStateStore = useCurrentStateStore();
  const additionalMedia: MediaItem[] = (
    await getMediaFromJwPlaylist(
      watchedItemPath,
      dateFromString(parentDate),
      await currentStateStore.getDatedAdditionalMediaDirectory(dateString),
    )
  ).map((m: MediaItem) => ({ ...m, source: 'watched' }));
  return additionalMedia;
};

const addFullPathsToMultimediaItems = async (
  items: MultimediaItem[],
  publication: PublicationFetcher,
) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item) {
      items[i] = await addFullFilePathToMultimediaItem(item, publication);
    }
  }
};

const applyMepsLanguageOverrides = (
  allMedia: MultimediaItem[],
  options: {
    db: string;
    docId: number;
    includeVideoMarkers?: boolean;
  },
) => {
  const currentStateStore = useCurrentStateStore();
  const mepsLanguagesByMediaItem = getMepsLanguagesByMediaItem(options);

  for (const media of allMedia) {
    applyMepsLanguageOverride(media, mepsLanguagesByMediaItem);
    if (options.includeVideoMarkers) {
      const videoMarkers = getMediaVideoMarkers(options, media.MultimediaId);
      if (videoMarkers) media.VideoMarkers = videoMarkers;
    }
  }

  return mepsLanguagesByMediaItem;

  function applyMepsLanguageOverride(
    media: MultimediaItem,
    mepsLanguages: {
      IssueTagNumber: number;
      KeySymbol: null | string;
      MepsLanguageIndex: number;
      Track: null | number;
    }[],
  ) {
    const mediaKeySymbol =
      media.KeySymbol === 'sjjm'
        ? currentStateStore.currentSongbook?.pub
        : media.KeySymbol;
    const mepsLanguage = mepsLanguages.find(
      (item) =>
        item.KeySymbol === mediaKeySymbol &&
        item.Track === media.Track &&
        item.IssueTagNumber === media.IssueTagNumber,
    );
    if (
      mepsLanguage?.MepsLanguageIndex !== undefined &&
      mepsLanguage?.MepsLanguageIndex !== media.MepsLanguageIndex
    ) {
      media.MepsLanguageAlternativeIndex = mepsLanguage.MepsLanguageIndex;
    }
  }
};

const groupMediaByOriginalSection = (mediaForDay: MediaItem[]) => {
  const groupedMedia: Record<string, MediaItem[]> = {};
  mediaForDay.forEach((mediaItem) => {
    const section = mediaItem.originalSection || 'tgw';
    groupedMedia[section] ??= [];
    groupedMedia[section].push(mediaItem);
  });
  return groupedMedia;
};

const getWeekendIssueWithFallback = async (monday: Date, lookupDate: Date) => {
  const currentStateStore = useCurrentStateStore();
  const weeksToTry = [6, 8, 10, 12];
  const primaryLang = currentStateStore.currentSettings?.lang;
  const fallbackLang = currentStateStore.currentSettings?.langFallback;

  const primaryResult = await getWeekendIssueForLanguage(
    monday,
    lookupDate,
    weeksToTry,
    primaryLang,
  );
  if (primaryResult.db) return primaryResult;

  const fallbackResult = await getWeekendIssueForLanguage(
    monday,
    lookupDate,
    weeksToTry,
    fallbackLang,
    true,
  );
  if (fallbackResult.db) return fallbackResult;

  return getEmptyWeekendIssue();
};

const getWeekendIssueForLanguage = async (
  monday: Date,
  lookupDate: Date,
  weeksToTry: number[],
  langwritten?: JwLangCode | null,
  lastChance = false,
) => {
  if (!langwritten) return getEmptyWeekendIssue();

  for (const weeks of weeksToTry) {
    const result = await getWtIssue(
      monday,
      weeks,
      langwritten,
      lookupDate,
      lastChance,
    );
    if (result.db?.length > 0) {
      return result;
    }
  }

  return getEmptyWeekendIssue();
};

const getEmptyWeekendIssue = () => ({
  db: '',
  docId: -1,
  issueString: '',
  publication: {
    langwritten: '' as const,
    pub: '',
  },
  weekNr: -1,
});

const getWeekendSongs = (
  options: {
    db: string;
    docId: number;
    issueString: string;
  },
  videosNotInParagraphs: MultimediaItem[],
) => {
  if (+options.issueString < FEB_2023) {
    return executeQuery<MultimediaItem>(
      options.db,
      `SELECT *
        FROM Multimedia
        INNER JOIN DocumentMultimedia
          ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId
        WHERE DataType = 2
        AND DocumentId = ?
        ORDER BY BeginParagraphOrdinal
        LIMIT 2`,
      [options.docId],
    );
  }

  if (!videosNotInParagraphs?.length) return [];

  const sortedVideos = videosNotInParagraphs.toSorted(
    (a, b) => (a.MultimediaId || 0) - (b.MultimediaId || 0),
  );
  if (sortedVideos.length <= 2) return sortedVideos;

  const songs = sortedVideos.filter(
    (v) => !!v.Track && v.Track > 0 && v.KeySymbol?.includes('sjj'),
  );
  return songs.length > 2 ? sortedVideos.slice(0, 2).filter(Boolean) : songs;
};

const getMidweekDocumentId = (db: string, monday: Date) =>
  executeQuery<{ DocumentId: number }>(
    db,
    `SELECT DocumentId FROM DatedText WHERE FirstDateOffset = ${formatDate(
      monday,
      'YYYYMMDD',
    )}`,
  )[0]?.DocumentId ?? -1;

const getMidweekIssueDb = async (
  publication: PublicationFetcher,
  issueString: string,
  lookupDate: Date,
) => {
  const currentStateStore = useCurrentStateStore();
  const fetchIssueDb = async (langwritten?: JwLangCode | null) => {
    if (!langwritten) return '';
    publication.issue = issueString;
    publication.langwritten = langwritten;
    publication.pub = 'mwb';
    return await getDbFromJWPUB(
      publication,
      formatDate(lookupDate, 'YYYYMMDD'),
    );
  };

  const primaryDb = await fetchIssueDb(currentStateStore.currentSettings?.lang);
  if (primaryDb) return primaryDb;

  return await fetchIssueDb(currentStateStore.currentSettings?.langFallback);
};

const checkMediaFileExistence = async (media: MultimediaItem) => {
  if (!media.KeySymbol && !media.MepsDocumentId) return null;

  const exists =
    !!media.StreamUrl ||
    (!!media.FilePath && (await pathExists(media.FilePath)));
  return { exists, media };
};

const processWeekendMedia = (
  mediaWithoutVideos: MultimediaItem[],
  videosInParagraphs: MultimediaItem[],
  videosNotInParagraphs: MultimediaItem[],
  currentStateStore: ReturnType<typeof useCurrentStateStore>,
): MultimediaItem[] => {
  const combined = [
    ...mediaWithoutVideos,
    ...videosInParagraphs,
    ...videosNotInParagraphs,
  ];

  // Separate items with and without BeginPosition
  const withBegin = combined.filter(
    (item) => item.BeginPosition !== undefined && item.BeginPosition !== null,
  );
  const withoutBegin = combined.filter(
    (item) => item.BeginPosition === undefined || item.BeginPosition === null,
  );

  // Sort those with BeginPosition
  withBegin.sort((a, b) => (a.BeginPosition || 0) - (b.BeginPosition || 0));

  // Final result: Insert all withoutBegin *before* the last item with BeginPosition
  let final: MultimediaItem[] = [];
  if (withBegin.length === 0) {
    final.push(...withoutBegin);
  } else {
    const lastIndex = withBegin.length - 1;
    const lastItem = withBegin[lastIndex];
    if (!lastItem) return [];
    final.push(...withBegin.slice(0, lastIndex), ...withoutBegin, lastItem);
  }

  final = final
    .map((mediaObj) => {
      // Mark media as being in a footnote if it's outside numbered paragraphs
      // IsInNumberedParagraphs will be 0 for footnotes, 1 for regular content
      if (
        mediaObj &&
        'IsInNumberedParagraphs' in mediaObj &&
        mediaObj.IsInNumberedParagraphs === 0 &&
        !mediaObj.TargetParagraphNumberLabel
      ) {
        return {
          ...mediaObj,
          TargetParagraphNumberLabel: FOOTNOTE_TARGET_PARAGRAPH,
        };
      }
      return mediaObj;
    })
    .filter((item) => !!item)
    .filter((v) => {
      try {
        // Exclude videos from paragraphs in the WT study if setting is enabled
        if (
          currentStateStore.currentSettings?.excludeWtParagraphVideos &&
          v.IsInNumberedParagraphs === 1 &&
          v.MimeType.includes('video')
        ) {
          return false;
        }

        // Exclude items from footnotes in the WT study if setting is enabled
        if (
          currentStateStore.currentSettings?.excludeFootnotes &&
          v.TargetParagraphNumberLabel === FOOTNOTE_TARGET_PARAGRAPH
        ) {
          return false;
        }

        // Include all other items
        return true;
      } catch (e) {
        // In case of error, include the item to be safe
        errorCatcher(e);
        return true;
      }
    });

  const updatedMedia = final.map((item) => {
    if (item.MultimediaId !== null && item.LinkMultimediaId !== null) {
      const linkedItem = final.find(
        (i) => i.MultimediaId === item.LinkMultimediaId,
      );
      if (linkedItem?.FilePath) {
        item.FilePath = linkedItem.FilePath;
        item.LinkMultimediaId = null;
        linkedItem.LinkMultimediaId = linkedItem.MultimediaId;
      }
    }
    return item;
  });

  return updatedMedia.filter((item) => item.LinkMultimediaId === null);
};

const mergeWeekendSongs = (
  allMedia: MultimediaItem[],
  songs: MultimediaItem[],
  songMultimediaExtractItems: MultimediaExtractItem[],
  currentStateStore: ReturnType<typeof useCurrentStateStore>,
): MultimediaItem[] => {
  let songMepsLanguageCodes: ('' | JwLangCode)[] = [];
  try {
    songMepsLanguageCodes = songMultimediaExtractItems.map((item) => {
      const match = new RegExp(/\/(.*)\//).exec(item.Link);
      const langOverride = match ? (match[1]?.split(':')[0] as JwLangCode) : '';
      return langOverride === currentStateStore.currentSettings?.lang
        ? ''
        : langOverride;
    });
  } catch (e: unknown) {
    errorCatcher(e);
    songMepsLanguageCodes = songs.map(
      () => currentStateStore.currentSettings?.lang || 'E',
    );
  }

  const mergedSongs: MultimediaItem[] = songs
    .map((song, index) => {
      if (!songMepsLanguageCodes[index]) return song;
      const langId = getJwLangId(songMepsLanguageCodes[index]);
      return {
        ...song,
        ...(langId === undefined
          ? {}
          : { MepsLanguageAlternativeIndex: langId }),
      };
    })
    .sort((a, b) => (a.MultimediaId || 0) - (b.MultimediaId || 0));

  if (mergedSongs[0]) {
    mergedSongs[0].BeginParagraphOrdinal = 0;
    const index0 = allMedia.findIndex(
      (item) =>
        item.Track === mergedSongs[0]?.Track &&
        item.KeySymbol === mergedSongs[0]?.KeySymbol,
    );

    if (index0 === -1) {
      allMedia.unshift(mergedSongs[0]);
    } else {
      allMedia[index0] = mergedSongs[0];
    }

    if (mergedSongs[1]) {
      mergedSongs[1].BeginParagraphOrdinal = LAST_SONG_ORDINAL;
      const index1 = allMedia.findIndex(
        (item) =>
          item.Track === mergedSongs[1]?.Track &&
          item.KeySymbol === mergedSongs[1]?.KeySymbol,
      );

      if (index1 === -1) {
        allMedia.push(mergedSongs[1]);
      } else {
        allMedia[index1] = mergedSongs[1];
      }
    }
  }

  return allMedia;
};

export const getWeMedia = async (lookupDate: Date) => {
  log(
    `Getting weekend meeting media for date: ${formatDate(lookupDate, 'YYYYMMDD')}`,
    'weMedia',
    'info',
  );
  try {
    const currentStateStore = useCurrentStateStore();
    lookupDate = dateFromString(lookupDate);

    // The weekend meeting is replaced by the Memorial when the Memorial falls
    // on a weekend day in the same week as this lookup date.
    if (isReplacedByMemorial(lookupDate)) {
      return {
        error: false,
        media: {} as Record<string, MediaItem[]>,
      };
    }

    const monday = getSpecificWeekday(lookupDate, 0);
    const { db, docId, issueString, publication } =
      await getWeekendIssueWithFallback(monday, lookupDate);

    if (!db || docId < 0) {
      return {
        error: true,
        media: {} as Record<string, MediaItem[]>,
      };
    }
    const videos = executeQuery<MultimediaItem>(
      db,
      `SELECT m.*, dm.*, dp.*, q.*,
         CASE
           WHEN dp.BeginPosition IS NULL THEN 0
           WHEN dp.BeginPosition < (
             SELECT MIN(BeginPosition)
             FROM DocumentParagraph
             WHERE DocumentId = ?
               AND ParagraphNumberLabel IS NOT NULL
               AND ParagraphNumberLabel != ''
           ) THEN 0
           WHEN dp.BeginPosition > (
             SELECT MAX(EndPosition)
             FROM DocumentParagraph
             WHERE DocumentId = ?
               AND ParagraphNumberLabel IS NOT NULL
               AND ParagraphNumberLabel != ''
           ) THEN 0
           ELSE 1
         END AS IsInNumberedParagraphs
         FROM Multimedia m
         INNER JOIN DocumentMultimedia dm
           ON dm.MultimediaId = m.MultimediaId
         INNER JOIN DocumentParagraph dp
           ON dm.BeginParagraphOrdinal = dp.ParagraphIndex
           AND dm.DocumentId = dp.DocumentId
     		 LEFT JOIN Question q
           ON q.DocumentId = dm.DocumentId
           AND q.TargetParagraphOrdinal = dm.BeginParagraphOrdinal
         WHERE dm.DocumentId = ?
           AND m.CategoryType = -1
         ORDER BY dp.BeginPosition;`,
      [docId, docId, docId],
    );
    const videosInParagraphs = videos.filter(
      (video) => !!video.TargetParagraphNumberLabel,
    );
    const videosNotInParagraphs = videos.filter(
      (video) => !video.TargetParagraphNumberLabel,
    );

    const mediaWithoutVideos = executeQuery<MultimediaItem>(
      db,
      `SELECT *
       FROM DocumentMultimedia
         INNER JOIN Multimedia
           ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId
         INNER JOIN DocumentParagraph
           ON DocumentMultimedia.DocumentId = DocumentParagraph.DocumentId
     		  AND DocumentMultimedia.BeginParagraphOrdinal = DocumentParagraph.ParagraphIndex
         LEFT JOIN Question
           ON Question.DocumentId = DocumentMultimedia.DocumentId
           AND Question.TargetParagraphOrdinal = DocumentMultimedia.BeginParagraphOrdinal
         WHERE DocumentMultimedia.DocumentId = ${docId}
           AND CategoryType <> 9
           AND CategoryType <> -1
           AND (KeySymbol != '${currentStateStore.currentSongbook?.pub}' OR KeySymbol IS NULL)
         GROUP BY DocumentMultimedia.MultimediaId
         ORDER BY DocumentParagraph.BeginPosition`, // pictures
    );
    await addFullPathsToMultimediaItems(mediaWithoutVideos, publication);

    const finalMedia = processWeekendMedia(
      mediaWithoutVideos,
      videosInParagraphs,
      videosNotInParagraphs,
      currentStateStore,
    );

    const songs = getWeekendSongs(
      {
        db,
        docId,
        issueString,
      },
      videosNotInParagraphs,
    );

    const songMultimediaExtractItems: MultimediaExtractItem[] =
      globalThis.electronApi
        .executeQuery<MultimediaExtractItem>(
          db,
          `SELECT Extract.ExtractId, Extract.Link, DocumentExtract.BeginParagraphOrdinal
           FROM Extract
           INNER JOIN DocumentExtract ON Extract.ExtractId = DocumentExtract.ExtractId
           WHERE Extract.RefMepsDocumentClass = 31
             AND DocumentExtract.DocumentId = ${docId}
           ORDER BY Extract.ExtractId
           LIMIT 2`,
        )
        .sort((a, b) => a.BeginParagraphOrdinal - b.BeginParagraphOrdinal);

    const allMedia = mergeWeekendSongs(
      finalMedia,
      songs,
      songMultimediaExtractItems,
      currentStateStore,
    );

    const mepsLanguagesByMediaItem = applyMepsLanguageOverrides(allMedia, {
      db,
      docId,
      includeVideoMarkers: true,
    });
    await processMissingMediaInfo({
      allMedia,
      isDynamicMedia: true,
      meetingDate: formatDate(lookupDate, 'YYYYMMDD'),
      mepsLanguagesByMediaItem,
    });
    const mediaForDay = await dynamicMediaMapper(
      allMedia,
      lookupDate,
      'dynamic',
    );

    return {
      error: false,
      media: { wt: mediaForDay },
    };
  } catch (e) {
    errorCatcher(e, {
      contexts: { fn: { name: 'getWeMedia' } },
    });
    return {
      error: true,
      media: {} as Record<string, MediaItem[]>,
    };
  }
};

export const getMwMedia = async (lookupDate: Date) => {
  log(
    `Getting midweek meeting media for date: ${formatDate(lookupDate, 'YYYYMMDD')}`,
    'mwMedia',
    'info',
  );
  try {
    const currentStateStore = useCurrentStateStore();
    lookupDate = dateFromString(lookupDate);

    // The midweek meeting is replaced by the Memorial when the Memorial falls
    // on a weekday in the same week as this lookup date.
    if (isReplacedByMemorial(lookupDate)) {
      return {
        error: false,
        media: {} as Record<string, MediaItem[]>,
      };
    }

    // if not monday, get the previous monday
    const monday = getSpecificWeekday(lookupDate, 0);
    const issue = subtractFromDate(monday, {
      months: (monday.getMonth() + 1) % 2 === 0 ? 1 : 0,
    });
    const issueString = formatDate(issue, 'YYYYMM') + '00';
    const publication: PublicationFetcher = {
      issue: issueString,
      langwritten: '',
      pub: '',
    };
    const db = await getMidweekIssueDb(publication, issueString, lookupDate);

    if (!db) return { error: true, media: {} as Record<string, MediaItem[]> };

    const docId = getMidweekDocumentId(db, monday);

    if (docId < 0)
      throw new Error(
        'No document id found for ' +
          formatDate(monday, 'YYYYMMDD') +
          ' ' +
          issueString +
          ' ' +
          db.split('/').pop(),
      );

    const mms = getDocumentMultimediaItems(
      { db, docId },
      currentStateStore.currentSettings?.includePrinted,
    );
    await addFullPathsToMultimediaItems(mms, publication);

    // To think about: Enabling InternalLink lookups: is this needed?
    // const internalLinkMedia = getInternalLinkItems({ db, docId }).map(
    //   (multimediaItem) => {
    //     return addFullFilePathToMultimediaItem(multimediaItem, publication);
    //   },
    // );

    const extracts = await getDocumentExtractItems(
      db,
      docId,
      formatDate(lookupDate, 'YYYYMMDD'),
    );

    const allMedia: MultimediaItem[] = mms
      .concat(extracts)
      .sort((a, b) => a.BeginParagraphOrdinal - b.BeginParagraphOrdinal);

    const mepsLanguagesByMediaItem = applyMepsLanguageOverrides(allMedia, {
      db,
      docId,
    });
    const errors =
      (await processMissingMediaInfo({
        allMedia,
        isDynamicMedia: true,
        meetingDate: formatDate(lookupDate, 'YYYYMMDD'),
        mepsLanguagesByMediaItem,
      })) || [];
    const mediaForDay = await dynamicMediaMapper(
      allMedia,
      lookupDate,
      'dynamic',
    );

    return {
      error: errors.length > 0,
      media: groupMediaByOriginalSection(mediaForDay),
    };
  } catch (e) {
    errorCatcher(e);
    return { error: true, media: {} as Record<string, MediaItem[]> };
  }
};

const normalizeWatchtowerMagazineSymbol = (media: MultimediaItem) => {
  if (
    media.KeySymbol === 'w' &&
    media.IssueTagNumber &&
    Number.parseInt(media.IssueTagNumber.toString()) >= 20080101 &&
    media.IssueTagNumber.toString().endsWith('01')
  ) {
    media.KeySymbol = 'wp';
    log(
      `Updated magazine symbol to wp: ${media.KeySymbol}`,
      'mediaProcessing',
      'info',
    );
  }
};

const getEffectiveMediaKeySymbol = (
  media: MultimediaItem,
  isSignLanguage: boolean,
) => {
  const currentStateStore = useCurrentStateStore();
  if (media.KeySymbol === 'sjjm' && isSignLanguage) {
    return currentStateStore.currentSongbook?.pub || media.KeySymbol;
  }

  return media.KeySymbol;
};

const mediaHasMepsLanguage = (
  effectiveMediaKeySymbol: null | string | undefined,
  mepsLanguageIndex: number | undefined,
  isSignLanguage: boolean,
  mepsLanguagesByMediaItem:
    | undefined
    | {
        IssueTagNumber: number;
        KeySymbol: null | string;
        MepsLanguageIndex: number;
        Track: null | number;
      }[],
) => {
  if (mepsLanguageIndex === undefined) return false;
  if (!isSignLanguage) return true;

  return !!mepsLanguagesByMediaItem?.some(
    (item) =>
      item.KeySymbol === effectiveMediaKeySymbol &&
      item.MepsLanguageIndex === mepsLanguageIndex,
  );
};

const getMediaLanguageCandidates = (
  media: MultimediaItem,
  effectiveMediaKeySymbol: null | string | undefined,
  isSignLanguage: boolean,
  mepsLanguagesByMediaItem:
    | undefined
    | {
        IssueTagNumber: number;
        KeySymbol: null | string;
        MepsLanguageIndex: number;
        Track: null | number;
      }[],
) => {
  const currentStateStore = useCurrentStateStore();
  const mediaMepsLanguage =
    mediaHasMepsLanguage(
      effectiveMediaKeySymbol,
      media.MepsLanguageIndex,
      isSignLanguage,
      mepsLanguagesByMediaItem,
    ) && getJwLangCode(media.MepsLanguageIndex);
  const mediaAltMepsLanguage =
    media.MepsLanguageAlternativeIndex !== media.MepsLanguageIndex &&
    mediaHasMepsLanguage(
      effectiveMediaKeySymbol,
      media.MepsLanguageAlternativeIndex,
      isSignLanguage,
      mepsLanguagesByMediaItem,
    ) &&
    getJwLangCode(media.MepsLanguageAlternativeIndex);

  return [
    currentStateStore.currentSettings?.lang,
    mediaMepsLanguage,
    mediaAltMepsLanguage,
    currentStateStore.currentSettings?.langFallback,
  ];
};

const isJwLangCandidate = (lang: unknown): lang is JwLangCode => {
  return typeof lang === 'string' && !!lang;
};

const createMissingMediaPublicationFetcher = (
  media: MultimediaItem,
  langwritten: JwLangCode,
): PublicationFetcher => ({
  docid: media.MepsDocumentId,
  fileformat: media.MimeType?.includes('audio') ? 'MP3' : 'MP4',
  issue: media.IssueTagNumber,
  langwritten,
  pub: media.KeySymbol,
  ...(typeof media.Track === 'number' &&
    media.Track > 0 && { track: media.Track }),
});

const getBibleVerseDuration = (
  media: MultimediaItem,
  chapterMedia: MediaLink[],
) => {
  let min = 0;
  let max = 0;
  const verses = media.VerseNumbers?.sort((a, b) => a - b);
  if (!verses) return { max, min };

  min = timeToSeconds(
    chapterMedia.map((item) =>
      item.markers.markers.find((marker) => marker.verseNumber === verses[0]),
    )?.[0]?.startTime || '0',
  );

  const endVerse = chapterMedia.map((item) =>
    item.markers.markers.find((marker) => marker.verseNumber === verses.at(-1)),
  )?.[0];

  max = endVerse
    ? timeToSeconds(endVerse.startTime) + timeToSeconds(endVerse.duration)
    : 0;

  return { max, min };
};

const downloadBibleMissingMedia = async (
  media: MultimediaItem,
  langwritten: JwLangCode,
  meetingDate: null | string | undefined,
) => {
  const pubs = await getBibleMedia(false, langwritten);
  const bookMedia: MediaLink[] =
    Object.values(
      pubs?.find((p) => p.booknum === media.BookNumber)?.files?.[langwritten] ??
        {},
    )[0] ?? [];
  const chapterMedia = bookMedia.filter(
    (item) => item.track === media.ChapterNumber && !!item.markers,
  );

  return downloadAdditionalRemoteVideo({
    customDuration: getBibleVerseDuration(media, chapterMedia),
    mediaItemLinks: chapterMedia,
    meetingDate: meetingDate || undefined,
    section: undefined,
    song: false,
    thumbnailUrl: media.ThumbnailFilePath,
    title: media.Label,
  });
};

const downloadStandardMissingMedia = async ({
  isDynamicMedia,
  keepMediaLabels,
  media,
  meetingDate,
  publicationFetcher,
}: {
  isDynamicMedia: boolean;
  keepMediaLabels: boolean;
  media: MultimediaItem;
  meetingDate?: null | string;
  publicationFetcher: PublicationFetcher;
}) => {
  const currentStateStore = useCurrentStateStore();

  if (!media.FilePath || !(await pathExists(media.FilePath))) {
    const { FilePath, Label, StreamDuration, StreamThumbnailUrl, StreamUrl } =
      await downloadMissingMedia(
        publicationFetcher,
        meetingDate || currentStateStore.selectedDate,
        isDynamicMedia,
        true,
      );
    media.FilePath = FilePath ?? media.FilePath;
    media.Label = keepMediaLabels
      ? media.Label || Label || ''
      : Label || media.Label;
    media.StreamUrl = StreamUrl ?? media.StreamUrl;
    media.Duration = StreamDuration ?? media.Duration;
    media.ThumbnailUrl = StreamThumbnailUrl ?? media.ThumbnailUrl;
  }

  if (!media.FilePath && !media.StreamUrl) return false;

  if (!media.Label) {
    media.Label =
      media.Label ||
      media.Caption ||
      (await getJwMediaInfo(publicationFetcher)).title ||
      '';
  }

  return true;
};

const markMissingMediaDownloadErrors = (
  publicationFetchers: PublicationFetcher[],
  meetingDate: null | string | undefined,
) => {
  const currentStateStore = useCurrentStateStore();

  for (const publicationFetcher of publicationFetchers) {
    const downloadId = getPubId(publicationFetcher, true);
    currentStateStore.downloadProgress[downloadId] = {
      error: true,
      filename: downloadId,
      meetingDate,
    };
  }
};

export async function processMissingMediaInfo({
  allMedia,
  isDynamicMedia = false,
  keepMediaLabels = false,
  meetingDate,
  mepsLanguagesByMediaItem,
}: {
  allMedia: MultimediaItem[];
  isDynamicMedia?: boolean;
  keepMediaLabels?: boolean;
  meetingDate?: null | string;
  mepsLanguagesByMediaItem?: {
    IssueTagNumber: number;
    KeySymbol: null | string;
    MepsLanguageIndex: number;
    Track: null | number;
  }[];
}) {
  try {
    const currentStateStore = useCurrentStateStore();
    const errors = [];

    allMedia.forEach(normalizeWatchtowerMagazineSymbol);

    const mediaChecksResults = await Promise.all(
      allMedia.map(checkMediaFileExistence),
    );

    const mediaToProcess = mediaChecksResults.filter(
      (result): result is { exists: false; media: MultimediaItem } =>
        !!result && !result.exists,
    );

    for (const { media } of mediaToProcess) {
      const isSignLanguage =
        !!currentStateStore.currentLangObject?.isSignLanguage;
      const effectiveMediaKeySymbol = getEffectiveMediaKeySymbol(
        media,
        isSignLanguage,
      );
      const languageCandidates = getMediaLanguageCandidates(
        media,
        effectiveMediaKeySymbol,
        isSignLanguage,
        mepsLanguagesByMediaItem,
      );
      const langsWritten = [...new Set(languageCandidates)].filter(
        isJwLangCandidate,
      );

      log(
        '[processMissingMediaInfo] Language resolution',
        'mediaProcessing',
        'debug',
        {
          effectiveMediaKeySymbol,
          fallbackLang: currentStateStore.currentSettings?.langFallback,
          isSignLanguage,
          keySymbol: media.KeySymbol,
          langsWritten,
          mepsLanguageAlternativeIndex: media.MepsLanguageAlternativeIndex,
          mepsLanguageIndex: media.MepsLanguageIndex,
          track: media.Track,
        },
      );

      let mediaWasDownloaded = false;
      const triedPublicationFetchers: PublicationFetcher[] = [];

      for (const langwritten of langsWritten) {
        if (!langwritten || !(media.KeySymbol || media.MepsDocumentId))
          continue;

        const publicationFetcher = createMissingMediaPublicationFetcher(
          media,
          langwritten,
        );
        triedPublicationFetchers.push(publicationFetcher);

        log(
          '[processMissingMediaInfo] Trying media download',
          'mediaProcessing',
          'info',
          { publicationFetcher },
        );

        if (media.KeySymbol === 'nwt') {
          mediaWasDownloaded =
            !!(await downloadBibleMissingMedia(
              media,
              langwritten,
              meetingDate,
            )) || mediaWasDownloaded;
          continue;
        }

        try {
          mediaWasDownloaded =
            (await downloadStandardMissingMedia({
              isDynamicMedia,
              keepMediaLabels,
              media,
              meetingDate,
              publicationFetcher,
            })) || mediaWasDownloaded;
        } catch (e) {
          errorCatcher(e);
        }
      }

      if (!mediaWasDownloaded) {
        markMissingMediaDownloadErrors(triedPublicationFetchers, meetingDate);
        errors.push(...triedPublicationFetchers);
      }
    }
    return errors;
  } catch (e) {
    errorCatcher(e);
  }
}

export const getPubMediaLinks = async (
  publication: PublicationFetcher,
  meetingDate?: string,
  suppressDownloadError = false,
) => {
  const jwStore = useJwStore();
  const { urlVariables } = jwStore;
  try {
    const currentStateStore = useCurrentStateStore();

    const isSignLanguage =
      jwStore.jwLanguages.list.find(
        (l) => l.langcode === publication.langwritten,
      )?.isSignLanguage ?? currentStateStore.currentSongbook.signLanguage;

    const response = await fetchPubMediaLinks(
      {
        ...publication,
        pub:
          publication.pub === 'sjjm' && isSignLanguage
            ? currentStateStore.currentSongbook.pub
            : publication.pub,
      },
      urlVariables.pubMedia,
      currentStateStore.online,
    );

    if (!response && !suppressDownloadError) {
      const downloadId = getPubId(publication, true);
      currentStateStore.downloadProgress[downloadId] = {
        error: true,
        filename: downloadId,
        meetingDate,
      };
    }
    return response;
  } catch (e) {
    errorCatcher(e);
    return null;
  }
};

export const getJwMepsInfo = async () => {
  try {
    const jwStore = useJwStore();

    if (!shouldUpdateList(jwStore.jwMepsLanguages, 3)) {
      return;
    }

    const file = await downloadMissingMedia({
      fileformat: 'ZIP',
      langwritten: 'E',
      pub: 'jwlb',
    });
    if (!file.FilePath) return;
    const dir = dirname(file.FilePath);
    await unzip(file.FilePath, dir);
    const msixbundle = await findFile(dir, '.msixbundle');
    if (!msixbundle) return;
    await unzip(msixbundle, dir);
    const msix = await findFile(dir, '_x64.msix');
    if (!msix) return;
    await unzip(msix, dir);
    const mepsunit = await findFile(join(dir, 'Data'), '.db');
    if (!mepsunit) return;
    const dynamicMepsLangs = globalThis.electronApi
      .executeQuery<JwMepsLanguage>(
        mepsunit,
        'SELECT LanguageId, PrimaryIetfCode, Symbol FROM Language',
      )
      .map((l) => ({
        ...l,
        PrimaryIetfCode: l.PrimaryIetfCode.toLowerCase() as JwLangSymbol,
      }));
    if (dynamicMepsLangs.length < jwStore.jwMepsLanguages.list.length) return;
    jwStore.jwMepsLanguages = {
      list: dynamicMepsLangs,
      updated: new Date(),
    };
  } catch (e) {
    errorCatcher(e);
  }
};

const findExistingPublicationFile = async (
  publication: PublicationFetcher,
  pubDir: string,
) => {
  if (!(await pathExists(pubDir))) return { FilePath: '' };

  const dirItems = await readdir(pubDir);
  const params = [
    publication.issue,
    publication.track,
    publication.pub,
    publication.docid,
  ]
    .filter((item) => item !== undefined && item !== null)
    .map((item) => item.toString());

  const matchingFile = dirItems.find((item) => {
    if (!item.isFile || !item.name) return false;

    const filePath = join(pubDir, item.name);
    const fileExtension = extname(filePath).toLowerCase();
    const nameMatches = params.every((param) =>
      basename(item.name).includes(param),
    );
    const formatMatches =
      !publication.fileformat ||
      fileExtension.includes(publication.fileformat.toLowerCase());

    return nameMatches && formatMatches;
  });

  return matchingFile
    ? { FilePath: join(pubDir, matchingFile.name) }
    : { FilePath: '' };
};

const getPublicationMediaItems = (
  publication: PublicationFetcher,
  responseObject: Publication,
) => {
  if (!publication.fileformat && publication.langwritten) {
    publication.fileformat = Object.keys(
      responseObject.files[publication.langwritten] || {},
    )[0] as keyof PublicationFiles;
  }

  if (!publication.langwritten || !publication.fileformat) return [];

  return (
    responseObject.files[publication.langwritten]?.[publication.fileformat] ||
    []
  );
};

const shouldDownloadLowPriority = (
  isMemorialMeeting: boolean,
  meetingDate: string | undefined,
) => {
  if (isMemorialMeeting || !meetingDate) return false;
  return getDateDiff(meetingDate, new Date(), 'days') > 1;
};

const downloadRelatedMediaAssets = async ({
  bestItem,
  downloadedFile,
  isMemorialMeeting,
  jwMediaInfo,
  meetingDate,
  pubDir,
}: {
  bestItem: MediaLink;
  downloadedFile: DownloadedFile;
  isMemorialMeeting: boolean;
  jwMediaInfo: {
    duration: number;
    subtitles: string;
    thumbnail: string;
    title: string;
  };
  meetingDate?: string;
  pubDir: string;
}) => {
  const currentStateStore = useCurrentStateStore();
  const relatedUrls = [
    currentStateStore.currentSettings?.enableSubtitles
      ? jwMediaInfo.subtitles
      : undefined,
    jwMediaInfo.thumbnail,
  ].filter((url): url is string => !!url);

  for (const itemUrl of relatedUrls) {
    const itemFilename = changeExt(
      basename(bestItem.file.url),
      extname(itemUrl),
    );

    if (
      bestItem.file?.url &&
      (downloadedFile?.new || !(await exists(join(pubDir, itemFilename))))
    ) {
      await downloadFileIfNeeded({
        dir: pubDir,
        filename: itemFilename,
        lowPriority: shouldDownloadLowPriority(isMemorialMeeting, meetingDate),
        meetingDate,
        url: itemUrl,
      });
    }
  }
};

interface MissingMediaDownloadResult {
  FilePath: string;
  Label?: string;
  StreamDuration?: number;
  StreamThumbnailUrl?: string;
  StreamUrl?: string;
}

const downloadMissingMedia = async (
  publication: PublicationFetcher,
  meetingDate?: string,
  isDynamicMedia = false,
  suppressDownloadError = false,
): Promise<MissingMediaDownloadResult> => {
  try {
    const currentStateStore = useCurrentStateStore();
    const isMemorialMeeting =
      !!meetingDate &&
      isMemorialMeetingDate(
        meetingDate,
        currentStateStore.currentSettings?.memorialDate,
      );
    const pubDir = await getPublicationDirectory(publication);
    await updateLastUsedDate(
      pubDir,
      meetingDate || currentStateStore.selectedDate,
    );
    const responseObject = await getPubMediaLinks(
      publication,
      meetingDate,
      suppressDownloadError,
    );
    if (!responseObject?.files) {
      return findExistingPublicationFile(publication, pubDir);
    }

    const mediaItemLinks = getPublicationMediaItems(
      publication,
      responseObject,
    );
    const bestItem = findBestResolution(
      mediaItemLinks,
      useCurrentStateStore().currentSettings?.maxRes,
    );
    if (!isMediaLink(bestItem) || !bestItem?.file?.url) {
      return { FilePath: '' };
    }
    const jwMediaInfo = await getJwMediaInfo(publication);

    if (isDynamicMedia && (bestItem.duration || 0) > LONG_MEDIA_DURATION) {
      return {
        FilePath: '',
        Label: bestItem.title,
        StreamDuration: bestItem.duration,
        StreamThumbnailUrl: jwMediaInfo.thumbnail,
        StreamUrl: bestItem.file.url,
      };
    }

    const downloadedFile = await downloadFileIfNeeded({
      dir: pubDir,
      lowPriority: !isMemorialMeeting,
      meetingDate,
      size: bestItem.filesize,
      url: bestItem.file.url,
    });
    await downloadRelatedMediaAssets({
      bestItem,
      downloadedFile,
      isMemorialMeeting,
      jwMediaInfo,
      meetingDate,
      pubDir,
    });
    return {
      FilePath: join(pubDir, basename(bestItem.file.url)),
      Label: bestItem.title,
      StreamDuration: bestItem.duration,
      StreamThumbnailUrl: jwMediaInfo.thumbnail,
      StreamUrl: bestItem.file.url,
    };
  } catch (e) {
    errorCatcher(e);
    return { FilePath: '' };
  }
};

const getMediaLinkUrl = (item: MediaItemsMediatorFile | MediaLink) => {
  if ('progressiveDownloadURL' in item) return item.progressiveDownloadURL;
  return item.file.url;
};

const createPinyinAdditionalMedia = async ({
  bestItemUrl,
  currentSettings,
  onlyCreateItem,
  section,
  song,
  title,
}: {
  bestItemUrl: string | undefined;
  currentSettings: ReturnType<typeof useCurrentStateStore>['currentSettings'];
  onlyCreateItem: boolean;
  section?: MediaSectionIdentifier;
  song: false | number | string;
  title?: string;
}) => {
  if (
    !song ||
    currentSettings?.lang !== 'CHS' ||
    !currentSettings?.enablePinyinSongs ||
    !useCurrentStateStore().pinyinActive ||
    !currentSettings?.pinyinSongFolder
  ) {
    return undefined;
  }

  const trackNum = String(song).padStart(3, '0');
  const pinyinPath = join(
    currentSettings.pinyinSongFolder,
    `sjjm_s-Pi_CHS_${trackNum}_r720P.mp4`,
  );
  if (!(await pathExists(pinyinPath))) return undefined;

  const mediaOptions = {
    song: song.toString(),
    title,
    url: bestItemUrl,
  };

  if (onlyCreateItem) {
    return createMediaItemFromPath(pinyinPath, undefined, mediaOptions);
  }

  return addToAdditionMediaMapFromPath(
    pinyinPath,
    section,
    undefined,
    mediaOptions,
  );
};

const queueAdditionalMediaDownload = ({
  bestItem,
  bestItemUrl,
  datedAdditionalMediaDir,
  meetingDate,
  progressCategory,
}: {
  bestItem: MediaItemsMediatorFile | MediaLink;
  bestItemUrl: string;
  datedAdditionalMediaDir: string;
  meetingDate?: string;
  progressCategory: FileDownloader['progressCategory'];
}) => {
  downloadFileIfNeeded({
    dir: datedAdditionalMediaDir,
    lowPriority: false,
    meetingDate,
    progressCategory,
    size: bestItem.filesize,
    url: bestItemUrl,
  });
};

export interface DownloadAdditionalRemoteVideoOptions {
  customDuration?: { max: number; min: number };
  mediaItemLinks: MediaItemsMediatorFile[] | MediaLink[];
  meetingDate?: string;
  onlyCreateItem?: boolean;
  progressCategory?: FileDownloader['progressCategory'];
  section?: MediaSectionIdentifier;
  song?: false | number | string;
  thumbnailUrl?: string;
  title?: string;
}

export const downloadAdditionalRemoteVideo = async (
  options: DownloadAdditionalRemoteVideoOptions,
): Promise<MediaItem | string | undefined> => {
  const {
    customDuration,
    mediaItemLinks,
    meetingDate,
    onlyCreateItem = false,
    progressCategory,
    section,
    song = false,
    thumbnailUrl,
    title,
  } = options;
  try {
    const currentStateStore = useCurrentStateStore();
    const currentSettings = currentStateStore.currentSettings;

    const bestItem = findBestResolution(
      mediaItemLinks,
      currentSettings?.maxRes,
    );
    const bestItemUrl = bestItem ? getMediaLinkUrl(bestItem) : undefined;

    // Pinyin song substitution: use local pinyin file instead of downloading
    const pinyinMedia = await createPinyinAdditionalMedia({
      bestItemUrl,
      currentSettings,
      onlyCreateItem,
      section,
      song,
      title,
    });
    if (pinyinMedia) return pinyinMedia;

    if (!bestItem || !bestItemUrl) return undefined;

    const datedAdditionalMediaDir =
      await currentStateStore.getDatedAdditionalMediaDirectory();

    await updateLastUsedDate(
      datedAdditionalMediaDir,
      meetingDate || currentStateStore.selectedDate,
    );

    const mediaFilePath = join(datedAdditionalMediaDir, basename(bestItemUrl));

    if (onlyCreateItem) {
      const mediaItem = await createMediaItemFromPath(
        mediaFilePath,
        undefined,
        {
          duration: bestItem.duration,
          filesize: bestItem.filesize,
          song: song ? song.toString() : undefined,
          thumbnailUrl,
          title,
          url: bestItemUrl,
        },
        customDuration,
      );

      queueAdditionalMediaDownload({
        bestItem,
        bestItemUrl,
        datedAdditionalMediaDir,
        meetingDate,
        progressCategory,
      });

      return mediaItem;
    }

    await addToAdditionMediaMapFromPath(
      mediaFilePath,
      section,
      undefined,
      {
        duration: bestItem.duration,
        filesize: bestItem.filesize,
        song: song ? song.toString() : undefined,
        thumbnailUrl,
        title,
        url: bestItemUrl,
      },
      customDuration,
    );

    queueAdditionalMediaDownload({
      bestItem,
      bestItemUrl,
      datedAdditionalMediaDir,
      meetingDate,
      progressCategory,
    });

    const key = bestItemUrl + datedAdditionalMediaDir;
    return key;
  } catch (e) {
    errorCatcher(e);
    return undefined;
  }
};

const getPreferredImageTypes = (square: boolean): (keyof ImageTypeSizes)[] => {
  if (square) return ['sqr', 'wss', 'lsr', 'pnr'];
  return ['wss', 'lsr', 'sqr', 'pnr'];
};

const getImageSizesToConsider = (
  minSize: keyof ImageSizes | undefined,
): (keyof ImageSizes)[] => {
  const sizeOrder: (keyof ImageSizes)[] = ['sm', 'md', 'lg', 'xl'];
  const startIndex = minSize ? sizeOrder.indexOf(minSize) : 0;
  return sizeOrder.slice(startIndex);
};

const getFirstPreferredImageSize = (
  imageSizes: ImageSizes,
  sizesToConsider: (keyof ImageSizes)[],
) => {
  const preferredSize = sizesToConsider.find((size) => size in imageSizes);
  if (preferredSize) return imageSizes[preferredSize];

  const fallbackSize = (Object.keys(imageSizes) as (keyof ImageSizes)[]).find(
    (size) => !sizesToConsider.includes(size),
  );
  return fallbackSize ? imageSizes[fallbackSize] : undefined;
};

export function getBestImageUrl(
  images: ImageTypeSizes,
  minSize?: keyof ImageSizes,
  square = false,
) {
  try {
    const sizesToConsider = getImageSizesToConsider(minSize);

    for (const key of getPreferredImageTypes(square)) {
      const imageSizes = images[key];
      if (!imageSizes) continue;

      const imageUrl = getFirstPreferredImageSize(imageSizes, sizesToConsider);
      if (imageUrl) return imageUrl;
    }
  } catch (e) {
    errorCatcher(e);
    return '';
  }
}

export const getJwMediaInfo = async (publication: PublicationFetcher) => {
  const jwStore = useJwStore();
  const { urlVariables } = jwStore;
  const emptyResponse = {
    duration: 0,
    subtitles: '',
    thumbnail: '',
    title: '',
  };
  try {
    const responseObject = await fetchMediaItems(
      publication,
      urlVariables.mediator,
      useCurrentStateStore().online,
    );

    const jwMediaInfo = responseObject?.media[0];
    if (!jwMediaInfo) return emptyResponse;

    const best = findBestResolution(
      jwMediaInfo.files,
      useCurrentStateStore().currentSettings?.maxRes,
    );

    return {
      duration: jwMediaInfo.duration,
      subtitles:
        !isMediaLink(best) && best?.subtitles ? best.subtitles.url : '',
      thumbnail: getBestImageUrl(jwMediaInfo.images) ?? '',
      title: jwMediaInfo.title,
    };
  } catch (error) {
    errorCatcher(error);
    return emptyResponse;
  }
};

const downloadPubMediaFiles = async (publication: PublicationFetcher) => {
  try {
    const currentStateStore = useCurrentStateStore();
    if (!publication.fileformat) return;
    const filteredMediaItemLinks = await getPublicationMediaLinks(publication);
    if (!filteredMediaItemLinks.length) {
      const downloadId = getPubId(publication, true);
      currentStateStore.downloadProgress[downloadId] = {
        error: true,
        filename: downloadId,
      };
      return;
    }

    const dir = await getPublicationDirectory(publication);
    await updateLastUsedDate(dir, new Date());
    for (const mediaLink of filteredMediaItemLinks) {
      downloadFileIfNeeded({
        dir,
        // Background music should not be a high priority download
        lowPriority: true,
        size: mediaLink.filesize,
        url: mediaLink.file.url,
      });
    }
  } catch (e) {
    errorCatcher(e);
  }
};

export const fetchBackgroundMusicSongLibrary = async (
  lang: JwLangCode,
): Promise<SongItem[]> => {
  const currentStateStore = useCurrentStateStore();
  const publication: PublicationFetcher = {
    fileformat: currentStateStore.currentSongbook?.fileformat,
    langwritten: lang || 'E',
    maxTrack: MAX_SONGS,
    pub: currentStateStore.currentSongbook?.pub || 'sjjm',
  };
  const cacheKey = getBackgroundMusicLibraryCacheKey(publication);

  if (!backgroundMusicLibraryCache.has(cacheKey)) {
    backgroundMusicLibraryCache.set(
      cacheKey,
      (async () => {
        const startedAt = performance.now();
        const mediaLinks = await getPublicationMediaLinks(publication);
        const dir = await getPublicationDirectory(publication);
        await updateLastUsedDate(dir, new Date());

        const songs = await Promise.all(
          mediaLinks.map(async (mediaLink) => ({
            duration: mediaLink.duration,
            filesize: mediaLink.filesize,
            path: await getExpectedDownloadPath(dir, mediaLink.file.url),
            remoteUrl: mediaLink.file.url,
            title: mediaLink.title,
            track: mediaLink.track,
          })),
        );

        log(
          `[${new Date().toISOString()}] +${Math.round(
            performance.now() - startedAt,
          )}ms Background music API song library fetched`,
          'backgroundMusic',
          'debug',
          {
            cacheKey,
            songs: songs.length,
          },
        );

        if (!songs.length) {
          backgroundMusicLibraryCache.delete(cacheKey);
        }

        return songs;
      })().catch((error: unknown) => {
        backgroundMusicLibraryCache.delete(cacheKey);
        throw error;
      }),
    );
  }

  return backgroundMusicLibraryCache.get(cacheKey) ?? [];
};

export const resolveBackgroundMusicPlaybackUrl = async (
  song: SongItem,
): Promise<string> => {
  const localPath = await getValidLocalSongPath(song);
  if (localPath) {
    log(
      `[${new Date().toISOString()}] Background music using local file`,
      'backgroundMusic',
      'debug',
      {
        path: localPath,
        title: song.title,
        track: song.track,
      },
    );
    return pathToFileURL(localPath);
  }

  if (song.remoteUrl) {
    const dir = dirname(song.path);
    downloadFileIfNeeded({
      dir,
      lowPriority: true,
      size: song.filesize,
      url: song.remoteUrl,
    });
    log(
      `[${new Date().toISOString()}] Background music streaming remote file while caching`,
      'backgroundMusic',
      'debug',
      {
        path: song.path,
        remoteUrl: song.remoteUrl,
        title: song.title,
        track: song.track,
      },
    );
    return song.remoteUrl;
  }

  return song.path ? pathToFileURL(song.path) : '';
};

export const downloadBackgroundMusic = () => {
  try {
    const currentStateStore = useCurrentStateStore();
    if (
      !currentStateStore.currentSongbook ||
      !currentStateStore.currentSettings?.lang ||
      !currentStateStore.currentSettings?.enableMusicButton
    ) {
      log(
        `[${new Date().toISOString()}] Background music download skipped`,
        'backgroundMusic',
        'debug',
        {
          enableMusicButton:
            currentStateStore.currentSettings?.enableMusicButton,
          hasCurrentSongbook: !!currentStateStore.currentSongbook,
          lang: currentStateStore.currentSettings?.lang,
        },
      );
      return;
    }
    log(
      `[${new Date().toISOString()}] Background music download requested`,
      'backgroundMusic',
      'debug',
      {
        fileformat: currentStateStore.currentSongbook?.fileformat,
        lang: currentStateStore.currentSettings?.lang,
        pub: currentStateStore.currentSongbook?.pub,
      },
    );
    downloadPubMediaFiles({
      fileformat: currentStateStore.currentSongbook?.fileformat,
      langwritten: currentStateStore.currentSettings?.lang,
      maxTrack: MAX_SONGS,
      pub: currentStateStore.currentSongbook?.pub,
    });
  } catch (e) {
    errorCatcher(e);
  }
};

export const downloadSongbookVideos = () => {
  try {
    const currentStateStore = useCurrentStateStore();
    if (
      !currentStateStore.currentSongbook ||
      !currentStateStore.currentSettings?.lang ||
      !currentStateStore.currentSettings?.enableExtraCache
    )
      return;
    downloadPubMediaFiles({
      fileformat: 'MP4',
      issue: 0,
      langwritten: currentStateStore.currentSettings?.lang,
      maxTrack: MAX_SONGS,
      pub: currentStateStore.currentSongbook?.pub,
    });
  } catch (e) {
    errorCatcher(e);
  }
};

const downloadJwpub = async (
  publication: PublicationFetcher,
  meetingDate?: string,
  progressCategory?: FileDownloader['progressCategory'],
): Promise<DownloadedFile> => {
  try {
    const currentStateStore = useCurrentStateStore();
    const isMemorialMeeting =
      !!meetingDate &&
      isMemorialMeetingDate(
        meetingDate,
        currentStateStore.currentSettings?.memorialDate,
      );
    publication.fileformat = 'JWPUB';
    const isValidJwpubArchive = async (jwpubPath?: string) => {
      if (!jwpubPath) return false;
      try {
        const entries = await getZipEntries(jwpubPath);
        return !!entries['contents'];
      } catch (error) {
        log(
          `[downloadJwpub] Corrupt JWPUB detected at ${jwpubPath}.`,
          'mediaFetching',
          'warn',
          error,
        );
        return false;
      }
    };

    const getExistingJwpub = async (dir: string): Promise<DownloadedFile> => {
      try {
        if (!(await pathExists(dir))) {
          return { new: false, path: '' };
        }

        const files = await readdir(dir);
        for (const file of files) {
          const filename = file?.name || '';
          if (!filename.toLowerCase().endsWith('.jwpub')) continue;

          const jwpubPath = join(dir, filename);
          if (await isValidJwpubArchive(jwpubPath)) {
            return {
              new: false,
              path: jwpubPath,
            };
          }
        }
      } catch (error) {
        errorCatcher(error);
      }
      return { new: false, path: '' };
    };

    const publicationDir = await getPublicationDirectory(publication);

    const handleDownloadError = async () => {
      const downloadId = getPubId(publication, true);
      currentStateStore.downloadProgress[downloadId] = {
        error: true,
        filename: downloadId,
        progressCategory,
      };
      const cachedJwpub = await getExistingJwpub(publicationDir);
      if (cachedJwpub.path) return cachedJwpub;
      return { new: false, path: '' };
    };
    const publicationInfo = await getPubMediaLinks(publication, meetingDate);
    if (!publicationInfo?.files) {
      return handleDownloadError();
    }
    const mediaLinks =
      (publication.langwritten
        ? publicationInfo.files[publication.langwritten]?.[
            publication.fileformat
          ] || []
        : []
      )
        .filter((element) => isMediaLink(element))
        .filter(
          (mediaLink) =>
            !publication.maxTrack || mediaLink.track < publication.maxTrack,
        ) || [];
    if (!mediaLinks.length) {
      return handleDownloadError();
    }

    await updateLastUsedDate(publicationDir, meetingDate || new Date());
    let lowPriority = false;

    if (!isMemorialMeeting && meetingDate) {
      lowPriority = getDateDiff(meetingDate, new Date(), 'days') > 1;
    }

    const downloadOptions = {
      dir: publicationDir,
      lowPriority,
      meetingDate,
      progressCategory,
      size: mediaLinks[0]?.filesize,
      url: mediaLinks[0]?.file.url ?? '',
    };

    const firstAttempt = await downloadFileIfNeeded(downloadOptions);
    if (firstAttempt.error || !firstAttempt.path) return firstAttempt;
    if (await isValidJwpubArchive(firstAttempt.path)) return firstAttempt;

    // Self-heal once by deleting and re-downloading when the archive is invalid.
    await trackInvalidJwpubRedownload('attempted', {
      path: firstAttempt.path,
      publication: publication.pub,
    }).catch(() => undefined);
    await remove(firstAttempt.path).catch(() => undefined);
    const secondAttempt = await downloadFileIfNeeded(downloadOptions);
    if (secondAttempt.error || !secondAttempt.path) return secondAttempt;
    if (await isValidJwpubArchive(secondAttempt.path)) {
      await trackInvalidJwpubRedownload('recovered', {
        path: secondAttempt.path,
        publication: publication.pub,
      }).catch(() => undefined);
      return secondAttempt;
    }

    await trackInvalidJwpubRedownload('failed', {
      path: secondAttempt.path,
      publication: publication.pub,
    }).catch(() => undefined);
    await remove(secondAttempt.path).catch(() => undefined);
    return handleDownloadError();
  } catch (e) {
    errorCatcher(e);
    return {
      new: false,
      path: '',
    };
  }
};

const requestControllers: AbortController[] = [];

export const setUrlVariables = async (baseUrl: string | undefined) => {
  const jwStore = useJwStore();

  const resetUrlVariables = (base = false) => {
    if (base) jwStore.urlVariables.base = '';
    jwStore.urlVariables.mediator = '';
    jwStore.urlVariables.pubMedia = '';
  };

  const isValidUrlBasePart = (basePart?: string) => {
    if (!basePart) return false;
    const basePartWithoutPath = basePart.split('/')[0];
    if (!basePartWithoutPath) return false;
    const domainSegments = basePartWithoutPath.split('.');
    const eachSegmentIsAtLeastTwoChars = domainSegments.every(
      (segment) => segment.length >= 2,
    );
    return eachSegmentIsAtLeastTwoChars;
  };

  if (!baseUrl || !isValidUrlBasePart(baseUrl)) {
    resetUrlVariables(true);
    return;
  }

  if (
    baseUrl === jwStore.urlVariables.base &&
    jwStore.urlVariables.mediator &&
    jwStore.urlVariables.pubMedia
  )
    return;

  try {
    resetUrlVariables();
    jwStore.urlVariables.base = baseUrl;
    clearFetchCache();
    const homePageUrl = 'https://www.' + baseUrl + '/en';

    requestControllers
      .filter((c) => !c.signal.aborted)
      .forEach((c) => c.abort());
    const controller = new AbortController();
    // delete all items in the array
    requestControllers.splice(0);
    requestControllers.push(controller);
    const homePage = await fetchRaw(
      homePageUrl,
      {
        signal: controller.signal,
      },
      false,
    )
      .then((response) => {
        if (!response.ok) return null;
        return response.text();
      })
      .catch(() => null);
    if (!homePage) {
      resetUrlVariables();
      return;
    }

    const { load } = await import('cheerio');
    const $ = load(homePage);
    const div = $('div#pageConfig');
    if (!div?.[0]?.attribs) {
      resetUrlVariables();
      return;
    }

    const attributes = { ...div?.[0]?.attribs };

    if (attributes['data-mediator_url']) {
      jwStore.urlVariables.mediator = attributes['data-mediator_url'];
    }
    if (attributes['data-pubmedia_url']) {
      jwStore.urlVariables.pubMedia = attributes['data-pubmedia_url'];
    }

    if (!jwStore.urlVariables.mediator || !jwStore.urlVariables.pubMedia) {
      resetUrlVariables();
    }
  } catch (e) {
    if (jwStore.urlVariables.base) {
      requestControllers
        .filter((c) => !c.signal.aborted)
        .forEach((c) => c.abort());
    }
    errorCatcher(e);
    resetUrlVariables();
  } finally {
    setElectronUrlVariables(JSON.stringify(jwStore.urlVariables));
  }
};

// Breaking circular dependencies by registering providers
registerMediaProviders({
  downloadFileIfNeeded,
  getJwMediaInfo,
});

registerSqliteProviders({
  getDbFromJWPUB,
  getJwLangCode,
});
