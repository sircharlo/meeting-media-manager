import { storeToRefs } from 'pinia';
import { fetchMeetingLocations } from 'src/helpers/congregation-schedule';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useCongregationSettingsStore } from 'stores/congregation-settings';

import type { MigrationFunction } from './types';

export const autoEnrollMeetingSync: MigrationFunction = async () => {
  const currentState = useCurrentStateStore();
  const { lookupInProgress, online } = storeToRefs(currentState);

  try {
    const congregationSettingsStore = useCongregationSettingsStore();
    const { congregations } = storeToRefs(congregationSettingsStore);

    if (!congregations.value) {
      console.log(
        'ℹ️ [autoEnrollMeetingSync] No congregation settings. Skipping for now.',
      );
      return false;
    }

    if (!online.value) {
      console.log(
        'ℹ️ [autoEnrollMeetingSync] No internet connection. Skipping for now.',
      );
      return false;
    }

    lookupInProgress.value = true;

    for (const id of Object.keys(congregations.value)) {
      console.log(`ℹ️ [autoEnrollMeetingSync] Checking "${id}"...`);

      const congregationSettings = congregations.value?.[id];

      if (!congregationSettings) {
        console.log(
          `ℹ️ [autoEnrollMeetingSync] No settings for "${id}". Skipping.`,
        );
        continue;
      }

      if (!congregationSettings.congregationNameModified) {
        console.log(
          `ℹ️ [autoEnrollMeetingSync] "${id}" is not modified. Skipping.`,
        );
        continue;
      }

      if (!congregationSettings.congregationName) {
        console.log(
          `ℹ️ [autoEnrollMeetingSync] No name for "${id}". Skipping.`,
        );
        continue;
      }

      const response = await fetchMeetingLocations(
        congregationSettings.congregationName,
      );

      const exactMatch = response?.geoLocationList?.find(
        (loc) =>
          loc.properties.orgName === congregationSettings.congregationName,
      );

      if (exactMatch) {
        console.log(
          '✅ [autoEnrollMeetingSync] Exact match found. Enabling sync.',
        );
        congregationSettings.congregationNameModified = false;
      } else {
        console.log(
          'ℹ️ [autoEnrollMeetingSync] No exact match. Keeping manual settings.',
        );
      }
    }

    return true;
  } catch (error) {
    console.error('❌ [autoEnrollMeetingSync] Migration failed:', error);
    errorCatcher(error);
  }

  lookupInProgress.value = false;
  return online.value; // Retry later if offline, otherwise mark migration as done
};
