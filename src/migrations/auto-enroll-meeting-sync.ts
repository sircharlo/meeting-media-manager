import { storeToRefs } from 'pinia';
import { fetchMeetingLocations } from 'src/helpers/congregation-schedule';
import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
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
      log(
        'ℹ️ [autoEnrollMeetingSync] No congregation settings. Skipping for now.',
        'migrations',
        'log',
      );
      return false;
    }

    if (!online.value) {
      log(
        'ℹ️ [autoEnrollMeetingSync] No internet connection. Skipping for now.',
        'migrations',
        'log',
      );
      return false;
    }

    lookupInProgress.value = true;

    for (const id of Object.keys(congregations.value)) {
      log(
        `ℹ️ [autoEnrollMeetingSync] Checking "${id}"...`,
        'migrations',
        'log',
      );

      const congregationSettings = congregations.value?.[id];

      if (!congregationSettings) {
        log(
          `ℹ️ [autoEnrollMeetingSync] No settings for "${id}". Skipping.`,
          'migrations',
          'log',
        );
        continue;
      }

      if (!congregationSettings.congregationNameModified) {
        log(
          `ℹ️ [autoEnrollMeetingSync] "${id}" is not modified. Skipping.`,
          'migrations',
          'log',
        );
        continue;
      }

      if (!congregationSettings.congregationName) {
        log(
          `ℹ️ [autoEnrollMeetingSync] No name for "${id}". Skipping.`,
          'migrations',
          'log',
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
        log(
          '✅ [autoEnrollMeetingSync] Exact match found. Enabling sync.',
          'migrations',
          'log',
        );
        congregationSettings.congregationNameModified = false;
      } else {
        log(
          'ℹ️ [autoEnrollMeetingSync] No exact match. Keeping manual settings.',
          'migrations',
          'log',
        );
      }
    }

    return true;
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'autoEnrollMeetingSync' } },
    });
  }

  lookupInProgress.value = false;
  return online.value; // Retry later if offline, otherwise mark migration as done
};
