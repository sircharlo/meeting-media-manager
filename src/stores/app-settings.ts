import type { OldAppConfig, ScreenPreferences } from 'src/types';

import { defineStore, storeToRefs } from 'pinia';
import { LocalStorage, uid } from 'quasar';
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
          congregations.value = LocalStorage.getItem('congregations') || {};
          LocalStorage.removeItem('congregations');
          jwStore.additionalMediaMaps.value =
            LocalStorage.getItem('additionalMediaMaps') || {};
          LocalStorage.removeItem('additionalMediaMaps');
          jwStore.customDurations.value =
            LocalStorage.getItem('customDurations') || {};
          LocalStorage.removeItem('customDurations');
          jwStore.jwLanguages.value = LocalStorage.getItem('jwLanguages') || {
            list: [],
            updated: new Date(1900, 0, 1),
          };
          LocalStorage.removeItem('jwLanguages');
          jwStore.jwSongs.value = LocalStorage.getItem('jwSongs') || {};
          LocalStorage.removeItem('jwSongs');
          jwStore.lookupPeriod.value =
            LocalStorage.getItem('lookupPeriod') || {};
          LocalStorage.removeItem('lookupPeriod');
          jwStore.mediaSort.value = LocalStorage.getItem('mediaSort') || {};
          LocalStorage.removeItem('mediaSort');
          jwStore.yeartexts.value = LocalStorage.getItem('yeartexts') || {};
          LocalStorage.removeItem('yeartexts');
          this.migrations = this.migrations.concat(
            LocalStorage.getItem('migrations') || [],
          );
          LocalStorage.removeItem('migrations');
          // this.migrations.push('firstRun');
          this.screenPreferences = LocalStorage.getItem(
            'screenPreferences',
          ) || { preferredScreenNumber: 0, preferWindowed: false };
          LocalStorage.removeItem('screenPreferences');
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
