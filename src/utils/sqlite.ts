import type {
  FileDownloader,
  JwLangCode,
  MultimediaExtractItem,
  MultimediaItem,
  MultimediaItemsFetcher,
  PublicationFetcher,
  TableItemCount,
  VideoMarker,
} from 'src/types';

const { executeQuery, join } = globalThis.electronApi;

import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
import { findFile, getPublicationDirectory } from 'src/utils/fs';
import { decodeEntities } from 'src/utils/general';
import { useCurrentStateStore } from 'stores/current-state';

let getDbFromJWPUBProvider:
  | ((
      publication: PublicationFetcher,
      meetingDate?: string,
      progressCategory?: FileDownloader['progressCategory'],
    ) => Promise<null | string>)
  | null = null;
let getJwLangCodeProvider: ((mepsId?: number) => JwLangCode | null) | null =
  null;

/**
 * Registers providers for sqlite utilities to avoid circular dependencies.
 */
export const registerSqliteProviders = (providers: {
  getDbFromJWPUB: (
    publication: PublicationFetcher,
    meetingDate?: string,
    progressCategory?: FileDownloader['progressCategory'],
  ) => Promise<null | string>;
  getJwLangCode: (mepsId?: number) => JwLangCode | null;
}) => {
  getDbFromJWPUBProvider = providers.getDbFromJWPUB;
  getJwLangCodeProvider = providers.getJwLangCode;
};

const getDbFromJWPUB = async (
  publication: PublicationFetcher,
  meetingDate?: string,
  progressCategory?: FileDownloader['progressCategory'],
) => {
  if (!getDbFromJWPUBProvider) {
    throw new Error('getDbFromJWPUBProvider not registered');
  }
  return getDbFromJWPUBProvider(publication, meetingDate, progressCategory);
};

const getJwLangCode = (mepsId?: number) => {
  if (!getJwLangCodeProvider) {
    throw new Error('getJwLangCodeProvider not registered');
  }
  return getJwLangCodeProvider(mepsId);
};

export async function addFullFilePathToMultimediaItem(
  multimediaItem: MultimediaItem,
  publication: PublicationFetcher,
): Promise<MultimediaItem> {
  try {
    const paths = [
      'FilePath',
      'LinkedPreviewFilePath',
      'CoverPictureFilePath',
    ] as const;

    const baseDir = await getPublicationDirectory(publication);

    for (const pathKey of paths) {
      if (multimediaItem[pathKey]) {
        multimediaItem[pathKey] = join(baseDir, multimediaItem[pathKey]);
      }
    }
    return multimediaItem;
  } catch (error) {
    errorCatcher(error);
    return multimediaItem;
  }
}

export const findDb = async (publicationDirectory: string | undefined) => {
  return findFile(publicationDirectory, '.db');
};

export const tableExists = (db: string, tableName: string) => {
  try {
    if (!db || !tableName) return false;
    return (
      executeQuery<{ name: string }>(
        db,
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName],
      ).length > 0
    );
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const publicationTitleColumns = [
  'DisplayTitle',
  'ShortTitle',
  'Title',
  'ReferenceTitle',
  'UndatedReferenceTitle',
  'DisplayTitleRich',
  'ShortTitleRich',
  'TitleRich',
  'ReferenceTitleRich',
  'UndatedReferenceTitleRich',
  'Symbol',
  'UndatedSymbol',
  'UniqueSymbol',
  'EnglishSymbol',
  'UniqueEnglishSymbol',
  'RootSymbol',
];

const cleanPublicationTitle = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return decodeEntities(value).trim();
};

export const getPublicationTitleFromDb = (db: string) => {
  try {
    if (!db || !tableExists(db, 'Publication')) return '';

    const columns = new Set(
      executeQuery<{ name: string }>(db, 'PRAGMA table_info(Publication)').map(
        (column) => column.name,
      ),
    );
    const availableTitleColumns = publicationTitleColumns.filter((column) =>
      columns.has(column),
    );
    if (!availableTitleColumns.length) return '';

    const publication = executeQuery<Record<string, unknown>>(
      db,
      `SELECT ${availableTitleColumns.join(', ')} FROM Publication LIMIT 1`,
    )[0];
    if (!publication) return '';

    return (
      availableTitleColumns
        .map((column) => cleanPublicationTitle(publication[column]))
        .find(Boolean) ?? ''
    );
  } catch (error) {
    errorCatcher(error);
    return '';
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
      'SELECT VideoMarkerId, Label, StartTimeTicks, DurationTicks, EndTransitionDurationTicks from VideoMarker WHERE MultimediaId = ? ORDER by StartTimeTicks',
      [mediaId],
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
      langwritten: getJwLangCode(pubQuery.MepsLanguageIndex) ?? '',
      pub: pubQuery.UndatedSymbol,
    };

    return publication;
  } catch (error) {
    errorCatcher(error);
    return { issue: '', langwritten: '', pub: '' };
  }
};

export const getMepsLanguagesByMediaItem = (source: MultimediaItemsFetcher) => {
  try {
    if (!source.db) return [];
    const mepsLanguagesByMediaItem: {
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
          contexts: {
            fn: { name: 'getMepsLanguagesByMediaItem', source, table },
          },
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
        mepsLanguagesByMediaItem.push(
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

    const filterSjjm = (items: typeof mepsLanguagesByMediaItem) => {
      // Build a set of sjj keys (IssueTagNumber + Track)
      const sjjSet = new Set(
        items
          .filter((i) => i.KeySymbol === 'sjj')
          .map((i) => `${i.IssueTagNumber}-${i.Track}`),
      );

      return items.filter((item) => {
        if (item.KeySymbol !== 'sjjm') return true;

        const key = `${item.IssueTagNumber}-${item.Track}`;

        // If equivalent sjj exists → remove sjjm
        return !sjjSet.has(key);
      });
    };

    return filterSjjm(mepsLanguagesByMediaItem);
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
      SortPosition: number;
    }>(
      db,
      `SELECT DocumentExtract.BeginParagraphOrdinal, DocumentExtract.EndParagraphOrdinal, DocumentExtract.SortPosition
       FROM DocumentExtract
       INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId
       INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId
       WHERE DocumentExtract.DocumentId = ?
       AND RefPublication.UndatedSymbol = 'sjj'
       ORDER BY DocumentExtract.SortPosition`,
      [docId],
    );

    return ordinals;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

const getDbMetadata = (db: string) => {
  const DocumentMultimediaTable = executeQuery<{ name: string }>(
    db,
    "SELECT name FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'",
  ).map((item) => item.name);

  const mmTable =
    DocumentMultimediaTable.length === 0
      ? 'Multimedia'
      : DocumentMultimediaTable[0];

  const columnQueryResult = executeQuery<{ name: string }>(
    db,
    `PRAGMA table_info(${mmTable})`,
  );

  const ParagraphColumnsExist = columnQueryResult.some(
    (column) => column.name === 'BeginParagraphOrdinal',
  );

  const QuestionTableInfo = executeQuery<{ name: string }>(
    db,
    "PRAGMA table_info('Question')",
  );

  const targetParNrExists =
    QuestionTableInfo.some(
      (item) => item.name === 'TargetParagraphNumberLabel',
    ) &&
    !!executeQuery<TableItemCount>(db, 'SELECT COUNT(*) FROM Question')[0]
      ?.count;

  const MultimediaTableInfo = executeQuery<{ name: string }>(
    db,
    "PRAGMA table_info('Multimedia')",
  );

  const LinkMultimediaIdExists = MultimediaTableInfo.some(
    (item) => item.name === 'LinkMultimediaId',
  );

  const suppressZoomExists = MultimediaTableInfo.some(
    (item) => item.name === 'SuppressZoom',
  );

  return {
    LinkMultimediaIdExists,
    mmTable,
    ParagraphColumnsExist,
    suppressZoomExists,
    targetParNrExists,
  };
};

const buildDocumentMultimediaQuery = (
  db: string,
  source: MultimediaItemsFetcher,
  includePrinted: boolean | undefined,
) => {
  const {
    LinkMultimediaIdExists,
    mmTable,
    ParagraphColumnsExist,
    suppressZoomExists,
    targetParNrExists,
  } = getDbMetadata(db);

  let select = 'SELECT Document.*, Multimedia.*';
  if (mmTable === 'DocumentMultimedia') select += ', DocumentMultimedia.*';
  if (ParagraphColumnsExist) select += ', DocumentParagraph.*';
  if (LinkMultimediaIdExists)
    select += ', LinkedMultimedia.FilePath AS LinkedPreviewFilePath';

  let from = ' FROM Multimedia';
  if (mmTable === 'DocumentMultimedia') {
    from +=
      ' INNER JOIN DocumentMultimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId';
    from += ` LEFT JOIN DocumentParagraph ON ${mmTable}.BeginParagraphOrdinal = DocumentParagraph.ParagraphIndex
                AND DocumentParagraph.DocumentId = ${mmTable}.DocumentId`;
  }
  from += ` INNER JOIN Document ON ${mmTable}.DocumentId = Document.DocumentId`;
  if (LinkMultimediaIdExists) {
    from +=
      ' LEFT JOIN Multimedia AS LinkedMultimedia ON Multimedia.LinkMultimediaId = LinkedMultimedia.MultimediaId';
  }
  if (targetParNrExists && ParagraphColumnsExist) {
    from += ` LEFT JOIN Question ON Question.DocumentId = ${mmTable}.DocumentId AND Question.TargetParagraphOrdinal = ${mmTable}.BeginParagraphOrdinal`;
  }

  const params: (number | string)[] = [];
  let where = 'WHERE ';
  if (source.docId || source.docId === 0) {
    where += 'Document.DocumentId = ?';
    params.push(source.docId);
  } else {
    where += 'Document.MepsDocumentId = ?';
    params.push(source.mepsId as number);
  }

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
    where += ` AND ${mmTable}.BeginParagraphOrdinal >= ? AND ${mmTable}.EndParagraphOrdinal <= ?`;
    params.push(
      source.BeginParagraphOrdinal || 0,
      source.EndParagraphOrdinal || 0,
    );
  }

  if (suppressZoomExists) {
    where += ' AND Multimedia.SuppressZoom <> 1';
  }

  const groupAndSort = ParagraphColumnsExist
    ? 'GROUP BY Multimedia.MultimediaId ORDER BY DocumentMultimedia.BeginParagraphOrdinal'
    : '';

  return {
    ParagraphColumnsExist,
    params,
    query: `${select} ${from} ${where} ${groupAndSort}`,
  };
};

const fixSjjmItems = (
  items: MultimediaItem[],
  db: string,
  docId: number | undefined,
  ParagraphColumnsExist: boolean,
) => {
  const sjjmItems = items.filter((item) => item?.KeySymbol?.includes('sjj'));
  if (sjjmItems.length === 0 || docId === undefined) return;

  const sjjOrdinals = getSjjExtractOrdinals(db, docId);
  if (sjjOrdinals.length === 0) return;

  // Capture original ordinals to reliably identify "between" items
  const originalOrdinals = new Map<number, number>();
  items.forEach((item) => {
    originalOrdinals.set(item.MultimediaId, item.BeginParagraphOrdinal || 0);
  });

  // 1. Map sjjm items sequentially: 1st sjjm item gets 1st sjj ordinal, etc.
  sjjmItems.forEach((item, index) => {
    const ordinal = sjjOrdinals[index];
    if (ordinal) {
      if (ordinal.BeginParagraphOrdinal !== item.BeginParagraphOrdinal) {
        log(
          '⚠️ BeginParagraphOrdinal mismatch for sjjm item; updating:',
          'sqlite',
          'log',
          item.MultimediaId,
          'from',
          item.BeginParagraphOrdinal,
          'to',
          ordinal.BeginParagraphOrdinal,
        );
        item.BeginParagraphOrdinal = ordinal.BeginParagraphOrdinal;
      }
      if (ordinal.EndParagraphOrdinal !== item.EndParagraphOrdinal) {
        log(
          '⚠️ EndParagraphOrdinal mismatch for sjjm item; updating:',
          'sqlite',
          'log',
          item.MultimediaId,
          'from',
          item.EndParagraphOrdinal,
          'to',
          ordinal.EndParagraphOrdinal,
        );
        item.EndParagraphOrdinal = ordinal.EndParagraphOrdinal;
      }
      if (ordinal.SortPosition !== item.BeginPosition) {
        log(
          '⚠️ SortPosition mismatch for sjjm item; updating:',
          'sqlite',
          'log',
          item.MultimediaId,
          'from',
          item.BeginPosition,
          'to',
          ordinal.SortPosition,
        );
        item.BeginPosition = ordinal.SortPosition;
      }
    }
  });

  // 2. Fix items between sjjm items by incrementing ordinals
  for (let i = 0; i < sjjmItems.length - 1; i++) {
    const current = sjjmItems[i];
    const next = sjjmItems[i + 1];
    if (!current || !next) continue;

    const currentOrigP = originalOrdinals.get(current.MultimediaId) || 0;
    const nextOrigP = originalOrdinals.get(next.MultimediaId) || 0;

    const betweenItems = items.filter((item) => {
      const origP = originalOrdinals.get(item.MultimediaId) || 0;
      return (
        origP > currentOrigP && origP < nextOrigP && !sjjmItems.includes(item)
      );
    });

    if (betweenItems.length > 0) {
      betweenItems.sort((a, b) => {
        const aP = originalOrdinals.get(a.MultimediaId) || 0;
        const bP = originalOrdinals.get(b.MultimediaId) || 0;
        return aP - bP;
      });

      let lastP = current.BeginParagraphOrdinal || 0;
      let lastS = current.BeginPosition || 0;

      betweenItems.forEach((item) => {
        lastP++;
        lastS++;
        log(
          '⚠️ Incrementing ordinals for item between sjjm items:',
          'sqlite',
          'log',
          item.MultimediaId,
          'to p:',
          lastP,
          's:',
          lastS,
        );
        item.BeginParagraphOrdinal = lastP;
        item.EndParagraphOrdinal = lastP;
        item.BeginPosition = lastS;
      });
    }
  }

  // Re-sort all items by BeginParagraphOrdinal after mapping
  if (ParagraphColumnsExist) {
    items.sort(
      (a, b) => (a.BeginParagraphOrdinal || 0) - (b.BeginParagraphOrdinal || 0),
    );
  }
};

export const getDocumentMultimediaItems = (
  source: MultimediaItemsFetcher,
  includePrinted: boolean | undefined,
) => {
  try {
    if (!source.db) return [];

    const { ParagraphColumnsExist, params, query } =
      buildDocumentMultimediaQuery(source.db, source, includePrinted);

    const items = executeQuery<MultimediaItem>(source.db, query, params);

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
    fixSjjmItems(items, source.db, source.docId, ParagraphColumnsExist);

    return items;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

const getExtractLanguage = (
  extract: MultimediaExtractItem,
  defaultLang: JwLangCode,
): JwLangCode => {
  if (extract.Link) {
    try {
      const matches = extract.Link.match(/\/(.*)\//);
      if (matches && matches.length > 0) {
        return (matches.pop()?.split(':')[0] || '') as JwLangCode;
      }
    } catch (e: unknown) {
      errorCatcher(e);
    }
  }
  return extract.Lang ?? defaultLang;
};

const getExtractSymbol = (
  uniqueEnglishSymbol: string,
  issueTagNumber?: number | string,
): string => {
  let symbol = /[^a-zA-Z0-9]/.test(uniqueEnglishSymbol)
    ? uniqueEnglishSymbol
    : uniqueEnglishSymbol.replaceAll(/\d/g, '');

  if (
    symbol === 'w' &&
    issueTagNumber &&
    Number.parseInt(issueTagNumber.toString()) >= 20080101 &&
    issueTagNumber.toString().endsWith('01')
  ) {
    symbol = 'wp';
  }
  return symbol;
};

const getMultimediaRequestParams = (
  symbol: string,
  extract: MultimediaExtractItem,
  db: string,
  lang: JwLangCode,
) => {
  const params: MultimediaItemsFetcher = {
    db,
    lang,
    mepsId: extract.RefMepsDocumentId,
  };

  if (extract.RefBeginParagraphOrdinal) {
    params.BeginParagraphOrdinal =
      ['bt', 'lff', 'lmd'].includes(symbol) &&
      extract.RefBeginParagraphOrdinal < 8
        ? 1
        : extract.RefBeginParagraphOrdinal;
  }

  if (extract.RefEndParagraphOrdinal) {
    params.EndParagraphOrdinal = extract.RefEndParagraphOrdinal;
  }

  return params;
};

const getExtractMultimedia = async (
  extract: MultimediaExtractItem,
  meetingDate: string,
  defaultLang: JwLangCode,
  settings: ReturnType<typeof useCurrentStateStore>['currentSettings'],
  isSignLanguage: boolean | undefined,
): Promise<MultimediaItem[]> => {
  const extractLangOrig = getExtractLanguage(extract, defaultLang);
  const symbol = getExtractSymbol(
    extract.UniqueEnglishSymbol,
    extract.IssueTagNumber,
  );

  if (['it', 'snnw'].includes(symbol)) return [];

  let extractLang = extractLangOrig;
  let extractDb = await getDbFromJWPUB(
    {
      issue: extract.IssueTagNumber,
      langwritten: extractLang,
      pub: symbol,
    },
    meetingDate,
  );

  if (!extractDb && settings?.langFallback) {
    extractLang = settings.langFallback;
    extractDb = await getDbFromJWPUB(
      {
        issue: extract.IssueTagNumber,
        langwritten: extractLang,
        pub: symbol,
      },
      meetingDate,
    );
  }

  if (!extractDb) return [];

  const requestParams = getMultimediaRequestParams(
    symbol,
    extract,
    extractDb,
    extractLang,
  );

  const extractItems = getDocumentMultimediaItems(
    requestParams,
    settings?.includePrinted,
  )
    .map((extractItem): MultimediaItem => ({
      ...extractItem,
      BeginParagraphOrdinal: extract.BeginParagraphOrdinal,
      EndParagraphOrdinal: extract.EndParagraphOrdinal,
      ExtractCaption: extract.ExtractCaption,
    }))
    .filter(
      (extractItem) =>
        isSignLanguage ||
        !(symbol === 'lmd' && extractItem.MimeType.includes('video')),
    );

  for (let i = 0; i < extractItems.length; i++) {
    const item = extractItems[i];
    if (!item) continue;

    const videoMarkers = getMediaVideoMarkers(
      { db: extractDb },
      item.MultimediaId,
    );
    if (videoMarkers) item.VideoMarkers = videoMarkers;

    extractItems[i] = await addFullFilePathToMultimediaItem(item, {
      issue: extract.IssueTagNumber,
      langwritten: extractLang,
      pub: symbol,
    });
  }

  return extractItems;
};

export const getDocumentExtractItems = async (
  db: string,
  docId: number,
  meetingDate: string,
) => {
  try {
    const currentStateStore = useCurrentStateStore();
    const settings = currentStateStore.currentSettings;
    const defaultLang = settings?.lang || 'E';

    const extracts = executeQuery<MultimediaExtractItem>(
      db,
      `SELECT DocumentExtract.BeginParagraphOrdinal,DocumentExtract.EndParagraphOrdinal,DocumentExtract.DocumentId,
      Extract.RefMepsDocumentId,Extract.RefPublicationId,Extract.RefMepsDocumentId,UniqueEnglishSymbol,IssueTagNumber,
      Extract.RefBeginParagraphOrdinal,Extract.RefEndParagraphOrdinal, Extract.Link, Extract.Caption as ExtractCaption
    FROM DocumentExtract
      INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId
      INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId
      INNER JOIN Document ON DocumentExtract.DocumentId = Document.DocumentId
    WHERE DocumentExtract.DocumentId = ?
    AND NOT UniqueEnglishSymbol LIKE 'mwbr%'
    AND NOT UniqueEnglishSymbol = 'sjj'
    ${settings?.excludeTh ? "AND NOT UniqueEnglishSymbol = 'th' " : ''}
    ORDER BY DocumentExtract.BeginParagraphOrdinal`,
      [docId],
    );

    const allExtractItems: MultimediaItem[] = [];

    for (const extract of extracts) {
      const extractItems = await getExtractMultimedia(
        extract,
        meetingDate,
        defaultLang,
        settings,
        currentStateStore.currentLangObject?.isSignLanguage,
      );
      allExtractItems.push(...extractItems);
    }
    return allExtractItems;
  } catch (e: unknown) {
    errorCatcher(e);
    return [];
  }
};
