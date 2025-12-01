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

export const moveAdditionalMediaMaps: MigrationFunction = async () => {
  try {
    const jwStore = useJwStore();
    const successfulMigration = true;

    // Validate that jwStore exists and is properly initialized
    if (!jwStore || typeof jwStore !== 'object') {
      console.warn('🔍 [migration] Invalid jwStore structure:', jwStore);
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
    if (
      !storedData ||
      typeof storedData !== 'object' ||
      Array.isArray(storedData)
    ) {
      console.warn('🔍 [migration] Invalid storedData structure:', storedData);
      return successfulMigration;
    }

    // Validate that currentAdditionalMediaMaps is a proper object
    if (
      !currentAdditionalMediaMaps ||
      typeof currentAdditionalMediaMaps !== 'object' ||
      Array.isArray(currentAdditionalMediaMaps)
    ) {
      console.warn(
        '🔍 [migration] Invalid currentAdditionalMediaMaps structure:',
        currentAdditionalMediaMaps,
      );
      return successfulMigration;
    }

    // Validate that jwStore.lookupPeriod exists and is properly initialized
    if (
      !jwStore.lookupPeriod ||
      typeof jwStore.lookupPeriod !== 'object' ||
      Array.isArray(jwStore.lookupPeriod)
    ) {
      console.warn(
        '🔍 [migration] Invalid jwStore.lookupPeriod structure:',
        jwStore.lookupPeriod,
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
      if (!currentLookupPeriods[congId]) {
        currentLookupPeriods[congId] = [];
      }
      const lookupPeriodForCongregation = currentLookupPeriods[congId];
      if (!lookupPeriodForCongregation) continue;

      // Validate that dates is a proper object with string keys
      if (!dates || typeof dates !== 'object' || Array.isArray(dates)) {
        console.warn(
          '🔍 [migration] Invalid dates structure for congregation:',
          congId,
          dates,
        );
        continue;
      }

      // Ensure lookupPeriodForCongregation is an array
      if (!Array.isArray(lookupPeriodForCongregation)) {
        console.warn(
          '🔍 [migration] Invalid lookupPeriodForCongregation structure for congregation:',
          congId,
          lookupPeriodForCongregation,
        );
        continue;
      }

      lookupPeriodForCongregation.forEach((day, dayIndex) => {
        // Validate day object structure
        if (!day || typeof day !== 'object') {
          console.warn(
            '🔍 [migration] Skipping invalid day object at index:',
            dayIndex,
            day,
          );
          return;
        }

        // Ensure the date is properly converted to a Date object
        if (day.date && !(day.date instanceof Date)) {
          try {
            console.warn(
              '🔍 [migration] Converting corrupted date object in lookupPeriodForCongregation:',
              day.date,
            );
            day.date = dateFromString(day.date);
          } catch (error) {
            errorCatcher(error, {
              contexts: {
                fn: {
                  name: 'move-additional-mediaMaps convert corrupted date object',
                },
              },
            });
            return;
          }
        }

        // Initialize mediaSections if it doesn't exist
        day.mediaSections ??= [];
        // Clear additional section
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
                name: 'move-additional-mediaMaps get or create media section',
              },
            },
          });
        }
        day.status = null;
      });
      for (const [targetDate, additionalItems] of Object.entries(dates)) {
        if (!targetDate || !additionalItems) continue;

        // Skip if targetDate is not a valid date string (e.g., empty object)
        if (typeof targetDate !== 'string' || !targetDate.trim()) {
          console.warn(
            '🔍 [migration] Skipping invalid targetDate:',
            targetDate,
          );
          continue;
        }

        // Additional validation: check if targetDate looks like a valid date format
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(targetDate) &&
          !/^\d{8}$/.test(targetDate)
        ) {
          console.warn(
            '🔍 [migration] Skipping targetDate with invalid format:',
            targetDate,
          );
          continue;
        }

        // Ensure additionalItems is an array
        if (!Array.isArray(additionalItems)) {
          console.warn(
            '🔍 [migration] Skipping non-array additionalItems for targetDate:',
            targetDate,
            additionalItems,
          );
          continue;
        }

        // Validate and process each item
        const validItems: MediaItem[] = [];
        (additionalItems as MediaItem[]).forEach((item, index) => {
          if (item && typeof item === 'object' && item.uniqueId) {
            item.source = 'additional';
            validItems.push(item);
          } else {
            console.warn(
              '🔍 [migration] Skipping invalid item at index:',
              index,
              item,
            );
          }
        });

        if (validItems.length === 0) {
          console.warn(
            '🔍 [migration] No valid items found for targetDate:',
            targetDate,
          );
          continue;
        }

        const existingMediaItemsForDate = lookupPeriodForCongregation.find(
          (d) => {
            // Ensure d.date is a proper Date object before comparison
            if (d.date && !(d.date instanceof Date)) {
              try {
                console.warn(
                  '🔍 [migration] Converting corrupted date object in datesAreSame comparison:',
                  d.date,
                );
                d.date = dateFromString(d.date);
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
              return datesAreSame(d.date, targetDate);
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
          },
        );
        if (existingMediaItemsForDate) {
          existingMediaItemsForDate.mediaSections ??= [];
          let additionalSection;
          try {
            additionalSection = findMediaSection(
              existingMediaItemsForDate.mediaSections,
              'imported-media',
            );
          } catch (error) {
            errorCatcher(error, {
              contexts: {
                fn: {
                  name: 'move-additional-mediaMaps find media section for existing media items',
                },
              },
            });
            continue;
          }
          const existingItems = additionalSection?.items || [];

          const newAdditionalItems = validItems.filter(
            (item) =>
              !existingItems.find(
                (m: MediaItem) => m.uniqueId === item.uniqueId,
              ),
          );

          let targetSection;
          try {
            targetSection = getOrCreateMediaSection(
              existingMediaItemsForDate.mediaSections,
              'imported-media',
            );
            targetSection.items ??= [];
            targetSection.items.push(...newAdditionalItems);
          } catch (error) {
            errorCatcher(error, {
              contexts: {
                fn: {
                  name: 'move-additional-mediaMaps get or create target media section',
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
      delete (jwStore as typeof jwStore & { additionalMediaMaps?: unknown })
        .additionalMediaMaps;
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
