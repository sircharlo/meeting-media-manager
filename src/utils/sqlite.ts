import type {
  MultimediaItem,
  MultimediaItemsFetcher,
  PublicationFetcher,
  PublicationItem,
  TableItem,
  TableItemCount,
  VideoMarker,
} from 'src/types';

import mepslangs from 'src/constants/mepslangs';
import { errorCatcher } from 'src/helpers/error-catcher';
import { findFile } from 'src/utils/fs';

export const findDb = async (publicationDirectory: string | undefined) => {
  return findFile(publicationDirectory, '.db');
};

export const getMediaVideoMarkers = (
  source: MultimediaItemsFetcher,
  mediaId: number,
) => {
  try {
    const mediaVideoMarkers = window.electronApi.executeQuery<VideoMarker>(
      source.db,
      `SELECT * from VideoMarker WHERE MultimediaId = ${mediaId} ORDER by StartTimeTicks`,
    );
    return mediaVideoMarkers;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

export const getPublicationInfoFromDb = (db: string): PublicationFetcher => {
  try {
    const pubQuery = window.electronApi.executeQuery<PublicationItem>(
      db,
      'SELECT * FROM Publication',
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
    const multimediaMepsLangs: MultimediaItem[] = [];
    for (const table of [
      'Multimedia',
      'DocumentMultimedia',
      'ExtractMultimedia',
    ]) {
      // exists
      try {
        const tableExists =
          window.electronApi.executeQuery<TableItem>(
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
      const columnQueryResult = window.electronApi.executeQuery<TableItem>(
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
          ...window.electronApi.executeQuery<MultimediaItem>(
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

export const getDocumentMultimediaItems = (
  source: MultimediaItemsFetcher,
  includePrinted: boolean | undefined,
) => {
  try {
    if (!source.db) return [];
    const DocumentMultimediaTable = window.electronApi
      .executeQuery<TableItem>(
        source.db,
        "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'",
      )
      .map((item) => item.name);
    const mmTable =
      DocumentMultimediaTable.length === 0
        ? 'Multimedia'
        : DocumentMultimediaTable[0];
    const columnQueryResult = window.electronApi.executeQuery<TableItem>(
      source.db,
      `PRAGMA table_info(${mmTable})`,
    );

    const ParagraphColumnsExist = columnQueryResult.some(
      (column) => column.name === 'BeginParagraphOrdinal',
    );

    const targetParNrExists =
      window.electronApi
        .executeQuery<TableItem>(source.db, "PRAGMA table_info('Question')")
        .some((item) => item.name === 'TargetParagraphNumberLabel') &&
      !!window.electronApi.executeQuery<TableItemCount>(
        source.db,
        'SELECT COUNT(*) FROM Question',
      )[0]?.count;

    const LinkMultimediaIdExists = window.electronApi
      .executeQuery<TableItem>(source.db, "PRAGMA table_info('Multimedia')")
      .some((item) => item.name === 'LinkMultimediaId');

    const suppressZoomExists = window.electronApi
      .executeQuery<TableItem>(source.db, "PRAGMA table_info('Multimedia')")
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
      ? 'GROUP BY Multimedia.MultimediaId ORDER BY DocumentParagraph.BeginPosition'
      : '';

    if (targetParNrExists && ParagraphColumnsExist) {
      from += ` LEFT JOIN Question ON Question.DocumentId = ${mmTable}.DocumentId AND Question.TargetParagraphOrdinal = ${mmTable}.BeginParagraphOrdinal`;
    }
    if (suppressZoomExists) {
      where += ' AND Multimedia.SuppressZoom <> 1';
    }
    const items = window.electronApi.executeQuery<MultimediaItem>(
      source.db,
      `${select} ${from} ${where} ${groupAndSort}`,
    );
    return items;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};
