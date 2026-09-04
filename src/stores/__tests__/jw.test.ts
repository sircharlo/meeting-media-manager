import type { DateInfo, MediaItem } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addUniqueByIdAt,
  deduplicateById,
  replaceMissingMediaByPubMediaId,
  shouldUpdateList,
  useJwStore,
} from '../jw';

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

vi.mock('src/utils/api', () => ({
  fetchJwLanguages: vi.fn(),
  fetchMemorials: vi.fn(),
  fetchPubMediaLinks: vi.fn(),
  fetchRaw: vi.fn(),
  fetchYeartext: vi.fn(),
}));

vi.mock('src/utils/date', () => ({
  dateFromString: vi.fn((value) => new Date(value)),
  datesAreSame: vi.fn(),
  getDateDiff: vi.fn(),
  isInPast: vi.fn(),
}));

vi.mock('src/utils/jw', () => ({
  findBestResolution: vi.fn(),
  isMediaLink: vi.fn(),
}));

describe('JW Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('shouldUpdateList', () => {
    it('should return true for undefined cache list', () => {
      expect(shouldUpdateList(undefined, 6)).toBe(true);
    });

    it('should return true for empty list', () => {
      const emptyList = { list: [], updated: new Date() };
      expect(shouldUpdateList(emptyList, 6)).toBe(true);
    });

    it('should return true when cache is older than specified months', async () => {
      const dateUtils = await import('src/utils/date');
      vi.mocked(dateUtils.getDateDiff).mockReturnValue(7);

      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 7);
      const oldList = { list: ['item'], updated: oldDate };
      expect(shouldUpdateList(oldList, 6)).toBe(true);
    });

    it('should return false when cache is within specified months', async () => {
      const dateUtils = await import('src/utils/date');
      vi.mocked(dateUtils.getDateDiff).mockReturnValue(2);

      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 2);
      const recentList = { list: ['item'], updated: recentDate };
      expect(shouldUpdateList(recentList, 6)).toBe(false);
    });
  });

  describe('addUniqueByIdAt', () => {
    it('should add unique items to target array at the given index', () => {
      const target = [{ name: 'Item 1', uniqueId: '1' }];
      const source = [
        { name: 'Item 2', uniqueId: '2' },
        { name: 'Item 3', uniqueId: '3' },
      ];

      addUniqueByIdAt(target, source, 0);

      expect(target).toHaveLength(3);
      expect(target.map((item) => item.uniqueId)).toEqual(['2', '3', '1']);
    });

    it('should not add duplicate items', () => {
      const target = [{ name: 'Item 1', uniqueId: '1' }];
      const source = [
        { name: 'Item 1 Duplicate', uniqueId: '1' },
        { name: 'Item 2', uniqueId: '2' },
      ];

      addUniqueByIdAt(target, source, 0);

      expect(target).toHaveLength(2);
      expect(target.map((item) => item.uniqueId)).toEqual(['2', '1']);
    });

    it('should append unique items to the end of the array', () => {
      const target = [{ name: 'Item 1', uniqueId: '1' }];
      const source = [
        { name: 'Item 2', uniqueId: '2' },
        { name: 'Item 3', uniqueId: '3' },
      ];

      addUniqueByIdAt(target, source, target.length);

      expect(target.map((item) => item.uniqueId)).toEqual(['1', '2', '3']);
    });
  });

  describe('deduplicateById', () => {
    it('should remove duplicate items from array', () => {
      const array = [
        { name: 'Item 1', uniqueId: '1' },
        { name: 'Item 2', uniqueId: '2' },
        { name: 'Item 1 Duplicate', uniqueId: '1' },
        { name: 'Item 3', uniqueId: '3' },
      ];

      deduplicateById(array);

      expect(array).toHaveLength(3);
      expect(array.map((item) => item.uniqueId)).toEqual(['1', '2', '3']);
    });

    it('should keep first occurrence of duplicate items', () => {
      const array = [
        { name: 'First Item 1', uniqueId: '1' },
        { name: 'Item 2', uniqueId: '2' },
        { name: 'Second Item 1', uniqueId: '1' },
      ];

      deduplicateById(array);

      expect(array).toHaveLength(2);
      expect(array[0]?.name).toBe('First Item 1');
    });
  });

  describe('replaceMissingMediaByPubMediaId (FE-2)', () => {
    const buildDay = (existingItem: Partial<MediaItem>): DateInfo =>
      ({
        date: new Date(),
        mediaSections: [
          {
            config: { uniqueId: 'tgw' },
            items: [
              {
                source: 'dynamic',
                title: 'Original title',
                type: 'media',
                uniqueId: 'existing-1',
                ...existingItem,
              },
            ],
          },
        ],
        status: 'complete',
      }) as DateInfo;

    it('replaces a placeholder item unconditionally', () => {
      const day = buildDay({
        fileUrl: 'pub-media-1',
        pubMediaId: 'pub-media-1',
      });
      const incoming = {
        duration: 120,
        fileUrl: 'file:///cache/new.mp4',
        hidden: false,
        pubMediaId: 'pub-media-1',
        sortOrderOriginal: 5,
        source: 'dynamic',
        title: 'Fetched title',
        type: 'media',
        uniqueId: 'existing-1',
      } as MediaItem;

      replaceMissingMediaByPubMediaId(day, { tgw: [incoming] });

      expect(day.mediaSections[0]?.items?.[0]).toEqual(incoming);
    });

    it('does not replace an already-resolved item when duration and title are unchanged', () => {
      const day = buildDay({
        duration: 120,
        fileUrl: 'file:///cache/existing.mp4',
        hidden: true,
        pubMediaId: 'pub-media-1',
        sortOrderOriginal: 3,
      });
      const incoming = {
        duration: 120,
        fileUrl: 'file:///cache/different-path-same-content.mp4',
        pubMediaId: 'pub-media-1',
        source: 'dynamic',
        title: 'Original title',
        type: 'media',
        uniqueId: 'existing-1',
      } as MediaItem;

      replaceMissingMediaByPubMediaId(day, { tgw: [incoming] });

      const stored = day.mediaSections[0]?.items?.[0];
      expect(stored?.fileUrl).toBe('file:///cache/existing.mp4');
      expect(stored?.hidden).toBe(true);
      expect(stored?.sortOrderOriginal).toBe(3);
    });

    it('replaces an already-resolved item when JW.org content (duration) has genuinely changed, preserving hidden/sortOrderOriginal', () => {
      const day = buildDay({
        duration: 120,
        fileUrl: 'file:///cache/existing.mp4',
        hidden: true,
        pubMediaId: 'pub-media-1',
        sortOrderOriginal: 3,
      });
      const incoming = {
        duration: 180,
        fileUrl: 'file:///cache/corrected.mp4',
        pubMediaId: 'pub-media-1',
        source: 'dynamic',
        title: 'Original title',
        type: 'media',
        uniqueId: 'existing-1',
      } as MediaItem;

      replaceMissingMediaByPubMediaId(day, { tgw: [incoming] });

      const stored = day.mediaSections[0]?.items?.[0];
      expect(stored?.duration).toBe(180);
      expect(stored?.fileUrl).toBe('file:///cache/corrected.mp4');
      // User customizations survive the content swap.
      expect(stored?.hidden).toBe(true);
      expect(stored?.sortOrderOriginal).toBe(3);
    });

    it('replaces an already-resolved item when the title (e.g. a caption correction) has changed', () => {
      const day = buildDay({
        duration: 120,
        fileUrl: 'file:///cache/existing.mp4',
        pubMediaId: 'pub-media-1',
      });
      const incoming = {
        duration: 120,
        fileUrl: 'file:///cache/existing.mp4',
        pubMediaId: 'pub-media-1',
        source: 'dynamic',
        title: 'Corrected caption',
        type: 'media',
        uniqueId: 'existing-1',
      } as MediaItem;

      replaceMissingMediaByPubMediaId(day, { tgw: [incoming] });

      expect(day.mediaSections[0]?.items?.[0]?.title).toBe('Corrected caption');
    });
  });

  describe('updateMemorials', () => {
    it('does not fetch memorial dates while offline', async () => {
      const store = useJwStore();
      const api = await import('src/utils/api');

      await store.updateMemorials(false);

      expect(api.fetchMemorials).not.toHaveBeenCalled();
    });

    it('does not fetch memorial dates when the current year date is still future', async () => {
      const store = useJwStore();
      const currentYear = new Date().getFullYear();
      const api = await import('src/utils/api');
      const dateUtils = await import('src/utils/date');
      store.memorials[currentYear] = '2099/04/12';
      vi.mocked(dateUtils.isInPast).mockReturnValue(false);

      await store.updateMemorials(true);

      expect(api.fetchMemorials).not.toHaveBeenCalled();
    });

    it('refreshes memorial dates when the saved memorial date is in the past', async () => {
      const store = useJwStore();
      const currentYear = new Date().getFullYear();
      const api = await import('src/utils/api');
      const dateUtils = await import('src/utils/date');
      store.memorials[currentYear] = '2020/04/07';
      vi.mocked(dateUtils.isInPast).mockReturnValue(true);
      vi.mocked(api.fetchMemorials).mockResolvedValue({
        [currentYear]: '2099/04/12',
      });

      await store.updateMemorials(true);

      expect(api.fetchMemorials).toHaveBeenCalledTimes(1);
      expect(store.memorials[currentYear]).toBe('2099/04/12');
    });

    it('leaves existing memorial dates unchanged when the API is unavailable', async () => {
      const store = useJwStore();
      const currentYear = new Date().getFullYear();
      const api = await import('src/utils/api');
      store.memorials[currentYear] = '2020/04/07';
      vi.mocked(api.fetchMemorials).mockResolvedValue(null);

      await store.updateMemorials(true);

      expect(store.memorials[currentYear]).toBe('2020/04/07');
    });
  });

  describe('updateJwLanguages', () => {
    it('skips language refreshes while offline', async () => {
      const store = useJwStore();
      const api = await import('src/utils/api');

      await store.updateJwLanguages(false);

      expect(api.fetchJwLanguages).not.toHaveBeenCalled();
    });

    it('stores freshly fetched languages when the cache is stale', async () => {
      const store = useJwStore();
      const api = await import('src/utils/api');
      const dateUtils = await import('src/utils/date');
      vi.mocked(dateUtils.getDateDiff).mockReturnValue(6);
      vi.mocked(api.fetchJwLanguages).mockResolvedValue([
        {
          altSpellings: [],
          direction: 'ltr',
          hasWebContent: true,
          isCounted: true,
          isSignLanguage: false,
          langcode: 'E',
          name: 'English',
          script: 'Latn',
          symbol: 'en',
          vernacularName: 'English',
        },
      ]);

      await store.updateJwLanguages(true);

      expect(api.fetchJwLanguages).toHaveBeenCalledWith('jw.org');
      expect(store.jwLanguages.list).toHaveLength(1);
    });
  });

  describe('updateJwIconsUrl', () => {
    it('leaves the url empty when offline css does not expose jw-icons', async () => {
      // No hardcoded fallback: The website rotates this asset's hash
      // periodically, so a baked-in URL would just go stale and 404.
      const store = useJwStore();
      const api = await import('src/utils/api');
      vi.mocked(api.fetchRaw)
        .mockResolvedValueOnce(
          new Response(
            '<html><head><link href="/styles/site.css"></head></html>',
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            '@font-face { font-family: "other-font"; src: url("https://cdn.example.com/other.woff2") format("woff2"); }',
            { status: 200 },
          ),
        );

      await store.updateJwIconsUrl();

      expect(store.jwIconsUrl).toBe('');
      expect(store.fontUrls['jw-icons-all']).toBe('');
    });

    it('stores the discovered jw-icons font url when css is available', async () => {
      const store = useJwStore();
      const api = await import('src/utils/api');
      vi.mocked(api.fetchRaw)
        .mockResolvedValueOnce(
          new Response(
            '<html><head><link href="/styles/site.css"></head></html>',
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            '@font-face { font-family: "jw-icons"; src: url("/assets/fonts/jw-icons.woff2") format("woff2"); }',
            { status: 200 },
          ),
        );

      await store.updateJwIconsUrl();

      expect(store.jwIconsUrl).toBe(
        'https://wol.jw.org/assets/fonts/jw-icons.woff2',
      );
      expect(store.fontUrls['jw-icons-all']).toBe(
        'https://wol.jw.org/assets/fonts/jw-icons.woff2',
      );
    });

    // SEC-3 (full-audit-2026-09-04.md): these URLs load real font files from
    // a third-party CDN - pinned to a specific version rather than `@latest`
    // so a future fontsource release can't be served automatically with no
    // review on this project's side.
    it('pins jsdelivr fontsource URLs to a specific version, not @latest', () => {
      const store = useJwStore();

      expect(store.fontUrls.NotoSans).not.toContain('@latest');
      expect(store.fontUrls.NotoSans).toMatch(
        /^https:\/\/cdn\.jsdelivr\.net\/fontsource\/fonts\/noto-sans:vf@\d+\.\d+\.\d+\//,
      );
      expect(store.fontUrls.AbyssinicaSIL).not.toContain('@latest');
    });
  });

  describe('addToAdditionMediaMap', () => {
    it('does not crash when an existing lookup period predates mediaSections being populated', async () => {
      const dateUtils = await import('src/utils/date');
      vi.mocked(dateUtils.datesAreSame).mockReturnValue(true);

      const store = useJwStore();
      const selectedDate = new Date('2026-08-14');
      // Matches the shape behind MMM-V2-3GK: an existing period object in
      // lookupPeriod whose mediaSections was never populated.
      store.lookupPeriod['cong-1'] = [
        {
          date: selectedDate,
          status: null,
        } as unknown as DateInfo,
      ];

      const mediaItem = {
        title: 'Test media',
        type: 'media',
        uniqueId: 'm1',
      };

      store.addToAdditionMediaMap(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [mediaItem as any],
        'imported-media',
        'cong-1',
        { date: selectedDate, mediaSections: [], status: null },
        false,
      );

      expect(errorCatcher).not.toHaveBeenCalled();
      expect(store.lookupPeriod['cong-1']?.[0]?.mediaSections).toEqual([
        expect.objectContaining({
          config: expect.objectContaining({ uniqueId: 'imported-media' }),
          items: [mediaItem],
        }),
      ]);
    });
  });

  describe('updateYeartextFontUrls', () => {
    it('does not report transient network failures to Sentry', async () => {
      const store = useJwStore();
      const api = await import('src/utils/api');
      vi.mocked(api.fetchRaw).mockRejectedValue(
        new TypeError('Failed to fetch (wol.jw.org)'),
      );

      await store.updateYeartextFontUrls();

      expect(errorCatcher).not.toHaveBeenCalled();
    });

    it('reports non-network failures to Sentry', async () => {
      const store = useJwStore();
      const api = await import('src/utils/api');
      vi.mocked(api.fetchRaw).mockRejectedValue(
        new Error('Unexpected parse failure'),
      );

      await store.updateYeartextFontUrls();

      expect(errorCatcher).toHaveBeenCalledTimes(1);
    });
  });
});
