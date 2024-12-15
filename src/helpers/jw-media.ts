import type {
  DatedTextItem,
  DocumentItem,
  DownloadedFile,
  DynamicMediaObject,
  FileDownloader,
  ImageSizes,
  ImageTypeSizes,
  JwLangCode,
  JwPlaylistItem,
  MediaItemsMediator,
  MediaItemsMediatorFile,
  MediaLink,
  MediaSection,
  MultimediaExtractItem,
  MultimediaItem,
  Publication,
  PublicationFetcher,
  PublicationFiles,
} from 'src/types';

import { queues } from 'src/boot/globals';
import { FEB_2023, FOOTNOTE_TAR_PAR, MAX_SONGS } from 'src/constants/jw';
import mepslangs from 'src/constants/mepslangs';
import { isCoWeek, isMwMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { addDayToExportQueue, exportAllDays } from 'src/helpers/export-media';
import { getSubtitlesUrl, getThumbnailUrl } from 'src/helpers/fs';
import {
  decompressJwpub,
  getMediaFromJwPlaylist,
} from 'src/helpers/mediaPlayback';
import { useCurrentStateStore } from 'src/stores/current-state';
import { shouldUpdateList, useJwStore } from 'src/stores/jw';
import { fetchJson, fetchPubMediaLinks, fetchRaw } from 'src/utils/api';
import { convertImageIfNeeded } from 'src/utils/converters';
import {
  dateFromString,
  formatDate,
  getSpecificWeekday,
  subtractFromDate,
} from 'src/utils/date';
import { getPublicationDirectory, trimFilepathAsNeeded } from 'src/utils/fs';
import { sanitizeId } from 'src/utils/general';
import { findBestResolution, getPubId, isMediaLink } from 'src/utils/jw';
import {
  getMetadataFromMediaPath,
  isAudio,
  isImage,
  isJwPlaylist,
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

const { executeQuery, fileUrlToPath, fs, path, pathToFileURL, readdir } =
  window.electronApi;

export const copyToDatedAdditionalMedia = async (
  filepathToCopy: string,
  section: MediaSection | undefined,
  addToAdditionMediaMap?: boolean,
) => {
  const currentStateStore = useCurrentStateStore();
  const jwStore = useJwStore();
  const datedAdditionalMediaDir =
    await currentStateStore.getDatedAdditionalMediaDirectory();

  try {
    if (!filepathToCopy || !(await fs.exists(filepathToCopy))) return '';
    let datedAdditionalMediaPath = path.join(
      datedAdditionalMediaDir,
      path.basename(filepathToCopy),
    );
    datedAdditionalMediaPath = trimFilepathAsNeeded(datedAdditionalMediaPath);
    const uniqueId = sanitizeId(
      formatDate(currentStateStore.selectedDate, 'YYYYMMDD') +
        '-' +
        pathToFileURL(datedAdditionalMediaPath),
    );
    if (await fs.exists(datedAdditionalMediaPath)) {
      if (filepathToCopy !== datedAdditionalMediaPath) {
        await fs.remove(datedAdditionalMediaPath);
        jwStore.removeFromAdditionMediaMap(uniqueId);
      }
    }
    if (filepathToCopy !== datedAdditionalMediaPath) {
      await fs.copy(filepathToCopy, datedAdditionalMediaPath);
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
  section: MediaSection = 'additional',
  uniqueId?: string,
  additionalInfo?: {
    duration?: number;
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
        .replace(path.extname(additionalFilePath), '');

    if (!uniqueId) {
      uniqueId = sanitizeId(
        formatDate(currentStateStore.selectedDate, 'YYYYMMDD') +
          '-' +
          pathToFileURL(additionalFilePath),
      );
    }
    jwStore.addToAdditionMediaMap(
      [
        {
          customDuration,
          duration,
          fileUrl: pathToFileURL(additionalFilePath),
          isAdditional: true,
          isAudio: audio,
          isImage: isImage(additionalFilePath),
          isVideo: video,
          section,
          sectionOriginal: section,
          streamUrl: additionalInfo?.url,
          tag: {
            type: additionalInfo?.song ? 'song' : undefined,
            value: additionalInfo?.song ?? undefined,
          },
          thumbnailUrl:
            additionalInfo?.thumbnailUrl ??
            (await getThumbnailUrl(additionalFilePath, true)),
          title,
          uniqueId,
        },
      ],
      section,
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
  section: MediaSection | undefined,
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
    const dynamicMediaItems = currentStateStore.selectedDateObject
      ? await dynamicMediaMapper(
          multimediaItems,
          currentStateStore.selectedDateObject?.date,
          true,
          section,
        )
      : [];
    addToAdditionMediaMap(dynamicMediaItems, section);
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
  await fs.ensureDir(dir);
  if (!filename) filename = path.basename(url);
  const { default: sanitize } = await import('sanitize-filename');
  filename = sanitize(filename);
  const destinationPath = path.join(dir, filename);
  const remoteSize: number =
    size ||
    (await fetchRaw(url, { method: 'HEAD' })
      .then((response) => {
        return +(response?.headers?.get('content-length') || 0);
      })
      .catch(() => 0));
  if (await fs.exists(destinationPath)) {
    const stat = await fs.stat(destinationPath);
    const localSize = stat.size;
    if (localSize === remoteSize) {
      return {
        new: false,
        path: destinationPath,
      };
    }
  }
  const downloadId = await window.electronApi.downloadFile(
    url,
    dir,
    filename,
    lowPriority,
  );

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

export const mapOrder =
  (sortOrder: string | string[] | undefined) =>
  (a: DynamicMediaObject, b: DynamicMediaObject) => {
    try {
      const key = 'uniqueId';
      if (!sortOrder || sortOrder.length === 0) return 0;
      return sortOrder.indexOf(a[key]) > sortOrder.indexOf(b[key]) ? 1 : -1;
    } catch (e) {
      errorCatcher(e);
      return 0;
    }
  };

export const fetchMedia = async () => {
  try {
    const currentStateStore = useCurrentStateStore();
    if (
      !currentStateStore.currentCongregation ||
      !!currentStateStore.currentSettings?.disableMediaFetching
    ) {
      return;
    }

    const jwStore = useJwStore();

    if (!jwStore.urlVariables.base || !jwStore.urlVariables.mediator) {
      return;
    }

    const meetingsToFetch = (
      await Promise.all(
        jwStore.lookupPeriod[currentStateStore.currentCongregation]?.map(
          async (day) => {
            const hasIncompleteOrErrorMeeting =
              day.meeting && (!day.complete || day.error);

            const hasMissingMediaFile = await Promise.all(
              day.dynamicMedia.map(async (media) => {
                if (!media?.fileUrl) return true;
                const fileExists = await fs.pathExists(
                  fileUrlToPath(media.fileUrl),
                );
                return !fileExists;
              }),
            );

            return hasIncompleteOrErrorMeeting ||
              hasMissingMediaFile.includes(true)
              ? day
              : null;
          },
        ) || [],
      )
    ).filter((day) => !!day);

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
    for (const day of meetingsToFetch) {
      try {
        queue
          ?.add(async () => {
            if (!day) return;
            const dayDate = day.date;
            if (!dayDate) {
              day.complete = false;
              day.error = true;
              return;
            }
            let fetchResult = null;
            if (day.meeting === 'we') {
              fetchResult = await getWeMedia(dayDate);
            } else if (day.meeting === 'mw') {
              fetchResult = await getMwMedia(dayDate);
            }
            if (fetchResult) {
              day.dynamicMedia = fetchResult.media;
              day.error = fetchResult.error;
              day.complete = true;
            } else {
              day.error = true;
              day.complete = false;
            }
          })
          .catch((error) => {
            day.error = true;
            throw error;
          });
      } catch (error) {
        errorCatcher(error);
        day.error = true;
      }
    }
    await queue?.onIdle();
    exportAllDays();
  } catch (error) {
    errorCatcher(error);
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
        multimediaItem[key]
          ? [key, path.join(baseDir, multimediaItem[key])]
          : [],
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
      Extract.RefBeginParagraphOrdinal,Extract.RefEndParagraphOrdinal, Extract.Link
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
          };
        })
        .filter(
          (extractItem) =>
            !(symbol === 'lmd' && extractItem.FilePath.includes('mp4')),
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

    const bibleBookItems = window.electronApi.executeQuery<MultimediaItem>(
      nwtStyDb,
      bibleBooksQuery,
    );

    if (nwtStyDb_E) {
      const englishBookItems = window.electronApi.executeQuery<MultimediaItem>(
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

      const bibleBookLocalNames =
        window.electronApi.executeQuery<JwPlaylistItem>(
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

    const bibleMediaCategories =
      window.electronApi.executeQuery<MultimediaItem>(
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

    const bibleBookMediaItems = window.electronApi.executeQuery<MultimediaItem>(
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

    const bibleBookDocumentsStartAt =
      window.electronApi.executeQuery<DocumentItem>(
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

    const bibleBookDocumentsEndAt =
      window.electronApi.executeQuery<DocumentItem>(
        nwtStyDb,
        bibleBookDocumentsEndAtQuery,
      );

    const bibleBookDocumentsEndAtId = bibleBookDocumentsEndAt[0]?.DocumentId;

    const nonBibleBookMediaItemsQuery = `
      WITH RankedMultimedia AS (
          SELECT 
              Multimedia.*,
              Document.DocumentId,
              Document.Title,
              ParentDocument.Title AS ParentTitle,
              ParentDocument.SectionNumber AS ParentSection,
              Document.SectionNumber,
              ParentDocument.Type AS ParentType,
              Document.Type,
              LinkedMultimedia.FilePath AS CoverPictureFilePath,
              ROW_NUMBER() OVER (PARTITION BY Multimedia.MultimediaId ORDER BY Document.DocumentId, ParentDocument.Class DESC) AS RowNum
          FROM Multimedia
          LEFT JOIN DocumentMultimedia 
              ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId
          LEFT JOIN Multimedia AS LinkedMultimedia 
              ON Multimedia.LinkMultimediaId = LinkedMultimedia.MultimediaId
          LEFT JOIN Document 
              ON Document.DocumentId = DocumentMultimedia.DocumentId
          LEFT JOIN InternalLink 
              ON InternalLink.MepsDocumentId = Document.MepsDocumentId
          LEFT JOIN DocumentInternalLink 
              ON DocumentInternalLink.InternalLinkId = InternalLink.InternalLinkId
          LEFT JOIN Document AS ParentDocument 
              ON ParentDocument.DocumentId = DocumentInternalLink.DocumentId
          WHERE 
              Multimedia.CategoryType <> 9 
              AND Multimedia.CategoryType <> 17 
              AND (ParentDocument.Class IS NULL OR ParentDocument.Class <> 14)
              AND (Document.SectionNumber IS NULL OR Document.SectionNumber <> 1)
              AND (ParentDocument.SectionNumber IS NULL OR ParentDocument.SectionNumber <> 1)
              AND (ParentDocument.Type IS NULL OR ParentDocument.Type <> 0)
              ${bibleBookDocumentsStartAtId && bibleBookDocumentsEndAtId ? `AND (Document.DocumentId < ${bibleBookDocumentsStartAtId} OR Document.DocumentId > ${bibleBookDocumentsEndAtId})` : ''}
      )
      SELECT *
      FROM RankedMultimedia
      WHERE RowNum = 1;
  `;

    const nonBibleBookMediaItems =
      window.electronApi.executeQuery<MultimediaItem>(
        nwtStyDb,
        nonBibleBookMediaItemsQuery,
      );

    if (nwtStyDb_E) {
      const englishBibleBookMediaItems =
        window.electronApi.executeQuery<MultimediaItem>(
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

      const englishBibleBookDocumentsStartAt =
        window.electronApi.executeQuery<DocumentItem>(
          nwtStyDb_E,
          bibleBookDocumentsStartAtQuery,
        );

      const englishBibleBookDocumentsStartAtId =
        englishBibleBookDocumentsStartAt[0]?.DocumentId;

      const englishBibleBookDocumentsEndAt =
        window.electronApi.executeQuery<DocumentItem>(
          nwtStyDb_E,
          bibleBookDocumentsEndAtQuery,
        );

      const englishBibleBookDocumentsEndAtId =
        englishBibleBookDocumentsEndAt[0]?.DocumentId;

      const englishNonBibleBookMediaItems =
        window.electronApi.executeQuery<MultimediaItem>(
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

export const getAudioBibleMedia = async (force = false) => {
  try {
    const currentStateStore = useCurrentStateStore();
    const jwStore = useJwStore();

    const lang = currentStateStore.currentSettings?.lang;
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
      fileformat: 'MP3',
      issue: '',
      langwritten: '',
      pub: 'nwt',
    };
    const languages = [
      ...new Set([
        currentStateStore.currentSettings.lang,
        currentStateStore.currentSettings?.langFallback,
      ]),
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

      const bibleBookLocalNames =
        window.electronApi.executeQuery<JwPlaylistItem>(
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

    if (!numbers.length) return paragraphLabel;
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
  additional?: boolean,
  additionalSection: MediaSection = 'additional',
): Promise<DynamicMediaObject[]> => {
  const { currentSettings } = useCurrentStateStore();
  try {
    let middleSongParagraphOrdinal = 0;
    if (!additional) {
      const songs = allMedia.filter((m) => isSong(m));
      middleSongParagraphOrdinal =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        songs.length === 3 ? songs[1]!.BeginParagraphOrdinal : 0;
      if (isCoWeek(lookupDate)) {
        // The last songs for both MW and WE meeting get replaced during the CO visit
        const lastParagraphOrdinal =
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          allMedia[allMedia.length - 1]!.BeginParagraphOrdinal || 0;
        allMedia.pop();
        if (isMwMeetingDay(lookupDate)) {
          // Also remove CBS media if it's the MW meeting, since the CBS is skipped during the CO visit
          allMedia = allMedia.filter(
            (m) => m.BeginParagraphOrdinal < lastParagraphOrdinal - 2,
          );
        }
      }
    }
    const mediaPromises = allMedia.map(
      async (m): Promise<DynamicMediaObject> => {
        m.FilePath = await convertImageIfNeeded(m.FilePath);
        const fileUrl = m.FilePath
          ? pathToFileURL(m.FilePath)
          : ([m.KeySymbol, m.IssueTagNumber].filter(Boolean).length
              ? [m.KeySymbol, m.IssueTagNumber]
              : [m.MepsDocumentId]
            )
              .concat([
                (m.MepsLanguageIndex !== undefined &&
                  mepslangs[m.MepsLanguageIndex]) ||
                  '',
                m.Track,
              ])
              .filter(Boolean)
              .join('_');
        const mediaIsSong = isSong(m);
        const thumbnailUrl =
          m.ThumbnailUrl ??
          window.electronApi.pathToFileURL(m.LinkedPreviewFilePath || '') ??
          (await getThumbnailUrl(m.ThumbnailFilePath || m.FilePath));
        const video = isVideo(m.FilePath);
        const audio = isAudio(m.FilePath);
        let duration = 0;
        if (video || audio) {
          if (m.Duration) {
            duration = m.Duration;
          } else if (await fs.exists(m.FilePath)) {
            duration =
              (await getMetadataFromMediaPath(m.FilePath))?.format.duration ||
              0;
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
        let section: MediaSection = additional ? additionalSection : 'wt';
        if (middleSongParagraphOrdinal > 0) {
          //this is a meeting with 3 songs
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
          // iscoweek
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

        return {
          customDuration,
          duration,
          fileUrl,
          isAdditional: !!additional,
          isAudio: audio,
          isImage: isImage(m.FilePath),
          isVideo: video,
          markers: m.VideoMarkers,
          repeat: !!m.Repeat,
          section, // if is we: wt; else, if >= middle song: LAC; >= (middle song - 8???): AYFM; else: TGW
          sectionOriginal: section, // to enable restoring the original section after custom sorting
          streamUrl: m.StreamUrl,
          subtitlesUrl: video ? await getSubtitlesUrl(m, duration) : '',
          tag,
          thumbnailUrl,
          title: mediaIsSong
            ? m.Label.replace(/^\d+\.\s*/, '')
            : m.Label || m.Caption,
          uniqueId: sanitizeId(
            formatDate(lookupDate, 'YYYYMMDD') + '-' + fileUrl,
          ),
        };
      },
    );
    return Promise.all(mediaPromises);
  } catch (e) {
    errorCatcher(e);
    return [];
  }
};

export const watchedItemMapper: (
  parentDate: string,
  watchedItemPath: string,
) => Promise<DynamicMediaObject[] | undefined> = async (
  parentDate,
  watchedItemPath,
) => {
  try {
    const currentStateStore = useCurrentStateStore();
    const jwStore = useJwStore();
    if (!parentDate || !watchedItemPath) return undefined;

    const dateString = parentDate.replace(/-/g, '');

    const fileUrl = pathToFileURL(watchedItemPath);

    const video = isVideo(watchedItemPath);
    const audio = isAudio(watchedItemPath);
    const image = isImage(watchedItemPath);

    if (!(video || audio || image)) {
      if (isJwPlaylist(watchedItemPath)) {
        const additionalMedia = (
          await getMediaFromJwPlaylist(
            watchedItemPath,
            dateFromString(parentDate),
            await currentStateStore.getDatedAdditionalMediaDirectory(
              dateString,
            ),
          )
        ).map((m) => ({ ...m, isAdditional: false, watched: watchedItemPath }));
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
    const title = metadata?.common.title || path.basename(watchedItemPath);

    const uniqueId = sanitizeId(
      formatDate(parentDate, 'YYYYMMDD') + '-' + fileUrl,
    );

    const section =
      jwStore.watchedMediaSections?.[currentStateStore.currentCongregation]?.[
        parentDate
      ]?.[uniqueId] || 'additional';

    const thumbnailUrl = await getThumbnailUrl(watchedItemPath);

    return [
      {
        duration,
        fileUrl,
        isAudio: audio,
        isImage: image,
        isVideo: video,
        section,
        sectionOriginal: 'additional', // to enable restoring the original section after custom sorting
        thumbnailUrl,
        title,
        uniqueId,
        watched: true,
      },
    ];
  } catch (e) {
    errorCatcher(e);
    return undefined;
  }
};

export const getWeMedia = async (lookupDate: Date) => {
  try {
    const currentStateStore = useCurrentStateStore();
    lookupDate = dateFromString(lookupDate);
    const monday = getSpecificWeekday(lookupDate, 0);

    const getIssue = async (
      monday: Date,
      lang?: JwLangCode,
      lastChance = false,
    ) => {
      let result = await getWtIssue(monday, 8, lang);
      if (result.db?.length === 0) {
        result = await getWtIssue(monday, 10, lang, lastChance);
      }
      return result;
    };

    let { db, docId, issueString, publication, weekNr } = await getIssue(
      monday,
      currentStateStore.currentSettings?.lang,
    );
    if (db?.length === 0 && currentStateStore.currentSettings?.langFallback) {
      ({ db, docId, issueString, publication, weekNr } = await getIssue(
        monday,
        currentStateStore.currentSettings?.langFallback,
        true,
      ));
    }
    if (!db || docId < 0) {
      return {
        error: true,
        media: [],
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
    const media = mediaWithoutVideos.concat(videosInParagraphs).concat(
      // exclude the first two videos if wt is after FEB_2023, since these are the songs
      videosNotInParagraphs
        .slice(+issueString < FEB_2023 ? 0 : 2)
        .map((mediaObj) =>
          mediaObj.TargetParagraphNumberLabel === null
            ? { ...mediaObj, TargetParagraphNumberLabel: FOOTNOTE_TAR_PAR } // assign special number so we know videos are referenced by a footnote
            : mediaObj,
        )
        .filter((v) => {
          return (
            !currentStateStore.currentSettings?.excludeFootnotes ||
            v.TargetParagraphNumberLabel < FOOTNOTE_TAR_PAR
          );
        }),
    );

    const updatedMedia = media.map((item) => {
      if (item.MultimediaId !== null && item.LinkMultimediaId !== null) {
        const linkedItem = media.find(
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
            ORDER BY BeginParagraphOrdinal
            LIMIT 2 OFFSET ${2 * weekNr}`,
      );
    } else {
      songs = videosNotInParagraphs.slice(0, 2); // after FEB_2023, the first two videos from DocumentMultimedia are the songs
    }
    let songLangs: ('' | JwLangCode)[] = [];
    try {
      songLangs = executeQuery<MultimediaExtractItem>(
        db,
        `SELECT Extract.ExtractId, Extract.Link, DocumentExtract.BeginParagraphOrdinal
        FROM Extract
        INNER JOIN DocumentExtract ON Extract.ExtractId = DocumentExtract.ExtractId
        WHERE Extract.RefMepsDocumentClass = 31
        ORDER BY Extract.ExtractId
        LIMIT 2
        OFFSET ${2 * weekNr}`,
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
      allMedia.unshift(mergedSongs[0]);
      if (mergedSongs[1]) allMedia.push(mergedSongs[1]);
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
        const mepsLang = mepslangs[multimediaMepsLangItem.MepsLanguageIndex];
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
    const dynamicMediaForDay = await dynamicMediaMapper(allMedia, lookupDate);
    return {
      error: false,
      media: dynamicMediaForDay,
    };
  } catch (e) {
    errorCatcher(e);
    return {
      error: true,
      media: [],
    };
  }
};

export const getMwMedia = async (lookupDate: Date) => {
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

    if (!db) return { error: true, media: [] };

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
        const mepsLang = mepslangs[multimediaMepsLangItem.MepsLanguageIndex];
        if (mepsLang) media.AlternativeLanguage = mepsLang;
      }
    }
    const errors = (await processMissingMediaInfo(allMedia)) || [];
    const dynamicMediaForDay = await dynamicMediaMapper(allMedia, lookupDate);
    return {
      error: errors.length > 0,
      media: dynamicMediaForDay,
    };
  } catch (e) {
    errorCatcher(e);
    return { error: true, media: [] };
  }
};

export async function processMissingMediaInfo(allMedia: MultimediaItem[]) {
  try {
    const currentStateStore = useCurrentStateStore();
    const errors = [];

    const mediaExistenceChecks = allMedia.map(async (m) => {
      if (m.KeySymbol || m.MepsDocumentId) {
        const exists =
          !!m.StreamUrl || (!!m.FilePath && (await fs.pathExists(m.FilePath)));
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
        try {
          if (!media.FilePath || !(await fs.pathExists(media.FilePath))) {
            const {
              FilePath,
              Label,
              StreamDuration,
              StreamThumbnailUrl,
              StreamUrl,
            } = await downloadMissingMedia(publicationFetcher);
            media.FilePath = FilePath ?? media.FilePath;
            media.Label = Label || media.Label;
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

    const response = await fetchPubMediaLinks(
      {
        ...publication,
        pub:
          publication.pub === 'sjjm'
            ? (currentStateStore.currentSongbook?.pub ?? 'sjjm')
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

const downloadMissingMedia = async (publication: PublicationFetcher) => {
  try {
    const pubDir = await getPublicationDirectory(
      publication,
      useCurrentStateStore().currentSettings?.cacheFolder,
    );
    const responseObject = await getPubMediaLinks(publication);
    if (!responseObject?.files) {
      if (!(await fs.pathExists(pubDir))) return { FilePath: '' };
      const files: string[] = [];
      const items = (await readdir(pubDir)).filter((item) => item.isFile);
      for (const item of items) {
        const filePath = path.join(pubDir, item.name);
        const fileExtension = path.extname(filePath).toLowerCase();

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
          if (!item.name || !path.basename(item.name).includes(test)) {
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
      const itemFilename = window.electronApi.path.changeExt(
        path.basename(bestItem.file.url),
        path.extname(itemUrl),
      );
      if (
        bestItem.file?.url &&
        (downloadedFile?.new ||
          !(await fs.exists(path.join(pubDir, itemFilename))))
      ) {
        await downloadFileIfNeeded({
          dir: pubDir,
          filename: itemFilename,
          url: itemUrl,
        });
      }
    }
    return {
      FilePath: path.join(pubDir, path.basename(bestItem.file.url)),
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
  section?: MediaSection,
  customDuration?: { max: number; min: number },
) => {
  try {
    const currentStateStore = useCurrentStateStore();
    const bestItem = findBestResolution(
      mediaItemLinks,
      currentStateStore.currentSettings?.maxRes,
    );
    if (bestItem) {
      const bestItemUrl =
        'progressiveDownloadURL' in bestItem
          ? bestItem.progressiveDownloadURL
          : bestItem.file.url;

      const uniqueId = await addToAdditionMediaMapFromPath(
        path.join(
          await currentStateStore.getDatedAdditionalMediaDirectory(),
          path.basename(bestItemUrl),
        ),
        section,
        undefined,
        {
          duration: bestItem.duration,
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
      }).then(() => {
        if (currentStateStore?.selectedDateObject?.date) {
          addDayToExportQueue(currentStateStore.selectedDateObject.date);
        }
      });

      return uniqueId;
    }
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
    let url = `${urlVariables.mediator}/v1/media-items/`;
    url += publication.langwritten + '/';
    if (publication.pub) {
      url += 'pub-' + publication.pub;
      let issue = publication.issue?.toString();
      if (issue && issue.endsWith('00')) issue = issue.slice(0, -2);
      if (issue && issue !== '0') url += '_' + issue;
    } else {
      url += 'docid-' + publication.docid;
    }
    if (publication.track) url += '_' + publication.track;
    if (publication.fileformat?.toLowerCase().includes('mp4')) url += '_VIDEO';
    else if (publication.fileformat?.toLowerCase().includes('mp3'))
      url += '_AUDIO';
    const responseObject = await fetchJson<MediaItemsMediator>(
      url,
      undefined,
      useCurrentStateStore().online,
    );
    if (responseObject && responseObject.media.length > 0) {
      const best = findBestResolution(
        responseObject.media[0]?.files,
        useCurrentStateStore().currentSettings?.maxRes,
      );
      return {
        duration: responseObject.media[0]?.duration ?? undefined,
        subtitles: isMediaLink(best) ? '' : (best?.subtitles?.url ?? ''),
        thumbnail: getBestImageUrl(responseObject.media[0]?.images ?? {}),
        title: responseObject.media[0]?.title ?? '',
      };
    } else {
      return emptyResponse;
    }
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
      )
        continue; // This file is not of the right format; API glitch!
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
    window.electronApi.setUrlVariables(JSON.stringify(jwStore.urlVariables));
  }
};
