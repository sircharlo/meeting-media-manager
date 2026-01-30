import type { DateInfo } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { createMeetingSections } from 'src/helpers/media-sections';
import { useJwStore } from 'stores/jw';

import type { MigrationFunction } from './types';

export const newMediaSections: MigrationFunction = async () => {
  try {
    const jwStore = useJwStore();

    // Validate that jwStore.lookupPeriod exists and is properly initialized
    if (
      !jwStore.lookupPeriod ||
      typeof jwStore.lookupPeriod !== 'object' ||
      Array.isArray(jwStore.lookupPeriod)
    ) {
      errorCatcher(
        new Error(
          'Invalid jwStore.lookupPeriod structure in 25.8.4-newMediaSections',
        ),
        {
          contexts: {
            fn: {
              name: 'new-media-sections',
            },
          },
        },
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
            date: day.date instanceof Date ? new Date(day.date) : day.date,
          }));
        }
      }
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            name: 'new-media-sections clone lookupPeriod',
          },
        },
      });
      currentLookupPeriods = {};
    }
    for (const [congId, dateInfo] of Object.entries(currentLookupPeriods)) {
      if (!congId || !dateInfo) continue;

      dateInfo.forEach((day) => {
        if (day?.mediaSections) {
          createMeetingSections(day);
        }
      });
    }
    jwStore.lookupPeriod = currentLookupPeriods;
    return true;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'new-media-sections main',
        },
      },
    });
    return false;
  }
};
