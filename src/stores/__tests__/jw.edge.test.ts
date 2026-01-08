import { describe, expect, it } from 'vitest';

import { addUniqueByIdToTop, deduplicateById, shouldUpdateList } from '../jw';

describe('JW Store edge cases', () => {
  describe('shouldUpdateList invalid/missing dates', () => {
    it('returns true when updated is null', () => {
      expect(
        shouldUpdateList(
          { list: ['x'] } as unknown as { list: string[]; updated: null },
          6,
        ),
      ).toBe(true);
      expect(
        shouldUpdateList(
          { list: ['x'], updated: null } as unknown as {
            list: string[];
            updated: Date;
          },
          6,
        ),
      ).toBe(true);
      expect(
        shouldUpdateList(
          { list: ['x'], updated: new Date('invalid') } as unknown as {
            list: string[];
            updated: Date;
          },
          6,
        ),
      ).toBe(true);
    });
  });

  describe('addUniqueByIdToTop/deduplicateById missing uniqueId', () => {
    it('keeps items without uniqueId as-is', () => {
      const target: { name: string; uniqueId: string }[] = [
        { name: 'A', uniqueId: '1' },
      ];
      addUniqueByIdToTop(target, [
        { name: 'B' } as unknown as { name: string; uniqueId: string },
        { name: 'C', uniqueId: '2' } as { name: string; uniqueId: string },
      ]);
      expect(target.map((x) => x.uniqueId ?? x.name)).toEqual(['B', '2', '1']);
    });

    it('deduplicateById keeps first occurrence and keeps items without uniqueId', () => {
      const arr = [
        { name: 'First 1', uniqueId: '1' } as {
          name: string;
          uniqueId: string;
        },
        { name: 'No ID' } as unknown as { name: string; uniqueId: string },
        { name: 'Second 1', uniqueId: '1' } as {
          name: string;
          uniqueId: string;
        },
      ];
      deduplicateById(arr as unknown as { name: string; uniqueId: string }[]);
      expect(arr.map((x) => x.uniqueId ?? x.name)).toEqual(['1', 'No ID']);
    });
  });
});
