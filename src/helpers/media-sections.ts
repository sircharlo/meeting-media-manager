import type { JwIconKeyword } from 'src/constants/jw-icons';
import type {
  DateInfo,
  MediaItem,
  MediaSection,
  MediaSectionIdentifier,
  MediaSectionWithConfig,
} from 'src/types';

import { i18n } from 'boot/i18n';
import { getMeetingSections, standardSections } from 'src/constants/media';
import { isCoWeek } from 'src/helpers/date';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'src/stores/current-state';

import { errorCatcher } from './error-catcher';

type WatchedMediaSectionOrder = Record<
  string,
  { order: number; section: MediaSectionIdentifier }
>;

export const defaultAdditionalSection = {
  config: {
    bgColor: 'rgb(148, 94, 181)',
    uniqueId: 'imported-media',
  },
  items: [],
};

// Helper functions for array-based mediaSections
export const findMediaSection: (
  mediaSections: MediaSectionWithConfig[],
  sectionId: MediaSectionIdentifier,
) => MediaSectionWithConfig | undefined = (
  mediaSections: MediaSectionWithConfig[],
  sectionId: MediaSectionIdentifier,
): MediaSectionWithConfig | undefined => {
  return mediaSections.find((section) => section.config.uniqueId === sectionId);
};

export const findMediaSectionIndex = (
  mediaSections: MediaSectionWithConfig[],
  sectionId: MediaSectionIdentifier,
): number => {
  return mediaSections.findIndex(
    (section) => section.config.uniqueId === sectionId,
  );
};

export const getOrCreateMediaSection = (
  mediaSections: MediaSectionWithConfig[],
  sectionId: MediaSectionIdentifier,
  defaultConfig?: Partial<MediaSection>,
): MediaSectionWithConfig => {
  const section = findMediaSection(mediaSections, sectionId);
  if (sectionId === 'imported-media') {
    defaultConfig = defaultAdditionalSection.config;
  }
  if (!section) {
    const newSection = {
      config: {
        uniqueId: sectionId,
        ...defaultConfig,
      },
      items: [],
    };
    mediaSections.push(newSection);
    return findMediaSection(mediaSections, sectionId) || newSection;
  }
  return section;
};

export const removeMediaSection = (
  mediaSections: MediaSectionWithConfig[],
  sectionId: MediaSectionIdentifier,
): MediaSectionWithConfig | undefined => {
  const index = findMediaSectionIndex(mediaSections, sectionId);
  if (index >= 0) {
    return mediaSections.splice(index, 1)[0];
  }
  return undefined;
};

export const addSection = () => {
  const { selectedDateObject } = useCurrentStateStore();
  if (!selectedDateObject) return;

  const newSectionId = 'custom-' + Date.now().toString();

  const newSection: MediaSection = {
    ...defaultAdditionalSection.config,
    bgColor: getRandomColor(), // Override with a random color for variety
    uniqueId: newSectionId,
  };

  // Add the new section to mediaSections with config
  if (!selectedDateObject.mediaSections) {
    selectedDateObject.mediaSections = [];
  }
  selectedDateObject.mediaSections.push({
    config: newSection,
    items: [],
  });

  log('✅ New section created:', 'mediaSections', 'log', {
    config: newSection,
    sectionId: newSectionId,
  });
};

export const deleteSection = (uniqueId: string) => {
  const { selectedDateObject } = useCurrentStateStore();
  if (!selectedDateObject?.mediaSections) return;

  // Find the section to delete
  const sectionToDelete = findMediaSection(
    selectedDateObject.mediaSections,
    uniqueId,
  );
  if (sectionToDelete) {
    // Move media from the deleted section to additional section
    const mediaToMove = sectionToDelete.items;
    if (mediaToMove?.length) {
      const additionalSection = getOrCreateMediaSection(
        selectedDateObject.mediaSections,
        'imported-media',
      );
      additionalSection.items ??= [];
      additionalSection.items.push(...mediaToMove);
    }

    // Actually delete the section from mediaSections
    removeMediaSection(selectedDateObject.mediaSections, uniqueId);

    log('✅ Section deleted:', 'mediaSections', 'log', {
      deletedSectionId: uniqueId,
      remainingSections: selectedDateObject.mediaSections.map(
        (s) => s.config.uniqueId,
      ),
    });
  }
};

export const getRandomColor = () => {
  const min = 80; // Minimum brightness for each RGB channel
  const max = 230; // Maximum brightness for each RGB channel
  const randomChannel = () => Math.floor(Math.random() * (max - min + 1)) + min;

  const r = randomChannel();
  const g = randomChannel();
  const b = randomChannel();

  return `rgb(${r}, ${g}, ${b})`;
};

export const isStandardSection = (section: MediaSectionIdentifier) => {
  if (!section) return false;
  return standardSections.includes(section);
};

function getMeetingSectionConfigs(
  section?: MediaSectionIdentifier,
): MediaSection {
  if (!section) {
    return { bgColor: getRandomColor(), uniqueId: '' };
  }

  // Sections that have icons
  const iconSections: JwIconKeyword[] = [
    'ayfm',
    'lac',
    'tgw',
    'wt',
    'pt',
    'circuit-overseer',
  ];

  if (iconSections.includes(section)) {
    return {
      jwIconKeyword: section,
      uniqueId: section,
    };
  }

  // Fallback for unknown sections
  return {
    bgColor: getRandomColor(),
    uniqueId: section,
  };
}

export const createMeetingSections = (day: DateInfo) => {
  const currentState = useCurrentStateStore();
  const { getMeetingType } = currentState;
  const meetingType = getMeetingType(day.date);

  // Debug logging to help identify the issue
  if (day.date && typeof day.date === 'object' && !(day.date instanceof Date)) {
    errorCatcher(new Error('createMeetingSections: Received non-Date object'), {
      contexts: {
        fn: {
          dayDate: day.date,
          name: 'createMeetingSections',
          type: typeof day.date,
          value: day.date,
        },
      },
    });
  }

  const sections = getMeetingSections(meetingType, isCoWeek(day.date));
  sections.forEach((section) => {
    const calculatedConfig = getMeetingSectionConfigs(section);
    const mediaSection = getOrCreateMediaSection(day.mediaSections, section);
    mediaSection.config = calculatedConfig;
  });
};

export const getSectionBgColor = (section: MediaSection | undefined) => {
  if (!section || isStandardSection(section.uniqueId))
    return 'var(--q-primary)';
  return section.bgColor || 'var(--q-primary)';
};

// Parses a "#rgb"/"#rrggbb" or "rgb(a)(...)" color string into channels.
const parseColorToRgb = (color: string): [number, number, number] | null => {
  let b, g, r;
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    [r, g, b] = [0, 1, 2].map((i) =>
      Number.parseInt(
        hex.length === 3
          ? hex.charAt(i) + hex.charAt(i)
          : hex.slice(i * 2, i * 2 + 2),
        16,
      ),
    );
  } else if (color.startsWith('rgb')) {
    [r, g, b] = color
      .replaceAll(/rgba?|\(|\)|\s/g, '')
      .split(',')
      .map(Number);
  } else {
    return null;
  }

  return r === undefined || g === undefined || b === undefined
    ? null
    : [r, g, b];
};

export const getTextColor = (section?: MediaSectionWithConfig) => {
  const bgColor = section?.config?.bgColor;
  if (!bgColor) return '#ffffff';

  const rgb = parseColorToRgb(bgColor);
  if (!rgb) {
    errorCatcher(new Error('Invalid color format'), {
      contexts: {
        fn: {
          bgColor,
          name: 'getTextColor',
        },
      },
    });
    return '#ffffff'; // Default to white if invalid input
  }
  const [r, g, b] = rgb;

  // Calculate relative luminance
  const luminance = (val: number) => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };

  const lum =
    0.2126 * luminance(r) + 0.7152 * luminance(g) + 0.0722 * luminance(b);

  // Return white or black based on contrast
  return lum > 0.3 ? '#000000' : '#ffffff';
};

// Mirrors the hardcoded left-bar colors in the `.media-section` SCSS rules
// for the meeting sections that always use the same color (see app.scss).
// Custom sections (including "imported-media" and "pt") use their own
// stored bgColor instead, applied via the `--bg-color` CSS variable.
const STANDARD_SECTION_COLORS: Record<string, string> = {
  ayfm: 'rgb(214, 143, 0)',
  'circuit-overseer': 'rgb(148, 94, 181)',
  lac: 'rgb(191, 47, 19)',
  tgw: 'rgb(60, 127, 139)',
  wt: 'rgb(214, 143, 0)',
};

export const getSectionAccentColor = (
  sectionId: MediaSectionIdentifier | undefined,
  mediaSections?: MediaSectionWithConfig[],
): string => {
  const standardColor = sectionId ? STANDARD_SECTION_COLORS[sectionId] : null;
  if (standardColor) return standardColor;

  const section = sectionId
    ? findMediaSection(mediaSections ?? [], sectionId)
    : undefined;
  return section?.config.bgColor || defaultAdditionalSection.config.bgColor;
};

export const withAlpha = (color: string, alpha: number): string => {
  const rgb = parseColorToRgb(color);
  if (!rgb) return color;
  const [r, g, b] = rgb;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const mixWithWhite = (color: string, weight: number): string => {
  const rgb = parseColorToRgb(color);
  if (!rgb) return color;
  const [r, g, b] = rgb;
  const mix = (channel: number) =>
    Math.round(channel * (1 - weight) + 255 * weight);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

const getNumericSortOrder = (item?: MediaItem) => {
  return typeof item?.sortOrderOriginal === 'number'
    ? item.sortOrderOriginal
    : undefined;
};

const getWatchedOrder = (items: MediaItem[], itemIndex: number) => {
  const itemsBeforeCurrent = items.slice(0, itemIndex);
  const previousAnchorIndex = itemsBeforeCurrent.findLastIndex(
    (item) =>
      item.source !== 'watched' && getNumericSortOrder(item) !== undefined,
  );
  const nextAnchorOffset = items
    .slice(itemIndex + 1)
    .findIndex(
      (item) =>
        item.source !== 'watched' && getNumericSortOrder(item) !== undefined,
    );
  const nextAnchorIndex =
    nextAnchorOffset >= 0 ? itemIndex + 1 + nextAnchorOffset : -1;
  const previousAnchor =
    previousAnchorIndex >= 0 ? items[previousAnchorIndex] : undefined;
  const nextAnchor = nextAnchorIndex >= 0 ? items[nextAnchorIndex] : undefined;
  const previousOrder = getNumericSortOrder(previousAnchor);
  const nextOrder = getNumericSortOrder(nextAnchor);
  const runStart = previousAnchorIndex + 1;
  const runEnd = nextAnchorIndex >= 0 ? nextAnchorIndex : items.length;
  const runItems = items.slice(runStart, runEnd);
  const currentRunOffset = itemIndex - runStart + 1;
  const watchedItemsBeforeCurrent = runItems
    .slice(0, currentRunOffset)
    .filter((item) => item.source === 'watched').length;
  const watchedItemCount = runItems.filter(
    (item) => item.source === 'watched',
  ).length;

  if (previousOrder !== undefined && nextOrder !== undefined) {
    const step = (nextOrder - previousOrder) / (watchedItemCount + 1);
    return previousOrder + step * watchedItemsBeforeCurrent;
  }

  if (previousOrder !== undefined) {
    return previousOrder + watchedItemsBeforeCurrent;
  }

  if (nextOrder !== undefined) {
    return nextOrder - (watchedItemCount - watchedItemsBeforeCurrent + 1);
  }

  return itemIndex;
};

// Sections the media auto-export feature can produce a folder name for (see
// buildDestinationPath in helpers/export-media.ts), used to reverse-match an
// exported section name back to a MediaSectionIdentifier.
const EXPORTABLE_SECTION_IDS: MediaSectionIdentifier[] = [
  ...standardSections,
  'pt',
];

// Matches the naming convention written by the media auto-export feature:
// "<section#> <section name> - <item#> <title>.<ext>". Used as a fallback
// ordering signal for watched items with no .section-order.json entry, e.g.
// files brought into the watch folder from another device's export, or
// copied in manually following the same numbering convention.
const EXPORTED_FILENAME_PATTERN = /^(\d{1,3})\s+(.+?)\s-\s(\d{1,3})\s/;

const getSectionIdFromExportedName = (
  sectionName: string,
): MediaSectionIdentifier | undefined => {
  const normalized = sectionName.trim().toLowerCase();
  return EXPORTABLE_SECTION_IDS.find(
    (id) => i18n.global.t(id).trim().toLowerCase() === normalized,
  );
};

export const getExportedFilenamePlacement = (
  filename: string,
): null | { order: number; section?: MediaSectionIdentifier } => {
  const match = EXPORTED_FILENAME_PATTERN.exec(filename);
  if (!match) return null;

  const [, sectionNumber, sectionName, itemNumber] = match;
  const sectionIndex = Number.parseInt(sectionNumber ?? '', 10);
  const itemIndex = Number.parseInt(itemNumber ?? '', 10);
  if (Number.isNaN(sectionIndex) || Number.isNaN(itemIndex)) return null;

  return {
    order: sectionIndex * 1000 + itemIndex,
    section: getSectionIdFromExportedName(sectionName ?? ''),
  };
};

const readWatchedMediaSectionOrder = async (
  sectionOrderFilePath: string,
): Promise<WatchedMediaSectionOrder> => {
  try {
    const { fs, hideFileOnWindows, showFileOnWindows } = globalThis.electronApi;
    const { pathExists, readJSON } = fs;

    if (!(await pathExists(sectionOrderFilePath))) return {};

    await showFileOnWindows(sectionOrderFilePath);
    const result = await readJSON(sectionOrderFilePath);
    await hideFileOnWindows(sectionOrderFilePath);

    return result;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'readWatchedMediaSectionOrder',
          sectionOrderFilePath,
        },
      },
    });
    return {};
  }
};

const writeWatchedMediaSectionOrder = async (
  sectionOrderFilePath: string,
  data: WatchedMediaSectionOrder,
) => {
  const { fs, hideFileOnWindows } = globalThis.electronApi;
  const { rename, writeFile } = fs;

  // Write to a temp file and rename into place rather than writing the
  // target directly. A rename is atomic; a multi-KB write is not, and this
  // file commonly lives in a cloud-synced folder (OneDrive, etc.) whose
  // background sync I/O can interleave with an in-place write and leave
  // truncated/corrupted JSON for the next reader to trip over.
  const tempPath = `${sectionOrderFilePath}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await rename(tempPath, sectionOrderFilePath);
  await hideFileOnWindows(sectionOrderFilePath);
};

export const saveWatchedMediaLayout = async (
  mediaSections: MediaSectionWithConfig[],
): Promise<void> => {
  try {
    const { basename, dirname, fileUrlToPath, join } = globalThis.electronApi;
    const dataByFolder: Record<string, WatchedMediaSectionOrder> = {};

    mediaSections.forEach((section) => {
      const items = section.items ?? [];
      items.forEach((item, index) => {
        if (item.source !== 'watched' || !item.fileUrl) return;

        const localPath = fileUrlToPath(item.fileUrl);
        if (!localPath) return;

        const datedFolderPath = dirname(localPath);
        if (!datedFolderPath) return;

        const filename = basename(localPath);
        dataByFolder[datedFolderPath] ??= {};
        dataByFolder[datedFolderPath][filename] = {
          order: getWatchedOrder(items, index),
          section: section.config.uniqueId,
        };
      });
    });

    for (const [datedFolderPath, layoutData] of Object.entries(dataByFolder)) {
      const sectionOrderFilePath = join(datedFolderPath, '.section-order.json');
      const existingData =
        await readWatchedMediaSectionOrder(sectionOrderFilePath);

      await writeWatchedMediaSectionOrder(sectionOrderFilePath, {
        ...existingData,
        ...layoutData,
      });
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'saveWatchedMediaLayout',
        },
      },
    });
  }
};

/**
 * Get section information for a watched media item from the section order file
 */
export const getWatchedMediaSectionInfo = async (
  datedFolderPath: string,
  filename: string,
): Promise<null | { order: number; section: MediaSectionIdentifier }> => {
  try {
    const { join } = globalThis.electronApi;

    const sectionOrderFilePath = join(datedFolderPath, '.section-order.json');
    const sectionOrderData =
      await readWatchedMediaSectionOrder(sectionOrderFilePath);

    return sectionOrderData[filename] || null;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          datedFolderPath,
          filename,
          name: 'getWatchedMediaSectionInfo',
        },
      },
    });
    return null;
  }
};

/**
 * Remove section information for a watched media item when it's moved or deleted
 */
export const removeWatchedMediaSectionInfo = async (
  datedFolderPath: string,
  filename: string,
): Promise<void> => {
  try {
    // Access electron API functions
    const { fs, hideFileOnWindows, join, showFileOnWindows } =
      globalThis.electronApi;
    const { pathExists, readJSON, writeFile } = fs;

    const sectionOrderFilePath = join(datedFolderPath, '.section-order.json');

    if (!(await pathExists(sectionOrderFilePath))) {
      return;
    }

    const sectionOrderData: Record<
      string,
      { order: number; section: MediaSectionIdentifier }
    > = await readJSON(sectionOrderFilePath);

    if (sectionOrderData[filename]) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete sectionOrderData[filename];

      await showFileOnWindows(sectionOrderFilePath);
      await writeFile(
        sectionOrderFilePath,
        JSON.stringify(sectionOrderData, null, 2),
        'utf-8',
      );
      await hideFileOnWindows(sectionOrderFilePath);
      log(`✅ Removed section info for ${filename}`, 'mediaSections', 'log');
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          datedFolderPath,
          filename,
          name: 'removeWatchedMediaSectionInfo',
        },
      },
    });
  }
};
