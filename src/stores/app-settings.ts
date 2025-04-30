import type {
  DateInfo,
  DynamicMediaObject,
  JwLanguage,
  MediaLink,
  OldAppConfig,
  ScreenPreferences,
  SettingsValues,
} from 'src/types';

import { defineStore } from 'pinia';
import { LocalStorage as QuasarStorage } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { dateFromString, datesAreSame } from 'src/utils/date';
import { parseJsonSafe, uuid } from 'src/utils/general';
import {
  buildNewPrefsObject,
  getOldPrefsPaths,
  parsePrefsFile,
} from 'src/utils/migrations';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useJwStore } from 'stores/jw';

interface Store {
  displayCameraId: null | string;
  migrations: string[];
  screenPreferences: ScreenPreferences;
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
          const currentLookupPeriods: Record<string, DateInfo[]> = JSON.parse(
            JSON.stringify(jwStore.lookupPeriod),
          );
          for (const [congId, dateInfo] of Object.entries(
            currentLookupPeriods,
          )) {
            if (!congId || !dateInfo) continue;
            dateInfo
              .filter((day) => !!day.meeting)
              .forEach((day) => {
                day.dynamicMedia =
                  day.dynamicMedia.filter(
                    (item) => item.source !== 'dynamic',
                  ) || [];
                day.complete = false;
                day.error = false;
              });
          }
          jwStore.lookupPeriod = currentLookupPeriods;
        };

        if (type === 'firstRun') {
          const oldVersionPath = window.electronApi.path.join(
            await window.electronApi.getAppDataPath(),
            'meeting-media-manager',
          );
          if (await window.electronApi.fs.exists(oldVersionPath)) {
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
              Partial<Record<string, DynamicMediaObject[]>>
            >;
          };

          const currentAdditionalMediaMaps: Record<
            string,
            Partial<Record<string, DynamicMediaObject[]>>
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
              day.dynamicMedia = [];
              day.complete = false;
              day.error = false;
            });
            for (const [targetDate, additionalItems] of Object.entries(dates)) {
              if (!targetDate || !additionalItems) continue;
              additionalItems.forEach((item) => {
                item.source = 'additional';
              });
              const existingMediaItemsForDate =
                lookupPeriodForCongregation.find((d) =>
                  datesAreSame(d.date, targetDate),
                );
              if (existingMediaItemsForDate) {
                const newAdditionalItems = additionalItems.filter(
                  (item) =>
                    !existingMediaItemsForDate?.dynamicMedia?.find(
                      (m) => m.uniqueId === item.uniqueId,
                    ),
                );
                existingMediaItemsForDate.dynamicMedia.push(
                  ...newAdditionalItems,
                );
              } else {
                lookupPeriodForCongregation.push({
                  complete: true,
                  date: dateFromString(targetDate),
                  dynamicMedia: additionalItems,
                  error: false,
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
