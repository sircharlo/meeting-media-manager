import type { SettingsValues } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { toRawDeep } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';

import type { MigrationFunction } from './types';

export const addBaseUrlToAllCongregations: MigrationFunction = async () => {
  try {
    const congregationStore = useCongregationSettingsStore();

    // Validate that congregationStore.congregations exists and is properly initialized
    if (
      !congregationStore.congregations ||
      typeof congregationStore.congregations !== 'object' ||
      Array.isArray(congregationStore.congregations)
    ) {
      console.warn(
        '🔍 [migration] Invalid congregationStore.congregations structure in addBaseUrlToAllCongregations:',
        congregationStore.congregations,
      );
      congregationStore.congregations = {};
    }

    let updatedCongregations: Partial<Record<string, SettingsValues>>;
    try {
      const rawCongregations = toRawDeep(congregationStore.congregations);
      updatedCongregations = structuredClone(rawCongregations);
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            name: 'addBaseUrlToAllCongregations clone congregations',
          },
        },
      });
      updatedCongregations = {};
    }

    try {
      Object.values(updatedCongregations).forEach((cong) => {
        if (cong && typeof cong === 'object') {
          cong.baseUrl = 'jw.org';
        }
      });
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            name: 'addBaseUrlToAllCongregations process congregations',
          },
        },
      });
    }
    congregationStore.congregations = updatedCongregations;
    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};
