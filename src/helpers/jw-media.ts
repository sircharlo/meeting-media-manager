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
import { storeToRefs } from 'pinia';
import { date } from 'quasar';
import sanitize from 'sanitize-filename';
import { get, urlWithParamsToString } from 'src/boot/axios';
import { queues } from 'src/boot/globals';
import mepslangs from 'src/defaults/mepslangs';
import {
  dateFromString,
  getSpecificWeekday,
  isCoWeek,
  isMwMeetingDay,
} from 'src/helpers/date';
import { electronApi } from 'src/helpers/electron-api';
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
import { MAX_SONGS, useJwStore } from 'src/stores/jw';

import { errorCatcher } from './error-catcher';

const { executeQuery, fileUrlToPath, fs, klawSync, path } = electronApi;
const FEB_2023 = 20230200;
const FOOTNOTE_TAR_PAR = 9999;

const addJwpubDocumentMediaToFiles = async (
  dbPath: string,
  document: DocumentItem,
) => {
  const jwStore = useJwStore();
  const { addToAdditionMediaMap } = jwStore;
  const currentStateStore = useCurrentStateStore();
  const { selectedDateObject } = storeToRefs(currentStateStore);
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
    const dynamicMediaItems = await dynamicMediaMapper(
      multimediaItems,
      selectedDateObject.value?.date,
      true,
    );
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
  const { currentCongregation } = storeToRefs(useCurrentStateStore());
  if (!queues.downloads[currentCongregation.value])
    queues.downloads[currentCongregation.value] = new PQueue({
      concurrency: 5,
    });
  const queue = queues.downloads[currentCongregation.value];
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
        const { downloadedFiles } = storeToRefs(useCurrentStateStore());
        if (!downloadedFiles.value[url])
          downloadedFiles.value[url] = downloadFile({
            dir,
            filename,
            size,
            url,
          });
        return downloadedFiles.value[url];
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
  const { downloadProgress } = storeToRefs(useCurrentStateStore());
  const destinationPath = path.join(dir, filename);
  const downloadedDataRequest = await axios
    .get(url, {
      onDownloadProgress: (progressEvent) => {
        const downloadDone = downloadProgress.value[url]?.complete || false;
        if (!downloadDone)
          downloadProgress.value[url] = {
            loaded: progressEvent.loaded,
            total: progressEvent.total || progressEvent.loaded,
          };
      },
      responseType: 'arraybuffer',
    })
    .catch((error: AxiosError) => {
      errorCatcher(error);
      downloadProgress.value[url] = {
        error: true,
      };
      return { data: '' };
    });
  const downloadedData = downloadedDataRequest.data;
  downloadProgress.value[url] = {
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
    const { currentCongregation, currentSettings } = storeToRefs(
      useCurrentStateStore(),
    );
    if (
      !currentCongregation.value ||
      !!currentSettings.value?.disableMediaFetching
    )
      return;
    const { lookupPeriod } = storeToRefs(useJwStore());
    const meetingsToFetch = lookupPeriod.value[
      currentCongregation.value
    ]?.filter((day) => {
      return (
        (day.meeting && !day.complete) ||
        day.dynamicMedia.some(
          (media) =>
            !media?.fileUrl || !fs.existsSync(fileUrlToPath(media?.fileUrl)),
        )
      );
    });
    if (meetingsToFetch.length === 0) return;
    if (!queues.meetings[currentCongregation.value]) {
      queues.meetings[currentCongregation.value] = new PQueue({
        concurrency: 2,
      });
    } else {
      queues.meetings[currentCongregation.value].start();
    }
    const queue = queues.meetings[currentCongregation.value];
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

const getPublicationInfoFromDb = (db: string) => {
  try {
    const publication = {} as PublicationFetcher;
    const pubQuery = (
      executeQuery(db, 'SELECT * FROM Publication') as PublicationItem[]
    )[0];
    publication.pub = pubQuery.UndatedSymbol;
    publication.issue = pubQuery.IssueTagNumber;
    publication.langwritten = mepslangs[pubQuery.MepsLanguageIndex];
    return publication as PublicationFetcher;
  } catch (error) {
    errorCatcher(error);
    return { issue: '', langwritten: '', pub: '' } as PublicationFetcher;
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
    const multimediaMepsLangs = [] as MultimediaItem[];
    for (const table of [
      'Multimedia',
      'DocumentMultimedia',
      'ExtractMultimedia',
    ]) {
      // exists
      try {
        const tableExists =
          (
            executeQuery(
              source.db,
              `SELECT * FROM sqlite_master WHERE type='table' AND name='${table}'`,
            ) as TableItem[]
          )?.map((item) => item.name).length > 0;
        if (!tableExists) continue;
      } catch (error) {
        errorCatcher(source.db + ' - ' + table);
        errorCatcher(error);
        continue;
      }
      const columnQueryResult = executeQuery(
        source.db,
        `PRAGMA table_info(${table})`,
      ) as TableItem[];

      const columnMLIExists = columnQueryResult.some(
        (column) => column.name === 'MepsLanguageIndex',
      );
      const columnKSExists = columnQueryResult.some(
        (column) => column.name === 'KeySymbol',
      );

      if (columnKSExists && columnMLIExists)
        multimediaMepsLangs.push(
          ...(executeQuery(
            source.db,
            `SELECT DISTINCT KeySymbol, Track, IssueTagNumber, MepsLanguageIndex from ${table} ORDER by KeySymbol, IssueTagNumber, Track`,
          ) as MultimediaItem[]),
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
    const mediaVideoMarkers = executeQuery(
      source.db,
      `SELECT * from VideoMarker WHERE MultimediaId = ${mediaId} ORDER by StartTimeTicks`,
    ) as VideoMarker[];
    return mediaVideoMarkers;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

const getDocumentMultimediaItems = (source: MultimediaItemsFetcher) => {
  try {
    if (!source.db) return [];
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
    const DocumentMultimediaTable = (
      executeQuery(
        source.db,
        "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'",
      ) as TableItem[]
    ).map((item) => item.name);
    const mmTable =
      DocumentMultimediaTable.length === 0
        ? 'Multimedia'
        : (DocumentMultimediaTable[0] as string);
    const columnQueryResult = executeQuery(
      source.db,
      `PRAGMA table_info(${mmTable})`,
    ) as TableItem[];

    const ParagraphColumnsExist = columnQueryResult.some(
      (column) => column.name === 'BeginParagraphOrdinal',
    );

    const targetParNrExists =
      (
        executeQuery(source.db, "PRAGMA table_info('Question')") as TableItem[]
      ).some((item) => item.name === 'TargetParagraphNumberLabel') &&
      (
        executeQuery(
          source.db,
          'SELECT COUNT(*) FROM Question',
        ) as TableItemCount[]
      )[0].count > 0;

    const suppressZoomExists = (
      executeQuery(source.db, "PRAGMA table_info('Multimedia')") as TableItem[]
    )
      .map((item) => item.name)
      .includes('SuppressZoom') as boolean;

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
      currentSettings.value?.includePrinted
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
    const items = executeQuery(
      source.db,
      `${select} ${from} ${where} ${groupAndSort}`,
    ) as MultimediaItem[];
    return items;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

const getDocumentExtractItems = async (db: string, docId: number) => {
  try {
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
    const extracts = executeQuery(
      // ${currentSongbook.value?.pub === 'sjjm'
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
      currentSettings.value?.excludeTh
        ? "AND NOT UniqueEnglishSymbol = 'th' "
        : ''
    }
      ORDER BY DocumentExtract.BeginParagraphOrdinal`,
    ) as MultimediaExtractItem[];

    // AND NOT RefPublication.PublicationCategorySymbol = 'web'
    // To think about: should we add a toggle to enable/disable web publication multimedia?

    const allExtractItems = [];
    for (const extract of extracts) {
      extract.Lang = currentSettings.value?.lang;
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
      let extractLang = extract.Lang ?? currentSettings.value?.lang;
      let extractDb = await getDbFromJWPUB({
        issue: extract.IssueTagNumber,
        langwritten: extractLang,
        pub: symbol,
      });
      const langFallback = currentSettings.value?.langFallback;
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
  langwritten: string,
  lastChance = false,
) => {
  try {
    const issue = date.subtractFromDate(monday, {
      days: weeksInPast * 7,
    });
    const issueString = date.formatDate(issue, 'YYYYMM') + '00';
    if (!langwritten) throw new Error('No language selected');
    const publication = {
      issue: issueString,
      langwritten,
      pub: 'w',
    };
    const db = await getDbFromJWPUB(publication);
    if (!db) throw new Error('No db file found: ' + issueString);
    const datedTexts = executeQuery(
      db,
      'SELECT * FROM DatedText',
    ) as DatedTextItem[];
    const weekNr = datedTexts
      ? datedTexts.findIndex((weekItem) => {
          const mondayAsNumber = parseInt(date.formatDate(monday, 'YYYYMMDD'));
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
    const mediaPromises = allMedia.map(async (m) => {
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
      return {
        duration,
        fileUrl,
        isAdditional: !!additional,
        isAudio: audio,
        isImage: isImage(m.FilePath),
        isVideo: video,
        markers: m.VideoMarkers,
        paragraph: getParagraphNumbers(m.TargetParagraphNumberLabel, m.Caption),
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
          date.formatDate(lookupDate, 'YYYYMMDD') + '-' + fileUrl,
        ),
      } as DynamicMediaObject;
    });
    return Promise.all(mediaPromises);
  } catch (e) {
    errorCatcher(e);
    return [];
  }
};

const getWeMedia = async (lookupDate: Date) => {
  try {
    const currentState = useCurrentStateStore();
    const { currentSongbook } = storeToRefs(currentState);
    const { currentSettings } = storeToRefs(currentState);
    lookupDate = dateFromString(lookupDate);
    const monday = getSpecificWeekday(lookupDate, 0);

    const getIssue = async (monday: Date, lang: string, lastChance = false) => {
      let result = await getWtIssue(monday, 8, lang);
      if (result.db?.length === 0) {
        result = await getWtIssue(monday, 10, lang, lastChance);
      }
      return result;
    };

    let { db, docId, issueString, publication, weekNr } = await getIssue(
      monday,
      currentSettings.value?.lang,
    );
    if (db?.length === 0 && currentSettings.value?.langFallback) {
      ({ db, docId, issueString, publication, weekNr } = await getIssue(
        monday,
        currentSettings.value?.langFallback,
        true,
      ));
    }
    if (!db || docId < 0) {
      return {
        error: true,
        media: [],
      };
    }
    const videos = executeQuery(
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
    ) as MultimediaItem[];
    const videosInParagraphs = videos.filter(
      (video) => !!video.TargetParagraphNumberLabel,
    );
    const videosNotInParagraphs = videos.filter(
      (video) => !video.TargetParagraphNumberLabel,
    );

    const media = (
      executeQuery(
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
           AND (KeySymbol != '${currentSongbook.value?.pub}' OR KeySymbol IS NULL)
         GROUP BY DocumentMultimedia.MultimediaId
         ORDER BY DocumentParagraph.BeginPosition`, // pictures
      ) as MultimediaItem[]
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
              !currentSettings.value?.excludeFootnotes ||
              v.TargetParagraphNumberLabel < FOOTNOTE_TAR_PAR
            );
          }),
      ) as MultimediaItem[];

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
      songs = executeQuery(
        db,
        `SELECT *
            FROM Multimedia
            INNER JOIN DocumentMultimedia
              ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId
            WHERE DataType = 2
            ORDER BY BeginParagraphOrdinal
            LIMIT 2 OFFSET ${2 * weekNr}`,
      ) as MultimediaItem[];
    } else {
      songs = videosNotInParagraphs.slice(0, 2); // after FEB_2023, the first two videos from DocumentMultimedia are the songs
    }
    let songLangs: string[] = [];
    try {
      songLangs = (
        executeQuery(
          db,
          `SELECT Extract.ExtractId, Extract.Link, DocumentExtract.BeginParagraphOrdinal
        FROM Extract
        INNER JOIN DocumentExtract ON Extract.ExtractId = DocumentExtract.ExtractId
        WHERE Extract.RefMepsDocumentClass = 31
        ORDER BY Extract.ExtractId
        LIMIT 2
        OFFSET ${2 * weekNr}`,
        ) as MultimediaExtractItem[]
      )
        .sort((a, b) => a.BeginParagraphOrdinal - b.BeginParagraphOrdinal)
        .map((item) => {
          const match = item.Link.match(/\/(.*)\//);
          const langOverride = match ? match[1].split(':')[0] : '';
          return langOverride === currentSettings.value?.lang
            ? ''
            : langOverride;
        });
    } catch (e: unknown) {
      errorCatcher(e);
      songLangs = songs.map(() => currentSettings.value?.lang);
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
          ? currentSongbook.value?.pub
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
        { db, docId } as MultimediaItemsFetcher,
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
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
    const { currentSongbook } = storeToRefs(currentState);
    lookupDate = dateFromString(lookupDate);
    // if not monday, get the previous monday
    const monday = getSpecificWeekday(lookupDate, 0);
    const issue = date.subtractFromDate(monday, {
      months: (monday.getMonth() + 1) % 2 === 0 ? 1 : 0,
    });
    const issueString = date.formatDate(issue, 'YYYYMM') + '00';
    let publication = {} as PublicationFetcher;
    const getMwbIssue = async (langwritten: string) => {
      if (!langwritten) return '';
      publication = {
        issue: issueString,
        langwritten,
        pub: 'mwb',
      };
      return await getDbFromJWPUB(publication);
    };

    let db = await getMwbIssue(currentSettings.value?.lang);
    if (!db && currentSettings.value?.langFallback) {
      db = await getMwbIssue(currentSettings.value?.langFallback);
    }
    if (!db) {
      return { error: true, media: [] };
    }
    const docId =
      (
        executeQuery(
          db,
          `SELECT DocumentId FROM DatedText WHERE FirstDateOffset = ${date.formatDate(
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
          { db, docId } as MultimediaItemsFetcher,
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
          ? currentSongbook.value?.pub
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
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
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
        currentSettings.value?.lang,
        currentSettings.value?.langFallback,
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
  try {
    const { currentSongbook, downloadProgress } = storeToRefs(
      useCurrentStateStore(),
    );
    const url = 'https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS';
    if (!publication.fileformat) publication.fileformat = '';
    if (publication.pub === 'sjjm') {
      publication.pub = currentSongbook.value?.pub;
      // publication.fileformat = currentSongbook.value?.fileformat;
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
    const response = await get(urlWithParamsToString(url, params));
    if (!response) {
      downloadProgress.value[
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
    return response as Publication;
  } catch (e) {
    errorCatcher(e);
    return {} as Publication;
  }
};

export function findBestResolution(
  mediaLinks: MediaItemsMediatorFile[] | MediaLink[],
) {
  try {
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
    let bestItem = null;
    let bestHeight = 0;
    const maxRes = parseInt(currentSettings.value?.maxRes?.replace(/\D/g, ''));
    if (mediaLinks.some((m) => !m.subtitled))
      mediaLinks = mediaLinks.filter((m) => !m.subtitled) as MediaLink[];
    for (const mediaLink of mediaLinks) {
      if (
        mediaLink.frameHeight <= maxRes &&
        mediaLink.frameHeight >= bestHeight
      ) {
        bestItem = Object.hasOwn(mediaLink, 'progressiveDownloadURL')
          ? (mediaLink as MediaItemsMediatorFile)
          : (mediaLink as MediaLink);
        bestHeight = mediaLink.frameHeight;
      }
    }
    return bestItem;
  } catch (e) {
    errorCatcher(e);
    return mediaLinks.length > 0 ? mediaLinks[mediaLinks.length - 1] : [];
  }
}

const downloadMissingMedia = async (publication: PublicationFetcher) => {
  try {
    const pubDir = getPublicationDirectory(publication);
    const responseObject = await getPubMediaLinks(publication);
    if (!responseObject?.files) {
      if (!fs.existsSync(pubDir)) return { FilePath: '' }; // Publication not found
      const files = klawSync(pubDir, {
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
        (responseObject as Publication).files[publication.langwritten],
      )[0];
    const mediaItemLinks = (responseObject as Publication).files[
      publication.langwritten
    ][publication.fileformat] as MediaLink[];
    const bestItem = findBestResolution(mediaItemLinks) as MediaLink;
    if (!bestItem?.file?.url) {
      return { FilePath: '' };
    }
    const jwMediaInfo = await getJwMediaInfo(publication);
    downloadFileIfNeeded({
      dir: pubDir,
      size: bestItem.filesize,
      url: bestItem.file.url,
    }).then(async (downloadedFile) => {
      const { currentSettings } = storeToRefs(useCurrentStateStore());
      for (const itemUrl of [
        currentSettings.value?.enableSubtitles
          ? jwMediaInfo.subtitles
          : undefined,
        jwMediaInfo.thumbnail,
      ].filter(Boolean)) {
        if (!itemUrl) continue;
        const itemFilename =
          path.basename(bestItem.file.url).split('.')[0] +
          path.extname(itemUrl);
        if (
          itemUrl &&
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
    const currentState = useCurrentStateStore();
    const { getDatedAdditionalMediaDirectory } = storeToRefs(currentState);
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
              getDatedAdditionalMediaDirectory.value,
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
        dir: getDatedAdditionalMediaDirectory.value,
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
  const emptyResponse = {
    duration: 0,
    subtitles: '',
    thumbnail: '',
    title: '',
  };
  try {
    let url = 'https://b.jw-cdn.org/apis/mediator/v1/media-items/';
    url += publication.langwritten + '/';
    url += 'pub-' + publication.pub;
    let issue = publication.issue?.toString();
    if (issue && issue.endsWith('00')) issue = issue.slice(0, -2);
    if (issue && issue !== '0') url += '_' + issue;
    if (publication.track) url += '_' + publication.track;
    if (publication.fileformat?.toLowerCase().includes('mp4')) url += '_VIDEO';
    else if (publication.fileformat?.toLowerCase().includes('mp3'))
      url += '_AUDIO';
    const responseObject: MediaItemsMediator = await get(url);
    if (responseObject?.media?.length > 0) {
      return {
        duration: responseObject.media[0].duration ?? undefined,
        subtitles:
          (
            findBestResolution(
              responseObject.media[0].files,
            ) as MediaItemsMediatorFile
          )?.subtitles?.url ?? '',
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
    const { downloadProgress } = storeToRefs(useCurrentStateStore());
    const publicationInfo = (await getPubMediaLinks(
      publication,
    )) as Publication;
    if (!publication.fileformat) return;
    if (!publicationInfo?.files) {
      downloadProgress.value[
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
    const mediaLinks = (
      publicationInfo.files[publication.langwritten][
        publication.fileformat
      ] as MediaLink[]
    ).filter(
      (mediaLink) =>
        !publication.maxTrack || mediaLink.track < publication.maxTrack,
    );

    const dir = getPublicationDirectory(publication);
    const filteredMediaItemLinks = [] as MediaLink[];
    for (const mediaItemLink of mediaLinks) {
      const currentTrack = mediaItemLink.track;
      if (!filteredMediaItemLinks.some((m) => m.track === currentTrack)) {
        const bestItem = findBestResolution(
          mediaLinks.filter((m) => m.track === currentTrack),
        ) as MediaLink;
        if (bestItem) filteredMediaItemLinks.push(bestItem);
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
    const { currentSettings, currentSongbook } = storeToRefs(
      useCurrentStateStore(),
    );
    if (
      !currentSongbook.value ||
      !currentSettings.value?.lang ||
      !currentSettings.value?.enableMusicButton
    )
      return;
    downloadPubMediaFiles({
      fileformat: currentSongbook.value?.fileformat,
      langwritten: currentSettings.value?.lang,
      maxTrack: MAX_SONGS,
      pub: currentSongbook.value?.pub,
    });
  } catch (e) {
    errorCatcher(e);
  }
};

const downloadSongbookVideos = () => {
  try {
    const { currentSettings, currentSongbook } = storeToRefs(
      useCurrentStateStore(),
    );
    if (
      !currentSongbook.value ||
      !currentSettings.value?.lang ||
      !currentSettings.value?.enableExtraCache
    )
      return;
    downloadPubMediaFiles({
      fileformat: 'MP4',
      issue: 0,
      langwritten: currentSettings.value?.lang,
      maxTrack: MAX_SONGS,
      pub: currentSongbook.value?.pub,
    });
  } catch (e) {
    errorCatcher(e);
  }
};

const downloadJwpub = async (
  publication: PublicationFetcher,
): Promise<DownloadedFile> => {
  try {
    const { downloadProgress } = storeToRefs(useCurrentStateStore());
    publication.fileformat = 'JWPUB';
    const handleDownloadError = () => {
      downloadProgress.value[
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
    const publicationInfo = (await getPubMediaLinks(
      publication,
    )) as Publication;
    if (!publicationInfo?.files) {
      return handleDownloadError();
    }
    const mediaLinks =
      (
        publicationInfo.files[publication.langwritten][
          publication.fileformat
        ] as MediaLink[]
      ).filter(
        (mediaLink) =>
          !publication.maxTrack || mediaLink.track < publication.maxTrack,
      ) || [];
    if (!mediaLinks.length) {
      return handleDownloadError();
    }

    return (await downloadFileIfNeeded({
      dir: getPublicationDirectory(publication),
      size: mediaLinks[0].filesize,
      url: mediaLinks[0].file.url,
    })) as DownloadedFile;
  } catch (e) {
    errorCatcher(e);
    return {
      new: false,
      path: '',
    };
  }
};

export {
  addFullFilePathToMultimediaItem,
  addJwpubDocumentMediaToFiles,
  downloadAdditionalRemoteVideo,
  downloadBackgroundMusic,
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
};
