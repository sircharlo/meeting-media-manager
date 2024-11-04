import type {
  DatedTextItem,
  DocumentItem,
  DownloadedFile,
  DynamicMediaObject,
  FileDownloader,
  ImageSizes,
  ImageTypeSizes,
  MediaItemsMediator,
  MediaItemsMediatorFile,
  MediaLink,
  MultimediaExtractItem,
  MultimediaItem,
  MultimediaItemsFetcher,
  Publication,
  PublicationFetcher,
  PublicationItem,
  TableItem,
  TableItemCount,
  VideoMarker,
} from 'src/types';

import axios, { type AxiosError } from 'axios';
import { Buffer } from 'buffer';
import PQueue from 'p-queue';
import { date } from 'quasar';
import sanitize from 'sanitize-filename';
import { get, urlWithParamsToString } from 'src/boot/axios';
import { queues } from 'src/boot/globals';
import { FEB_2023, FOOTNOTE_TAR_PAR, MAX_SONGS } from 'src/constants/jw';
import mepslangs from 'src/constants/mepslangs';
import {
  dateFromString,
  getSpecificWeekday,
  isCoWeek,
  isMwMeetingDay,
} from 'src/helpers/date';
import {
  getDurationFromMediaPath,
  getFileUrl,
  getPublicationDirectory,
  getSubtitlesUrl,
  getThumbnailUrl,
} from 'src/helpers/fs';
import {
  convertImageIfNeeded,
  decompressJwpub,
  findDb,
  isAudio,
  isImage,
  isSong,
  isVideo,
} from 'src/helpers/mediaPlayback';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';

import { errorCatcher } from './error-catcher';

const { formatDate, subtractFromDate } = date;

const {
  downloadErrorIsExpected,
  executeQuery,
  fileUrlToPath,
  fs,
  path,
  readDirectory,
} = window.electronApi;

const addJwpubDocumentMediaToFiles = async (
  dbPath: string,
  document: DocumentItem,
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
    }).map((multimediaItem) =>
      addFullFilePathToMultimediaItem(multimediaItem, publication),
    );
    const errors = await processMissingMediaInfo(multimediaItems);
    const dynamicMediaItems = currentStateStore.selectedDateObject
      ? await dynamicMediaMapper(
          multimediaItems,
          currentStateStore.selectedDateObject?.date,
          true,
        )
      : [];
    addToAdditionMediaMap(dynamicMediaItems);
    if (errors?.length) return errors;
  } catch (e) {
    errorCatcher(e);
  }
};

const downloadFileIfNeeded = async ({
  dir,
  filename,
  lowPriority = false,
  size,
  url,
}: FileDownloader): Promise<DownloadedFile> => {
  if (!url)
    return {
      new: false,
      path: '',
    };
  const currentStateStore = useCurrentStateStore();
  if (!queues.downloads[currentStateStore.currentCongregation])
    queues.downloads[currentStateStore.currentCongregation] = new PQueue({
      concurrency: 5,
    });
  const queue = queues.downloads[currentStateStore.currentCongregation];
  return (
    queue.add(
      async () => {
        fs.ensureDirSync(dir);
        if (!filename) filename = path.basename(url);
        filename = sanitize(filename);
        const destinationPath = path.join(dir, filename);
        const remoteSize: number =
          size ||
          (await axios({ method: 'HEAD', url })
            .then((response) => +response.headers['content-length'] || 0)
            .catch(() => 0));
        if (fs.existsSync(destinationPath)) {
          const stat = fs.statSync(destinationPath);
          const localSize = stat.size;
          if (localSize === remoteSize) {
            return {
              new: false,
              path: destinationPath,
            };
          }
        }
        const currentStateStore = useCurrentStateStore();
        if (!currentStateStore.downloadedFiles[url])
          currentStateStore.downloadedFiles[url] = downloadFile({
            dir,
            filename,
            size,
            url,
          });
        return currentStateStore.downloadedFiles[url];
      },
      { priority: lowPriority ? 10 : 100 },
    ) as Promise<DownloadedFile>
  ).catch((error) => {
    errorCatcher(error);
    return {
      new: false,
      path: '',
    };
  });
};

const downloadFile = async ({ dir, filename, url }: FileDownloader) => {
  if (!url) {
    return {
      error: true,
      path: '',
    };
  }
  if (!filename) filename = path.basename(url);
  filename = sanitize(filename);
  const currentStateStore = useCurrentStateStore();
  const destinationPath = path.join(dir, filename);
  const downloadedDataRequest = await axios
    .get(url, {
      onDownloadProgress: (progressEvent) => {
        const downloadDone =
          currentStateStore.downloadProgress[url]?.complete || false;
        if (!downloadDone)
          currentStateStore.downloadProgress[url] = {
            loaded: progressEvent.loaded,
            total: progressEvent.total || progressEvent.loaded,
          };
      },
      responseType: 'arraybuffer',
    })
    .catch(async (error: AxiosError) => {
      if (!(await downloadErrorIsExpected())) errorCatcher(error);
      currentStateStore.downloadProgress[url] = {
        error: true,
      };
      return { data: '' };
    });
  const downloadedData = downloadedDataRequest.data;
  currentStateStore.downloadProgress[url] = {
    complete: true,
  };
  if (!downloadedData) {
    return {
      error: true,
      path: destinationPath,
    };
  }
  fs.ensureDirSync(dir);
  fs.writeFileSync(destinationPath, Buffer.from(downloadedData));
  return {
    new: true,
    path: destinationPath,
  };
};
const fetchMedia = async () => {
  try {
    const currentStateStore = useCurrentStateStore();
    if (
      !currentStateStore.currentCongregation ||
      !!currentStateStore.currentSettings?.disableMediaFetching
    ) {
      return;
    }

    const jwStore = useJwStore();
    const meetingsToFetch =
      jwStore.lookupPeriod[currentStateStore.currentCongregation]?.filter(
        (day) => {
          return (
            (day.meeting && (!day.complete || day.error)) ||
            day.dynamicMedia.some(
              (media) =>
                !media?.fileUrl ||
                !fs.existsSync(fileUrlToPath(media?.fileUrl)),
            )
          );
        },
      ) || [];
    if (meetingsToFetch.length === 0) return;
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
  } catch (error) {
    errorCatcher(error);
  }
};

const getDbFromJWPUB = async (publication: PublicationFetcher) => {
  try {
    const jwpub = await downloadJwpub(publication);
    if (jwpub.error) return null;
    const publicationDirectory = getPublicationDirectory(publication);
    if (jwpub.new || !findDb(publicationDirectory)) {
      await decompressJwpub(jwpub.path, publicationDirectory);
    }
    const dbFile = findDb(publicationDirectory);
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

const getPublicationInfoFromDb = (db: string): PublicationFetcher => {
  try {
    const pubQuery = executeQuery<PublicationItem>(
      db,
      'SELECT * FROM Publication',
    )[0];

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

function addFullFilePathToMultimediaItem(
  multimediaItem: MultimediaItem,
  publication: PublicationFetcher,
) {
  try {
    return {
      ...multimediaItem,
      ...(multimediaItem.FilePath
        ? {
            FilePath: path.join(
              getPublicationDirectory(publication),
              multimediaItem.FilePath,
            ),
          }
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
          )?.map((item) => item.name).length > 0;
        if (!tableExists) continue;
      } catch (error) {
        errorCatcher(source.db + ' - ' + table);
        errorCatcher(error);
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

const getDocumentMultimediaItems = (source: MultimediaItemsFetcher) => {
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
      executeQuery<TableItemCount>(
        source.db,
        'SELECT COUNT(*) FROM Question',
      )[0].count > 0;

    const suppressZoomExists = executeQuery<TableItem>(
      source.db,
      "PRAGMA table_info('Multimedia')",
    )
      .map((item) => item.name)
      .includes('SuppressZoom');

    // let select = 'SELECT Multimedia.DocumentId, Multimedia.MultimediaId, ';
    const select = 'SELECT * ';
    let from = 'FROM Multimedia ';
    if (mmTable === 'DocumentMultimedia') {
      from +=
        'INNER JOIN DocumentMultimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId ';
      from += `INNER JOIN DocumentParagraph ON ${mmTable}.BeginParagraphOrdinal = DocumentParagraph.ParagraphIndex `;
    }
    from += `INNER JOIN Document ON ${mmTable}.DocumentId = Document.DocumentId `;

    let where = ` WHERE ${
      source.docId || source.docId === 0
        ? `Document.DocumentId = ${source.docId}`
        : `Document.MepsDocumentId = ${source.mepsId}`
    }`;

    const videoString =
      "(Multimedia.MimeType LIKE '%video%' OR Multimedia.MimeType LIKE '%audio%')";
    const imgString = `(Multimedia.MimeType LIKE '%image%' ${
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
      ? ' GROUP BY Multimedia.MultimediaId ORDER BY DocumentParagraph.BeginPosition'
      : '';

    if (targetParNrExists && ParagraphColumnsExist) {
      from += ` LEFT JOIN Question ON Question.DocumentId = ${mmTable}.DocumentId AND Question.TargetParagraphOrdinal = ${mmTable}.BeginParagraphOrdinal `;
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
            extract.Lang = (matches.pop() as string).split(':')[0];
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
        .map((extractItem) => {
          return {
            ...extractItem,
            BeginParagraphOrdinal: extract.BeginParagraphOrdinal,
            EndParagraphOrdinal: extract.EndParagraphOrdinal,
          };
        })
        .map((extractItem) =>
          addFullFilePathToMultimediaItem(extractItem, {
            issue: extract.IssueTagNumber,
            langwritten: extractLang,
            pub: symbol,
          }),
        );
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
  langwritten?: string,
  lastChance = false,
) => {
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
    const docId = (
      executeQuery(
        db,
        `SELECT Document.DocumentId FROM Document WHERE Document.Class=40 LIMIT 1 OFFSET ${weekNr}`,
      ) as { DocumentId: number }[]
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

const dynamicMediaMapper = async (
  allMedia: MultimediaItem[],
  lookupDate: Date,
  additional?: boolean,
): Promise<DynamicMediaObject[]> => {
  try {
    let middleSongParagraphOrdinal = 0;
    if (!additional) {
      const songs = allMedia.filter((m) => isSong(m));
      if (songs.length === 3)
        middleSongParagraphOrdinal = songs[1].BeginParagraphOrdinal;
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
        const fileUrl = getFileUrl(m.FilePath);
        const mediaIsSong = isSong(m);
        const thumbnailUrl =
          m.ThumbnailUrl ??
          (await getThumbnailUrl(m.ThumbnailFilePath || m.FilePath));
        const video = isVideo(m.FilePath);
        const audio = isAudio(m.FilePath);
        let duration = 0;
        if (video || audio) {
          duration = m.Duration ?? (await getDurationFromMediaPath(m.FilePath));
        }
        let section = additional ? 'additional' : 'wt';
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

const getWeMedia = async (lookupDate: Date) => {
  try {
    const currentStateStore = useCurrentStateStore();
    lookupDate = dateFromString(lookupDate);
    const monday = getSpecificWeekday(lookupDate, 0);

    const getIssue = async (
      monday: Date,
      lang?: string,
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

    const media = executeQuery<MultimediaItem>(
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
    )
      .map((multimediaItem) =>
        addFullFilePathToMultimediaItem(multimediaItem, publication),
      )
      .concat(videosInParagraphs)
      .concat(
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

function sanitizeId(id: string) {
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

const getMwMedia = async (lookupDate: Date) => {
  try {
    const currentStateStore = useCurrentStateStore();
    lookupDate = dateFromString(lookupDate);
    // if not monday, get the previous monday
    const monday = getSpecificWeekday(lookupDate, 0);
    const issue = subtractFromDate(monday, {
      months: (monday.getMonth() + 1) % 2 === 0 ? 1 : 0,
    });
    const issueString = formatDate(issue, 'YYYYMM') + '00';
    let publication: PublicationFetcher;
    const getMwbIssue = async (langwritten?: string) => {
      if (!langwritten) return '';
      publication = {
        issue: issueString,
        langwritten,
        pub: 'mwb',
      };
      return await getDbFromJWPUB(publication);
    };

    let db = await getMwbIssue(currentStateStore.currentSettings?.lang);
    if (!db && currentStateStore.currentSettings?.langFallback) {
      db = await getMwbIssue(currentStateStore.currentSettings?.langFallback);
    }

    if (!db) return { error: true, media: [] };

    const docId =
      (
        executeQuery(
          db,
          `SELECT DocumentId FROM DatedText WHERE FirstDateOffset = ${formatDate(
            monday,
            'YYYYMMDD',
          )}`,
        ) as { DocumentId: number }[]
      )[0]?.DocumentId ?? -1;

    if (docId < 0)
      throw new Error(
        'No document id found for ' + monday + ' ' + issueString + ' ' + db,
      );

    const mms = getDocumentMultimediaItems({ db, docId }).map(
      (multimediaItem) => {
        const videoMarkers = getMediaVideoMarkers(
          { db, docId },
          multimediaItem.MultimediaId,
        );
        if (videoMarkers) multimediaItem.VideoMarkers = videoMarkers;
        return addFullFilePathToMultimediaItem(multimediaItem, publication);
      },
    );

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

async function processMissingMediaInfo(allMedia: MultimediaItem[]) {
  try {
    const currentStateStore = useCurrentStateStore();
    const errors = [];
    for (const media of allMedia.filter(
      (m) =>
        m.KeySymbol && (!m.Label || !m.FilePath || !fs.existsSync(m.FilePath)),
    )) {
      if (!media.KeySymbol) {
        continue;
      }
      const langsWritten = [
        media.AlternativeLanguage,
        currentStateStore.currentSettings?.lang,
        currentStateStore.currentSettings?.langFallback,
      ];
      for (const langwritten of langsWritten) {
        if (!langwritten) {
          continue;
        }
        const publicationFetcher = {
          fileformat: media.MimeType?.includes('audio') ? 'MP3' : 'MP4',
          issue: media.IssueTagNumber,
          langwritten,
          pub: media.KeySymbol,
          ...(typeof media.Track === 'number' &&
            media.Track > 0 && { track: media.Track }),
        };
        try {
          if (!media.FilePath || !fs.existsSync(media.FilePath)) {
            const { FilePath, StreamDuration, StreamThumbnailUrl, StreamUrl } =
              await downloadMissingMedia(publicationFetcher);
            media.FilePath = FilePath ?? media.FilePath;
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

const getPubMediaLinks = async (publication: PublicationFetcher) => {
  const jwStore = useJwStore();
  const { urlVariables } = jwStore;
  try {
    const currentStateStore = useCurrentStateStore();

    if (!publication.fileformat) publication.fileformat = '';
    if (publication.pub === 'sjjm') {
      publication.pub = currentStateStore.currentSongbook?.pub;
      // publication.fileformat = currentStateStore.currentSongbook?.fileformat;
    }
    publication.fileformat = publication.fileformat.toUpperCase();
    const params = {
      alllangs: '0',
      fileformat: publication.fileformat,
      issue: publication.issue?.toString() || '',
      langwritten: publication.langwritten,
      output: 'json',
      pub: publication.pub,
      track: publication.track?.toString() || '',
      txtCMSLang: 'E',
    };
    const response = await get<Publication>(
      urlWithParamsToString(urlVariables.pubMedia, params),
    );
    if (!response) {
      currentStateStore.downloadProgress[
        [
          publication.pub,
          publication.langwritten,
          publication.issue,
          publication.track,
          publication.fileformat,
        ]
          .filter(Boolean)
          .join('_')
      ] = {
        error: true,
      };
    }
    return response;
  } catch (e) {
    errorCatcher(e);
    return null;
  }
};

export function isMediaLink(
  item: MediaItemsMediatorFile | MediaLink | null,
): item is MediaLink {
  if (!item) return false;
  return !('progressiveDownloadURL' in item);
}

export function findBestResolution(
  mediaLinks: MediaItemsMediatorFile[] | MediaLink[],
) {
  try {
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
    return mediaLinks.length > 0 ? mediaLinks[mediaLinks.length - 1] : null;
  }
}

const downloadMissingMedia = async (publication: PublicationFetcher) => {
  try {
    const pubDir = getPublicationDirectory(publication);
    const responseObject = await getPubMediaLinks(publication);
    if (!responseObject?.files) {
      if (!fs.existsSync(pubDir)) return { FilePath: '' }; // Publication not found
      const files = readDirectory(pubDir, {
        filter: (file) => {
          let match = true;
          const params = [publication.issue, publication.track, publication.pub]
            .filter((i) => i !== undefined)
            .map((i) => i?.toString()) as string[];
          for (const test of params) {
            if (!file.path || !path.basename(file.path).includes(test))
              match = false;
          }
          if (
            !publication.fileformat ||
            !path
              .extname(file.path)
              .toLowerCase()
              .includes(publication.fileformat?.toLowerCase())
          )
            match = false;
          return match;
        },
        nodir: true,
      });
      return files.length > 0 ? { FilePath: files[0].path } : { FilePath: '' };
    }
    if (!responseObject) return { FilePath: '' };
    if (!publication.fileformat)
      publication.fileformat = Object.keys(
        responseObject.files[publication.langwritten],
      )[0];
    const mediaItemLinks =
      responseObject.files[publication.langwritten][publication.fileformat];
    const bestItem = findBestResolution(mediaItemLinks);
    if (!isMediaLink(bestItem) || !bestItem?.file?.url) {
      return { FilePath: '' };
    }
    const jwMediaInfo = await getJwMediaInfo(publication);
    downloadFileIfNeeded({
      dir: pubDir,
      size: bestItem.filesize,
      url: bestItem.file.url,
    }).then(async (downloadedFile) => {
      const currentStateStore = useCurrentStateStore();
      for (const itemUrl of [
        currentStateStore.currentSettings?.enableSubtitles
          ? jwMediaInfo.subtitles
          : undefined,
        jwMediaInfo.thumbnail,
      ].filter((u): u is string => !!u)) {
        const itemFilename =
          path.basename(bestItem.file.url).split('.')[0] +
          path.extname(itemUrl);
        if (
          bestItem.file?.url &&
          (downloadedFile?.new ||
            !fs.existsSync(path.join(pubDir, itemFilename)))
        ) {
          await downloadFileIfNeeded({
            dir: pubDir,
            filename: itemFilename,
            url: itemUrl,
          });
        }
      }
    });
    return {
      FilePath: path.join(pubDir, path.basename(bestItem.file.url)),
      StreamDuration: bestItem.duration,
      StreamThumbnailUrl: jwMediaInfo.thumbnail,
      StreamUrl: bestItem.file.url,
    };
  } catch (e) {
    errorCatcher(e);
    return { FilePath: '' };
  }
};

const downloadAdditionalRemoteVideo = async (
  mediaItemLinks: MediaItemsMediatorFile[] | MediaLink[],
  thumbnailUrl?: string,
  song: boolean | number | string = false,
  title?: string,
) => {
  try {
    const currentStateStore = useCurrentStateStore();
    const bestItem = findBestResolution(mediaItemLinks) as
      | MediaItemsMediatorFile
      | MediaLink;
    if (bestItem) {
      const bestItemUrl =
        'progressiveDownloadURL' in bestItem
          ? bestItem.progressiveDownloadURL
          : bestItem.file.url;
      window.dispatchEvent(
        new CustomEvent('remote-video-loading', {
          detail: {
            duration: bestItem.duration,
            path: path.join(
              currentStateStore.getDatedAdditionalMediaDirectory,
              path.basename(bestItemUrl),
            ),
            song,
            thumbnailUrl: thumbnailUrl || '',
            title,
            url: bestItemUrl,
          },
        }),
      );
      await downloadFileIfNeeded({
        dir: currentStateStore.getDatedAdditionalMediaDirectory,
        size: bestItem.filesize,
        url: bestItemUrl,
      });
    }
  } catch (e) {
    errorCatcher(e);
  }
};

function getBestImageUrl(images: ImageTypeSizes, minSize?: keyof ImageSizes) {
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

const getJwMediaInfo = async (publication: PublicationFetcher) => {
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
    url += 'pub-' + publication.pub;
    let issue = publication.issue?.toString();
    if (issue && issue.endsWith('00')) issue = issue.slice(0, -2);
    if (issue && issue !== '0') url += '_' + issue;
    if (publication.track) url += '_' + publication.track;
    if (publication.fileformat?.toLowerCase().includes('mp4')) url += '_VIDEO';
    else if (publication.fileformat?.toLowerCase().includes('mp3'))
      url += '_AUDIO';
    const responseObject = await get<MediaItemsMediator>(url);
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
      currentStateStore.downloadProgress[
        [
          publication.pub,
          publication.langwritten,
          publication.issue,
          publication.track,
          publication.fileformat,
        ]
          .filter(Boolean)
          .join('_')
      ] = {
        error: true,
      };
      return;
    }
    const mediaLinks = publicationInfo.files[publication.langwritten][
      publication.fileformat
    ]
      .filter(isMediaLink)
      .filter(
        (mediaLink) =>
          !publication.maxTrack || mediaLink.track < publication.maxTrack,
      );

    const dir = getPublicationDirectory(publication);
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

const downloadBackgroundMusic = () => {
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

const downloadSongbookVideos = () => {
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
      currentStateStore.downloadProgress[
        [
          publication.pub,
          publication.langwritten,
          publication.issue,
          publication.track,
          publication.fileformat,
        ]
          .filter(Boolean)
          .join('_')
      ] = {
        error: true,
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
      publicationInfo.files[publication.langwritten][publication.fileformat]
        .filter(isMediaLink)
        .filter(
          (mediaLink) =>
            !publication.maxTrack || mediaLink.track < publication.maxTrack,
        ) || [];
    if (!mediaLinks.length) {
      return handleDownloadError();
    }

    return await downloadFileIfNeeded({
      dir: getPublicationDirectory(publication),
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

const setUrlVariables = async (baseUrl: string | undefined) => {
  const jwStore = useJwStore();

  const resetUrlVariables = (base = false) => {
    if (base) jwStore.urlVariables.base = '';
    jwStore.urlVariables.mediator = '';
    jwStore.urlVariables.pubMedia = '';
  };

  if (!baseUrl) {
    resetUrlVariables(true);
    return;
  }

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
    const homePage = await axios
      .get(homePageUrl, {
        signal: controller.signal,
      })
      .then((res) => res.data);
    console.debug('homepage finished', homePageUrl);

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

export {
  addFullFilePathToMultimediaItem,
  addJwpubDocumentMediaToFiles,
  downloadAdditionalRemoteVideo,
  downloadBackgroundMusic,
  downloadFile,
  downloadFileIfNeeded,
  downloadSongbookVideos,
  dynamicMediaMapper,
  fetchMedia,
  getBestImageUrl,
  getDocumentMultimediaItems,
  getJwMediaInfo,
  getMwMedia,
  getPublicationInfoFromDb,
  getPubMediaLinks,
  getWeMedia,
  processMissingMediaInfo,
  sanitizeId,
  setUrlVariables,
};
