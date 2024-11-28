import type {
  DatedTextItem,
  DocumentItem,
  DownloadedFile,
  DynamicMediaObject,
  FileDownloader,
  ImageSizes,
  ImageTypeSizes,
  JwLangCode,
  MediaItemsMediator,
  MediaItemsMediatorFile,
  MediaLink,
  MediaSection,
  MultimediaExtractItem,
  MultimediaItem,
  MultimediaItemsFetcher,
  Publication,
  PublicationFetcher,
  PublicationFiles,
  PublicationItem,
  TableItem,
  TableItemCount,
  VideoMarker,
} from 'src/types';

import PQueue from 'p-queue';
import { date } from 'quasar';
import { queues } from 'src/boot/globals';
import { FEB_2023, FOOTNOTE_TAR_PAR, MAX_SONGS } from 'src/constants/jw';
import mepslangs from 'src/constants/mepslangs';
import {
  dateFromString,
  datesAreSame,
  getSpecificWeekday,
  isCoWeek,
  isMwMeetingDay,
} from 'src/helpers/date';
import {
  getFileUrl,
  getMetadataFromMediaPath,
  getPublicationDirectory,
  getSubtitlesUrl,
  getThumbnailUrl,
  trimFilepathAsNeeded,
} from 'src/helpers/fs';
import {
  convertImageIfNeeded,
  decompressJwpub,
  findDb,
  getMediaFromJwPlaylist,
  isAudio,
  isImage,
  isJwPlaylist,
  isSong,
  isVideo,
} from 'src/helpers/mediaPlayback';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { fetchJson, fetchRaw } from 'src/utils/api';

import { errorCatcher } from './error-catcher';

const { formatDate, subtractFromDate } = date;

const { executeQuery, fileUrlToPath, fs, path, readdir } = window.electronApi;

export const addJwpubDocumentMediaToFiles = async (
  dbPath: string,
  document: DocumentItem,
  section?: MediaSection,
) => {
  const jwStore = useJwStore();
  const { addToAdditionMediaMap } = jwStore;
  const currentStateStore = useCurrentStateStore();
  try {
    if (!dbPath) return;
    const publication = getPublicationInfoFromDb(dbPath);
    const multimediaItems = getDocumentMultimediaItems({
      db: dbPath,
      docId: document.DocumentId,
    });
    for (let i = 0; i < multimediaItems.length; i++) {
      multimediaItems[i] = await addFullFilePathToMultimediaItem(
        multimediaItems[i],
        publication,
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

export const addDayToExportQueue = async (targetDate?: Date) => {
  folderExportQueue.add(() => exportDayToFolder(targetDate));
};

const exportDayToFolder = async (targetDate?: Date) => {
  const currentStateStore = useCurrentStateStore();
  const jwStore = useJwStore();

  if (
    !targetDate ||
    !currentStateStore?.currentCongregation ||
    !currentStateStore.currentSettings?.mediaAutoExportFolder
  ) {
    return;
  }

  const dateString = formatDate(targetDate, 'YYYY/MM/DD');
  const dateFolderName = formatDate(targetDate, 'YYYY-MM-DD');

  const dynamicMedia = [
    ...(jwStore.lookupPeriod?.[currentStateStore.currentCongregation]?.find(
      (d) => datesAreSame(d.date, targetDate),
    )?.dynamicMedia || []),
    ...(jwStore.additionalMediaMaps?.[currentStateStore.currentCongregation]?.[
      dateString
    ] || []),
    ...(currentStateStore.watchFolderMedia[dateString] || []),
  ];

  const dynamicMediaFiltered = Array.from(
    new Map(dynamicMedia.map((item) => [item.fileUrl, item])).values(),
  )
    .sort(
      mapOrder(
        jwStore.mediaSort[currentStateStore.currentCongregation]?.[
          dateString
        ] || [],
      ),
    )
    .sort((a, b) => {
      const sectionOrder: MediaSection[] = [
        'additional',
        'tgw',
        'ayfm',
        'lac',
        'wt',
        'circuitOverseer',
      ];
      return sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section);
    });

  const dayMediaLength = dynamicMediaFiltered.length;

  const destFolder = path.join(
    currentStateStore.currentSettings.mediaAutoExportFolder,
    dateFolderName,
  );

  try {
    await fs.ensureDir(destFolder);
  } catch (error) {
    errorCatcher(error);
    return; // Exit early if we can't create the folder
  }

  const expectedFiles = new Set<string>();

  const { default: sanitize } = await import('sanitize-filename');
  const sections: Partial<Record<MediaSection, number>> = {}; // Object to store dynamic section prefixes
  for (let i = 0; i < dayMediaLength; i++) {
    try {
      const m = dynamicMediaFiltered[i];
      const sourceFilePath = window.electronApi.fileUrlToPath(m.fileUrl);
      if (!sourceFilePath || !(await fs.exists(sourceFilePath))) continue;

      if (!sections[m.section]) {
        sections[m.section] = Object.keys(sections).length + 1;
      }
      const sectionPrefix = (sections[m.section] || 0)
        .toString()
        .padStart(2, '0');

      const destFilePath = trimFilepathAsNeeded(
        path.join(
          destFolder,
          sectionPrefix +
            '-' +
            (i + 1).toString().padStart(dayMediaLength > 99 ? 3 : 2, '0') +
            ' ' +
            (m.title
              ? sanitize(m.title.replace(path.extname(m.fileUrl), '')) +
                path.extname(m.fileUrl)
              : path.basename(m.fileUrl)),
        ),
      );
      const fileBaseName = path.basename(destFilePath);

      // Check if destination file exists and matches size
      if (await fs.exists(destFilePath)) {
        const sourceStats = await fs.stat(sourceFilePath);
        const destStats = await fs.stat(destFilePath);

        if (sourceStats.size === destStats.size) {
          expectedFiles.add(fileBaseName); // Mark as expected without copying
          continue;
        }
      }

      // Copy file if it doesn't exist or size doesn't match
      expectedFiles.add(fileBaseName);
      await fs.copy(sourceFilePath, destFilePath);
    } catch (error) {
      errorCatcher(error);
    }
  }

  try {
    const filesInDestFolder = await fs.readdir(destFolder);
    for (const file of filesInDestFolder) {
      try {
        if (!expectedFiles.has(file)) {
          await fs.remove(path.join(destFolder, file));
        }
      } catch (error) {
        errorCatcher(error);
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
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

const folderExportQueue = new PQueue({ concurrency: 1 });

export const exportAllDays = async () => {
  try {
    const jwStore = useJwStore();
    const currentStateStore = useCurrentStateStore();
    if (
      !currentStateStore.currentSettings?.enableMediaAutoExport ||
      !currentStateStore.currentSettings?.mediaAutoExportFolder
    )
      return;
    const daysToExport = (
      jwStore.lookupPeriod[currentStateStore.currentCongregation] || []
    ).map((d) => d.date);
    await folderExportQueue.addAll(
      daysToExport.map((day) => () => exportDayToFolder(day)),
    );
  } catch (error) {
    errorCatcher(error);
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
      queues.meetings[currentStateStore.currentCongregation] = new PQueue({
        concurrency: 2,
      });
    } else {
      queues.meetings[currentStateStore.currentCongregation].start();
    }
    const queue = queues.meetings[currentStateStore.currentCongregation];
    for (const day of meetingsToFetch) {
      try {
        queue
          .add(async () => {
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
            throw new Error(error);
          });
      } catch (error) {
        errorCatcher(error);
        day.error = true;
      }
    }
    await queue.onIdle();
    exportAllDays();
  } catch (error) {
    errorCatcher(error);
  }
};

const getDbFromJWPUB = async (publication: PublicationFetcher) => {
  try {
    const jwpub = await downloadJwpub(publication);
    if (jwpub.error) return null;
    const publicationDirectory = await getPublicationDirectory(publication);
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

export const getPublicationInfoFromDb = (db: string): PublicationFetcher => {
  try {
    const pubQuery = executeQuery<PublicationItem>(
      db,
      'SELECT * FROM Publication',
    )[0];

    if (!pubQuery) return { issue: '', langwritten: '', pub: '' };

    const publication: PublicationFetcher = {
      issue: pubQuery.IssueTagNumber,
      langwritten: mepslangs[pubQuery.MepsLanguageIndex],
      pub: pubQuery.UndatedSymbol,
    };

    return publication;
  } catch (error) {
    errorCatcher(error);
    return { issue: '', langwritten: '', pub: '' };
  }
};

async function addFullFilePathToMultimediaItem(
  multimediaItem: MultimediaItem,
  publication: PublicationFetcher,
) {
  try {
    const fullFilePath = multimediaItem.FilePath
      ? path.join(
          await getPublicationDirectory(publication),
          multimediaItem.FilePath,
        )
      : undefined;
    const fullLinkedPreviewFilePath = multimediaItem.LinkedPreviewFilePath
      ? path.join(
          await getPublicationDirectory(publication),
          multimediaItem.LinkedPreviewFilePath,
        )
      : undefined;
    return {
      ...multimediaItem,
      ...(fullFilePath ? { FilePath: fullFilePath } : {}),
      ...(fullLinkedPreviewFilePath
        ? { LinkedPreviewFilePath: fullLinkedPreviewFilePath }
        : {}),
    };
  } catch (error) {
    errorCatcher(error);
    return multimediaItem;
  }
}

const getMultimediaMepsLangs = (source: MultimediaItemsFetcher) => {
  try {
    if (!source.db) return [];
    const multimediaMepsLangs: MultimediaItem[] = [];
    for (const table of [
      'Multimedia',
      'DocumentMultimedia',
      'ExtractMultimedia',
    ]) {
      // exists
      try {
        const tableExists =
          executeQuery<TableItem>(
            source.db,
            `SELECT * FROM sqlite_master WHERE type='table' AND name='${table}'`,
          ).length > 0;
        if (!tableExists) continue;
      } catch (error) {
        errorCatcher(error, {
          contexts: { fn: { name: 'getMultimediaMepsLangs', source, table } },
        });
        continue;
      }
      const columnQueryResult = executeQuery<TableItem>(
        source.db,
        `PRAGMA table_info(${table})`,
      );

      const columnMLIExists = columnQueryResult.some(
        (column) => column.name === 'MepsLanguageIndex',
      );
      const columnKSExists = columnQueryResult.some(
        (column) => column.name === 'KeySymbol',
      );

      if (columnKSExists && columnMLIExists)
        multimediaMepsLangs.push(
          ...executeQuery<MultimediaItem>(
            source.db,
            `SELECT DISTINCT KeySymbol, Track, IssueTagNumber, MepsLanguageIndex from ${table} ORDER by KeySymbol, IssueTagNumber, Track`,
          ),
        );
    }
    return multimediaMepsLangs;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

const getMediaVideoMarkers = (
  source: MultimediaItemsFetcher,
  mediaId: number,
) => {
  try {
    const mediaVideoMarkers = executeQuery<VideoMarker>(
      source.db,
      `SELECT * from VideoMarker WHERE MultimediaId = ${mediaId} ORDER by StartTimeTicks`,
    );
    return mediaVideoMarkers;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

export const getDocumentMultimediaItems = (source: MultimediaItemsFetcher) => {
  try {
    if (!source.db) return [];
    const currentStateStore = useCurrentStateStore();
    const DocumentMultimediaTable = executeQuery<TableItem>(
      source.db,
      "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'",
    ).map((item) => item.name);
    const mmTable =
      DocumentMultimediaTable.length === 0
        ? 'Multimedia'
        : DocumentMultimediaTable[0];
    const columnQueryResult = executeQuery<TableItem>(
      source.db,
      `PRAGMA table_info(${mmTable})`,
    );

    const ParagraphColumnsExist = columnQueryResult.some(
      (column) => column.name === 'BeginParagraphOrdinal',
    );

    const targetParNrExists =
      executeQuery<TableItem>(source.db, "PRAGMA table_info('Question')").some(
        (item) => item.name === 'TargetParagraphNumberLabel',
      ) &&
      !!executeQuery<TableItemCount>(
        source.db,
        'SELECT COUNT(*) FROM Question',
      )[0]?.count;

    const LinkMultimediaIdExists = executeQuery<TableItem>(
      source.db,
      "PRAGMA table_info('Multimedia')",
    ).some((item) => item.name === 'LinkMultimediaId');

    const suppressZoomExists = executeQuery<TableItem>(
      source.db,
      "PRAGMA table_info('Multimedia')",
    )
      .map((item) => item.name)
      .includes('SuppressZoom');

    let select = 'SELECT Document.*, Multimedia.*';
    select += mmTable === 'DocumentMultimedia' ? ', DocumentMultimedia.*' : '';
    select += ParagraphColumnsExist ? ', DocumentParagraph.*' : '';
    select += LinkMultimediaIdExists
      ? ', LinkedMultimedia.FilePath AS LinkedPreviewFilePath'
      : '';
    let from = ' FROM Multimedia';
    if (mmTable === 'DocumentMultimedia') {
      from +=
        ' INNER JOIN DocumentMultimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId';
      from += ` LEFT JOIN DocumentParagraph ON ${mmTable}.BeginParagraphOrdinal = DocumentParagraph.ParagraphIndex`;
    }
    from += ` INNER JOIN Document ON ${mmTable}.DocumentId = Document.DocumentId`;
    if (LinkMultimediaIdExists)
      from +=
        ' LEFT JOIN Multimedia AS LinkedMultimedia ON Multimedia.LinkMultimediaId = LinkedMultimedia.MultimediaId';
    let where = `WHERE ${
      source.docId || source.docId === 0
        ? `Document.DocumentId = ${source.docId}`
        : `Document.MepsDocumentId = ${source.mepsId}`
    }`;

    const videoString =
      "(Multimedia.MimeType LIKE '%video%' OR Multimedia.MimeType LIKE '%audio%')";
    const imgString = `(Multimedia.MimeType LIKE '%image%'${
      currentStateStore.currentSettings?.includePrinted
        ? ''
        : ' AND Multimedia.CategoryType <> 4 AND Multimedia.CategoryType <> 6'
    } AND Multimedia.CategoryType <> 9 AND Multimedia.CategoryType <> 10 AND Multimedia.CategoryType <> 25)`;

    where += ` AND (${videoString} OR ${imgString})`;

    if (
      'BeginParagraphOrdinal' in source &&
      'EndParagraphOrdinal' in source &&
      ParagraphColumnsExist
    ) {
      where += ` AND ${mmTable}.BeginParagraphOrdinal >= ${source.BeginParagraphOrdinal} AND ${mmTable}.EndParagraphOrdinal <= ${source.EndParagraphOrdinal}`;
    }

    const groupAndSort = ParagraphColumnsExist
      ? 'GROUP BY Multimedia.MultimediaId ORDER BY DocumentParagraph.BeginPosition'
      : '';

    if (targetParNrExists && ParagraphColumnsExist) {
      from += ` LEFT JOIN Question ON Question.DocumentId = ${mmTable}.DocumentId AND Question.TargetParagraphOrdinal = ${mmTable}.BeginParagraphOrdinal`;
    }
    if (suppressZoomExists) {
      where += ' AND Multimedia.SuppressZoom <> 1';
    }
    const items = executeQuery<MultimediaItem>(
      source.db,
      `${select} ${from} ${where} ${groupAndSort}`,
    );
    return items;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

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

      const extractItems = getDocumentMultimediaItems({
        db: extractDb,
        lang: extractLang,
        mepsId: extract.RefMepsDocumentId,
        ...(extract.RefBeginParagraphOrdinal
          ? {
              BeginParagraphOrdinal:
                symbol === 'lmd' && extract.RefBeginParagraphOrdinal < 8
                  ? 1 // Hack to show intro picture from the lmd brochure when appropriate
                  : extract.RefBeginParagraphOrdinal,
            }
          : {}),
        ...(extract.RefEndParagraphOrdinal
          ? { EndParagraphOrdinal: extract.RefEndParagraphOrdinal }
          : {}),
      })
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
          extractItems[i],
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
    const docId = executeQuery<{ DocumentId: number }>(
      db,
      `SELECT Document.DocumentId FROM Document WHERE Document.Class=40 LIMIT 1 OFFSET ${weekNr}`,
    )[0]?.DocumentId;
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

    const max = numbers[numbers.length - 1]; // Find the last number

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
        songs.length === 3 ? songs[1].BeginParagraphOrdinal : 0;
      if (isCoWeek(lookupDate)) {
        // The last songs for both MW and WE meeting get replaced during the CO visit
        const lastParagraphOrdinal =
          allMedia[allMedia.length - 1].BeginParagraphOrdinal || 0;
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
          ? getFileUrl(m.FilePath)
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

        return {
          customDuration,
          duration,
          fileUrl,
          isAdditional: !!additional,
          isAudio: audio,
          isImage: isImage(m.FilePath),
          isVideo: video,
          markers: m.VideoMarkers,
          paragraph: getParagraphNumbers(
            m.TargetParagraphNumberLabel,
            m.Caption,
          ),
          repeat: !!m.Repeat,
          section, // if is we: wt; else, if >= middle song: LAC; >= (middle song - 8???): AYFM; else: TGW
          sectionOriginal: section, // to enable restoring the original section after custom sorting
          song: mediaIsSong,
          streamUrl: m.StreamUrl,
          subtitlesUrl: video ? await getSubtitlesUrl(m, duration) : '',
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

    const fileUrl = getFileUrl(watchedItemPath);

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
        additionalMedia
          .filter(
            (m) =>
              m.customDuration &&
              (m.customDuration.max || m.customDuration.min),
          )
          .forEach((m) => {
            const { max, min } = m.customDuration ?? { max: 0, min: 0 };
            const congregation = (jwStore.customDurations[
              currentStateStore.currentCongregation
            ] ??= {});
            const dateDurations = (congregation[dateString] ??= {});
            dateDurations[m.uniqueId] = { max, min };
          });
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
        mediaWithoutVideos[i],
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
    let songLangs: string[] = [];
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
          const langOverride = match ? match[1].split(':')[0] : '';
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
    const mergedSongs = songs
      .map((song, index) => ({
        ...song,
        ...(songLangs[index] ? { LangOverride: songLangs[index] } : {}),
      }))
      .sort(
        (a, b) =>
          (a.BeginParagraphOrdinal ?? 0) - (b.BeginParagraphOrdinal ?? 0),
      );
    const allMedia = finalMedia;
    if (mergedSongs.length > 0) {
      allMedia.unshift(mergedSongs[0]);
      if (mergedSongs.length > 1) allMedia.push(mergedSongs[1]);
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
        if (mepsLang) media.AlternativeLanguage = mepsLang;
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

export function sanitizeId(id: string) {
  try {
    const regex = /[a-zA-Z0-9\-_:.]/g;
    const sanitizedString = id.replace(regex, function (match) {
      return match;
    });
    return sanitizedString;
  } catch (e) {
    errorCatcher(e);
    return id;
  }
}

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
        'No document id found for ' + monday + ' ' + issueString + ' ' + db,
      );

    const mms = getDocumentMultimediaItems({ db, docId });
    for (let i = 0; i < mms.length; i++) {
      const multimediaItem = mms[i];
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
          currentStateStore.currentSettings?.lang,
          currentStateStore.currentSettings?.langFallback,
          media.AlternativeLanguage,
          media.MepsLanguageIndex !== undefined &&
            mepslangs[media.MepsLanguageIndex],
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

    if (publication.pub === 'sjjm') {
      publication.pub = currentStateStore.currentSongbook?.pub;
      // publication.fileformat = currentStateStore.currentSongbook?.fileformat;
    }
    const params = {
      alllangs: '0',
      docid: !publication.pub ? publication.docid?.toString() || '' : '',
      fileformat: publication.fileformat || '',
      issue: publication.issue?.toString() || '',
      langwritten: publication.langwritten || '',
      output: 'json',
      pub: publication.pub || '',
      track: publication.track?.toString() || '',
      txtCMSLang: 'E',
    };
    const response = await fetchJson<Publication>(
      urlVariables.pubMedia,
      new URLSearchParams(params),
    );
    if (!response) {
      const downloadId = [
        publication.docid,
        publication.pub,
        publication.langwritten,
        publication.issue,
        publication.track,
        publication.fileformat,
      ]
        .filter(Boolean)
        .join('_');
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

export function findBestResolution(
  mediaLinks?: MediaItemsMediatorFile[] | MediaLink[],
) {
  try {
    if (!mediaLinks?.length) return null;

    const currentStateStore = useCurrentStateStore();
    let bestItem = null;
    let bestHeight = 0;
    const maxRes = parseInt(
      currentStateStore.currentSettings?.maxRes?.replace(/\D/g, '') || '0',
    );

    if (mediaLinks.some((m) => !m.subtitled)) {
      mediaLinks = mediaLinks.filter((m) => !m.subtitled) as
        | MediaItemsMediatorFile[]
        | MediaLink[];
    }

    for (const mediaLink of mediaLinks) {
      if (
        mediaLink.frameHeight <= maxRes &&
        mediaLink.frameHeight >= bestHeight
      ) {
        bestItem = mediaLink;
        bestHeight = mediaLink.frameHeight;
      }
    }
    return bestItem;
  } catch (e) {
    errorCatcher(e);
    return mediaLinks?.length ? mediaLinks[mediaLinks.length - 1] : null;
  }
}

export function isMediaLink(
  item: MediaItemsMediatorFile | MediaLink | null,
): item is MediaLink {
  if (!item) return false;
  return !('progressiveDownloadURL' in item);
}

const downloadMissingMedia = async (publication: PublicationFetcher) => {
  try {
    const pubDir = await getPublicationDirectory(publication);
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
    const bestItem = findBestResolution(mediaItemLinks);
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
      const itemFilename =
        path.basename(bestItem.file.url).split('.')[0] + path.extname(itemUrl);
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
) => {
  try {
    const currentStateStore = useCurrentStateStore();
    const bestItem = findBestResolution(mediaItemLinks);
    if (bestItem) {
      const bestItemUrl =
        'progressiveDownloadURL' in bestItem
          ? bestItem.progressiveDownloadURL
          : bestItem.file.url;
      window.dispatchEvent(
        new CustomEvent<{
          duration: number;
          path: string;
          section?: MediaSection;
          song: false | number | string;
          thumbnailUrl: string;
          title?: string;
          url: string;
        }>('remote-video-loading', {
          detail: {
            duration: bestItem.duration,
            path: path.join(
              await currentStateStore.getDatedAdditionalMediaDirectory(),
              path.basename(bestItemUrl),
            ),
            section,
            song,
            thumbnailUrl: thumbnailUrl || '',
            title,
            url: bestItemUrl,
          },
        }),
      );
      await downloadFileIfNeeded({
        dir: await currentStateStore.getDatedAdditionalMediaDirectory(),
        size: bestItem.filesize,
        url: bestItemUrl,
      });
      window.dispatchEvent(
        new CustomEvent<{
          targetDate: Date | undefined;
        }>('remote-video-loaded', {
          detail: {
            targetDate: currentStateStore?.selectedDateObject?.date,
          },
        }),
      );
    }
  } catch (e) {
    errorCatcher(e);
  }
};

export function getBestImageUrl(
  images: ImageTypeSizes,
  minSize?: keyof ImageSizes,
) {
  try {
    const preferredOrder: (keyof ImageTypeSizes)[] = [
      'wss',
      'lsr',
      'sqr',
      'pnr',
    ];
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
        if (otherSizes.length > 0) {
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
    const responseObject = await fetchJson<MediaItemsMediator>(url);
    if (responseObject && responseObject.media.length > 0) {
      const best = findBestResolution(responseObject.media[0].files);
      return {
        duration: responseObject.media[0].duration ?? undefined,
        subtitles: isMediaLink(best) ? '' : (best?.subtitles?.url ?? ''),
        thumbnail: getBestImageUrl(responseObject.media[0].images),
        title: responseObject.media[0].title,
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
      const downloadId = [
        publication.docid,
        publication.pub,
        publication.langwritten,
        publication.issue,
        publication.track,
        publication.fileformat,
      ]
        .filter(Boolean)
        .join('_');
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

    const dir = await getPublicationDirectory(publication);
    const filteredMediaItemLinks: MediaLink[] = [];
    for (const mediaItemLink of mediaLinks) {
      const currentTrack = mediaItemLink.track;
      if (!filteredMediaItemLinks.some((m) => m.track === currentTrack)) {
        const bestItem = findBestResolution(
          mediaLinks.filter((m) => m.track === currentTrack),
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
      const downloadId = [
        publication.docid,
        publication.pub,
        publication.langwritten,
        publication.issue,
        publication.track,
        publication.fileformat,
      ]
        .filter(Boolean)
        .join('_');
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
      dir: await getPublicationDirectory(publication),
      size: mediaLinks[0].filesize,
      url: mediaLinks[0].file.url,
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
