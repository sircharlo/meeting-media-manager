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

  const oldVersionPath = join(await getAppDataPath(), 'meeting-media-manager');
  if (await exists(oldVersionPath)) {
    let oldPrefsPaths: string[];
    try {
      oldPrefsPaths = await getOldPrefsPaths(oldVersionPath);
    } catch (error) {
      console.warn('🔍 [migration] Failed to get old prefs paths:', error);
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
            console.warn(
              '🔍 [migration] Failed to parse prefs file:',
              oldPrefsPath,
              parseError,
            );
            return;
          }

          let newPrefsObject;
          try {
            newPrefsObject = buildNewPrefsObject(oldPrefs);
          } catch (buildError) {
            console.warn(
              '🔍 [migration] Failed to build new prefs object for:',
              oldPrefsPath,
              buildError,
            );
            return;
          }

          let newCongId: string;
          try {
            newCongId = uuid();
          } catch (uuidError) {
            console.warn('🔍 [migration] Failed to generate UUID:', uuidError);
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
};
