import type { DateInfo, MediaItem } from 'src/types';

import { LocalStorage as QuasarStorage } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  findMediaSection,
  getOrCreateMediaSection,
} from 'src/helpers/media-sections';
import { dateFromString, datesAreSame } from 'src/utils/date';
import { toRawDeep } from 'src/utils/general';
import { useJwStore } from 'stores/jw';

import type { MigrationFunction } from './types';

const reportMoveAdditionalMediaError = (
  message: string,
  context: Record<string, unknown> = {},
) => {
  errorCatcher(new Error(message), {
    contexts: {
      fn: {
        ...context,
        name: context.name || 'moveAdditionalMediaMaps',
      },
    },
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && !Array.isArray(value);
};

const normalizeMoveAdditionalMediaDay = (
  congId: string,
  day: DateInfo,
  dayIndex: number,
) => {
  if (!isRecord(day)) {
    reportMoveAdditionalMediaError(
      'Invalid day object structure in moveAdditionalMediaMaps',
      { congId, day, dayIndex },
    );
    return false;
  }

  if (day.date && !(day.date instanceof Date)) {
    try {
      reportMoveAdditionalMediaError(
        'Invalid date object structure in moveAdditionalMediaMaps',
        { congId, day, dayIndex },
      );
      day.date = dateFromString(day.date);
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            congId,
            day,
            dayIndex,
            name: 'moveAdditionalMediaMaps convert corrupted date object',
          },
        },
      });
      return false;
    }
  }

  return true;
};

const resetImportedMediaSection = (
  congId: string,
  day: DateInfo,
  dayIndex: number,
) => {
  day.mediaSections ??= [];
  try {
    const additionalSection = getOrCreateMediaSection(
      day.mediaSections,
      'imported-media',
    );
    additionalSection.items = [];
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          congId,
          day,
          dayIndex,
          name: 'moveAdditionalMediaMaps get or create media section',
        },
      },
    });
  }
  day.status = null;
};

const isValidTargetDate = (targetDate: string, congId: string) => {
  const hasValidFormat =
    /^\d{4}-\d{2}-\d{2}$/.test(targetDate) || /^\d{8}$/.test(targetDate);
  if (targetDate.trim() && hasValidFormat) return true;

  reportMoveAdditionalMediaError(
    'Invalid targetDate structure in moveAdditionalMediaMaps',
    { congId, targetDate },
  );
  return false;
};

const getValidAdditionalItems = (
  additionalItems: unknown,
  congId: string,
  targetDate: string,
) => {
  if (!Array.isArray(additionalItems)) {
    reportMoveAdditionalMediaError(
      'Invalid additionalItems structure in moveAdditionalMediaMaps',
      { additionalItems, congId },
    );
    return [];
  }

  const validItems: MediaItem[] = [];
  (additionalItems as MediaItem[]).forEach((item, index) => {
    if (item && typeof item === 'object' && item.uniqueId) {
      item.source = 'additional';
      validItems.push(item);
      return;
    }

    reportMoveAdditionalMediaError(
      'Invalid item structure in moveAdditionalMediaMaps',
      { congId, index, item, targetDate },
    );
  });

  if (!validItems.length) {
    reportMoveAdditionalMediaError(
      'No valid items found for targetDate in moveAdditionalMediaMaps',
      { congId, targetDate },
    );
  }

  return validItems;
};

const datesMatchForMoveAdditionalMedia = (
  day: DateInfo,
  targetDate: string,
  congId: string,
) => {
  if (day.date && !(day.date instanceof Date)) {
    try {
      reportMoveAdditionalMediaError(
        'Converting corrupted date object in datesAreSame comparison in moveAdditionalMediaMaps',
        {
          congId,
          name: 'moveAdditionalMediaMaps convert corrupted date object in datesAreSame comparison',
          targetDate,
        },
      );
      day.date = dateFromString(day.date);
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            name: 'move-additional-mediaMaps convert corrupted date object in datesAreSame comparison',
          },
        },
      });
      return false;
    }
  }

  try {
    return datesAreSame(day.date, targetDate);
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'move-additional-mediaMaps compare dates',
        },
      },
    });
    return false;
  }
};

const appendAdditionalItemsToDate = (
  dateInfo: DateInfo,
  validItems: MediaItem[],
) => {
  dateInfo.mediaSections ??= [];
  const additionalSection = findMediaSection(
    dateInfo.mediaSections,
    'imported-media',
  );
  const existingItems = additionalSection?.items || [];
  const newAdditionalItems = validItems.filter(
    (item) => !existingItems.some((media) => media.uniqueId === item.uniqueId),
  );

  const targetSection = getOrCreateMediaSection(
    dateInfo.mediaSections,
    'imported-media',
  );
  targetSection.items ??= [];
  targetSection.items.push(...newAdditionalItems);
};

export const moveAdditionalMediaMaps: MigrationFunction = async () => {
  try {
    const jwStore = useJwStore();
    const successfulMigration = true;

    // Validate that jwStore exists and is properly initialized
    if (!isRecord(jwStore)) {
      reportMoveAdditionalMediaError(
        'Invalid jwStore structure in moveAdditionalMediaMaps',
      );
      return successfulMigration;
    }

    let storedData: {
      additionalMediaMaps?: Record<string, Partial<Record<string, unknown[]>>>;
    };

    try {
      const storedDataString = String(
        QuasarStorage.getItem('jw-store') || '{}',
      );
      storedData = JSON.parse(storedDataString) as {
        additionalMediaMaps?: Record<
          string,
          Partial<Record<string, unknown[]>>
        >;
      };
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            name: 'move-additional-mediaMaps parse stored data',
          },
        },
      });
      return successfulMigration;
    }

    const currentAdditionalMediaMaps: Record<
      string,
      Partial<Record<string, unknown[]>>
    > = storedData.additionalMediaMaps || {};

    // Validate that storedData is a proper object
    if (!isRecord(storedData)) {
      reportMoveAdditionalMediaError(
        'Invalid storedData structure in moveAdditionalMediaMaps',
      );
      return successfulMigration;
    }

    // Validate that currentAdditionalMediaMaps is a proper object
    if (!isRecord(currentAdditionalMediaMaps)) {
      reportMoveAdditionalMediaError(
        'Invalid currentAdditionalMediaMaps structure in moveAdditionalMediaMaps',
      );
      return successfulMigration;
    }

    // Validate that jwStore.lookupPeriod exists and is properly initialized
    if (
      !jwStore.lookupPeriod ||
      typeof jwStore.lookupPeriod !== 'object' ||
      Array.isArray(jwStore.lookupPeriod)
    ) {
      reportMoveAdditionalMediaError(
        'Invalid jwStore.lookupPeriod structure in moveAdditionalMediaMaps',
      );
      jwStore.lookupPeriod = {};
    }

    let currentLookupPeriods: Partial<Record<string, DateInfo[]>>;
    try {
      const rawLookupPeriod = toRawDeep(jwStore.lookupPeriod);
      currentLookupPeriods = structuredClone(rawLookupPeriod) || {};
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            name: 'move-additional-mediaMaps clone lookupPeriod',
          },
        },
      });
      currentLookupPeriods = {};
    }

    for (const [congId, dates] of Object.entries(currentAdditionalMediaMaps)) {
      if (!congId || !currentLookupPeriods) continue;
      currentLookupPeriods[congId] ??= [];
      const lookupPeriodForCongregation = currentLookupPeriods[congId];
      if (!lookupPeriodForCongregation) continue;

      // Validate that dates is a proper object with string keys
      if (!isRecord(dates)) {
        reportMoveAdditionalMediaError(
          'Invalid dates structure for congregation in moveAdditionalMediaMaps',
          { congId, dates },
        );
        continue;
      }

      // Ensure lookupPeriodForCongregation is an array
      if (!Array.isArray(lookupPeriodForCongregation)) {
        reportMoveAdditionalMediaError(
          'Invalid lookupPeriodForCongregation structure for congregation in moveAdditionalMediaMaps',
          { congId, lookupPeriodForCongregation },
        );
        continue;
      }

      lookupPeriodForCongregation.forEach((day, dayIndex) => {
        if (!normalizeMoveAdditionalMediaDay(congId, day, dayIndex)) return;
        resetImportedMediaSection(congId, day, dayIndex);
      });
      for (const [targetDate, additionalItems] of Object.entries(dates)) {
        if (!targetDate || !additionalItems) continue;

        if (!isValidTargetDate(targetDate, congId)) continue;

        const validItems = getValidAdditionalItems(
          additionalItems,
          congId,
          targetDate,
        );
        if (!validItems.length) continue;

        const existingMediaItemsForDate = lookupPeriodForCongregation.find(
          (day) => datesMatchForMoveAdditionalMedia(day, targetDate, congId),
        );
        if (existingMediaItemsForDate) {
          try {
            appendAdditionalItemsToDate(existingMediaItemsForDate, validItems);
          } catch (error) {
            errorCatcher(error, {
              contexts: {
                fn: {
                  name: 'move-additional-mediaMaps append additional media items',
                },
              },
            });
            continue;
          }
        } else {
          try {
            const parsedDate = dateFromString(targetDate);
            lookupPeriodForCongregation.push({
              date: parsedDate,
              mediaSections: [],
              status: 'complete',
            });
          } catch (error) {
            errorCatcher(error, {
              contexts: {
                fn: {
                  name: 'move-additional-mediaMaps parse targetDate',
                },
              },
            });
            continue;
          }
        }
      }
    }
    if ('additionalMediaMaps' in jwStore) {
      delete (jwStore as Record<string, unknown>)['additionalMediaMaps'];
    }
    jwStore.lookupPeriod = currentLookupPeriods;
    return true;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'move-additional-media',
        },
      },
    });
    return false;
  }
};
