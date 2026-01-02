import { fetchMeetingLocations } from 'src/helpers/congregation-schedule';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useCongregationSettingsStore } from 'stores/congregation-settings';

import type { MigrationFunction } from './types';

export const autoEnrollMeetingSync: MigrationFunction = async () => {
  const currentState = useCurrentStateStore();
  try {
    const { congregations } = useCongregationSettingsStore();

    if (!congregations) {
      console.log(
        'ℹ️ [autoEnrollMeetingSync] No congregation settings. Skipping.',
      );
      return true;
    }

    currentState.lookupInProgress = true;

    for (const [id, settings] of Object.entries(congregations)) {
      console.log(`ℹ️ [autoEnrollMeetingSync] Checking "${id}"...`);

      if (!settings) {
        console.log(
          `ℹ️ [autoEnrollMeetingSync] No settings for "${id}". Skipping.`,
        );
        continue;
      }
      const { congregationName, congregationNameModified } = settings;

      if (!congregationNameModified) {
        console.log(
          `ℹ️ [autoEnrollMeetingSync] "${id}" is not modified. Skipping.`,
        );
        continue;
      }

      if (!congregationName) {
        console.log(
          `ℹ️ [autoEnrollMeetingSync] No name for "${id}". Skipping.`,
        );
        continue;
      }

      const response = await fetchMeetingLocations(congregationName);

      const exactMatch = response?.geoLocationList?.find(
        (loc) => loc.properties.orgName === congregationName,
      );

      if (exactMatch) {
        console.log(
          '✅ [autoEnrollMeetingSync] Exact match found. Enabling sync.',
        );
        const congSettingsStore = congregations[id];
        if (!congSettingsStore) {
          console.log(
            `ℹ️ [autoEnrollMeetingSync] No settings for "${id}". Skipping.`,
          );
          continue;
        }
        congSettingsStore.congregationNameModified = false;
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
    return currentState.online; // Retry if offline, otherwise mark done
  } finally {
    currentState.lookupInProgress = false;
  }
};
