import type { DateInfo } from 'src/types';

import { createMeetingSections } from 'src/helpers/media-sections';
import { useJwStore } from 'stores/jw';

import type { MigrationFunction } from './types';

export const newMediaSections: MigrationFunction = async () => {
  const jwStore = useJwStore();

  // Validate that jwStore.lookupPeriod exists and is properly initialized
  if (
    !jwStore.lookupPeriod ||
    typeof jwStore.lookupPeriod !== 'object' ||
    Array.isArray(jwStore.lookupPeriod)
  ) {
    console.warn(
      '🔍 [migration] Invalid jwStore.lookupPeriod structure in 25.8.4-newMediaSections:',
      jwStore.lookupPeriod,
    );
    jwStore.lookupPeriod = {};
  }

  let currentLookupPeriods: Partial<Record<string, DateInfo[]>>;
  try {
    // Manually clone while preserving Date objects
    currentLookupPeriods = {};
    for (const [congId, dateInfo] of Object.entries(jwStore.lookupPeriod)) {
      if (Array.isArray(dateInfo)) {
        currentLookupPeriods[congId] = dateInfo.map((day) => ({
          ...day,
          date:
            day.date instanceof Date ? new Date(day.date.getTime()) : day.date,
        }));
      }
    }
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to clone lookupPeriod in 25.8.4-newMediaSections:',
      error,
    );
    currentLookupPeriods = {};
  }
  for (const [congId, dateInfo] of Object.entries(currentLookupPeriods)) {
    if (!congId || !dateInfo) continue;

    dateInfo.forEach((day) => {
      if (day && day.mediaSections) {
        createMeetingSections(day);
      }
    });
  }
  jwStore.lookupPeriod = currentLookupPeriods;
  return true;
};
