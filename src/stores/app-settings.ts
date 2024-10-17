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

const { fs, getAppDataPath, path } = electronApi;

export const useAppSettingsStore = defineStore('app-settings', {
  actions: {
    runMigration(type: string) {
      try {
        let successfulMigration = true;
        const { congregations } = storeToRefs(useCongregationSettingsStore());
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
        } else {
          // future migrations will go here
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
  state: () => {
    return {
      migrations: (LocalStorage.getItem('migrations') || []) as string[],
      screenPreferences: (LocalStorage.getItem('screenPreferences') ||
        {}) as ScreenPreferences,
    };
  },
});
