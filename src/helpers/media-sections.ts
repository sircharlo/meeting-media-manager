import type {
  DateInfo,
  MediaSection,
  MediaSectionIdentifier,
  MediaSectionWithConfig,
} from 'src/types';

import { i18n } from 'boot/i18n';
import { defaultAdditionalSection } from 'src/composables/useMediaSection';
import { getMeetingSections, standardSections } from 'src/constants/media';
import { isCoWeek } from 'src/helpers/date';
import { useCurrentStateStore } from 'src/stores/current-state';

export const addSection = () => {
  const { selectedDateObject } = useCurrentStateStore();
  if (!selectedDateObject) return;

  const newSectionId = 'custom-' + Date.now().toString();

  const newSection: MediaSection = {
    ...defaultAdditionalSection.config,
    bgColor: getRandomColor(), // Override with a random color for variety
    label: (i18n.global.t as (key: string) => string)('imported-media'),
    mmmIcon: 'mmm-additional-media',
    uniqueId: newSectionId,
  };

  // Add the new section to mediaSections with config
  if (!selectedDateObject.mediaSections) {
    selectedDateObject.mediaSections = {};
  }
  selectedDateObject.mediaSections[newSectionId] = {
    config: newSection,
    items: [],
  };

  console.log('✅ New section created:', {
    config: newSection,
    sectionId: newSectionId,
  });
};

export const deleteSection = (uniqueId: string) => {
  const { selectedDateObject } = useCurrentStateStore();
  if (!selectedDateObject?.mediaSections) return;

  // Move media from the deleted section to additional section
  if (selectedDateObject.mediaSections[uniqueId]) {
    const mediaToMove = selectedDateObject.mediaSections[uniqueId].items;
    if (mediaToMove?.length) {
      selectedDateObject.mediaSections['imported-media'] ??=
        defaultAdditionalSection;
      selectedDateObject.mediaSections['imported-media'].items ??= [];
      selectedDateObject.mediaSections['imported-media'].items.push(
        ...mediaToMove,
      );
    }

    // Actually delete the section from mediaSections
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete selectedDateObject.mediaSections[uniqueId];

    console.log('✅ Section deleted:', {
      deletedSectionId: uniqueId,
      remainingSections: Object.keys(selectedDateObject.mediaSections),
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

export const isStandardSection = (section: string) => {
  if (!section) return false;
  return standardSections.includes(section);
};

function getMeetingSectionConfigs(section: MediaSectionIdentifier | undefined) {
  if (!section) return { bgColor: getRandomColor(), uniqueId: '' };
  if (section === 'ayfm') {
    return {
      jwIcon: '',
      uniqueId: section,
    };
  }
  if (section === 'lac') {
    return {
      jwIcon: '',
      uniqueId: section,
    };
  }
  if (section === 'tgw') {
    return {
      jwIcon: '',
      uniqueId: section,
    };
  }
  if (section === 'wt') {
    return {
      jwIcon: '',
      uniqueId: section,
    };
  }
  if (section === 'pt') {
    return {
      jwIcon: '',
      uniqueId: section,
    };
  }
  if (section === 'circuit-overseer') {
    return {
      jwIcon: '',
      uniqueId: section,
    };
  }
  return { bgColor: getRandomColor(), uniqueId: section };
}

export const createMeetingSections = (day: DateInfo) => {
  const meetingType = day.meeting;
  console.log('🔍 [createMeetingSections] meetingType', meetingType);
  const sections = getMeetingSections(meetingType, isCoWeek(day.date));
  console.log('🔍 [createMeetingSections] sections', sections);
  sections.forEach((section) => {
    console.log('🔍 [createMeetingSections] section', section);
    const calculatedConfig = getMeetingSectionConfigs(section);
    day.mediaSections[section] ??= {
      config: calculatedConfig,
      items: [],
    };
    const mediaSection = day.mediaSections[section];
    mediaSection.config = calculatedConfig;
  });
  console.log(
    '🔍 [createMeetingSections] day.mediaSections',
    day.mediaSections,
  );
};

export const getSectionBgColor = (section: MediaSection | undefined) => {
  if (!section || isStandardSection(section.uniqueId))
    return 'var(--q-primary)';
  return section.bgColor || 'var(--q-primary)';
};

export const getTextColor = (section?: MediaSectionWithConfig) => {
  const bgColor = section?.config?.bgColor;
  if (!bgColor) return '#ffffff';
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
    return '#ffffff'; // Default to white if invalid input
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
  return lum > 0.3 ? '#000000' : '#ffffff';
};
