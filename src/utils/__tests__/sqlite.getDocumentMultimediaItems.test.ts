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
