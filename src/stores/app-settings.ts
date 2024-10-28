import type { OldAppConfig, ScreenPreferences } from 'src/types';

import { parseJsonSafe } from 'app/docs/utils/general';
import { defineStore, storeToRefs } from 'pinia';
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
        const { congregations } = storeToRefs(useCongregationSettingsStore());
        const jwStore = storeToRefs(useJwStore());
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
                congregations.value[newCongId] = newPrefsObject;
              } catch (error) {
                errorCatcher(error);
              }
            }
          }
        } else if (type === 'localStorageToPiniaPersist') {
          congregations.value = parseJsonSafe(
            QuasarStorage.getItem('congregations'),
            {},
          );
          QuasarStorage.removeItem('congregations');
          jwStore.additionalMediaMaps.value = parseJsonSafe(
            QuasarStorage.getItem('additionalMediaMaps'),
            {},
          );
          QuasarStorage.removeItem('additionalMediaMaps');
          jwStore.customDurations.value = parseJsonSafe(
            QuasarStorage.getItem('customDurations'),
            {},
          );
          QuasarStorage.removeItem('customDurations');
          jwStore.jwLanguages.value = parseJsonSafe(
            QuasarStorage.getItem('jwLanguages'),
            {
              list: [],
              updated: new Date(1900, 0, 1),
            },
          );
          QuasarStorage.removeItem('jwLanguages');
          jwStore.jwSongs.value = parseJsonSafe(
            QuasarStorage.getItem('jwSongs'),
            {},
          );
          QuasarStorage.removeItem('jwSongs');
          jwStore.lookupPeriod.value = parseJsonSafe(
            QuasarStorage.getItem('lookupPeriod'),
            {},
          );
          QuasarStorage.removeItem('lookupPeriod');
          jwStore.mediaSort.value = parseJsonSafe(
            QuasarStorage.getItem('mediaSort'),
            {},
          );
          QuasarStorage.removeItem('mediaSort');
          jwStore.yeartexts.value = parseJsonSafe(
            QuasarStorage.getItem('yeartexts'),
            {},
          );
          QuasarStorage.removeItem('yeartexts');
          this.migrations = this.migrations.concat(
            parseJsonSafe(QuasarStorage.getItem('migrations'), []),
          );
          QuasarStorage.removeItem('migrations');
          // this.migrations.push('firstRun');
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
