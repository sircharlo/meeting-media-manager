import type { SettingsValues } from 'src/types';

import { toRawDeep } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';

import type { MigrationFunction } from './types';

export const addBaseUrlToAllCongregations: MigrationFunction = async () => {
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
    console.warn(
      '🔍 [migration] Failed to clone congregations in addBaseUrlToAllCongregations:',
      error,
    );
    updatedCongregations = {};
  }

  try {
    Object.values(updatedCongregations).forEach((cong) => {
      if (cong && typeof cong === 'object') {
        cong.baseUrl = 'jw.org';
      }
    });
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to process congregations in addBaseUrlToAllCongregations:',
      error,
    );
  }
  congregationStore.congregations = updatedCongregations;
  return true;
};
