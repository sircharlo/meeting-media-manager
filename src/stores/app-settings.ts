import type {
  DateInfo,
  DynamicMediaObject,
  JwLanguage,
  MediaLink,
  OldAppConfig,
  ScreenPreferences,
  SettingsValues,
} from 'src/types';

import { useLocalStorage } from '@vueuse/core';
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
          congregations.value =
            (LocalStorage.getItem('congregations') as Record<
              string,
              SettingsValues
            >) || {};
          LocalStorage.removeItem('congregations');
          jwStore.additionalMediaMaps.value =
            (LocalStorage.getItem('additionalMediaMaps') as Record<
              string,
              Record<string, DynamicMediaObject[]>
            >) || {};
          LocalStorage.removeItem('additionalMediaMaps');
          jwStore.customDurations.value =
            (LocalStorage.getItem('customDurations') as Record<
              string,
              Record<string, Record<string, { max: number; min: number }>>
            >) || {};
          LocalStorage.removeItem('customDurations');
          jwStore.jwLanguages.value = (LocalStorage.getItem('jwLanguages') as {
            list: JwLanguage[];
            updated: Date;
          }) || {
            list: [],
            updated: new Date(1900, 0, 1),
          };
          LocalStorage.removeItem('jwLanguages');
          jwStore.jwSongs.value =
            (LocalStorage.getItem('jwSongs') as Record<
              string,
              {
                list: MediaLink[];
                updated: Date;
              }
            >) || {};
          LocalStorage.removeItem('jwSongs');
          jwStore.lookupPeriod.value =
            (LocalStorage.getItem('lookupPeriod') as Record<
              string,
              DateInfo[]
            >) || {};
          LocalStorage.removeItem('lookupPeriod');
          jwStore.mediaSort.value =
            (LocalStorage.getItem('mediaSort') as Record<
              string,
              Record<string, string[]>
            >) || {};
          LocalStorage.removeItem('mediaSort');
          jwStore.yeartexts.value =
            (LocalStorage.getItem('yeartexts') as Record<
              number,
              Record<string, string>
            >) || {};
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
        } else if (type === 'piniaPersistToUseLocalStorage') {
          const persistedPiniaCongregations = JSON.parse(
            LocalStorage.getItem('congregation-settings') || '{}',
          ) as { congregations: Record<string, SettingsValues> };
          congregations.value = persistedPiniaCongregations.congregations || {};
          LocalStorage.removeItem('congregation-settings');

          const persistedPiniaJw = JSON.parse(
            LocalStorage.getItem('jw-store') || '{}',
          ) as {
            additionalMediaMaps: Record<
              string,
              Record<string, DynamicMediaObject[]>
            >;
            customDurations: Record<
              string,
              Record<string, Record<string, { max: number; min: number }>>
            >;
            jwLanguages: { list: JwLanguage[]; updated: Date };
            jwSongs: Record<
              string,
              {
                list: MediaLink[];
                updated: Date;
              }
            >;
            lookupPeriod: Record<string, DateInfo[]>;
            mediaSort: Record<string, Record<string, string[]>>;
            migrations: string[];
            screenPreferences: {
              preferredScreenNumber: number;
              preferWindowed: boolean;
            };
            yeartexts: Record<number, Record<string, string>>;
          };
          jwStore.additionalMediaMaps.value =
            persistedPiniaJw.additionalMediaMaps || {};
          jwStore.customDurations.value =
            persistedPiniaJw.customDurations || {};
          jwStore.jwLanguages.value = persistedPiniaJw.jwLanguages || {
            list: [],
            updated: new Date(1900, 0, 1),
          };
          jwStore.jwSongs.value = persistedPiniaJw.jwSongs || {};
          jwStore.lookupPeriod.value = persistedPiniaJw.lookupPeriod || {};
          jwStore.mediaSort.value = persistedPiniaJw.mediaSort || {};
          jwStore.yeartexts.value = persistedPiniaJw.yeartexts || {};
          LocalStorage.removeItem('jw-store');

          const persistedPiniaAppSettings = JSON.parse(
            LocalStorage.getItem('app-settings') || '{}',
          ) as {
            migrations: string[];
            screenPreferences: {
              preferredScreenNumber: number;
              preferWindowed: boolean;
            };
          };
          this.migrations = this.migrations.concat(
            persistedPiniaAppSettings.migrations || [],
          );
          this.screenPreferences =
            persistedPiniaAppSettings.screenPreferences || {
              preferredScreenNumber: 0,
              preferWindowed: false,
            };
          LocalStorage.removeItem('app-settings');
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
  state: () => {
    return {
      migrations: useLocalStorage('migrations', [] as string[]),
      screenPreferences: useLocalStorage(
        'screenPreferences',
        {} as ScreenPreferences,
      ),
    };
  },
});
