import type {
  DateInfo,
  DynamicMediaObject,
  JwLanguage,
  MediaLink,
  OldAppConfig,
  ScreenPreferences,
  SettingsValues,
} from 'src/types';

import { parseJsonSafe } from 'app/docs/utils/general';
import { defineStore } from 'pinia';
import { LocalStorage as QuasarStorage, uid } from 'quasar';
import { electronApi } from 'src/helpers/electron-api';
import { errorCatcher } from 'src/helpers/error-catcher';
import {
  buildNewPrefsObject,
  getOldPrefsPaths,
  parsePrefsFile,
} from 'src/helpers/migrations';
import { useCongregationSettingsStore } from 'src/stores/congregation-settings';
import { useJwStore } from 'src/stores/jw';

const { fs, getAppDataPath, path } = electronApi;

export const useAppSettingsStore = defineStore('app-settings', {
  actions: {
    runMigration(type: string) {
      try {
        let successfulMigration = true;
        const congregationStore = useCongregationSettingsStore();
        const jwStore = useJwStore();
        if (type === 'firstRun') {
          const oldVersionPath = path.join(
            getAppDataPath(),
            'meeting-media-manager',
          );
          if (!fs.existsSync(oldVersionPath)) {
            successfulMigration = false;
          } else {
            for (const oldPrefsPath of getOldPrefsPaths(oldVersionPath)) {
              try {
                const oldPrefs: OldAppConfig = parsePrefsFile(
                  oldPrefsPath.path,
                );
                const newPrefsObject = buildNewPrefsObject(oldPrefs);
                const newCongId = uid();
                congregationStore.congregations[newCongId] = newPrefsObject;
              } catch (error) {
                errorCatcher(error);
              }
            }
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
              {
                list: [],
                updated: new Date(1900, 0, 1),
              },
            ),
            jwSongs: parseJsonSafe<
              Record<string, { list: MediaLink[]; updated: Date }>
            >(QuasarStorage.getItem('jwSongs'), {}),
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

          QuasarStorage.removeItem('additionalMediaMaps');
          QuasarStorage.removeItem('customDurations');
          QuasarStorage.removeItem('jwLanguages');
          QuasarStorage.removeItem('jwSongs');
          QuasarStorage.removeItem('lookupPeriod');
          QuasarStorage.removeItem('mediaSort');
          QuasarStorage.removeItem('yeartexts');

          this.migrations = this.migrations.concat(
            parseJsonSafe(QuasarStorage.getItem('migrations'), []),
          );
          QuasarStorage.removeItem('migrations');

          this.screenPreferences = parseJsonSafe(
            QuasarStorage.getItem('screenPreferences'),
            { preferredScreenNumber: 0, preferWindowed: false },
          );
          QuasarStorage.removeItem('screenPreferences');
        } else {
          // other migrations will go here
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
  state: () => {
    return {
      migrations: [] as string[],
      screenPreferences: {} as ScreenPreferences,
    };
  },
});
