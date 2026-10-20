import { describe, expect, it } from 'vitest';

import { getVerseSelectionState } from '../bible-verses';

describe('getVerseSelectionState', () => {
  it('marks the chosen verses', () => {
    expect(getVerseSelectionState(3, [3], null)).toBe('chosen');
    expect(getVerseSelectionState(7, [3, 7], null)).toBe('chosen');
  });

  it('marks the verses between two chosen verses', () => {
    expect(getVerseSelectionState(5, [3, 7], null)).toBe('in-range');
    expect(getVerseSelectionState(2, [3, 7], null)).toBe('none');
    expect(getVerseSelectionState(8, [3, 7], null)).toBe('none');
  });

  it('previews the range up to the hovered verse while one verse is chosen', () => {
    expect(getVerseSelectionState(5, [3], 7)).toBe('in-range');
    expect(getVerseSelectionState(2, [7], 1)).toBe('in-range');
    expect(getVerseSelectionState(9, [3], 7)).toBe('none');
  });

  it('marks no range while one verse is chosen and none is hovered', () => {
    for (const verse of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(getVerseSelectionState(verse, [10], null)).toBe('none');
    }
  });

  it('marks nothing when no verse is chosen', () => {
    expect(getVerseSelectionState(5, [], 7)).toBe('none');
  });
});
