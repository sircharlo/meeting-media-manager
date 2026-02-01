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
      errorCatcher(
        new Error('Invalid jwStore structure in moveAdditionalMediaMaps'),
        {
          contexts: {
            fn: {
              name: 'moveAdditionalMediaMaps',
            },
          },
        },
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
    if (
      !storedData ||
      typeof storedData !== 'object' ||
      Array.isArray(storedData)
    ) {
      errorCatcher(
        new Error('Invalid storedData structure in moveAdditionalMediaMaps'),
        {
          contexts: {
            fn: {
              name: 'moveAdditionalMediaMaps',
            },
          },
        },
      );
      return successfulMigration;
    }

    // Validate that currentAdditionalMediaMaps is a proper object
    if (
      !currentAdditionalMediaMaps ||
      typeof currentAdditionalMediaMaps !== 'object' ||
      Array.isArray(currentAdditionalMediaMaps)
    ) {
      errorCatcher(
        new Error(
          'Invalid currentAdditionalMediaMaps structure in moveAdditionalMediaMaps',
        ),
        {
          contexts: {
            fn: {
              name: 'moveAdditionalMediaMaps',
            },
          },
        },
      );
      return successfulMigration;
    }

    // Validate that jwStore.lookupPeriod exists and is properly initialized
    if (
      !jwStore.lookupPeriod ||
      typeof jwStore.lookupPeriod !== 'object' ||
      Array.isArray(jwStore.lookupPeriod)
    ) {
      errorCatcher(
        new Error(
          'Invalid jwStore.lookupPeriod structure in moveAdditionalMediaMaps',
        ),
        {
          contexts: {
            fn: {
              name: 'moveAdditionalMediaMaps',
            },
          },
        },
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
      if (!dates || typeof dates !== 'object' || Array.isArray(dates)) {
        errorCatcher(
          new Error(
            'Invalid dates structure for congregation in moveAdditionalMediaMaps',
          ),
          {
            contexts: {
              fn: {
                congId,
                dates,
                name: 'moveAdditionalMediaMaps',
              },
            },
          },
        );
        continue;
      }

      // Ensure lookupPeriodForCongregation is an array
      if (!Array.isArray(lookupPeriodForCongregation)) {
        errorCatcher(
          new Error(
            'Invalid lookupPeriodForCongregation structure for congregation in moveAdditionalMediaMaps',
          ),
          {
            contexts: {
              fn: {
                congId,
                lookupPeriodForCongregation,
                name: 'moveAdditionalMediaMaps',
              },
            },
          },
        );
        continue;
      }

      lookupPeriodForCongregation.forEach((day, dayIndex) => {
        // Validate day object structure
        if (!day || typeof day !== 'object') {
          errorCatcher(
            new Error(
              'Invalid day object structure in moveAdditionalMediaMaps',
            ),
            {
              contexts: {
                fn: {
                  congId,
                  day,
                  dayIndex,
                  name: 'moveAdditionalMediaMaps',
                },
              },
            },
          );
          return;
        }

        // Ensure the date is properly converted to a Date object
        if (day.date && !(day.date instanceof Date)) {
          try {
            errorCatcher(
              new Error(
                'Invalid date object structure in moveAdditionalMediaMaps',
              ),
              {
                contexts: {
                  fn: {
                    congId,
                    day,
                    dayIndex,
                    name: 'moveAdditionalMediaMaps',
                  },
                },
              },
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
                congId,
                day,
                dayIndex,
                name: 'moveAdditionalMediaMaps get or create media section',
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
          errorCatcher(
            new Error(
              'Invalid targetDate structure in moveAdditionalMediaMaps',
            ),
            {
              contexts: {
                fn: {
                  congId,
                  name: 'moveAdditionalMediaMaps',
                  targetDate,
                },
              },
            },
          );
          continue;
        }

        // Additional validation: check if targetDate looks like a valid date format
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(targetDate) &&
          !/^\d{8}$/.test(targetDate)
        ) {
          errorCatcher(
            new Error(
              'Invalid targetDate structure in moveAdditionalMediaMaps',
            ),
            {
              contexts: {
                fn: {
                  congId,
                  name: 'moveAdditionalMediaMaps',
                  targetDate,
                },
              },
            },
          );
          continue;
        }

        // Ensure additionalItems is an array
        if (!Array.isArray(additionalItems)) {
          errorCatcher(
            new Error(
              'Invalid additionalItems structure in moveAdditionalMediaMaps',
            ),
            {
              contexts: {
                fn: {
                  additionalItems,
                  congId,
                  name: 'moveAdditionalMediaMaps',
                },
              },
            },
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
            errorCatcher(
              new Error('Invalid item structure in moveAdditionalMediaMaps'),
              {
                contexts: {
                  fn: {
                    congId,
                    index,
                    item,
                    name: 'moveAdditionalMediaMaps',
                    targetDate,
                  },
                },
              },
            );
          }
        });

        if (validItems.length === 0) {
          errorCatcher(
            new Error(
              'No valid items found for targetDate in moveAdditionalMediaMaps',
            ),
            {
              contexts: {
                fn: {
                  congId,
                  name: 'moveAdditionalMediaMaps',
                  targetDate,
                },
              },
            },
          );
          continue;
        }

        const existingMediaItemsForDate = lookupPeriodForCongregation.find(
          (d) => {
            // Ensure d.date is a proper Date object before comparison
            if (d.date && !(d.date instanceof Date)) {
              try {
                errorCatcher(
                  new Error(
                    'Converting corrupted date object in datesAreSame comparison in moveAdditionalMediaMaps',
                  ),
                  {
                    contexts: {
                      fn: {
                        congId,
                        name: 'moveAdditionalMediaMaps convert corrupted date object in datesAreSame comparison',
                        targetDate,
                      },
                    },
                  },
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
              !existingItems.some(
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
