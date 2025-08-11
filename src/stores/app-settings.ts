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

        /**
         * Removes all dynamic media entries from the lookupPeriod store, and sets the
         * complete and error flags to false for all days that have a meeting. This is
         * needed after certain updates to reset the state of the dynamic media items.
         */
        const refreshDynamicMedia = () => {
          const currentLookupPeriods = structuredClone(
            toRawDeep(jwStore.lookupPeriod),
          );
          for (const [congId, dateInfo] of Object.entries(
            currentLookupPeriods,
          )) {
            if (!congId || !dateInfo) continue;
            dateInfo
              .filter((day) => !!day.meeting)
              .forEach((day) => {
                // Remove dynamic media from all sections
                day.mediaSections.forEach((section) => {
                  if (section.items) {
                    section.items = section.items.filter(
                      (item) => item.source !== 'dynamic',
                    );
                  }
                });
                day.complete = false;
                day.error = false;
              });
          }
          jwStore.lookupPeriod = currentLookupPeriods;
        };

        if (type === 'firstRun') {
          const oldVersionPath = join(
            await getAppDataPath(),
            'meeting-media-manager',
          );
          if (await exists(oldVersionPath)) {
            const oldPrefsPaths = await getOldPrefsPaths(oldVersionPath);
            await Promise.allSettled(
              oldPrefsPaths.map(async (oldPrefsPath) => {
                try {
                  const oldPrefs: OldAppConfig =
                    await parsePrefsFile(oldPrefsPath);
                  const newPrefsObject = buildNewPrefsObject(oldPrefs);
                  const newCongId = uuid();
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
          congregationStore.$patch({
            congregations: parseJsonSafe<Record<string, SettingsValues>>(
              QuasarStorage.getItem('congregations'),
              {},
            ),
          });

          QuasarStorage.removeItem('congregations');

          jwStore.$patch({
            jwLanguages: parseJsonSafe<{ list: JwLanguage[]; updated: Date }>(
              QuasarStorage.getItem('jwLanguages'),
              jwStore.jwLanguages,
            ),
            jwSongs: parseJsonSafe<
              Record<string, { list: MediaLink[]; updated: Date }>
            >(QuasarStorage.getItem('jwSongs'), jwStore.jwSongs),
            lookupPeriod: parseJsonSafe<Partial<Record<string, DateInfo[]>>>(
              QuasarStorage.getItem('lookupPeriod'),
              jwStore.lookupPeriod,
            ),
            yeartexts: parseJsonSafe<
              Partial<Record<number, Record<string, string>>>
            >(QuasarStorage.getItem('yeartexts'), jwStore.yeartexts),
          });

          // Remove migrated items from localStorage
          ['jwLanguages', 'jwSongs', 'lookupPeriod', 'yeartexts'].forEach(
            (item) => {
              QuasarStorage.removeItem(item);
            },
          );

          this.migrations = this.migrations.concat(
            parseJsonSafe(QuasarStorage.getItem('migrations'), this.migrations),
          );
          QuasarStorage.removeItem('migrations');

          this.screenPreferences = parseJsonSafe(
            QuasarStorage.getItem('screenPreferences'),
            this.screenPreferences,
          );
          QuasarStorage.removeItem('screenPreferences');
        } else if (type === 'addBaseUrlToAllCongregations') {
          const updatedCongregations: Record<string, SettingsValues> =
            JSON.parse(JSON.stringify(congregationStore.congregations));

          Object.values(updatedCongregations).forEach((cong) => {
            cong.baseUrl = 'jw.org';
          });
          congregationStore.congregations = updatedCongregations;
        } else if (type === 'moveAdditionalMediaMaps') {
          const storedData = JSON.parse(
            QuasarStorage.getItem('jw-store') || '{}',
          ) as {
            additionalMediaMaps?: Record<
              string,
              Partial<Record<string, unknown[]>>
            >;
          };

          const currentAdditionalMediaMaps: Record<
            string,
            Partial<Record<string, unknown[]>>
          > = storedData.additionalMediaMaps || {};

          const currentLookupPeriods: Record<string, DateInfo[]> = JSON.parse(
            JSON.stringify(jwStore.lookupPeriod),
          );

          for (const [congId, dates] of Object.entries(
            currentAdditionalMediaMaps,
          )) {
            if (!congId || !currentLookupPeriods) continue;
            if (!currentLookupPeriods[congId]) {
              currentLookupPeriods[congId] = [];
            }
            const lookupPeriodForCongregation = currentLookupPeriods[congId];
            lookupPeriodForCongregation.forEach((day) => {
              // Initialize mediaSections if it doesn't exist
              if (!day.mediaSections) {
                day.mediaSections = [];
              }
              // Clear additional section
              const additionalSection = getOrCreateMediaSection(
                day.mediaSections,
                'imported-media',
              );
              additionalSection.items = [];
              day.complete = false;
              day.error = false;
            });
            for (const [targetDate, additionalItems] of Object.entries(dates)) {
              if (!targetDate || !additionalItems) continue;
              (additionalItems as MediaItem[]).forEach((item) => {
                item.source = 'additional';
              });
              const existingMediaItemsForDate =
                lookupPeriodForCongregation.find((d) =>
                  datesAreSame(d.date, targetDate),
                );
              if (existingMediaItemsForDate) {
                const additionalSection = findMediaSection(
                  existingMediaItemsForDate.mediaSections,
                  'imported-media',
                );
                const existingItems = additionalSection?.items || [];

                const newAdditionalItems = (
                  additionalItems as MediaItem[]
                ).filter(
                  (item) =>
                    !existingItems.find(
                      (m: MediaItem) => m.uniqueId === item.uniqueId,
                    ),
                );

                const targetSection = getOrCreateMediaSection(
                  existingMediaItemsForDate.mediaSections,
                  'imported-media',
                );
                targetSection.items ??= [];
                targetSection.items.push(...newAdditionalItems);
              } else {
                lookupPeriodForCongregation.push({
                  complete: true,
                  date: dateFromString(targetDate),
                  error: false,
                  mediaSections: [],
                  meeting: false,
                  today: false,
                });
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
        } else if (type === 'newMediaSections') {
          const currentLookupPeriods = structuredClone(
            toRawDeep(jwStore.lookupPeriod),
          );
          for (const [congId, dateInfo] of Object.entries(
            currentLookupPeriods,
          )) {
            if (!congId || !dateInfo) continue;
            dateInfo.forEach((day) => {
              day.mediaSections = [];
              createMeetingSections(day);
            });
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
