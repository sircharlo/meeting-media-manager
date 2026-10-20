import type { MultimediaItemsFetcher } from 'src/types';

import { beforeEach, describe, expect, it, vi } from 'vitest';

// `getDocumentMultimediaItems` destructures `executeQuery` from
// `globalThis.electronApi` at module load time, so the mock must be installed
// before the module is (dynamically) imported.
describe('getDocumentMultimediaItems', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('populates video markers for every media item, preserving order', async () => {
    const executeQueryMock = vi.fn(
      async (
        _dbPath: string,
        query: string,
        params?: (null | number | string)[],
      ) => {
        if (query.includes('sqlite_master')) {
          if (query.includes("name='DocumentMultimedia'")) {
            return [{ name: 'DocumentMultimedia' }];
          }
          if (params?.[0] === 'VideoMarker') return [{ name: 'VideoMarker' }];
          return [];
        }

        if (query.includes('PRAGMA table_info')) {
          if (query.includes('DocumentMultimedia')) {
            return [
              { name: 'BeginParagraphOrdinal' },
              { name: 'EndParagraphOrdinal' },
            ];
          }
          return [];
        }

        if (query.includes('Document.*, Multimedia.*')) {
          return [{ MultimediaId: 101 }, { MultimediaId: 102 }];
        }

        if (query.includes('VideoMarkerId')) {
          const mediaId = params?.[0];
          return [
            {
              DurationTicks: 2,
              EndTransitionDurationTicks: 3,
              Label: `Marker ${String(mediaId)}`,
              StartTimeTicks: 1,
              VideoMarkerId: mediaId,
            },
          ];
        }

        return [];
      },
    );

    globalThis.electronApi.executeQuery =
      executeQueryMock as unknown as typeof globalThis.electronApi.executeQuery;

    const { getDocumentMultimediaItems } = await import('../sqlite');

    const items = await getDocumentMultimediaItems(
      { db: '/tmp/test.db', docId: 1 },
      undefined,
    );

    expect(items.map((item) => item.MultimediaId)).toEqual([101, 102]);
    expect(items[0]?.VideoMarkers?.[0]?.Label).toBe('Marker 101');
    expect(items[1]?.VideoMarkers?.[0]?.Label).toBe('Marker 102');
  });
});

// Pins the media query that getDocumentMultimediaItems builds for each shape
// of publication database it can meet.
describe('getDocumentMultimediaItems query', () => {
  interface Schema {
    documentMultimedia?: boolean;
    linkMultimediaId?: boolean;
    paragraphColumns?: boolean;
    questions?: boolean;
    suppressZoom?: boolean;
  }

  const MEDIA_FILTER = `((Multimedia.MimeType LIKE '%video%' OR Multimedia.MimeType LIKE '%audio%') OR (Multimedia.MimeType LIKE '%image%' AND Multimedia.CategoryType <> 4 AND Multimedia.CategoryType <> 6 AND Multimedia.CategoryType <> 9 AND Multimedia.CategoryType <> 10 AND Multimedia.CategoryType <> 25))`;
  const MEDIA_FILTER_WITH_PRINTED = `((Multimedia.MimeType LIKE '%video%' OR Multimedia.MimeType LIKE '%audio%') OR (Multimedia.MimeType LIKE '%image%' AND Multimedia.CategoryType <> 9 AND Multimedia.CategoryType <> 10 AND Multimedia.CategoryType <> 25))`;

  beforeEach(() => {
    vi.resetModules();
  });

  const captureQuery = async (
    schema: Schema,
    source: Omit<MultimediaItemsFetcher, 'db'>,
    includePrinted?: boolean,
  ) => {
    const captured: { params?: (null | number | string)[]; query: string } = {
      query: '',
    };
    const columns = (...names: (false | string | undefined)[]) =>
      names.filter(Boolean).map((name) => ({ name }));

    globalThis.electronApi.executeQuery = (async (
      _dbPath: string,
      query: string,
      params?: (null | number | string)[],
    ) => {
      if (query.includes("name='DocumentMultimedia'")) {
        return schema.documentMultimedia
          ? [{ name: 'DocumentMultimedia' }]
          : [];
      }
      if (query.includes('sqlite_master')) return [];
      if (
        query === 'PRAGMA table_info(DocumentMultimedia)' ||
        query === 'PRAGMA table_info(Multimedia)'
      ) {
        return schema.paragraphColumns
          ? columns('BeginParagraphOrdinal', 'EndParagraphOrdinal')
          : [];
      }
      if (query === "PRAGMA table_info('Question')") {
        return schema.questions ? columns('TargetParagraphNumberLabel') : [];
      }
      if (query === 'SELECT COUNT(*) FROM Question') return [{ count: 3 }];
      if (query === "PRAGMA table_info('Multimedia')") {
        return columns(
          schema.linkMultimediaId && 'LinkMultimediaId',
          schema.suppressZoom && 'SuppressZoom',
        );
      }
      if (query.includes('Document.*, Multimedia.*')) {
        captured.query = query;
        captured.params = params;
      }
      return [];
    }) as unknown as typeof globalThis.electronApi.executeQuery;

    const { getDocumentMultimediaItems } = await import('../sqlite');
    await getDocumentMultimediaItems(
      { db: '/tmp/test.db', ...source },
      includePrinted,
    );
    return captured;
  };

  it('filters by document id, paragraph range and zoom suppression on a full schema', async () => {
    const { params, query } = await captureQuery(
      {
        documentMultimedia: true,
        linkMultimediaId: true,
        paragraphColumns: true,
        questions: true,
        suppressZoom: true,
      },
      { BeginParagraphOrdinal: 3, docId: 5, EndParagraphOrdinal: 7, mepsId: 9 },
    );

    expect(params).toEqual([5, 3, 7]);
    expect(query).toMatch(
      /^SELECT Document\.\*, Multimedia\.\*, DocumentMultimedia\.\*, DocumentParagraph\.\*, LinkedMultimedia\.FilePath AS LinkedPreviewFilePath, COALESCE\(Question\.TargetParagraphNumberLabel, /,
    );
    expect(query).toContain(
      ' FROM Multimedia INNER JOIN DocumentMultimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId LEFT JOIN DocumentParagraph ON DocumentMultimedia.BeginParagraphOrdinal = DocumentParagraph.ParagraphIndex',
    );
    expect(query).toContain(
      ' INNER JOIN Document ON DocumentMultimedia.DocumentId = Document.DocumentId LEFT JOIN Multimedia AS LinkedMultimedia ON Multimedia.LinkMultimediaId = LinkedMultimedia.MultimediaId LEFT JOIN Question ON Question.DocumentId = DocumentMultimedia.DocumentId AND Question.TargetParagraphOrdinal = DocumentMultimedia.BeginParagraphOrdinal WHERE ',
    );
    expect(query).toContain(
      `WHERE Document.DocumentId = ? AND ${MEDIA_FILTER} AND DocumentMultimedia.BeginParagraphOrdinal >= ? AND DocumentMultimedia.EndParagraphOrdinal <= ? AND Multimedia.SuppressZoom <> 1 GROUP BY Multimedia.MultimediaId ORDER BY DocumentMultimedia.BeginParagraphOrdinal`,
    );
    expect(query.endsWith('DocumentMultimedia.BeginParagraphOrdinal')).toBe(
      true,
    );
  });

  it('treats document id 0 as a document id', async () => {
    const { params, query } = await captureQuery(
      { documentMultimedia: true },
      { docId: 0, mepsId: 9 },
    );

    expect(params).toEqual([0]);
    expect(query).toContain(
      `WHERE Document.DocumentId = ? AND ${MEDIA_FILTER} `,
    );
  });

  it('falls back to the MEPS document id without a document id', async () => {
    const { params, query } = await captureQuery(
      { documentMultimedia: true },
      { mepsId: 9 },
    );

    expect(params).toEqual([9]);
    expect(query).toContain(
      `WHERE Document.MepsDocumentId = ? AND ${MEDIA_FILTER} `,
    );
  });

  it('keeps printed-only images when asked to', async () => {
    const { query } = await captureQuery(
      { documentMultimedia: true },
      { docId: 5 },
      true,
    );

    expect(query).toContain(
      `WHERE Document.DocumentId = ? AND ${MEDIA_FILTER_WITH_PRINTED} `,
    );
  });

  it('ignores the paragraph range on a schema without paragraph columns', async () => {
    const { params, query } = await captureQuery(
      {},
      { BeginParagraphOrdinal: 3, docId: 5, EndParagraphOrdinal: 7 },
    );

    expect(params).toEqual([5]);
    expect(query).toBe(
      `SELECT Document.*, Multimedia.*  FROM Multimedia INNER JOIN Document ON Multimedia.DocumentId = Document.DocumentId WHERE Document.DocumentId = ? AND ${MEDIA_FILTER} `,
    );
  });

  it('labels paragraphs by their range when the document has no study questions', async () => {
    const { params, query } = await captureQuery(
      { documentMultimedia: true, paragraphColumns: true },
      { BeginParagraphOrdinal: 3, docId: 5 },
    );

    // Only one end of the range given: no range filter.
    expect(params).toEqual([5]);
    expect(query).not.toContain('Question');
    expect(query).toContain(
      ' END AS TargetParagraphNumberLabel  FROM Multimedia',
    );
    expect(query).toContain(
      `WHERE Document.DocumentId = ? AND ${MEDIA_FILTER} GROUP BY Multimedia.MultimediaId ORDER BY DocumentMultimedia.BeginParagraphOrdinal`,
    );
  });
});
