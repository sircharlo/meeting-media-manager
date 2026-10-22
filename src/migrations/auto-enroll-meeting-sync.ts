import type { SettingsValues } from 'src/types';

import { storeToRefs } from 'pinia';
import {
  fetchCongregationSuggestions,
  fetchMeetingLocations,
} from 'src/helpers/congregation-schedule';
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
    try {
      await enrollCongregations(congregations.value);
    } finally {
      // Also after a successful run: left on, it would hide renames by hand
      // for the rest of the session (see MainLayout's name watcher).
      lookupInProgress.value = false;
    }

    return true;
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'autoEnrollMeetingSync' } },
    });
  }

  return online.value; // Retry later if offline, otherwise mark migration as done
};

/** Enables the schedule sync of each profile named exactly as on JW.org. */
const enrollCongregations = async (
  congregations: Partial<Record<string, SettingsValues>>,
) => {
  for (const id of Object.keys(congregations)) {
    log(`ℹ️ [autoEnrollMeetingSync] Checking "${id}"...`, 'migrations', 'log');

    const congregationSettings = congregations[id];

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

    const congregationName = congregationSettings.congregationName;

    const suggestions = await fetchCongregationSuggestions(congregationName); // NOSONAR: sequential - one JW.org lookup at a time
    const exactSuggestion = suggestions.find(
      (suggestion) =>
        suggestion.name.toLowerCase() === congregationName.toLowerCase(),
    );
    if (!exactSuggestion) continue;
    const { congregationGuid } = exactSuggestion;
    const response = await fetchMeetingLocations(congregationGuid); // NOSONAR: sequential - one JW.org lookup at a time

    const exactMatch = response?.items?.some((item) =>
      item.congregationMeetings.some(
        (meeting) => meeting.name === congregationName,
      ),
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
};
