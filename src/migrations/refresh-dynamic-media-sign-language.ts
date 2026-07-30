import { updateLookupPeriod } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useJwStore } from 'stores/jw';

import type { MigrationFunction } from './types';

export const refreshDynamicMediaSignLanguage: MigrationFunction = async () => {
  try {
    // Refresh dynamic media for sign language congregations only, since
    // reference video filepaths were being saved incorrectly for them
    const congregationSettingsStore = useCongregationSettingsStore();
    const { jwLanguages } = useJwStore();

    const signLanguageCongregationIds = Object.entries(
      congregationSettingsStore.congregations,
    )
      .filter(([, settings]) => {
        if (!settings?.lang) return false;
        return !!jwLanguages.list.find((l) => l.langcode === settings.lang)
          ?.isSignLanguage;
      })
      .map(([congId]) => congId);

    if (!signLanguageCongregationIds.length) return true;

    updateLookupPeriod({
      congregationIds: signLanguageCongregationIds,
      multipleCongregations: true,
      reset: true,
    });
    return true;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'refresh-dynamic-media-sign-language',
        },
      },
    });
    return false;
  }
};
