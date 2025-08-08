import type {
  DatedTextItem,
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
  Publication,
  PublicationFetcher,
  PublicationFiles,
} from 'src/types';

import { queues } from 'boot/globals';
import { FEB_2023, FOOTNOTE_TAR_PAR, MAX_SONGS } from 'src/constants/jw';
import mepslangs from 'src/constants/mepslangs';
import { isCoWeek, isMwMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { exportAllDays } from 'src/helpers/export-media';
import { getSubtitlesUrl, getThumbnailUrl } from 'src/helpers/fs';
import {
  decompressJwpub,
  getMediaFromJwPlaylist,
} from 'src/helpers/mediaPlayback';
import { fetchMediaItems, fetchPubMediaLinks, fetchRaw } from 'src/utils/api';
import { convertImageIfNeeded } from 'src/utils/converters';
import {
  dateFromString,
  formatDate,
  getSpecificWeekday,
  subtractFromDate,
} from 'src/utils/date';
import {
  findFile,
  getPublicationDirectory,
  trimFilepathAsNeeded,
} from 'src/utils/fs';
import { sanitizeId } from 'src/utils/general';
import { findBestResolution, getPubId, isMediaLink } from 'src/utils/jw';
import {
  getMetadataFromMediaPath,
  isAudio,
  isImage,
  isJwPlaylist,
  isLikelyFile,
  isSong,
  isVideo,
} from 'src/utils/media';
import {
  findDb,
  getDocumentMultimediaItems,
  getMediaVideoMarkers,
  getMultimediaMepsLangs,
  getPublicationInfoFromDb,
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
  decompress,
  downloadFile,
  executeQuery,
  fileUrlToPath,
  fs,
  path,
  pathToFileURL,
  readdir,
  setElectronUrlVariables,
} = window.electronApi;
const { copy, ensureDir, exists, pathExists, remove, stat } = fs;
const { basename, changeExt, dirname, extname, join } = path;

export const getJwLangCode = (mepsId?: number): JwLangCode | null => {
  if (mepsId === undefined) return null;
  const jwStore = useJwStore();
  const match = jwStore.jwMepsLanguages.list.find(
    (l) => l.LanguageId === mepsId,
  );
  if (match) return match.Symbol;
  return mepslangs[mepsId] || null;
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
    if (!additionalFilePath) return;
    const currentStateStore = useCurrentStateStore();
    const jwStore = useJwStore();
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
      path
        .basename(additionalFilePath)
        .replace(extname(additionalFilePath), '');

    if (!uniqueId) {
      uniqueId = sanitizeId(
        formatDate(currentStateStore.selectedDate, 'YYYYMMDD') +
          '-' +
          pathToFileURL(additionalFilePath),
      );
    }
    console.log('🔄 [addToAdditionMediaMapFromPath] Adding media to section:', {
      section,
      uniqueId,
    });
    jwStore.addToAdditionMediaMap(
      [
        {
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
        },
      ],
      section,
      currentStateStore.currentCongregation,
      currentStateStore.selectedDateObject,
      isCoWeek(currentStateStore.selectedDateObject?.date),
    );
    return uniqueId;
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
    for (let i = 0; i < multimediaItems.length; i++) {
      multimediaItems[i] = await addFullFilePathToMultimediaItem(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        multimediaItems[i]!,
        pubFolder ?? publication,
      );
    }
    await processMissingMediaInfo(multimediaItems);
    const mediaItems = currentStateStore.selectedDateObject
      ? await dynamicMediaMapper(
          multimediaItems,
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

export const downloadFileIfNeeded = async ({
  dir,
  filename,
  lowPriority = false,
  size,
  url,
}: FileDownloader): Promise<DownloadedFile> => {
  if (!url) {
    return {
      new: false,
      path: '',
    };
  }

  const currentStateStore = useCurrentStateStore();
  await ensureDir(dir);
  if (!filename) filename = basename(url);
  const { default: sanitize } = await import('sanitize-filename');
  filename = sanitize(filename);
  const destinationPath = join(dir, filename);
  const remoteSize: number =
    size ||
    (await fetchRaw(url, { method: 'HEAD' })
      .then((response) => {
        return +(response?.headers?.get('content-length') || 0);
      })
      .catch(() => 0));
  if (await exists(destinationPath)) {
    const statistics = await stat(destinationPath);
    const localSize = statistics.size;
    if (localSize === remoteSize) {
      return {
        new: false,
        path: destinationPath,
      };
    }
  }
  const downloadId = await downloadFile(url, dir, filename, lowPriority);

  const result = await new Promise<DownloadedFile>((resolve) => {
    const interval = setInterval(() => {
      if (!downloadId) {
        clearInterval(interval);
        resolve({
          error: true,
          path: destinationPath,
        });
        return;
      }
      if (currentStateStore.downloadProgress[downloadId]?.complete) {
        clearInterval(interval);
        resolve({
          new: true,
          path: destinationPath,
        });
      }
    }, 500); // Check every 500ms
  });
  return result;
};

export const fetchMedia = async () => {
  console.group('📥 Media Fetching');
  try {
    const currentStateStore = useCurrentStateStore();
    if (
      !currentStateStore.currentCongregation ||
      !!currentStateStore.currentSettings?.disableMediaFetching
    ) {
      console.log('⏭️ Media fetching disabled or no congregation');
      console.groupEnd();
      return;
    }

    const jwStore = useJwStore();

    if (!jwStore.urlVariables.base || !jwStore.urlVariables.mediator) {
      console.log('⚠️ Missing URL variables for media fetching');
      console.groupEnd();
      return;
    }

    const dedupeDays = (days: DateInfo[]) => {
      try {
        const dayMap = new Map<string, DateInfo>();

        for (const day of days) {
          const dateKey = new Date(day.date).toISOString().split('T')[0]; // Use yyyy-mm-dd format as key
          if (!dateKey) continue;

          if (!dayMap.has(dateKey)) {
            dayMap.set(dateKey, day);
          } else {
            const existing = dayMap.get(dateKey);
            if (!existing) continue;

            const preferCurrent =
              (day.complete && !day.error) ||
              (!existing.complete && existing.error && day.error);

            if (preferCurrent) {
              dayMap.set(dateKey, day);
            }
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
      console.group('🔄 Day Deduplication');
      console.log(
        `📊 Reduced days from ${rawDays.length} to ${uniqueDays.length}`,
      );
      jwStore.lookupPeriod[currentStateStore.currentCongregation] = uniqueDays;
      console.groupEnd();
    }

    console.group('🔍 Day Analysis');
    const meetingsToFetch = (
      await Promise.all(
        jwStore.lookupPeriod[currentStateStore.currentCongregation]?.map(
          async (day, index) => {
            // console.log(`\nChecking day at index ${index}:`, day);

            // Skip non-meeting days entirely
            if (!day.meeting) {
              return null;
            }

            // Condition 1: Incomplete or error meeting
            const hasIncompleteOrErrorMeeting =
              day.meeting && (!day.complete || day.error);
            if (hasIncompleteOrErrorMeeting) {
              console.group(
                `📅 Day ${index + 1} - ${day.date.toISOString().split('T')[0]}`,
              );
              console.log('🔍 Incomplete or error meeting detected:', {
                complete: day.complete,
                error: day.error,
                meeting: day.meeting,
              });
            }

            // Condition 2: Missing media file
            const allMedia = Object.values(day.mediaSections ?? {}).flatMap(
              (section) => section.items || [],
            );

            const missingMediaCheckResults = await Promise.all(
              allMedia.map(async (media, mediaIndex) => {
                const shouldCheckFile =
                  !media?.children?.length &&
                  media?.source === 'dynamic' &&
                  media?.fileUrl;
                const fileExists =
                  shouldCheckFile &&
                  (await pathExists(fileUrlToPath(media.fileUrl)));

                const isMissing = shouldCheckFile && !fileExists;

                if (isMissing) {
                  console.log(
                    `    ❌ Missing media file at media[${mediaIndex}]`,
                    {
                      media,
                    },
                  );
                }

                return isMissing;
              }),
            );

            const hasMissingMediaFile = missingMediaCheckResults.includes(true);

            // Condition 3: Duplicate `uniqueId`s in mediaSections
            const uniqueIds = allMedia.map((m) => m.uniqueId);
            const hasDuplicates = uniqueIds.length > new Set(uniqueIds).size;

            if (hasDuplicates) {
              console.log('⚠️ Duplicate uniqueIds found:', {
                totalCount: uniqueIds.length,
                uniqueCount: new Set(uniqueIds).size,
                uniqueIds,
              });
            }

            // Summary for this day
            const shouldRefresh =
              hasIncompleteOrErrorMeeting ||
              hasMissingMediaFile ||
              hasDuplicates;

            if (shouldRefresh) {
              console.log('✅ Day to be refreshed:', {
                hasDuplicates,
                hasIncompleteOrErrorMeeting,
                hasMissingMediaFile,
                index,
              });
              console.groupEnd();
            }

            return shouldRefresh ? day : null;
          },
        ) || [],
      )
    ).filter((day) => !!day);
    console.groupEnd();

    meetingsToFetch.forEach((day) => {
      day.error = false;
      day.complete = false;
    });
    if (!queues.meetings[currentStateStore.currentCongregation]) {
      const { default: PQueue } = await import('p-queue');
      queues.meetings[currentStateStore.currentCongregation] = new PQueue({
        concurrency: 2,
      });
    } else {
      queues.meetings[currentStateStore.currentCongregation]?.start();
    }
    const queue = queues.meetings[currentStateStore.currentCongregation];
    if (meetingsToFetch.length) {
      console.group('📥 Media Processing');
      console.log('📋 Meetings to process:', {
        count: meetingsToFetch.length,
        meetings: meetingsToFetch,
      });
    }
    for (const day of meetingsToFetch) {
      try {
        queue
          ?.add(async () => {
            console.group(
              `📅 Processing ${day.meeting === 'we' ? 'Weekend' : day.meeting === 'mw' ? 'Midweek' : 'Unknown'} Meeting - ${day.date.toISOString().split('T')[0]}`,
            );
            if (!day) {
              console.log('⚠️ No day data');
              console.groupEnd();
              return;
            }
            const dayDate = day.date;
            if (!dayDate) {
              day.complete = false;
              day.error = true;
              console.log('❌ No date for day');
              console.groupEnd();
              return;
            }
            let fetchResult = null;
            if (day.meeting === 'we') {
              console.log('🌅 Fetching weekend meeting media');
              fetchResult = await getWeMedia(dayDate);
            } else if (day.meeting === 'mw') {
              console.log('🌆 Fetching midweek meeting media');
              fetchResult = await getMwMedia(dayDate);
            }
            if (fetchResult) {
              console.log('✅ Media fetched successfully');
              // Get all media from all sections for replacement
              if (!day.mediaSections) day.mediaSections = {};
              createMeetingSections(day);
              if (isMwMeetingDay(dayDate)) {
                replaceMissingMediaByPubMediaId(day, fetchResult.media);
              } else {
                replaceMissingMediaByPubMediaId(day, fetchResult.media);
              }
              day.error = fetchResult.error;
              day.complete = true;
            } else {
              console.log('❌ Failed to fetch media');
              day.error = true;
              day.complete = false;
            }
            console.groupEnd();
          })
          .catch((error) => {
            console.log('❌ Error during media processing:', error);
            day.error = true;
            console.groupEnd();
            throw error;
          });
      } catch (error) {
        errorCatcher(error);
        day.error = true;
      }
    }
    await queue?.onIdle();
    console.log('✅ All media processing completed');
    console.groupEnd();
    exportAllDays();
  } catch (error) {
    console.log('❌ Error in fetchMedia:', error);
    errorCatcher(error);
  } finally {
    console.groupEnd(); // Close main Media Fetching group
  }
};

const getDbFromJWPUB = async (publication: PublicationFetcher) => {
  try {
    const jwpub = await downloadJwpub(publication);
    if (jwpub.error) return null;
    const publicationDirectory = await getPublicationDirectory(
      publication,
      useCurrentStateStore().currentSettings?.cacheFolder,
    );
    if (jwpub.new || !(await findDb(publicationDirectory))) {
      await decompressJwpub(jwpub.path, publicationDirectory);
    }
    const dbFile = await findDb(publicationDirectory);
    if (!dbFile) {
      return null;
    } else {
      return dbFile;
    }
  } catch (error) {
    errorCatcher(error);
    return null;
  }
};

async function addFullFilePathToMultimediaItem(
  multimediaItem: MultimediaItem,
  publication: PublicationFetcher,
): Promise<MultimediaItem> {
  try {
    const paths: (keyof MultimediaItem)[] = [
      'FilePath',
      'LinkedPreviewFilePath',
      'CoverPictureFilePath',
    ];
    const baseDir = await getPublicationDirectory(
      publication,
      useCurrentStateStore().currentSettings?.cacheFolder,
    );

    const resolvedPaths = Object.fromEntries(
      paths.map((key) =>
        multimediaItem[key] ? [key, join(baseDir, multimediaItem[key])] : [],
      ),
    );
    return {
      ...multimediaItem,
      ...resolvedPaths,
    };
  } catch (error) {
    errorCatcher(error);
    return multimediaItem;
  }
}

const getDocumentExtractItems = async (db: string, docId: number) => {
  try {
    const currentStateStore = useCurrentStateStore();
    const extracts = executeQuery<MultimediaExtractItem>(
      // ${currentStateStore.currentSongbook?.pub === 'sjjm'
      //   ? "AND NOT UniqueEnglishSymbol = 'sjj' "
      //   : ''
      // }
      db,
      `SELECT DocumentExtract.BeginParagraphOrdinal,DocumentExtract.EndParagraphOrdinal,DocumentExtract.DocumentId,
      Extract.RefMepsDocumentId,Extract.RefPublicationId,Extract.RefMepsDocumentId,UniqueEnglishSymbol,IssueTagNumber,
      Extract.RefBeginParagraphOrdinal,Extract.RefEndParagraphOrdinal, Extract.Link, Extract.Caption as ExtractCaption
    FROM DocumentExtract
      INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId
      INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId
      INNER JOIN Document ON DocumentExtract.DocumentId = Document.DocumentId
    WHERE DocumentExtract.DocumentId = ${docId}
    AND NOT UniqueEnglishSymbol LIKE 'mwbr%'
    AND NOT UniqueEnglishSymbol = 'sjj'
    ${
      currentStateStore.currentSettings?.excludeTh
        ? "AND NOT UniqueEnglishSymbol = 'th' "
        : ''
    }
      ORDER BY DocumentExtract.BeginParagraphOrdinal`,
    );

    // AND NOT RefPublication.PublicationCategorySymbol = 'web'
    // To think about: should we add a toggle to enable/disable web publication multimedia?

    const allExtractItems = [];
    for (const extract of extracts) {
      extract.Lang = currentStateStore.currentSettings?.lang || 'E';
      if (extract.Link) {
        try {
          const matches = extract.Link.match(/\/(.*)\//);
          if (matches && matches.length > 0) {
            extract.Lang = (matches.pop()?.split(':')[0] || '') as JwLangCode;
          }
        } catch (e: unknown) {
          errorCatcher(e);
        }
      }

      let symbol = /[^a-zA-Z0-9]/.test(extract.UniqueEnglishSymbol)
        ? extract.UniqueEnglishSymbol
        : extract.UniqueEnglishSymbol.replace(/\d/g, '');
      if (['it', 'snnw'].includes(symbol)) continue; // Exclude Insight and the "old new songs" songbook; we don't need images from that
      if (
        symbol === 'w' &&
        extract.IssueTagNumber &&
        parseInt(extract.IssueTagNumber.toString()) >= 20080101 &&
        extract.IssueTagNumber.toString().slice(-2) === '01'
      ) {
        symbol = 'wp';
      }
      let extractLang = extract.Lang ?? currentStateStore.currentSettings?.lang;
      let extractDb = await getDbFromJWPUB({
        issue: extract.IssueTagNumber,
        langwritten: extractLang,
        pub: symbol,
      });
      const langFallback = currentStateStore.currentSettings?.langFallback;
      if (!extractDb && langFallback) {
        extractDb = await getDbFromJWPUB({
          issue: extract.IssueTagNumber,
          langwritten: langFallback,
          pub: symbol,
        });
        extractLang = langFallback;
      }

      if (!extractDb) continue;

      const extractItems = getDocumentMultimediaItems(
        {
          db: extractDb,
          lang: extractLang,
          mepsId: extract.RefMepsDocumentId,
          ...(extract.RefBeginParagraphOrdinal
            ? {
                // Hack to show intro picture when appropriate from:
                // - the Love People brochure
                // - the Enjoy Life Forever book
                // - the Bearing Thorough Witness book
                BeginParagraphOrdinal:
                  ['bt', 'lff', 'lmd'].includes(symbol) &&
                  extract.RefBeginParagraphOrdinal < 8
                    ? 1
                    : extract.RefBeginParagraphOrdinal,
              }
            : {}),
          ...(extract.RefEndParagraphOrdinal
            ? { EndParagraphOrdinal: extract.RefEndParagraphOrdinal }
            : {}),
        },
        currentStateStore.currentSettings?.includePrinted,
      )
        .map((extractItem): MultimediaItem => {
          return {
            ...extractItem,
            BeginParagraphOrdinal: extract.BeginParagraphOrdinal,
            EndParagraphOrdinal: extract.EndParagraphOrdinal,
            ExtractCaption: extract.ExtractCaption,
          };
        })
        .filter(
          (extractItem) =>
            currentStateStore.currentLangObject?.isSignLanguage ||
            !(symbol === 'lmd' && extractItem.MimeType.includes('video')),
        );
      for (let i = 0; i < extractItems.length; i++) {
        extractItems[i] = await addFullFilePathToMultimediaItem(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          extractItems[i]!,
          {
            issue: extract.IssueTagNumber,
            langwritten: extractLang,
            pub: symbol,
          },
        );
      }
      allExtractItems.push(...extractItems);
    }
    return allExtractItems;
  } catch (e: unknown) {
    errorCatcher(e);
    return [];
  }
};

const getStudyBible = async () => {
  try {
    const nwtStyPublication_E: PublicationFetcher = {
      fileformat: 'JWPUB',
      langwritten: 'E',
      pub: 'nwtsty',
    };
    const nwtStyDb_E = getDbFromJWPUB(nwtStyPublication_E);
    const currentStateStore = useCurrentStateStore();
    const languages = [
      ...new Set([
        currentStateStore.currentSettings?.lang,
        currentStateStore.currentSettings?.langFallback,
      ]),
    ].filter((l): l is JwLangCode => !!l);
    let nwtStyDb: null | string = null;
    let nwtStyPublication: null | PublicationFetcher = null;
    let nwtDb: null | string = null;
    for (const langwritten of languages) {
      if (!langwritten) continue;
      if (langwritten === 'E') {
        nwtStyDb = await nwtStyDb_E;
        nwtStyPublication = nwtStyPublication_E;
        break;
      }
      nwtStyPublication = {
        fileformat: 'JWPUB',
        langwritten,
        pub: 'nwtsty',
      };
      nwtStyDb = await getDbFromJWPUB(nwtStyPublication);
      if (nwtStyDb) break;
    }
    if (!nwtStyDb) {
      nwtStyPublication = nwtStyPublication_E;
      nwtStyDb = await nwtStyDb_E;

      let nwtPublication: null | PublicationFetcher = null;
      for (const langwritten of languages) {
        if (!langwritten) continue;
        nwtPublication = {
          fileformat: 'JWPUB',
          langwritten,
          pub: 'nwt',
        };
        nwtDb = await getDbFromJWPUB(nwtPublication);
        if (nwtDb) break;
      }
    }
    return {
      nwtDb,
      nwtStyDb,
      nwtStyDb_E: await nwtStyDb_E,
      nwtStyPublication,
      nwtStyPublication_E,
    };
  } catch (error) {
    errorCatcher(error);
    return { nwtDb: null, nwtStyDb: null, nwtStyPublication: null };
  }
};

export const getStudyBibleBooks: () => Promise<
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
      SELECT *
      FROM 
          Document
      WHERE
          Class = 1
    `;

      const bibleBookLocalNames = executeQuery<JwPlaylistItem>(
        nwtDb,
        bibleBooksSimpleQuery,
      );

      bibleBookLocalNames.forEach((localItem) => {
        const styItem = bibleBookItems.find(
          (item) => localItem.ChapterNumber === item.BibleBookId,
        );
        if (styItem) {
          styItem.Title = localItem.Title;
        }
      });
    }
    const bibleBooksObject = Object.fromEntries(
      await Promise.all(
        bibleBookItems
          .filter((item) => !!item.BibleBookId && !!item.CoverPictureFilePath)
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
  try {
    const { nwtStyDb, nwtStyPublication } = await getStudyBible();
    if (!nwtStyDb || !nwtStyPublication) return [];

    const bibleMediaCategoriesQuery = `
      select *
      from PublicationViewItem
      where PublicationViewId = 2
        and DefaultDocumentId < 0
        and ParentPublicationViewItemId < 0
    `;

    const bibleMediaCategories = executeQuery<MultimediaItem>(
      nwtStyDb,
      bibleMediaCategoriesQuery,
    );

    return bibleMediaCategories;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

export const getStudyBibleMedia = async () => {
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
          CoverMultimedia.FilePath AS CoverPictureFilePath
      FROM 
          VerseMultimediaMap vmm
      INNER JOIN 
          BibleChapter bc ON vmm.BibleVerseId BETWEEN bc.FirstVerseId AND bc.LastVerseId
      INNER JOIN 
          BibleVerse bv ON vmm.BibleVerseId = bv.BibleVerseId
      INNER JOIN 
          Multimedia m ON vmm.MultimediaId = m.MultimediaId
      INNER JOIN 
          Multimedia AS CoverMultimedia ON CoverMultimedia.LinkMultimediaId = m.MultimediaId;
    `;

    const bibleBookMediaItems = executeQuery<MultimediaItem>(
      nwtStyDb,
      bibleBookMediaItemsQuery,
    );

    const bibleBookDocumentsStartAtQuery = `
      SELECT Document.DocumentId
      FROM Document
      WHERE Document.SectionNumber <> 0 
        AND Document.Type <> 1
      ORDER BY Document.DocumentId
      LIMIT 1;
    `;

    const bibleBookDocumentsStartAt = executeQuery<DocumentItem>(
      nwtStyDb,
      bibleBookDocumentsStartAtQuery,
    );

    const bibleBookDocumentsStartAtId =
      bibleBookDocumentsStartAt[0]?.DocumentId;

    const bibleBookDocumentsEndAtQuery = `
      SELECT Document.DocumentId
      FROM Document
      WHERE Document.SectionNumber <> 0 
        AND Document.Type <> 1
      ORDER BY Document.DocumentId DESC
      LIMIT 1;
    `;

    const bibleBookDocumentsEndAt = executeQuery<DocumentItem>(
      nwtStyDb,
      bibleBookDocumentsEndAtQuery,
    );

    const bibleBookDocumentsEndAtId = bibleBookDocumentsEndAt[0]?.DocumentId;

    const nonBibleBookMediaItemsQuery = `
      WITH FilteredMultimedia AS (
        SELECT 
            m.MultimediaId,
            m.MepsDocumentId,
            m.KeySymbol,
            m.IssueTagNumber,
            m.Track,
            m.MimeType,
            m.CategoryType,
            dm.DocumentId,
            m.FilePath,
            m.Label,
            d.Title,
            pd.Title AS ParentTitle,
            pd.SectionNumber AS ParentSection,
            d.SectionNumber,
            pd.Type AS ParentType,
            d.Type,
            lm.FilePath AS CoverPictureFilePath,
            pd.Class AS ParentClass
        FROM Multimedia m
        LEFT JOIN DocumentMultimedia dm 
            ON m.MultimediaId = dm.MultimediaId
        LEFT JOIN Multimedia lm 
            ON m.LinkMultimediaId = lm.MultimediaId
        LEFT JOIN Document d 
            ON dm.DocumentId = d.DocumentId
        LEFT JOIN InternalLink il 
            ON il.MepsDocumentId = d.MepsDocumentId
        LEFT JOIN DocumentInternalLink dil 
            ON dil.InternalLinkId = il.InternalLinkId
        LEFT JOIN Document pd 
            ON pd.DocumentId = dil.DocumentId
        WHERE 
            m.CategoryType NOT IN (9, 17)
            AND (pd.Class IS NULL OR pd.Class <> 14)
            AND (d.SectionNumber IS NULL OR d.SectionNumber <> 1)
            AND (pd.SectionNumber IS NULL OR pd.SectionNumber <> 1)
            AND (pd.Type IS NULL OR pd.Type <> 0)
            ${bibleBookDocumentsStartAtId && bibleBookDocumentsEndAtId ? `AND (d.DocumentId NOT BETWEEN ${bibleBookDocumentsStartAtId} AND ${bibleBookDocumentsEndAtId})` : ''}
      ),
      RankedMultimedia AS (
          SELECT 
              *,
              ROW_NUMBER() OVER (
                  PARTITION BY MultimediaId 
                  ORDER BY DocumentId, ParentClass DESC
              ) AS RowNum
          FROM FilteredMultimedia
      )
      SELECT *
      FROM RankedMultimedia
      WHERE RowNum = 1;
    `;

    const nonBibleBookMediaItems = executeQuery<MultimediaItem>(
      nwtStyDb,
      nonBibleBookMediaItemsQuery,
    );

    if (nwtStyDb_E && nwtStyDb_E !== nwtStyDb) {
      const englishBibleBookMediaItems = executeQuery<MultimediaItem>(
        nwtStyDb_E,
        bibleBookMediaItemsQuery,
      );

      englishBibleBookMediaItems.forEach((englishBibleBookItem) => {
        const styItem = bibleBookMediaItems.find(
          (item) =>
            englishBibleBookItem.FilePath.replace(
              '_E_',
              `_${nwtStyPublication.langwritten}_`,
            ) === item.FilePath,
        );
        if (!styItem) {
          bibleBookMediaItems.push({
            ...englishBibleBookItem,
            MepsLanguageIndex: 0,
          });
        }
      });

      const englishBibleBookDocumentsStartAt = executeQuery<DocumentItem>(
        nwtStyDb_E,
        bibleBookDocumentsStartAtQuery,
      );

      const englishBibleBookDocumentsStartAtId =
        englishBibleBookDocumentsStartAt[0]?.DocumentId;

      const englishBibleBookDocumentsEndAt = executeQuery<DocumentItem>(
        nwtStyDb_E,
        bibleBookDocumentsEndAtQuery,
      );

      const englishBibleBookDocumentsEndAtId =
        englishBibleBookDocumentsEndAt[0]?.DocumentId;

      const englishNonBibleBookMediaItems = executeQuery<MultimediaItem>(
        nwtStyDb_E,
        nonBibleBookMediaItemsQuery.replace(
          `Document.DocumentId < ${bibleBookDocumentsStartAtId} OR Document.DocumentId > ${bibleBookDocumentsEndAtId}`,
          `Document.DocumentId < ${englishBibleBookDocumentsStartAtId} OR Document.DocumentId > ${englishBibleBookDocumentsEndAtId}`,
        ),
      );

      englishNonBibleBookMediaItems.forEach((englishNonBibleBookItem) => {
        const styItem = nonBibleBookMediaItems.find(
          (item) =>
            englishNonBibleBookItem.FilePath.replace(
              '_E_',
              `_${nwtStyPublication.langwritten}_`,
            ) === item.FilePath,
        );
        if (!styItem) {
          nonBibleBookMediaItems.push({
            ...englishNonBibleBookItem,
            MepsLanguageIndex: 0,
          });
        }
      });
    }

    const allStudyBibleMediaItems = [
      ...bibleBookMediaItems,
      ...nonBibleBookMediaItems,
    ];

    return {
      bibleBookDocumentsEndAtId,
      bibleBookDocumentsStartAtId,
      mediaItems: await Promise.all(
        allStudyBibleMediaItems.map(async (item) => {
          const updatedItem = await addFullFilePathToMultimediaItem(
            item,
            item.MepsLanguageIndex === 0
              ? nwtStyPublication_E
              : nwtStyPublication,
          );
          updatedItem.VerseNumber = parseInt(
            item.VerseLabel?.match(/>(\d+)</)?.[1] || '',
            10,
          );
          return updatedItem;
        }),
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

export const getAudioBibleMedia = async (
  force = false,
  langwritten?: JwLangCode,
) => {
  try {
    const currentStateStore = useCurrentStateStore();
    const jwStore = useJwStore();

    const lang = langwritten ?? currentStateStore.currentSettings?.lang;
    if (!lang) return;

    if (!force) {
      const audioFilesList = jwStore.jwBibleAudioFiles?.[lang];
      if (audioFilesList && !shouldUpdateList(audioFilesList, 3)) {
        return audioFilesList.list;
      }
    }

    const returnedItems: Partial<Publication>[] = [];
    const publication: PublicationFetcher = {
      booknum: 0,
      fileformat: currentStateStore.currentLangObject?.isSignLanguage
        ? 'MP4'
        : 'MP3',
      issue: '',
      langwritten: '',
      pub: 'nwt',
    };
    const languages = [
      ...new Set(
        langwritten
          ? [langwritten]
          : [
              currentStateStore.currentSettings?.lang,
              currentStateStore.currentSettings?.langFallback,
            ],
      ),
    ].filter((l): l is JwLangCode => !!l);

    const backupNameNeeded: number[] = [];

    for (const booknum of Array.from({ length: 66 }, (_, i) => i + 1)) {
      for (const lang of languages) {
        publication.booknum = booknum;
        publication.langwritten = lang;
        const audioBibleMediaItems = await getPubMediaLinks(publication);
        if (!audioBibleMediaItems) {
          backupNameNeeded.push(booknum);
          returnedItems.push({ booknum });
          break;
        }
        returnedItems.push(audioBibleMediaItems);
      }
    }

    if (backupNameNeeded.length) {
      const { nwtDb, nwtStyDb } = await getStudyBible();

      if (!(nwtStyDb || nwtDb)) return;

      const bibleBooksSimpleQuery = `
        SELECT *
        FROM 
            Document
        WHERE
            Class = 1
      `;

      const bibleBookLocalNames = executeQuery<JwPlaylistItem>(
        (nwtStyDb || nwtDb) as string,
        bibleBooksSimpleQuery,
      );
      for (const booknum of backupNameNeeded) {
        const pubName = bibleBookLocalNames.find(
          (item) => item.ChapterNumber === booknum,
        )?.Title;
        returnedItems[booknum - 1] = {
          booknum,
          pubName,
        };
      }
    }
    jwStore.jwBibleAudioFiles[lang] = {
      list: returnedItems,
      updated: new Date(),
    };
    return returnedItems;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

export const getMemorialBackground = async () => {
  try {
    const currentStateStore = useCurrentStateStore();
    const year = new Date().getFullYear().toString().substring(2);
    const languages = [
      ...new Set([
        currentStateStore.currentSettings?.lang,
        currentStateStore.currentSettings?.langFallback,
      ]),
    ].filter((l): l is JwLangCode => !!l);

    for (const langwritten of languages) {
      const pub: PublicationFetcher = {
        fileformat: 'JWPUB',
        langwritten,
        pub: `mi${year}`,
      };
      const db = await getDbFromJWPUB(pub);

      if (!db) continue;

      const mediaItem = executeQuery<MultimediaItem>(
        db,
        `SELECT FilePath FROM Multimedia WHERE CategoryType = 26 LIMIT 1`,
      )?.[0];

      if (!mediaItem) continue;

      const parsedItem = await addFullFilePathToMultimediaItem(mediaItem, pub);
      return parsedItem.FilePath;
    }
  } catch (e) {
    errorCatcher(e);
  }
};

const getWtIssue = async (
  monday: Date,
  weeksInPast: number,
  langwritten?: JwLangCode,
  lastChance = false,
): Promise<{
  db: string;
  docId: number;
  issueString: string;
  publication: PublicationFetcher;
  weekNr: number;
}> => {
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
    const db = await getDbFromJWPUB(publication);
    if (!db) throw new Error('No db file found: ' + issueString);
    const datedTexts = executeQuery<DatedTextItem>(
      db,
      'SELECT * FROM DatedText',
    );
    const weekNr = datedTexts
      ? datedTexts.findIndex((weekItem) => {
          const mondayAsNumber = parseInt(formatDate(monday, 'YYYYMMDD'));
          return weekItem.FirstDateOffset === mondayAsNumber;
        })
      : -1;
    if (weekNr === -1) {
      throw new Error('No week found in following w: ' + issueString);
    }
    const docId =
      executeQuery<{ DocumentId: number }>(
        db,
        `SELECT Document.DocumentId FROM Document WHERE Document.Class=40 LIMIT 1 OFFSET ${weekNr}`,
      )[0]?.DocumentId ?? -1;
    return { db, docId, issueString, publication, weekNr };
  } catch (e) {
    if (lastChance) errorCatcher(e);
    return {
      db: '',
      docId: -1,
      issueString: '',
      publication: {
        langwritten: '',
        pub: '',
      },
      weekNr: -1,
    };
  }
};

const getParagraphNumbers = (
  paragraphLabel: number | string,
  caption: string,
) => {
  try {
    if (!paragraphLabel) return '';
    if (!caption) return paragraphLabel;

    const numbers = [...caption.matchAll(/\d+/g)].map((match) =>
      parseInt(match[0]),
    ); // Find all numbers in the line

    if (
      !numbers.length ||
      !numbers.map((n) => n.toString()).includes(paragraphLabel.toString())
    )
      return paragraphLabel;
    if (numbers.length === 1) return numbers[0];

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const max = numbers[numbers.length - 1]!; // Find the last number

    // Find the first number less than or equal to max
    const firstNumber = numbers.find((n) => n <= max);
    if (!firstNumber) return paragraphLabel;

    const regex = new RegExp(`${firstNumber}.*${max}`);
    const match = caption.match(regex);
    if (match && match[0]?.length <= 15) return match[0];

    return paragraphLabel;
  } catch (e) {
    errorCatcher(e);
    return paragraphLabel || '';
  }
};

export const dynamicMediaMapper = async (
  allMedia: MultimediaItem[],
  lookupDate: Date,
  source: 'additional' | 'dynamic' | 'playlist' | 'watched',
): Promise<MediaItem[]> => {
  const { currentSettings } = useCurrentStateStore();
  try {
    const calculatedSource = source === 'playlist' ? 'additional' : source;
    const lastParagraphOrdinal =
      allMedia[allMedia.length - 1]?.BeginParagraphOrdinal || 0;
    let middleSongParagraphOrdinal = 0;
    if (calculatedSource !== 'additional') {
      const songs = allMedia.filter((m) => isSong(m));
      middleSongParagraphOrdinal =
        isMwMeetingDay(lookupDate) && songs?.length >= 2 && songs[1]
          ? songs[1].BeginParagraphOrdinal
          : 0;
    }

    // For weekend meetings, find the song with the highest paragraph ordinal and move it to the end
    if (!isMwMeetingDay(lookupDate)) {
      const songs = allMedia.filter((m) => isSong(m));
      if (songs.length >= 2) {
        // Find the song with the highest paragraph ordinal
        const lastSong = songs.reduce((highest, current) => {
          return (current.BeginParagraphOrdinal || 0) >
            (highest.BeginParagraphOrdinal || 0)
            ? current
            : highest;
        });

        // Give it a much higher paragraph ordinal to ensure it appears at the end
        const maxParagraphOrdinal = Math.max(
          ...allMedia.map((m) => m.BeginParagraphOrdinal || 0),
        );
        lastSong.BeginParagraphOrdinal = maxParagraphOrdinal + 1000;

        console.log('🔍 [WE] Moved last song to end:', {
          newParagraphOrdinal: lastSong.BeginParagraphOrdinal,
          originalParagraphOrdinal: lastSong.BeginParagraphOrdinal - 1000,
          title: lastSong.Label || lastSong.Caption,
        });
      }
    }
    const mediaPromises = allMedia.map(async (m, index): Promise<MediaItem> => {
      m.FilePath = await convertImageIfNeeded(m.FilePath);
      const pubMediaId = (
        [m.KeySymbol, m.IssueTagNumber].filter(Boolean).length
          ? [m.KeySymbol, m.IssueTagNumber]
          : [m.MepsDocumentId]
      )
        .concat([
          (m.MepsLanguageIndex !== undefined &&
            getJwLangCode(m.MepsLanguageIndex)) ||
            '',
          m.Track,
        ])
        .filter(Boolean)
        .join('_');
      const fileUrl = isLikelyFile(m.FilePath)
        ? pathToFileURL(m.FilePath)
        : pubMediaId;
      const mediaIsSong = isSong(m);
      const thumbnailUrl =
        m.ThumbnailUrl ??
        pathToFileURL(m.LinkedPreviewFilePath || '') ??
        (await getThumbnailUrl(m.ThumbnailFilePath || m.FilePath));
      const video = isVideo(m.FilePath);
      const audio = isAudio(m.FilePath);
      let duration = 0;
      if (video || audio) {
        if (m.Duration) {
          duration = m.Duration;
        } else if (await exists(m.FilePath)) {
          duration =
            (await getMetadataFromMediaPath(m.FilePath))?.format.duration || 0;
        }
        if (duration === 0 && m.KeySymbol) {
          const lang = currentSettings?.lang || currentSettings?.langFallback;
          if (lang) {
            duration =
              (
                await getJwMediaInfo({
                  langwritten: lang,
                  pub: m.KeySymbol,
                  ...(m.Track && { track: m.Track }),
                  ...(m.IssueTagNumber && { issue: m.IssueTagNumber }),
                  fileformat: video ? 'MP4' : 'MP3',
                })
              )?.duration || 0;
          }
        }
      }
      const customDuration =
        m.EndTime || m.StartTime
          ? {
              max: m.EndTime ?? duration,
              min: m.StartTime ?? 0,
            }
          : undefined;

      const tagType = mediaIsSong
        ? 'song'
        : getParagraphNumbers(m.TargetParagraphNumberLabel, m.Caption)
          ? 'paragraph'
          : undefined;

      const tagValue =
        tagType === 'song' && mediaIsSong
          ? mediaIsSong
          : tagType === 'paragraph'
            ? getParagraphNumbers(m.TargetParagraphNumberLabel, m.Caption)
            : undefined;

      const tag = tagType ? { type: tagType, value: tagValue } : undefined;

      const datePart = formatDate(lookupDate, 'YYYYMMDD');
      const durationPart =
        calculatedSource === 'additional' &&
        (customDuration?.min || customDuration?.max)
          ? `${customDuration.min ?? ''}_${customDuration.max ?? ''}-`
          : '';
      const idRaw = `${datePart}-${durationPart}${fileUrl}`;
      const uniqueId = sanitizeId(idRaw);

      let section: MediaSectionIdentifier =
        calculatedSource === 'additional' ? 'imported-media' : 'wt';

      if (isMwMeetingDay(lookupDate)) {
        if (middleSongParagraphOrdinal > 0) {
          // this is a meeting with 3 songs
          if (m.BeginParagraphOrdinal >= middleSongParagraphOrdinal) {
            // LAC
            section = 'lac';
          } else if (m.BeginParagraphOrdinal >= 18) {
            // AYFM
            section = 'ayfm';
          } else {
            // TGW
            section = 'tgw';
          }
        }
      }

      return {
        cbs:
          isMwMeetingDay(lookupDate) &&
          m.BeginParagraphOrdinal >= lastParagraphOrdinal - 2 &&
          m.BeginParagraphOrdinal < lastParagraphOrdinal,
        customDuration,
        duration,
        extractCaption: m.ExtractCaption,
        fileUrl,
        isAudio: audio,
        isImage: isImage(m.FilePath),
        isVideo: video,
        markers: m.VideoMarkers,
        mwSection: section,
        pubMediaId,
        repeat: !!m.Repeat,
        sortOrderOriginal: m.BeginParagraphOrdinal || index, // Use paragraph ordinal for proper ordering
        source: calculatedSource,
        streamUrl: m.StreamUrl,
        subtitlesUrl: video ? await getSubtitlesUrl(m, duration) : '',
        tag,
        thumbnailUrl,
        title: mediaIsSong
          ? m.Label.replace(/^\d+\.\s*/, '')
          : m.Label || m.Caption,
        type: 'media',
        uniqueId,
      };
    });
    const allMediaPromises = await Promise.all(mediaPromises);

    if (isCoWeek(lookupDate)) {
      // Hide the last song for both MW and WE meetings during the CO visit
      const lastSong = allMediaPromises.at(-1);
      if (lastSong) lastSong.hidden = true;

      // Hide CBS media
      allMediaPromises.forEach((m) => {
        if (m.cbs) m.hidden = true;
      });
    }

    // Group mediaPromises by extractCaption
    const groupedMediaPromises: MediaItem[] = Object.values(
      allMediaPromises.reduce<Record<string, MediaItem>>((acc, media) => {
        if (!media.extractCaption) {
          // If there's no extractCaption, keep the item as is
          acc[media.uniqueId] = acc[media.uniqueId] || media;
        } else {
          // If a group for this extractCaption doesn't exist, create it
          if (!acc[media.extractCaption]) {
            acc[media.extractCaption] = {
              cbs: media.cbs,
              children: [],
              extractCaption: media.extractCaption,
              sortOrderOriginal: media.sortOrderOriginal,
              source: media.source,
              title: media.extractCaption,
              type: 'media',
              uniqueId: `group-${media.extractCaption}`, // Unique ID for the group
            };
          }
          if (!acc[media.extractCaption]?.children)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            acc[media.extractCaption]!.children = [];
          // Add the media item as a child
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          acc[media.extractCaption]!.children!.push(media);
        }
        return acc;
      }, {}),
    );
    return groupedMediaPromises;
  } catch (e) {
    errorCatcher(e);
    return [];
  }
};

export const watchedItemMapper: (
  parentDate: string,
  watchedItemPath: string,
) => Promise<MediaItem[] | undefined> = async (parentDate, watchedItemPath) => {
  try {
    const currentStateStore = useCurrentStateStore();
    if (!parentDate || !watchedItemPath) return undefined;

    const dateString = parentDate.replace(/-/g, '');

    const fileUrl = pathToFileURL(watchedItemPath);

    const video = isVideo(watchedItemPath);
    const audio = isAudio(watchedItemPath);
    const image = isImage(watchedItemPath);

    if (!(video || audio || image)) {
      if (isJwPlaylist(watchedItemPath)) {
        const additionalMedia: MediaItem[] = (
          await getMediaFromJwPlaylist(
            watchedItemPath,
            dateFromString(parentDate),
            await currentStateStore.getDatedAdditionalMediaDirectory(
              dateString,
            ),
          )
        ).map((m) => ({ ...m, source: 'watched' }));
        additionalMedia.filter(
          (m) =>
            m.customDuration && (m.customDuration.max || m.customDuration.min),
        );
        return additionalMedia;
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

    return [
      {
        duration,
        fileUrl,
        isAudio: audio,
        isImage: image,
        isVideo: video,
        sortOrderOriginal: 'watched',
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

export const getWeMedia = async (lookupDate: Date) => {
  console.log('Getting weekend meeting media for date:', lookupDate);
  try {
    const currentStateStore = useCurrentStateStore();
    lookupDate = dateFromString(lookupDate);
    const monday = getSpecificWeekday(lookupDate, 0);

    const getIssueWithFallback = async (
      monday: Date,
    ): Promise<{
      db: string;
      docId: number;
      issueString: string;
      publication: PublicationFetcher;
      weekNr: number;
    }> => {
      const weeksToTry = [6, 8, 10, 12];
      const primaryLang = currentStateStore.currentSettings?.lang;
      const fallbackLang = currentStateStore.currentSettings?.langFallback;

      // First try primary language for all week offsets
      if (primaryLang) {
        for (const weeks of weeksToTry) {
          const result = await getWtIssue(monday, weeks, primaryLang);
          if (result.db?.length > 0) {
            return result;
          }
        }
      }

      // If no match with primary language, try fallback language
      if (fallbackLang) {
        for (const weeks of weeksToTry) {
          const result = await getWtIssue(monday, weeks, fallbackLang, true);
          if (result.db?.length > 0) {
            return result;
          }
        }
      }

      // Return empty result if nothing found
      return {
        db: '',
        docId: -1,
        issueString: '',
        publication: {
          langwritten: '',
          pub: '',
        },
        weekNr: -1,
      };
    };

    const { db, docId, issueString, publication } =
      await getIssueWithFallback(monday);

    if (!db || docId < 0) {
      return {
        error: true,
        media: {} as Record<string, MediaItem[]>,
      };
    }
    const videos = executeQuery<MultimediaItem>(
      db,
      `SELECT *
         FROM DocumentMultimedia
         INNER JOIN Multimedia
           ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId
         INNER JOIN DocumentParagraph
           ON DocumentMultimedia.BeginParagraphOrdinal = DocumentParagraph.ParagraphIndex
         LEFT JOIN Question
           ON Question.DocumentId = DocumentMultimedia.DocumentId
           AND Question.TargetParagraphOrdinal = DocumentMultimedia.BeginParagraphOrdinal
         WHERE DocumentMultimedia.DocumentId = ${docId}
           AND CategoryType = -1
         GROUP BY DocumentMultimedia.MultimediaId
         ORDER BY DocumentParagraph.BeginPosition`,
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
    for (let i = 0; i < mediaWithoutVideos.length; i++) {
      mediaWithoutVideos[i] = await addFullFilePathToMultimediaItem(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        mediaWithoutVideos[i]!,
        publication,
      );
    }

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
    let final = [];
    if (withBegin.length === 0) {
      final.push(...withoutBegin);
    } else {
      const lastIndex = withBegin.length - 1;
      final.push(...withBegin.slice(0, lastIndex));
      final.push(...withoutBegin);
      final.push(withBegin[lastIndex]);
    }

    final = final
      .map((mediaObj) =>
        mediaObj?.TargetParagraphNumberLabel === null &&
        mediaObj?.BeginPosition === null
          ? { ...mediaObj, TargetParagraphNumberLabel: FOOTNOTE_TAR_PAR }
          : mediaObj,
      )
      .filter((v) => {
        return (
          !currentStateStore.currentSettings?.excludeFootnotes ||
          (v?.TargetParagraphNumberLabel &&
            v.TargetParagraphNumberLabel < FOOTNOTE_TAR_PAR)
        );
      })
      .filter((item) => !!item);

    const updatedMedia = final.map((item) => {
      if (item.MultimediaId !== null && item.LinkMultimediaId !== null) {
        const linkedItem = final.find(
          (i) => i.MultimediaId === item.LinkMultimediaId,
        );
        if (linkedItem && linkedItem.FilePath) {
          item.FilePath = linkedItem.FilePath;
          item.LinkMultimediaId = null;
          linkedItem.LinkMultimediaId = linkedItem.MultimediaId;
        }
      }
      return item;
    });

    const finalMedia = updatedMedia.filter(
      (item) => item.LinkMultimediaId === null,
    );

    let songs: MultimediaItem[] = [];

    // Watchtowers before Feb 2023 don't include songs in DocumentMultimedia
    if (+issueString < FEB_2023) {
      songs = executeQuery<MultimediaItem>(
        db,
        `SELECT *
            FROM Multimedia
            INNER JOIN DocumentMultimedia
              ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId
            WHERE DataType = 2
            AND DocumentId = ${docId}
            ORDER BY BeginParagraphOrdinal
            LIMIT 2`,
      );
    } else {
      songs = videosNotInParagraphs
        .filter((item) => item.BeginPosition)
        .slice(0, 2); // after FEB_2023, the first two videos from DocumentMultimedia are the songs
    }

    let songLangs: ('' | JwLangCode)[] = [];
    try {
      songLangs = window.electronApi
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
        .sort((a, b) => a.BeginParagraphOrdinal - b.BeginParagraphOrdinal)
        .map((item) => {
          const match = item.Link.match(/\/(.*)\//);
          const langOverride = match
            ? (match[1]?.split(':')[0] as JwLangCode)
            : '';
          return langOverride === currentStateStore.currentSettings?.lang
            ? ''
            : langOverride;
        });
    } catch (e: unknown) {
      errorCatcher(e);
      songLangs = songs.map(
        () => currentStateStore.currentSettings?.lang || 'E',
      );
    }

    const mergedSongs: MultimediaItem[] = songs
      .map((song, index) => ({
        ...song,
        ...(songLangs[index] ? { AlternativeLanguage: songLangs[index] } : {}),
      }))
      .sort(
        (a, b) =>
          (a.BeginParagraphOrdinal ?? 0) - (b.BeginParagraphOrdinal ?? 0),
      );

    const allMedia = finalMedia;
    if (mergedSongs[0]) {
      const index0 = allMedia.findIndex(
        (item) =>
          item.Track === mergedSongs[0]?.Track &&
          item.KeySymbol === mergedSongs[0]?.KeySymbol,
      );

      if (index0 !== -1) {
        allMedia[index0] = mergedSongs[0];
      } else {
        allMedia.unshift(mergedSongs[0]);
      }

      if (mergedSongs[1]) {
        const index1 = allMedia.findIndex(
          (item) =>
            item.Track === mergedSongs[1]?.Track &&
            item.KeySymbol === mergedSongs[1]?.KeySymbol,
        );

        if (index1 !== -1) {
          allMedia[index1] = mergedSongs[1];
        } else {
          allMedia.push(mergedSongs[1]);
        }
      }
    }

    const multimediaMepsLangs = getMultimediaMepsLangs({ db, docId });
    for (const media of allMedia) {
      const mediaKeySymbol =
        media.KeySymbol === 'sjjm'
          ? currentStateStore.currentSongbook?.pub
          : media.KeySymbol;
      const multimediaMepsLangItem = multimediaMepsLangs.find(
        (item) =>
          item.KeySymbol === mediaKeySymbol &&
          item.Track === media.Track &&
          item.IssueTagNumber === media.IssueTagNumber,
      );
      if (multimediaMepsLangItem?.MepsLanguageIndex !== undefined) {
        const mepsLang = getJwLangCode(
          multimediaMepsLangItem.MepsLanguageIndex,
        );
        if (mepsLang) {
          media.AlternativeLanguage = mepsLang;
        }
      }
      const videoMarkers = getMediaVideoMarkers(
        { db, docId },
        media.MultimediaId,
      );
      if (videoMarkers) media.VideoMarkers = videoMarkers;
    }
    await processMissingMediaInfo(allMedia);
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
    errorCatcher(e);
    console.error(e);
    return {
      error: true,
      media: {} as Record<string, MediaItem[]>,
    };
  }
};

export const getMwMedia = async (lookupDate: Date) => {
  console.log('Getting midweek meeting media for date:', lookupDate);
  try {
    const currentStateStore = useCurrentStateStore();
    lookupDate = dateFromString(lookupDate);
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
    const getMwbIssue = async (langwritten?: JwLangCode) => {
      if (!langwritten) return '';
      publication.issue = issueString;
      publication.langwritten = langwritten;
      publication.pub = 'mwb';
      return await getDbFromJWPUB(publication);
    };

    let db = await getMwbIssue(currentStateStore.currentSettings?.lang);
    if (!db && currentStateStore.currentSettings?.langFallback) {
      db = await getMwbIssue(currentStateStore.currentSettings?.langFallback);
    }

    if (!db) return { error: true, media: {} as Record<string, MediaItem[]> };

    const docId =
      executeQuery<{ DocumentId: number }>(
        db,
        `SELECT DocumentId FROM DatedText WHERE FirstDateOffset = ${formatDate(
          monday,
          'YYYYMMDD',
        )}`,
      )[0]?.DocumentId ?? -1;

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
    for (let i = 0; i < mms.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const multimediaItem = mms[i]!;
      const videoMarkers = getMediaVideoMarkers(
        { db, docId },
        multimediaItem.MultimediaId,
      );
      if (videoMarkers) multimediaItem.VideoMarkers = videoMarkers;
      mms[i] = await addFullFilePathToMultimediaItem(
        multimediaItem,
        publication,
      );
    }

    // To think about: Enabling InternalLink lookups: is this needed?
    // const internalLinkMedia = getInternalLinkItems({ db, docId }).map(
    //   (multimediaItem) => {
    //     const videoMarkers = getMediaVideoMarkers(
    //       { db, docId } as MultimediaItemsFetcher,
    //       multimediaItem.MultimediaId,
    //     );
    //     if (videoMarkers) multimediaItem.VideoMarkers = videoMarkers;
    //     return addFullFilePathToMultimediaItem(multimediaItem, publication);
    //   },
    // );

    const extracts = await getDocumentExtractItems(db, docId);

    const allMedia: MultimediaItem[] = mms
      .concat(extracts)
      .sort((a, b) => a.BeginParagraphOrdinal - b.BeginParagraphOrdinal);

    const multimediaMepsLangs = getMultimediaMepsLangs({ db, docId });
    for (const media of allMedia) {
      const mediaKeySymbol =
        media.KeySymbol === 'sjjm'
          ? currentStateStore.currentSongbook?.pub
          : media.KeySymbol;
      const multimediaMepsLangItem = multimediaMepsLangs.find(
        (item) =>
          item.KeySymbol === mediaKeySymbol &&
          item.Track === media.Track &&
          item.IssueTagNumber === media.IssueTagNumber,
      );
      if (multimediaMepsLangItem?.MepsLanguageIndex) {
        const mepsLang = getJwLangCode(
          multimediaMepsLangItem.MepsLanguageIndex,
        );
        if (mepsLang) media.AlternativeLanguage = mepsLang;
      }
    }
    const errors = (await processMissingMediaInfo(allMedia)) || [];
    const mediaForDay = await dynamicMediaMapper(
      allMedia,
      lookupDate,
      'dynamic',
    );

    // Group media items by their mwSection property
    const groupedMedia: Record<string, MediaItem[]> = {};
    mediaForDay.forEach((mediaItem) => {
      const section = mediaItem.mwSection || 'tgw'; // Default to 'tgw' if no section assigned
      if (!groupedMedia[section]) {
        groupedMedia[section] = [];
      }
      groupedMedia[section].push(mediaItem);
    });

    return {
      error: errors.length > 0,
      media: groupedMedia,
    };
  } catch (e) {
    errorCatcher(e);
    return { error: true, media: {} as Record<string, MediaItem[]> };
  }
};

export async function processMissingMediaInfo(
  allMedia: MultimediaItem[],
  keepMediaLabels = false,
) {
  try {
    const currentStateStore = useCurrentStateStore();
    const errors = [];

    const mediaExistenceChecks = allMedia.map(async (m) => {
      if (m.KeySymbol || m.MepsDocumentId) {
        const exists =
          !!m.StreamUrl || (!!m.FilePath && (await pathExists(m.FilePath)));
        return { exists, media: m };
      }
      return null;
    });

    const mediaChecksResults = await Promise.all(mediaExistenceChecks);

    const mediaToProcess = mediaChecksResults.filter(
      (result): result is { exists: false; media: MultimediaItem } =>
        !!result && !result.exists,
    );

    for (const { media } of mediaToProcess) {
      const langsWritten = [
        ...new Set([
          /* eslint-disable perfectionist/sort-sets */
          currentStateStore.currentSettings?.langFallback &&
            currentStateStore.currentSettings?.lang,
          media.MepsLanguageIndex !== undefined &&
            mepslangs[media.MepsLanguageIndex],
          media.AlternativeLanguage,
          !currentStateStore.currentSettings?.langFallback &&
            currentStateStore.currentSettings?.lang,
          currentStateStore.currentSettings?.langFallback,
          /* eslint-enable perfectionist/sort-sets */
        ]),
      ];
      for (const langwritten of langsWritten) {
        if (!langwritten || !(media.KeySymbol || media.MepsDocumentId)) {
          continue;
        }

        const publicationFetcher: PublicationFetcher = {
          docid: media.MepsDocumentId,
          fileformat: media.MimeType?.includes('audio') ? 'MP3' : 'MP4',
          issue: media.IssueTagNumber,
          langwritten,
          pub: media.KeySymbol,
          ...(typeof media.Track === 'number' &&
            media.Track > 0 && { track: media.Track }),
        };

        if (media.KeySymbol === 'nwt') {
          const pubs = await getAudioBibleMedia(false, langwritten);
          const bookMedia: MediaLink[] =
            Object.values(
              pubs?.find((p) => p.booknum === media.BookNumber)?.files?.[
                langwritten
              ] ?? {},
            )[0] ?? [];
          const chapterMedia = bookMedia.filter(
            (m) => m.track === media.ChapterNumber && !!m.markers,
          );

          let min = 0;
          let max = 0;
          const verses = media.VerseNumbers?.sort((a, b) => a - b);

          if (verses) {
            min = timeToSeconds(
              chapterMedia.map((item) =>
                item.markers.markers.find(
                  (marker) => marker.verseNumber === verses[0],
                ),
              )?.[0]?.startTime || '0',
            );

            const endVerse = chapterMedia.map((item) =>
              item.markers.markers.find(
                (marker) => marker.verseNumber === verses[verses.length - 1],
              ),
            )?.[0];

            max = endVerse
              ? timeToSeconds(endVerse.startTime) +
                timeToSeconds(endVerse.duration)
              : 0;
          }

          const uniqueId = await downloadAdditionalRemoteVideo(
            chapterMedia,
            media.ThumbnailFilePath,
            false,
            media.Label,
            undefined,
            { max, min },
          );

          if (!uniqueId) {
            errors.push(publicationFetcher);
            continue;
          }
        } else {
          try {
            if (!media.FilePath || !(await pathExists(media.FilePath))) {
              const {
                FilePath,
                Label,
                StreamDuration,
                StreamThumbnailUrl,
                StreamUrl,
              } = await downloadMissingMedia(publicationFetcher);
              media.FilePath = FilePath ?? media.FilePath;
              media.Label = keepMediaLabels
                ? media.Label || Label || ''
                : Label || media.Label;
              media.StreamUrl = StreamUrl ?? media.StreamUrl;
              media.Duration = StreamDuration ?? media.Duration;
              media.ThumbnailUrl = StreamThumbnailUrl ?? media.ThumbnailUrl;
            }
            if (!media.FilePath && !media.StreamUrl) {
              errors.push(publicationFetcher);
              continue;
            }
            if (!media.Label) {
              media.Label =
                media.Label ||
                media.Caption ||
                (await getJwMediaInfo(publicationFetcher)).title ||
                '';
            }
          } catch (e) {
            errors.push(publicationFetcher);
            errorCatcher(e);
          }
        }
      }
    }
    return errors;
  } catch (e) {
    errorCatcher(e);
  }
}

export const getPubMediaLinks = async (publication: PublicationFetcher) => {
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

    if (!response) {
      const downloadId = getPubId(publication, true);
      currentStateStore.downloadProgress[downloadId] = {
        error: true,
        filename: downloadId,
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
    await decompress(file.FilePath, dir);
    const msixbundle = await findFile(dir, '.msixbundle');
    if (!msixbundle) return;
    await decompress(msixbundle, dir);
    const msix = await findFile(dir, '_x64.msix');
    if (!msix) return;
    await decompress(msix, dir);
    const mepsunit = await findFile(join(dir, 'Data'), '.db');
    if (!mepsunit) return;
    const mepsLangs = window.electronApi
      .executeQuery<JwMepsLanguage>(mepsunit, 'SELECT * FROM Language')
      .map((l) => ({
        ...l,
        PrimaryIetfCode: l.PrimaryIetfCode.toLowerCase() as JwLangSymbol,
      }));
    if (mepsLangs.length < jwStore.jwMepsLanguages.list.length) return;
    jwStore.jwMepsLanguages = {
      list: mepsLangs,
      updated: new Date(),
    };
  } catch (e) {
    errorCatcher(e);
  }
};

const downloadMissingMedia = async (publication: PublicationFetcher) => {
  try {
    const pubDir = await getPublicationDirectory(
      publication,
      useCurrentStateStore().currentSettings?.cacheFolder,
    );
    const responseObject = await getPubMediaLinks(publication);
    if (!responseObject?.files) {
      if (!(await pathExists(pubDir))) return { FilePath: '' };
      const files: string[] = [];
      const items = (await readdir(pubDir)).filter((item) => item.isFile);
      for (const item of items) {
        const filePath = join(pubDir, item.name);
        const fileExtension = extname(filePath).toLowerCase();

        let match = true;
        const params = [
          publication.issue,
          publication.track,
          publication.pub,
          publication.docid,
        ]
          .filter((i) => i !== undefined && i !== null)
          .map((i) => i.toString());

        for (const test of params) {
          if (!item.name || !basename(item.name).includes(test)) {
            match = false;
            break;
          }
        }
        if (
          match &&
          publication.fileformat &&
          !fileExtension.includes(publication.fileformat.toLowerCase())
        ) {
          match = false;
        }

        if (match) {
          files.push(filePath);
        }
      }
      return files.length > 0 ? { FilePath: files[0] } : { FilePath: '' };
    }
    if (!responseObject) return { FilePath: '' };
    if (!publication.fileformat && publication.langwritten) {
      publication.fileformat = Object.keys(
        responseObject.files[publication.langwritten] || {},
      )[0] as keyof PublicationFiles;
    }
    const mediaItemLinks =
      publication.langwritten && publication.fileformat
        ? responseObject.files[publication.langwritten]?.[
            publication.fileformat
          ] || []
        : [];
    const bestItem = findBestResolution(
      mediaItemLinks,
      useCurrentStateStore().currentSettings?.maxRes,
    );
    if (!isMediaLink(bestItem) || !bestItem?.file?.url) {
      return { FilePath: '' };
    }
    const jwMediaInfo = await getJwMediaInfo(publication);
    const downloadedFile = await downloadFileIfNeeded({
      dir: pubDir,
      size: bestItem.filesize,
      url: bestItem.file.url,
    });
    const currentStateStore = useCurrentStateStore();
    for (const itemUrl of [
      currentStateStore.currentSettings?.enableSubtitles
        ? jwMediaInfo.subtitles
        : undefined,
      jwMediaInfo.thumbnail,
    ].filter((u): u is string => !!u)) {
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
          url: itemUrl,
        });
      }
    }
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

export const downloadAdditionalRemoteVideo = async (
  mediaItemLinks: MediaItemsMediatorFile[] | MediaLink[],
  thumbnailUrl?: string,
  song: false | number | string = false,
  title?: string,
  section?: MediaSectionIdentifier,
  customDuration?: { max: number; min: number },
): Promise<string | undefined> => {
  try {
    const currentStateStore = useCurrentStateStore();
    const bestItem = findBestResolution(
      mediaItemLinks,
      currentStateStore.currentSettings?.maxRes,
    );
    if (!bestItem) return undefined;
    const bestItemUrl =
      'progressiveDownloadURL' in bestItem
        ? bestItem.progressiveDownloadURL
        : bestItem.file.url;

    const uniqueId = await addToAdditionMediaMapFromPath(
      join(
        await currentStateStore.getDatedAdditionalMediaDirectory(),
        basename(bestItemUrl),
      ),
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

    downloadFileIfNeeded({
      dir: await currentStateStore.getDatedAdditionalMediaDirectory(),
      size: bestItem.filesize,
      url: bestItemUrl,
    });

    return uniqueId;
  } catch (e) {
    errorCatcher(e);
    return undefined;
  }
};

export function getBestImageUrl(
  images: ImageTypeSizes,
  minSize?: keyof ImageSizes,
  square = false,
) {
  try {
    const preferredOrder: (keyof ImageTypeSizes)[] = [
      'wss',
      'lsr',
      'sqr',
      'pnr',
    ];
    if (square) {
      const sqrIndex = preferredOrder.indexOf('sqr');
      if (sqrIndex !== -1) {
        preferredOrder.splice(sqrIndex, 1);
        preferredOrder.unshift('sqr');
      }
    }
    const sizeOrder: (keyof ImageSizes)[] = ['sm', 'md', 'lg', 'xl'];
    const startIndex = minSize ? sizeOrder.indexOf(minSize) : 0;
    const sizesToConsider = sizeOrder.slice(startIndex);
    for (const key of preferredOrder) {
      if (images[key] !== undefined) {
        for (const size of sizesToConsider) {
          if (size in images[key]) return images[key][size];
        }
        // If none of the preferred sizes are found, return any other size
        const otherSizes = (
          Object.keys(images[key]) as (keyof ImageSizes)[]
        ).filter((size) => !sizesToConsider.includes(size));
        if (otherSizes[0]) {
          return images[key][otherSizes[0]];
        }
      }
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
    const publicationInfo = await getPubMediaLinks(publication);
    if (!publication.fileformat) return;
    if (!publicationInfo?.files) {
      const downloadId = getPubId(publication, true);
      currentStateStore.downloadProgress[downloadId] = {
        error: true,
        filename: downloadId,
      };
      return;
    }
    const mediaLinks = (
      publication.langwritten
        ? publicationInfo.files[publication.langwritten]?.[
            publication.fileformat
          ] || []
        : []
    )
      .filter(isMediaLink)
      .filter(
        (mediaLink) =>
          !publication.maxTrack || mediaLink.track < publication.maxTrack,
      );

    const dir = await getPublicationDirectory(
      publication,
      currentStateStore.currentSettings?.cacheFolder,
    );
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
    for (const mediaLink of filteredMediaItemLinks) {
      if (
        !path
          ?.extname(mediaLink?.file?.url)
          ?.includes(publication?.fileformat?.toLowerCase())
      ) {
        // This file is not of the right format; API glitch!
        continue;
      }
      downloadFileIfNeeded({
        dir,
        lowPriority: true,
        size: mediaLink.filesize,
        url: mediaLink.file.url,
      });
    }
  } catch (e) {
    errorCatcher(e);
  }
};

export const downloadBackgroundMusic = () => {
  try {
    const currentStateStore = useCurrentStateStore();
    if (
      !currentStateStore.currentSongbook ||
      !currentStateStore.currentSettings?.lang ||
      !currentStateStore.currentSettings?.enableMusicButton
    )
      return;
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
): Promise<DownloadedFile> => {
  try {
    const currentStateStore = useCurrentStateStore();
    publication.fileformat = 'JWPUB';
    const handleDownloadError = () => {
      const downloadId = getPubId(publication, true);
      currentStateStore.downloadProgress[downloadId] = {
        error: true,
        filename: downloadId,
      };
      return {
        new: false,
        path: '',
      };
    };
    const publicationInfo = await getPubMediaLinks(publication);
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
        .filter(isMediaLink)
        .filter(
          (mediaLink) =>
            !publication.maxTrack || mediaLink.track < publication.maxTrack,
        ) || [];
    if (!mediaLinks.length) {
      return handleDownloadError();
    }

    return await downloadFileIfNeeded({
      dir: await getPublicationDirectory(
        publication,
        currentStateStore.currentSettings?.cacheFolder,
      ),
      size: mediaLinks[0]?.filesize,
      url: mediaLinks[0]?.file.url ?? '',
    });
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
    const homePageUrl = 'https://www.' + baseUrl + '/en';

    requestControllers
      .filter((c) => !c.signal.aborted)
      .forEach((c) => c.abort());
    const controller = new AbortController();
    // delete all items in the array
    requestControllers.splice(0);
    requestControllers.push(controller);
    const homePage = await fetchRaw(homePageUrl, {
      signal: controller.signal,
    })
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

    const attributes = { ...(div?.[0]?.attribs || {}) };

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
