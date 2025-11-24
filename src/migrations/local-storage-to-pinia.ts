import type {
  DateInfo,
  JwLanguage,
  MediaLink,
  ScreenPreferences,
  SettingsValues,
} from 'src/types';

import { LocalStorage as QuasarStorage } from 'quasar';
import { dateFromString } from 'src/utils/date';
import { parseJsonSafe } from 'src/utils/general';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useJwStore } from 'stores/jw';

import type { MigrationFunction } from './types';

export const localStorageToPiniaPersist: MigrationFunction = async (
  appSettingsStore,
) => {
  const congregationStore = useCongregationSettingsStore();
  const jwStore = useJwStore();

  let parsedCongregations: Record<string, SettingsValues>;
  try {
    const congregationsString = String(
      QuasarStorage.getItem('congregations') || '{}',
    );
    parsedCongregations = parseJsonSafe<Record<string, SettingsValues>>(
      congregationsString,
      {},
    );
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to parse congregations in localStorageToPiniaPersist:',
      error,
    );
    parsedCongregations = {};
  }

  try {
    congregationStore.$patch({
      congregations: parsedCongregations,
    });
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to patch congregationStore in localStorageToPiniaPersist:',
      error,
    );
  }

  try {
    QuasarStorage.removeItem('congregations');
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to remove congregations from localStorage:',
      error,
    );
  }

  let parsedLookupPeriod: Partial<Record<string, DateInfo[]>> | undefined;
  try {
    const lookupPeriodString = String(
      QuasarStorage.getItem('lookupPeriod') || '{}',
    );
    parsedLookupPeriod = parseJsonSafe<Partial<Record<string, DateInfo[]>>>(
      lookupPeriodString,
      jwStore.lookupPeriod,
    );
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to parse lookupPeriod in localStorageToPiniaPersist:',
      error,
    );
    parsedLookupPeriod = undefined;
  }

  // Ensure all dates in lookupPeriod are properly converted to Date objects
  if (parsedLookupPeriod) {
    for (const [congId, dateInfo] of Object.entries(parsedLookupPeriod)) {
      if (!dateInfo || !Array.isArray(dateInfo)) {
        console.warn(
          '🔍 [migration] Invalid dateInfo structure in localStorageToPiniaPersist for congregation:',
          congId,
          dateInfo,
        );
        continue;
      }

      dateInfo.forEach((day, dayIndex) => {
        // Validate day object structure
        if (!day || typeof day !== 'object') {
          console.warn(
            '🔍 [migration] Skipping invalid day object in localStorageToPiniaPersist at index:',
            dayIndex,
            day,
          );
          return;
        }

        if (day.date && !(day.date instanceof Date)) {
          try {
            console.warn(
              '🔍 [migration] Converting corrupted date object in localStorageToPiniaPersist:',
              day.date,
            );
            day.date = dateFromString(day.date);
          } catch (error) {
            console.warn(
              '🔍 [migration] Failed to convert corrupted date object in localStorageToPiniaPersist, skipping day:',
              day.date,
              error,
            );
            return;
          }
        }
      });
    }
  }

  let parsedJwLanguages: {
    list: JwLanguage[];
    updated: Date | null | undefined;
  };
  let parsedJwSongs: Record<
    string,
    { list: MediaLink[]; updated: Date | null | undefined }
  >;
  let parsedYeartexts: Partial<Record<number, Record<string, string>>>;

  try {
    const jwLanguagesString = String(
      QuasarStorage.getItem('jwLanguages') || '{}',
    );
    parsedJwLanguages = parseJsonSafe<{
      list: JwLanguage[];
      updated: Date | null | undefined;
    }>(jwLanguagesString, jwStore.jwLanguages);
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to parse jwLanguages in localStorageToPiniaPersist:',
      error,
    );
    parsedJwLanguages = jwStore.jwLanguages;
  }

  try {
    const jwSongsString = String(QuasarStorage.getItem('jwSongs') || '{}');
    parsedJwSongs = parseJsonSafe<
      Record<string, { list: MediaLink[]; updated: Date | null | undefined }>
    >(jwSongsString, jwStore.jwSongs);
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to parse jwSongs in localStorageToPiniaPersist:',
      error,
    );
    parsedJwSongs = jwStore.jwSongs;
  }

  try {
    const yeartextsString = String(QuasarStorage.getItem('yeartexts') || '{}');
    parsedYeartexts = parseJsonSafe<
      Partial<Record<number, Record<string, string>>>
    >(yeartextsString, jwStore.yeartexts);
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to parse yeartexts in localStorageToPiniaPersist:',
      error,
    );
    parsedYeartexts = jwStore.yeartexts;
  }

  try {
    jwStore.$patch({
      jwLanguages: parsedJwLanguages,
      jwSongs: parsedJwSongs,
      lookupPeriod: parsedLookupPeriod,
      yeartexts: parsedYeartexts,
    });
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to patch jwStore in localStorageToPiniaPersist:',
      error,
    );
  }

  // Remove migrated items from localStorage
  ['jwLanguages', 'jwSongs', 'lookupPeriod', 'yeartexts'].forEach((item) => {
    try {
      QuasarStorage.removeItem(item);
    } catch (error) {
      console.warn(
        '🔍 [migration] Failed to remove item from localStorage:',
        item,
        error,
      );
    }
  });

  let parsedMigrations: string[];
  let parsedScreenPreferences: ScreenPreferences;

  try {
    const migrationsString = String(
      QuasarStorage.getItem('migrations') || '[]',
    );
    parsedMigrations = parseJsonSafe(
      migrationsString,
      appSettingsStore.migrations,
    );
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to parse migrations in localStorageToPiniaPersist:',
      error,
    );
    parsedMigrations = appSettingsStore.migrations;
  }

  appSettingsStore.migrations =
    appSettingsStore.migrations.concat(parsedMigrations);
  try {
    QuasarStorage.removeItem('migrations');
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to remove migrations from localStorage:',
      error,
    );
  }

  try {
    const screenPreferencesString = String(
      QuasarStorage.getItem('screenPreferences') || '{}',
    );
    parsedScreenPreferences = parseJsonSafe(
      screenPreferencesString,
      appSettingsStore.screenPreferences,
    );
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to parse screenPreferences in localStorageToPiniaPersist:',
      error,
    );
    parsedScreenPreferences = appSettingsStore.screenPreferences;
  }

  appSettingsStore.screenPreferences = parsedScreenPreferences;
  try {
    QuasarStorage.removeItem('screenPreferences');
  } catch (error) {
    console.warn(
      '🔍 [migration] Failed to remove screenPreferences from localStorage:',
      error,
    );
  }
  return true;
};
