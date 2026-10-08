import type {
  DateInfo,
  JwLanguage,
  MediaLink,
  ScreenPreferences,
  SettingsValues,
} from 'src/types';

import { LocalStorage as QuasarStorage } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { dateFromString } from 'src/utils/date';
import { parseJsonSafe } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useJwStore } from 'stores/jw';

import type { MigrationFunction } from './types';

const catchMigrationError = (error: unknown, name: string) => {
  errorCatcher(error, {
    contexts: {
      fn: {
        name,
      },
    },
  });
};

const parseStorageItem = <T>(
  key: string,
  fallback: T,
  name: string,
  defaultJson = '{}',
) => {
  try {
    const storedValue = String(QuasarStorage.getItem(key) || defaultJson);
    return parseJsonSafe<T>(storedValue, fallback);
  } catch (error) {
    catchMigrationError(error, name);
    return fallback;
  }
};

const removeStorageItem = (key: string, name: string) => {
  try {
    QuasarStorage.removeItem(key);
  } catch (error) {
    catchMigrationError(error, name);
  }
};

const normalizeLookupPeriodDates = (
  lookupPeriod: Partial<Record<string, DateInfo[]>> | undefined,
) => {
  if (!lookupPeriod) return;

  for (const [congId, dateInfo] of Object.entries(lookupPeriod)) {
    if (!dateInfo || !Array.isArray(dateInfo)) {
      errorCatcher(
        new Error(
          'Invalid dateInfo structure in localStorageToPiniaPersist for congregation',
        ),
        {
          contexts: {
            fn: {
              congId,
              name: 'localStorageToPiniaPersist lookupPeriod',
            },
          },
        },
      );
      continue;
    }

    normalizeLookupPeriodDays(congId, dateInfo);
  }
};

const normalizeLookupPeriodDays = (congId: string, dateInfo: DateInfo[]) => {
  dateInfo.forEach((day, dayIndex) => {
    if (!day || typeof day !== 'object') {
      errorCatcher(
        new Error('Invalid day object structure in localStorageToPiniaPersist'),
        {
          contexts: {
            fn: {
              congId,
              dayIndex,
              name: 'localStorageToPiniaPersist lookupPeriod',
            },
          },
        },
      );
      return;
    }

    if (!day.date || day.date instanceof Date) return;

    try {
      errorCatcher(
        new Error(
          'Invalid date object structure in localStorageToPiniaPersist',
        ),
        {
          contexts: {
            fn: {
              congId,
              dayIndex,
              name: 'localStorageToPiniaPersist lookupPeriod',
            },
          },
        },
      );
      day.date = dateFromString(day.date);
    } catch (error) {
      catchMigrationError(error, 'localStorageToPiniaPersist lookupPeriod');
    }
  });
};

export const localStorageToPiniaPersist: MigrationFunction = async (
  appSettingsStore,
) => {
  try {
    const congregationStore = useCongregationSettingsStore();
    const jwStore = useJwStore();

    const parsedCongregations = parseStorageItem<
      Record<string, SettingsValues>
    >('congregations', {}, 'localStorageToPiniaPersist congregations');

    try {
      congregationStore.$patch({
        congregations: parsedCongregations,
      });
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            name: 'localStorageToPiniaPersist congregationStore',
          },
        },
      });
    }

    removeStorageItem(
      'congregations',
      'localStorageToPiniaPersist congregations',
    );

    const parsedLookupPeriod = parseStorageItem<
      Partial<Record<string, DateInfo[]>> | undefined
    >(
      'lookupPeriod',
      jwStore.lookupPeriod,
      'localStorageToPiniaPersist lookupPeriod',
    );

    // Ensure all dates in lookupPeriod are properly converted to Date objects
    normalizeLookupPeriodDates(parsedLookupPeriod);

    const parsedJwLanguages = parseStorageItem<{
      list: JwLanguage[];
      updated: Date | null | undefined;
    }>(
      'jwLanguages',
      jwStore.jwLanguages,
      'localStorageToPiniaPersist jwLanguages',
    );

    const parsedJwSongs = parseStorageItem<
      Record<string, { list: MediaLink[]; updated: Date | null | undefined }>
    >('jwSongs', jwStore.jwSongs, 'localStorageToPiniaPersist jwSongs');

    const parsedYeartexts = parseStorageItem<
      Partial<Record<number, Record<string, string>>>
    >('yeartexts', jwStore.yeartexts, 'localStorageToPiniaPersist yeartexts');

    try {
      jwStore.$patch({
        jwLanguages: parsedJwLanguages,
        jwSongs: parsedJwSongs,
        lookupPeriod: parsedLookupPeriod,
        yeartexts: parsedYeartexts,
      });
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            name: 'localStorageToPiniaPersist jwStore',
          },
        },
      });
    }

    // Remove migrated items from localStorage
    ['jwLanguages', 'jwSongs', 'lookupPeriod', 'yeartexts'].forEach((item) => {
      removeStorageItem(item, 'localStorageToPiniaPersist localStorage');
    });

    const parsedMigrations = parseStorageItem<string[]>(
      'migrations',
      appSettingsStore.migrations,
      'localStorageToPiniaPersist migrations',
      '[]',
    );

    appSettingsStore.migrations =
      appSettingsStore.migrations.concat(parsedMigrations);
    removeStorageItem('migrations', 'localStorageToPiniaPersist migrations');

    const parsedScreenPreferences = parseStorageItem<ScreenPreferences>(
      'screenPreferences',
      appSettingsStore.screenPreferences,
      'localStorageToPiniaPersist screenPreferences',
    );

    appSettingsStore.screenPreferences = parsedScreenPreferences;
    removeStorageItem(
      'screenPreferences',
      'localStorageToPiniaPersist screenPreferences',
    );
    return true;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'localStorageToPiniaPersist',
        },
      },
    });
    return false;
  }
};
