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
import { LocalStorage as QuasarStorage, uid } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  buildNewPrefsObject,
  getOldPrefsPaths,
  parsePrefsFile,
} from 'src/helpers/migrations';
import { parseJsonSafe } from 'src/helpers/settings';
import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useJwStore } from 'src/stores/jw';

const { fs, getAppDataPath, path } = window.electronApi;

interface Store {
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
        if (type === 'firstRun') {
          const oldVersionPath = path.join(
            await getAppDataPath(),
            'meeting-media-manager',
          );
          if (await fs.exists(oldVersionPath)) {
            const oldPrefsPaths = await getOldPrefsPaths(oldVersionPath);
            await Promise.all(
              oldPrefsPaths.map(async (oldPrefsPath) => {
                try {
                  const oldPrefs: OldAppConfig =
                    await parsePrefsFile(oldPrefsPath);
                  const newPrefsObject = buildNewPrefsObject(oldPrefs);
                  const newCongId = uid();
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
            additionalMediaMaps: parseJsonSafe<
              Record<string, Record<string, DynamicMediaObject[]>>
            >(QuasarStorage.getItem('additionalMediaMaps'), {}),
            customDurations: parseJsonSafe<
              Record<
                string,
                Record<string, Record<string, { max: number; min: number }>>
              >
            >(QuasarStorage.getItem('customDurations'), {}),
            jwLanguages: parseJsonSafe<{ list: JwLanguage[]; updated: Date }>(
              QuasarStorage.getItem('jwLanguages'),
              { list: [], updated: new Date(0) },
            ),
            jwSongs: parseJsonSafe<
              Record<string, { list: MediaLink[]; updated: Date }>
            >(QuasarStorage.getItem('jwSongs'), jwStore.jwSongs),
            lookupPeriod: parseJsonSafe<Record<string, DateInfo[]>>(
              QuasarStorage.getItem('lookupPeriod'),
              {},
            ),
            mediaSort: parseJsonSafe<Record<string, Record<string, string[]>>>(
              QuasarStorage.getItem('mediaSort'),
              {},
            ),
            yeartexts: parseJsonSafe<Record<number, Record<string, string>>>(
              QuasarStorage.getItem('yeartexts'),
              {},
            ),
          });

          // Remove migrated items from localStorage
          [
            'additionalMediaMaps',
            'customDurations',
            'jwLanguages',
            'jwSongs',
            'lookupPeriod',
            'mediaSort',
            'yeartexts',
          ].forEach((item) => {
            QuasarStorage.removeItem(item);
          });

          this.migrations = this.migrations.concat(
            parseJsonSafe(QuasarStorage.getItem('migrations'), []),
          );
          QuasarStorage.removeItem('migrations');

          this.screenPreferences = parseJsonSafe(
            QuasarStorage.getItem('screenPreferences'),
            { preferredScreenNumber: 0, preferWindowed: false },
          );
          QuasarStorage.removeItem('screenPreferences');
        } else if (type === 'addBaseUrlToAllCongregations') {
          congregationStore.$patch((state) => {
            Object.values(state.congregations).forEach((prefs) => {
              prefs.baseUrl = 'jw.org';
            });
          });
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
      migrations: [],
      screenPreferences: { preferredScreenNumber: 0, preferWindowed: false },
    };
  },
});
