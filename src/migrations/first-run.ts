import type { OldAppConfig } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { uuid } from 'src/utils/general';
import {
  buildNewPrefsObject,
  getOldPrefsPaths,
  parsePrefsFile,
} from 'src/utils/migrations';
import { useCongregationSettingsStore } from 'stores/congregation-settings';

import type { MigrationFunction } from './types';

const { fs, getAppDataPath, path } = window.electronApi;
const { exists } = fs;
const { join } = path;

export const firstRun: MigrationFunction = async () => {
  try {
    let successfulMigration = true;
    const congregationStore = useCongregationSettingsStore();

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
        errorCatcher(error, {
          contexts: {
            fn: {
              name: 'firstRun getOldPrefsPaths',
            },
          },
        });
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
              errorCatcher(parseError, {
                contexts: {
                  fn: {
                    name: 'firstRun parsePrefsFile',
                  },
                },
              });
              return;
            }

            let newPrefsObject;
            try {
              newPrefsObject = buildNewPrefsObject(oldPrefs);
            } catch (buildError) {
              errorCatcher(buildError, {
                contexts: {
                  fn: {
                    name: 'firstRun buildNewPrefsObject',
                  },
                },
              });
              return;
            }

            let newCongId: string;
            try {
              newCongId = uuid();
            } catch (uuidError) {
              errorCatcher(uuidError, {
                contexts: {
                  fn: {
                    name: 'firstRun uuid',
                  },
                },
              });
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
    return successfulMigration;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};
