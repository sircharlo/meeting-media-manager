import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addUniqueById, deduplicateById, shouldUpdateList } from '../jw';

// Mock the electron API
vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

vi.mock('src/utils/api', () => ({
  fetchJwLanguages: vi.fn(),
  fetchMemorials: vi.fn(),
  fetchPubMediaLinks: vi.fn(),
  fetchYeartext: vi.fn(),
}));

vi.mock('src/utils/date', () => ({
  dateFromString: vi.fn(),
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
    // Reset mocks
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
      vi.mocked(dateUtils.getDateDiff).mockReturnValue(7); // Mock to return 7 months difference

      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 7);
      const oldList = { list: ['item'], updated: oldDate };
      expect(shouldUpdateList(oldList, 6)).toBe(true);
    });

    it('should return false when cache is within specified months', async () => {
      const dateUtils = await import('src/utils/date');
      vi.mocked(dateUtils.getDateDiff).mockReturnValue(2); // Mock to return 2 months difference

      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 2);
      const recentList = { list: ['item'], updated: recentDate };
      expect(shouldUpdateList(recentList, 6)).toBe(false);
    });
  });

  describe('addUniqueById', () => {
    it('should add unique items to target array', () => {
      const target = [{ name: 'Item 1', uniqueId: '1' }];
      const source = [
        { name: 'Item 2', uniqueId: '2' },
        { name: 'Item 3', uniqueId: '3' },
      ];

      addUniqueById(target, source);

      expect(target).toHaveLength(3);
      expect(target.map((item) => item.uniqueId)).toEqual(['1', '2', '3']);
    });

    it('should not add duplicate items', () => {
      const target = [{ name: 'Item 1', uniqueId: '1' }];
      const source = [
        { name: 'Item 1 Duplicate', uniqueId: '1' },
        { name: 'Item 2', uniqueId: '2' },
      ];

      addUniqueById(target, source);

      expect(target).toHaveLength(2);
      expect(target.map((item) => item.uniqueId)).toEqual(['1', '2']);
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
});
