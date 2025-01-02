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
import {
  buildNewPrefsObject,
  getOldPrefsPaths,
  parsePrefsFile,
} from 'src/helpers/migrations';
import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useJwStore } from 'src/stores/jw';
import { uuid } from 'src/utils/general';

const parseJsonSafe = <T>(json: null | string | T, fallback: T): T => {
  if (!json) return fallback;
  try {
    return typeof json === 'string' ? (JSON.parse(json) as T) : json;
  } catch (e) {
    errorCatcher(e);
    return fallback;
  }
};

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
            additionalMediaMaps: parseJsonSafe<
              Record<string, Record<string, DynamicMediaObject[]>>
            >(QuasarStorage.getItem('additionalMediaMaps'), {}),
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
            yeartexts: parseJsonSafe<Record<number, Record<string, string>>>(
              QuasarStorage.getItem('yeartexts'),
              {},
            ),
          });

          // Remove migrated items from localStorage
          [
            'additionalMediaMaps',
            'jwLanguages',
            'jwSongs',
            'lookupPeriod',
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
          const updatedCongregations: Record<string, SettingsValues> =
            JSON.parse(JSON.stringify(congregationStore.congregations));

          Object.values(updatedCongregations).forEach((cong) => {
            cong.baseUrl = 'jw.org';
          });
          congregationStore.congregations = updatedCongregations;
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
