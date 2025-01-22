import type { MediaSection } from 'src/types';

import { i18n } from 'boot/i18n';
import { standardSections } from 'src/constants/media';
import { useCurrentStateStore } from 'src/stores/current-state';

export const addSection = () => {
  const { selectedDateObject } = useCurrentStateStore();
  if (!selectedDateObject) return;
  if (!selectedDateObject?.customSections)
    selectedDateObject.customSections = [];
  const newSection: MediaSection = {
    alwaysShow: true,
    bgColor: getRandomColor(),
    extraMediaShortcut: true,
    // @ts-expect-error: t has no matching signature
    label: i18n.global.t('imported-media'),
    uniqueId: 'custom-' + Date.now().toString(),
  };
  selectedDateObject?.customSections?.push(newSection);
};

export const deleteSection = (uniqueId: string) => {
  const { selectedDateObject } = useCurrentStateStore();
  if (!selectedDateObject?.customSections) return;

  const sectionIndex = selectedDateObject.customSections.findIndex(
    (s) => s.uniqueId === uniqueId,
  );

  if (sectionIndex === -1) return;

  selectedDateObject.customSections.splice(sectionIndex, 1);

  selectedDateObject.dynamicMedia
    ?.filter((m) => m.uniqueId === uniqueId)
    .forEach((m) => {
      m.section = 'additional';
      m.sectionOriginal = 'additional';
    });
};

const getRandomColor = () => {
  const min = 80; // Minimum brightness for each RGB channel
  const max = 230; // Maximum brightness for each RGB channel
  const randomChannel = () => Math.floor(Math.random() * (max - min + 1)) + min;

  const r = randomChannel();
  const g = randomChannel();
  const b = randomChannel();

  return `rgb(${r}, ${g}, ${b})`;
};

export const isStandardSection = (section: string) => {
  if (!section) return false;
  return standardSections.includes(section);
};

export const getTextColor = (section: MediaSection) => {
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
    return '#000000'; // Default to black if invalid input
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
  return lum > 0.179 ? '#000000' : '#ffffff';
};
