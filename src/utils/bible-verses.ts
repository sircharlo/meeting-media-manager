export type VerseSelectionState = 'chosen' | 'in-range' | 'none';

/**
 * How a verse button shows in the Bible dialog's verse picker.
 * @param verse The verse number
 * @param chosenVerses The chosen verses: none, one, or the two ends of a range
 * @param hoveredVerse The verse under the mouse, or null
 * @returns 'chosen' for a chosen verse, 'in-range' for a verse between the
 * two chosen ones - or, while only one is chosen, between it and the hovered
 * verse - and 'none' otherwise
 */
export const getVerseSelectionState = (
  verse: number,
  chosenVerses: number[],
  hoveredVerse: null | number,
): VerseSelectionState => {
  if (chosenVerses.includes(verse)) return 'chosen';

  const [first, second] = chosenVerses;
  if (first === undefined) return 'none';

  // With one verse chosen, the range only previews while one is hovered.
  const rangeEnd = second ?? hoveredVerse;
  if (rangeEnd === null) return 'none';

  const isInRange =
    verse > Math.min(first, rangeEnd) && verse < Math.max(first, rangeEnd);
  return isInRange ? 'in-range' : 'none';
};
