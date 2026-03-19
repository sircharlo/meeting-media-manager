import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addUniqueByIdToTop,
  deduplicateById,
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

  describe('addUniqueByIdToTop', () => {
    it('should add unique items to target array', () => {
      const target = [{ name: 'Item 1', uniqueId: '1' }];
      const source = [
        { name: 'Item 2', uniqueId: '2' },
        { name: 'Item 3', uniqueId: '3' },
      ];

      addUniqueByIdToTop(target, source);

      expect(target).toHaveLength(3);
      expect(target.map((item) => item.uniqueId)).toEqual(['2', '3', '1']);
    });

    it('should not add duplicate items', () => {
      const target = [{ name: 'Item 1', uniqueId: '1' }];
      const source = [
        { name: 'Item 1 Duplicate', uniqueId: '1' },
        { name: 'Item 2', uniqueId: '2' },
      ];

      addUniqueByIdToTop(target, source);

      expect(target).toHaveLength(2);
      expect(target.map((item) => item.uniqueId)).toEqual(['2', '1']);
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
    it('keeps the default fallback when offline css does not expose jw-icons', async () => {
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
      expect(store.fontUrls['jw-icons-all']).toContain(
        '/assets/fonts/jw-icons-all-81d446b.woff',
      );
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
  });
});
