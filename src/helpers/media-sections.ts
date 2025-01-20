import type { DynamicMediaSection } from 'src/types';

import { standardSections } from 'src/constants/media';
import { useCurrentStateStore } from 'src/stores/current-state';

export const deleteSection = (uniqueId: string) => {
  const { selectedDateObject } = useCurrentStateStore();
  selectedDateObject?.customSections?.splice(
    selectedDateObject?.customSections.findIndex(
      (s) => s.uniqueId === uniqueId,
    ),
    1,
  );
};

export const isStandardSection = (section: string) => {
  if (!section) return false;
  return standardSections.includes(section);
};

export const setTextColor = (section: DynamicMediaSection) => {
  const bgColor = section.bgColor;
  if (!bgColor) return;
  // Convert HEX to RGB
  let b, g, r;
  if (bgColor.startsWith('#')) {
    const hex = bgColor.replace('#', '');
    [r, g, b] = [0, 1, 2].map((i) =>
      parseInt(
        hex.length === 3
          ? hex.charAt(i) + hex.charAt(i)
          : hex.slice(i * 2, i * 2 + 2),
        16,
      ),
    );
  } else if (bgColor.startsWith('rgb')) {
    [r, g, b] = bgColor
      .replace(/rgba?|\(|\)|\s/g, '')
      .split(',')
      .map(Number);
  } else {
    console.warn('Invalid color format');
    section.textColor = '#000000'; // Default to black if invalid input
  }

  // Calculate relative luminance
  const luminance = (val: number | undefined) => {
    if (val === undefined) return 0;
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };

  const lum =
    0.2126 * luminance(r) + 0.7152 * luminance(g) + 0.0722 * luminance(b);

  // Return white or black based on contrast
  section.textColor = lum > 0.179 ? '#000000' : '#ffffff';
};
