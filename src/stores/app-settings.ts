import type {
  DateInfo,
  JwLanguage,
  MediaItem,
  MediaLink,
  OldAppConfig,
  ScreenPreferences,
  SettingsValues,
} from 'src/types';

import { defineStore } from 'pinia';
import { LocalStorage as QuasarStorage } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  createMeetingSections,
  findMediaSection,
  getOrCreateMediaSection,
} from 'src/helpers/media-sections';
import { dateFromString, datesAreSame } from 'src/utils/date';
import { parseJsonSafe, uuid } from 'src/utils/general';
import {
  buildNewPrefsObject,
  getOldPrefsPaths,
  parsePrefsFile,
} from 'src/utils/migrations';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useJwStore } from 'stores/jw';
import { toRaw } from 'vue';

const { fs, getAppDataPath, path } = window.electronApi;
const { exists } = fs;
const { join } = path;

interface Store {
  displayCameraId: null | string;
  migrations: string[];
  screenPreferences: ScreenPreferences;
}

function toRawDeep<T>(observed: T): T {
  const val = toRaw(observed);

  if (Array.isArray(val)) {
    return val.map(toRawDeep) as T;
  }

  if (val === null) return null as T;

  if (typeof val === 'object') {
    const entries = Object.entries(val).map(([key, val]) => [
      key,
      toRawDeep(val),
    ]);

    return Object.fromEntries(entries);
  }

  return val;
}

export const useAppSettingsStore = defineStore('app-settings', {
  actions: {
    async runMigration(type: string) {
      try {
        let successfulMigration = true;
        const congregationStore = useCongregationSettingsStore();
        const jwStore = useJwStore();

        // Validate that jwStore is properly initialized
        if (!jwStore || typeof jwStore !== 'object') {
          console.warn('🔍 [migration] Invalid jwStore structure:', jwStore);
          return false;
        }

        /**
         * Removes all dynamic media entries from the lookupPeriod store, and sets the
         * complete and error flags to false for all days that have a meeting. This is
         * needed after certain updates to reset the state of the dynamic media items.
         */
        const refreshDynamicMedia = () => {
          // Validate that jwStore.lookupPeriod exists and is properly initialized
          if (
            !jwStore.lookupPeriod ||
            typeof jwStore.lookupPeriod !== 'object' ||
            Array.isArray(jwStore.lookupPeriod)
          ) {
            console.warn(
              '🔍 [refreshDynamicMedia] Invalid jwStore.lookupPeriod structure:',
              jwStore.lookupPeriod,
            );
            return;
          }

          let currentLookupPeriods;
          try {
            const rawLookupPeriod = toRawDeep(jwStore.lookupPeriod);
            currentLookupPeriods = structuredClone(rawLookupPeriod);
          } catch (error) {
            console.warn(
              '🔍 [refreshDynamicMedia] Failed to clone lookupPeriod:',
              error,
            );
            currentLookupPeriods = {};
          }
          try {
            for (const [congId, dateInfo] of Object.entries(
              currentLookupPeriods,
            )) {
              if (!congId || !dateInfo) continue;

              // Ensure dateInfo is an array
              if (!Array.isArray(dateInfo)) {
                console.warn(
                  '🔍 [refreshDynamicMedia] Invalid dateInfo structure for congregation:',
                  congId,
                  dateInfo,
                );
                continue;
              }

              dateInfo
                .filter((day) => !!day.meeting)
                .forEach((day, dayIndex) => {
                  // Validate day object structure
                  if (!day || typeof day !== 'object') {
                    console.warn(
                      '🔍 [refreshDynamicMedia] Skipping invalid day object at index:',
                      dayIndex,
                      day,
                    );
                    return;
                  }

                  // Ensure the date is properly converted to a Date object
                  if (day.date && !(day.date instanceof Date)) {
                    try {
                      console.warn(
                        '🔍 [refreshDynamicMedia] Converting corrupted date object:',
                        day.date,
                      );
                      day.date = dateFromString(day.date);
                    } catch (error) {
                      console.warn(
                        '🔍 [refreshDynamicMedia] Failed to convert corrupted date object, skipping day:',
                        day.date,
                        error,
                      );
                      return;
                    }
                  }

                  // Remove dynamic media from all sections
                  try {
                    day.mediaSections?.forEach((section) => {
                      if (section && section.items) {
                        section.items = section.items.filter(
                          (item) => item && item.source !== 'dynamic',
                        );
                      }
                    });
                  } catch (error) {
                    console.warn(
                      '🔍 [refreshDynamicMedia] Failed to process media sections for day:',
                      day.date,
                      error,
                    );
                  }
                  day.complete = false;
                  day.error = false;
                });
            }
          } catch (error) {
            console.warn(
              '🔍 [refreshDynamicMedia] Failed to process lookupPeriods:',
              error,
            );
          }

          jwStore.lookupPeriod = currentLookupPeriods;
        };

        if (type === 'firstRun') {
          // Validate that congregationStore.congregations exists and is properly initialized
          if (
            !congregationStore.congregations ||
            typeof congregationStore.congregations !== 'object' ||
            Array.isArray(congregationStore.congregations)
          ) {
            console.warn(
              '🔍 [migration] Invalid congregationStore.congregations structure in firstRun:',
              congregationStore.congregations,
            );
            congregationStore.congregations = {};
          }

          const oldVersionPath = join(
            await getAppDataPath(),
            'meeting-media-manager',
          );
          if (await exists(oldVersionPath)) {
            let oldPrefsPaths: string[];
            try {
              oldPrefsPaths = await getOldPrefsPaths(oldVersionPath);
            } catch (error) {
              console.warn(
                '🔍 [migration] Failed to get old prefs paths:',
                error,
              );
              oldPrefsPaths = [];
            }

            if (oldPrefsPaths.length === 0) {
              console.warn(
                '🔍 [migration] No old prefs paths found in:',
                oldVersionPath,
              );
            }

            await Promise.allSettled(
              oldPrefsPaths.map(async (oldPrefsPath) => {
                try {
                  let oldPrefs: OldAppConfig;
                  try {
                    oldPrefs = await parsePrefsFile(oldPrefsPath);
                  } catch (parseError) {
                    console.warn(
                      '🔍 [migration] Failed to parse prefs file:',
                      oldPrefsPath,
                      parseError,
                    );
                    return;
                  }

                  let newPrefsObject;
                  try {
                    newPrefsObject = buildNewPrefsObject(oldPrefs);
                  } catch (buildError) {
                    console.warn(
                      '🔍 [migration] Failed to build new prefs object for:',
                      oldPrefsPath,
                      buildError,
                    );
                    return;
                  }

                  let newCongId: string;
                  try {
                    newCongId = uuid();
                  } catch (uuidError) {
                    console.warn(
                      '🔍 [migration] Failed to generate UUID:',
                      uuidError,
                    );
                    return;
                  }

                  congregationStore.congregations[newCongId] = newPrefsObject;
                } catch (error) {
                  errorCatcher(error);
                }
              }),
            );
          } else {
            successfulMigration = false;
          }
        } else if (type === 'localStorageToPiniaPersist') {
          let parsedCongregations: Record<string, SettingsValues>;
          try {
            const congregationsString = String(
              QuasarStorage.getItem('congregations') || '{}',
            );
            parsedCongregations = parseJsonSafe<Record<string, SettingsValues>>(
              congregationsString,
              {},
            );
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to parse congregations in localStorageToPiniaPersist:',
              error,
            );
            parsedCongregations = {};
          }

          try {
            congregationStore.$patch({
              congregations: parsedCongregations,
            });
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to patch congregationStore in localStorageToPiniaPersist:',
              error,
            );
          }

          try {
            QuasarStorage.removeItem('congregations');
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to remove congregations from localStorage:',
              error,
            );
          }

          let parsedLookupPeriod:
            | Partial<Record<string, DateInfo[]>>
            | undefined;
          try {
            const lookupPeriodString = String(
              QuasarStorage.getItem('lookupPeriod') || '{}',
            );
            parsedLookupPeriod = parseJsonSafe<
              Partial<Record<string, DateInfo[]>>
            >(lookupPeriodString, jwStore.lookupPeriod);
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to parse lookupPeriod in localStorageToPiniaPersist:',
              error,
            );
            parsedLookupPeriod = undefined;
          }

          // Ensure all dates in lookupPeriod are properly converted to Date objects
          if (parsedLookupPeriod) {
            for (const [congId, dateInfo] of Object.entries(
              parsedLookupPeriod,
            )) {
              if (!dateInfo || !Array.isArray(dateInfo)) {
                console.warn(
                  '🔍 [migration] Invalid dateInfo structure in localStorageToPiniaPersist for congregation:',
                  congId,
                  dateInfo,
                );
                continue;
              }

              dateInfo.forEach((day, dayIndex) => {
                // Validate day object structure
                if (!day || typeof day !== 'object') {
                  console.warn(
                    '🔍 [migration] Skipping invalid day object in localStorageToPiniaPersist at index:',
                    dayIndex,
                    day,
                  );
                  return;
                }

                if (day.date && !(day.date instanceof Date)) {
                  try {
                    console.warn(
                      '🔍 [migration] Converting corrupted date object in localStorageToPiniaPersist:',
                      day.date,
                    );
                    day.date = dateFromString(day.date);
                  } catch (error) {
                    console.warn(
                      '🔍 [migration] Failed to convert corrupted date object in localStorageToPiniaPersist, skipping day:',
                      day.date,
                      error,
                    );
                    return;
                  }
                }
              });
            }
          }

          let parsedJwLanguages: {
            list: JwLanguage[];
            updated: Date | null | undefined;
          };
          let parsedJwSongs: Record<
            string,
            { list: MediaLink[]; updated: Date | null | undefined }
          >;
          let parsedYeartexts: Partial<Record<number, Record<string, string>>>;

          try {
            const jwLanguagesString = String(
              QuasarStorage.getItem('jwLanguages') || '{}',
            );
            parsedJwLanguages = parseJsonSafe<{
              list: JwLanguage[];
              updated: Date | null | undefined;
            }>(jwLanguagesString, jwStore.jwLanguages);
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to parse jwLanguages in localStorageToPiniaPersist:',
              error,
            );
            parsedJwLanguages = jwStore.jwLanguages;
          }

          try {
            const jwSongsString = String(
              QuasarStorage.getItem('jwSongs') || '{}',
            );
            parsedJwSongs = parseJsonSafe<
              Record<
                string,
                { list: MediaLink[]; updated: Date | null | undefined }
              >
            >(jwSongsString, jwStore.jwSongs);
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to parse jwSongs in localStorageToPiniaPersist:',
              error,
            );
            parsedJwSongs = jwStore.jwSongs;
          }

          try {
            const yeartextsString = String(
              QuasarStorage.getItem('yeartexts') || '{}',
            );
            parsedYeartexts = parseJsonSafe<
              Partial<Record<number, Record<string, string>>>
            >(yeartextsString, jwStore.yeartexts);
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to parse yeartexts in localStorageToPiniaPersist:',
              error,
            );
            parsedYeartexts = jwStore.yeartexts;
          }

          try {
            jwStore.$patch({
              jwLanguages: parsedJwLanguages,
              jwSongs: parsedJwSongs,
              lookupPeriod: parsedLookupPeriod,
              yeartexts: parsedYeartexts,
            });
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to patch jwStore in localStorageToPiniaPersist:',
              error,
            );
          }

          // Remove migrated items from localStorage
          ['jwLanguages', 'jwSongs', 'lookupPeriod', 'yeartexts'].forEach(
            (item) => {
              try {
                QuasarStorage.removeItem(item);
              } catch (error) {
                console.warn(
                  '🔍 [migration] Failed to remove item from localStorage:',
                  item,
                  error,
                );
              }
            },
          );

          let parsedMigrations: string[];
          let parsedScreenPreferences: ScreenPreferences;

          try {
            const migrationsString = String(
              QuasarStorage.getItem('migrations') || '[]',
            );
            parsedMigrations = parseJsonSafe(migrationsString, this.migrations);
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to parse migrations in localStorageToPiniaPersist:',
              error,
            );
            parsedMigrations = this.migrations;
          }

          this.migrations = this.migrations.concat(parsedMigrations);
          try {
            QuasarStorage.removeItem('migrations');
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to remove migrations from localStorage:',
              error,
            );
          }

          try {
            const screenPreferencesString = String(
              QuasarStorage.getItem('screenPreferences') || '{}',
            );
            parsedScreenPreferences = parseJsonSafe(
              screenPreferencesString,
              this.screenPreferences,
            );
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to parse screenPreferences in localStorageToPiniaPersist:',
              error,
            );
            parsedScreenPreferences = this.screenPreferences;
          }

          this.screenPreferences = parsedScreenPreferences;
          try {
            QuasarStorage.removeItem('screenPreferences');
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to remove screenPreferences from localStorage:',
              error,
            );
          }
        } else if (type === 'addBaseUrlToAllCongregations') {
          // Validate that congregationStore.congregations exists and is properly initialized
          if (
            !congregationStore.congregations ||
            typeof congregationStore.congregations !== 'object' ||
            Array.isArray(congregationStore.congregations)
          ) {
            console.warn(
              '🔍 [migration] Invalid congregationStore.congregations structure in addBaseUrlToAllCongregations:',
              congregationStore.congregations,
            );
            congregationStore.congregations = {};
          }

          let updatedCongregations: Partial<Record<string, SettingsValues>>;
          try {
            const rawCongregations = toRawDeep(congregationStore.congregations);
            updatedCongregations = structuredClone(rawCongregations);
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to clone congregations in addBaseUrlToAllCongregations:',
              error,
            );
            updatedCongregations = {};
          }

          try {
            Object.values(updatedCongregations).forEach((cong) => {
              if (cong && typeof cong === 'object') {
                cong.baseUrl = 'jw.org';
              }
            });
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to process congregations in addBaseUrlToAllCongregations:',
              error,
            );
          }
          congregationStore.congregations = updatedCongregations;
        } else if (type === 'moveAdditionalMediaMaps') {
          // Validate that jwStore exists and is properly initialized
          if (!jwStore || typeof jwStore !== 'object') {
            console.warn('🔍 [migration] Invalid jwStore structure:', jwStore);
            return successfulMigration;
          }

          let storedData: {
            additionalMediaMaps?: Record<
              string,
              Partial<Record<string, unknown[]>>
            >;
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
            console.warn('🔍 [migration] Failed to parse stored data:', error);
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
            console.warn(
              '🔍 [migration] Invalid storedData structure:',
              storedData,
            );
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
            console.warn(
              '🔍 [migration] Failed to clone lookupPeriod in moveAdditionalMediaMaps:',
              error,
            );
            currentLookupPeriods = {};
          }

          for (const [congId, dates] of Object.entries(
            currentAdditionalMediaMaps,
          )) {
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
                  console.warn(
                    '🔍 [migration] Failed to convert corrupted date object, skipping day:',
                    day.date,
                    error,
                  );
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
                console.warn(
                  '🔍 [migration] Failed to get or create media section for day:',
                  day.date,
                  error,
                );
              }
              day.complete = false;
              day.error = false;
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

              const existingMediaItemsForDate =
                lookupPeriodForCongregation.find((d) => {
                  // Ensure d.date is a proper Date object before comparison
                  if (d.date && !(d.date instanceof Date)) {
                    try {
                      console.warn(
                        '🔍 [migration] Converting corrupted date object in datesAreSame comparison:',
                        d.date,
                      );
                      d.date = dateFromString(d.date);
                    } catch (error) {
                      console.warn(
                        '🔍 [migration] Failed to convert corrupted date object in datesAreSame comparison, skipping:',
                        d.date,
                        error,
                      );
                      return false;
                    }
                  }

                  try {
                    return datesAreSame(d.date, targetDate);
                  } catch (error) {
                    console.warn(
                      '🔍 [migration] Failed to compare dates, skipping:',
                      d.date,
                      targetDate,
                      error,
                    );
                    return false;
                  }
                });
              if (existingMediaItemsForDate) {
                existingMediaItemsForDate.mediaSections ??= [];
                let additionalSection;
                try {
                  additionalSection = findMediaSection(
                    existingMediaItemsForDate.mediaSections,
                    'imported-media',
                  );
                } catch (error) {
                  console.warn(
                    '🔍 [migration] Failed to find media section for existing media items:',
                    error,
                  );
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
                  console.warn(
                    '🔍 [migration] Failed to get or create target media section:',
                    error,
                  );
                  continue;
                }
              } else {
                try {
                  const parsedDate = dateFromString(targetDate);
                  lookupPeriodForCongregation.push({
                    complete: true,
                    date: parsedDate,
                    error: false,
                    mediaSections: [],
                    meeting: false,
                    today: false,
                  });
                } catch (error) {
                  console.warn(
                    '🔍 [migration] Failed to parse targetDate, skipping:',
                    targetDate,
                    error,
                  );
                  continue;
                }
              }
            }
          }
          if ('additionalMediaMaps' in jwStore) {
            delete (
              jwStore as typeof jwStore & { additionalMediaMaps?: unknown }
            ).additionalMediaMaps;
          }
          jwStore.lookupPeriod = currentLookupPeriods;
        } else if (type.endsWith('refreshDynamicMedia')) {
          refreshDynamicMedia();
        } else if (type === '25.8.4-newMediaSections') {
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
            for (const [congId, dateInfo] of Object.entries(
              jwStore.lookupPeriod,
            )) {
              if (Array.isArray(dateInfo)) {
                currentLookupPeriods[congId] = dateInfo.map((day) => ({
                  ...day,
                  date:
                    day.date instanceof Date
                      ? new Date(day.date.getTime())
                      : day.date,
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
          for (const [congId, dateInfo] of Object.entries(
            currentLookupPeriods,
          )) {
            if (!congId || !dateInfo) continue;

            // Ensure dateInfo is an array
            if (!Array.isArray(dateInfo)) {
              console.warn(
                '🔍 [migration] Invalid dateInfo structure in 25.8.4-newMediaSections for congregation:',
                congId,
                dateInfo,
              );
              continue;
            }

            console.log('dateInfo', dateInfo, jwStore.lookupPeriod);

            const filteredDateInfo = dateInfo.filter(
              (day) => day.date?.getTime && !isNaN(day.date.getTime()),
            );

            console.log('filteredDateInfo', filteredDateInfo);

            filteredDateInfo.forEach((day, dayIndex) => {
              // Validate day object structure
              if (!day || typeof day !== 'object') {
                console.warn(
                  '🔍 [migration] Skipping invalid day object in 25.8.4-newMediaSections at index:',
                  dayIndex,
                  day,
                );
                return;
              }

              // Ensure the date is properly converted to a Date object
              if (day.date && !(day.date instanceof Date)) {
                try {
                  console.warn(
                    '🔍 [migration] Converting corrupted date object in 25.8.4-newMediaSections:',
                    day.date,
                  );
                  day.date = dateFromString(day.date);
                } catch (error) {
                  console.warn(
                    '🔍 [migration] Failed to convert corrupted date object in 25.8.4-newMediaSections, skipping day:',
                    day.date,
                    error,
                  );
                  return;
                }
              }

              day.mediaSections = [];
              if (day.complete) {
                day.complete = false;
              }
              if (day.error) {
                day.error = false;
              }

              try {
                createMeetingSections(day);
              } catch (error) {
                console.warn(
                  '🔍 [migration] Failed to create meeting sections for day in 25.8.4-newMediaSections:',
                  day.date,
                  error,
                );
              }
            });
            // Update the currentLookupPeriods with the filtered array
            currentLookupPeriods[congId] = filteredDateInfo;
          }
          jwStore.lookupPeriod = currentLookupPeriods;
        } else {
          // Other migrations can be added here
        }
        this.migrations.push(type);
        return successfulMigration;
      } catch (error) {
        errorCatcher(error);
        return false;
      }
    },
  },
  getters: {},
  persist: true,
  state: (): Store => {
    return {
      displayCameraId: null,
      migrations: [],
      screenPreferences: { preferredScreenNumber: 0, preferWindowed: false },
    };
  },
});
