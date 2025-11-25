import type {
  JwLangCode,
  MultimediaExtractItem,
  MultimediaItem,
  MultimediaItemsFetcher,
  PublicationFetcher,
  TableItemCount,
  VideoMarker,
} from 'src/types';

const { executeQuery } = window.electronApi;

import mepslangs from 'src/constants/mepslangs';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  addFullFilePathToMultimediaItem,
  getDbFromJWPUB,
} from 'src/helpers/jw-media';
import { findFile } from 'src/utils/fs';
import { useCurrentStateStore } from 'stores/current-state';

export const findDb = async (publicationDirectory: string | undefined) => {
  return findFile(publicationDirectory, '.db');
};

export const tableExists = (db: string, tableName: string) => {
  try {
    if (!db || !tableName) return false;
    return (
      executeQuery<{ name: string }>(
        db,
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
      ).length > 0
    );
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const getMediaVideoMarkers = (
  source: MultimediaItemsFetcher,
  mediaId: number,
) => {
  try {
    if (!source.db || !mediaId) return [];
    const videoMarkerTableExists = tableExists(source.db, 'VideoMarker');
    if (!videoMarkerTableExists) return [];
    const mediaVideoMarkers = executeQuery<VideoMarker>(
      source.db,
      `SELECT VideoMarkerId, Label, StartTimeTicks, DurationTicks, EndTransitionDurationTicks from VideoMarker WHERE MultimediaId = ${mediaId} ORDER by StartTimeTicks`,
    );
    return mediaVideoMarkers;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

export const getPublicationInfoFromDb = (db: string): PublicationFetcher => {
  try {
    const pubQuery = executeQuery<{
      IssueTagNumber: number;
      MepsLanguageIndex: number;
      UndatedSymbol: string;
    }>(
      db,
      'SELECT IssueTagNumber, MepsLanguageIndex, UndatedSymbol FROM Publication',
    )[0];

    if (!pubQuery) return { issue: '', langwritten: '', pub: '' };

    const publication: PublicationFetcher = {
      issue: pubQuery.IssueTagNumber,
      langwritten: mepslangs[pubQuery.MepsLanguageIndex] ?? '',
      pub: pubQuery.UndatedSymbol,
    };

    return publication;
  } catch (error) {
    errorCatcher(error);
    return { issue: '', langwritten: '', pub: '' };
  }
};

export const getMultimediaMepsLangs = (source: MultimediaItemsFetcher) => {
  try {
    if (!source.db) return [];
    const multimediaMepsLangs: {
      IssueTagNumber: number;
      KeySymbol: null | string;
      MepsLanguageIndex: number;
      Track: null | number;
    }[] = [];
    for (const table of [
      'Multimedia',
      'DocumentMultimedia',
      'ExtractMultimedia',
    ]) {
      try {
        const thisTableExists = tableExists(source.db, table);
        if (!thisTableExists) continue;
      } catch (error) {
        errorCatcher(error, {
          contexts: { fn: { name: 'getMultimediaMepsLangs', source, table } },
        });
        continue;
      }
      const columnQueryResult = executeQuery<{ name: string }>(
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
          ...executeQuery<{
            IssueTagNumber: number;
            KeySymbol: null | string;
            MepsLanguageIndex: number;
            Track: null | number;
          }>(
            source.db,
            `SELECT DISTINCT IssueTagNumber, KeySymbol, MepsLanguageIndex, Track from ${table} ORDER by KeySymbol, IssueTagNumber, Track`,
          ),
        );
    }
    return multimediaMepsLangs;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

/**
 * Get BeginParagraphOrdinal and EndParagraphOrdinal from DocumentExtract for sjj items
 * This is used to fix unreliable ordinals in DocumentMultimedia for sjjm items
 * @param db Database path
 * @param docId Document ID
 * @returns Array of ordinals sorted by SortPosition
 */
export const getSjjExtractOrdinals = (db: string, docId: number) => {
  try {
    if (!db || !docId) return [];

    // Check if required tables exist
    if (
      !tableExists(db, 'DocumentExtract') ||
      !tableExists(db, 'Extract') ||
      !tableExists(db, 'RefPublication')
    ) {
      return [];
    }

    const ordinals = executeQuery<{
      BeginParagraphOrdinal: number;
      EndParagraphOrdinal: number;
    }>(
      db,
      `SELECT DocumentExtract.BeginParagraphOrdinal, DocumentExtract.EndParagraphOrdinal
       FROM DocumentExtract
       INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId
       INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId
       WHERE DocumentExtract.DocumentId = ${docId}
       AND RefPublication.UndatedSymbol = 'sjj'
       ORDER BY DocumentExtract.SortPosition`,
    );

    return ordinals;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

export const getDocumentMultimediaItems = (
  source: MultimediaItemsFetcher,
  includePrinted: boolean | undefined,
) => {
  try {
    if (!source.db) return [];
    const DocumentMultimediaTable = window.electronApi
      .executeQuery<{
        name: string;
      }>(
        source.db,
        "SELECT name FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'",
      )
      .map((item) => item.name);
    const mmTable =
      DocumentMultimediaTable.length === 0
        ? 'Multimedia'
        : DocumentMultimediaTable[0];
    const columnQueryResult = executeQuery<{ name: string }>(
      source.db,
      `PRAGMA table_info(${mmTable})`,
    );

    const ParagraphColumnsExist = columnQueryResult.some(
      (column) => column.name === 'BeginParagraphOrdinal',
    );

    const targetParNrExists =
      window.electronApi
        .executeQuery<{
          name: string;
        }>(source.db, "PRAGMA table_info('Question')")
        .some((item) => item.name === 'TargetParagraphNumberLabel') &&
      !!executeQuery<TableItemCount>(
        source.db,
        'SELECT COUNT(*) FROM Question',
      )[0]?.count;

    const LinkMultimediaIdExists = window.electronApi
      .executeQuery<{
        name: string;
      }>(source.db, "PRAGMA table_info('Multimedia')")
      .some((item) => item.name === 'LinkMultimediaId');

    const suppressZoomExists = window.electronApi
      .executeQuery<{ name: string }>(
        source.db,
        "PRAGMA table_info('Multimedia')",
      )
      .map((item) => item.name)
      .includes('SuppressZoom');

    // Complex query with multiple joins - using SELECT * because the returned MultimediaItem objects
    // are used throughout the codebase and require all properties to be present.
    // The objects are passed to functions like addFullFilePathToMultimediaItem, dynamicMediaMapper,
    // processMissingMediaInfo, etc. which access various properties dynamically.
    // Optimizing this would require extensive refactoring of function signatures across the codebase.
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
      from += ` LEFT JOIN DocumentParagraph ON ${mmTable}.BeginParagraphOrdinal = DocumentParagraph.ParagraphIndex
                  AND DocumentParagraph.DocumentId = ${mmTable}.DocumentId`;
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
      includePrinted
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
      ? 'GROUP BY Multimedia.MultimediaId ORDER BY DocumentMultimedia.BeginParagraphOrdinal'
      : '';

    if (targetParNrExists && ParagraphColumnsExist) {
      from += ` LEFT JOIN Question ON Question.DocumentId = ${mmTable}.DocumentId AND Question.TargetParagraphOrdinal = ${mmTable}.BeginParagraphOrdinal`;
    }
    if (suppressZoomExists) {
      where += ' AND Multimedia.SuppressZoom <> 1';
    }
    const finalQuery = `${select} ${from} ${where} ${groupAndSort}`;
    const items = executeQuery<MultimediaItem>(source.db, finalQuery);
    for (const item of items) {
      if (!item) continue;
      const videoMarkers = getMediaVideoMarkers(
        { db: source.db },
        item.MultimediaId,
      );
      if (videoMarkers) item.VideoMarkers = videoMarkers;
    }

    // Hack: Fix unreliable BeginParagraphOrdinal and EndParagraphOrdinal for sjjm items
    // by mapping them from DocumentExtract (sjj) ordinals sequentially
    const sjjmItems = items.filter(
      (item) => item.KeySymbol && item.KeySymbol.includes('sjj'),
    );

    if (sjjmItems.length > 0 && (source.docId || source.docId === 0)) {
      const sjjOrdinals = getSjjExtractOrdinals(source.db, source.docId);

      if (sjjOrdinals.length > 0) {
        // Map ordinals sequentially: 1st sjjm item gets 1st sjj ordinal, etc.
        sjjmItems.forEach((item, index) => {
          const ordinal = sjjOrdinals[index];
          if (ordinal) {
            if (ordinal.BeginParagraphOrdinal !== item.BeginParagraphOrdinal) {
              console.log(
                '⚠️ BeginParagraphOrdinal mismatch for sjjm item; updating:',
                item.MultimediaId,
                'from',
                item.BeginParagraphOrdinal,
                'to',
                ordinal.BeginParagraphOrdinal,
              );
              item.BeginParagraphOrdinal = ordinal.BeginParagraphOrdinal;
            }
            if (ordinal.EndParagraphOrdinal !== item.EndParagraphOrdinal) {
              console.log(
                '⚠️ EndParagraphOrdinal mismatch for sjjm item; updating:',
                item.MultimediaId,
                'from',
                item.EndParagraphOrdinal,
                'to',
                ordinal.EndParagraphOrdinal,
              );
              item.EndParagraphOrdinal = ordinal.EndParagraphOrdinal;
            }
          }
        });

        // Re-sort all items by BeginParagraphOrdinal after mapping
        if (ParagraphColumnsExist) {
          items.sort(
            (a, b) =>
              (a.BeginParagraphOrdinal || 0) - (b.BeginParagraphOrdinal || 0),
          );
        }
      }
    }

    return items;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

export const getDocumentExtractItems = async (
  db: string,
  docId: number,
  meetingDate: string,
) => {
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

      // Get the symbol from the unique English symbol; if it contains any non-alphanumeric symbol, use it as-is; otherwise remove digits
      let symbol = /[^a-zA-Z0-9]/.test(extract.UniqueEnglishSymbol)
        ? extract.UniqueEnglishSymbol
        : extract.UniqueEnglishSymbol.replace(/\d/g, '');
      if (['it', 'snnw'].includes(symbol)) continue; // Exclude Insight and the "old new songs" songbook; we don't need images from that

      // Special handling for wp
      if (
        symbol === 'w' &&
        extract.IssueTagNumber &&
        parseInt(extract.IssueTagNumber.toString()) >= 20080101 &&
        extract.IssueTagNumber.toString().slice(-2) === '01'
      ) {
        symbol = 'wp';
      }

      let extractLang = extract.Lang ?? currentStateStore.currentSettings?.lang;
      let extractDb = await getDbFromJWPUB(
        {
          issue: extract.IssueTagNumber,
          langwritten: extractLang,
          pub: symbol,
        },
        meetingDate,
      );
      const langFallback = currentStateStore.currentSettings?.langFallback;
      if (!extractDb && langFallback) {
        extractDb = await getDbFromJWPUB(
          {
            issue: extract.IssueTagNumber,
            langwritten: langFallback,
            pub: symbol,
          },
          meetingDate,
        );
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
        const multimediaItem = extractItems[i];
        if (!multimediaItem) continue;
        const videoMarkers = getMediaVideoMarkers(
          { db: extractDb },
          multimediaItem.MultimediaId,
        );
        if (videoMarkers) multimediaItem.VideoMarkers = videoMarkers;

        extractItems[i] = await addFullFilePathToMultimediaItem(
          multimediaItem,
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
