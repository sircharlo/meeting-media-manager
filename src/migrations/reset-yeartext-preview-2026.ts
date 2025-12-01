import { errorCatcher } from 'src/helpers/error-catcher';
import { useAppSettingsStore } from 'stores/app-settings';

import type { MigrationFunction } from './types';

export const resetYeartextPreview2026: MigrationFunction = async () => {
  try {
    // Remove the 2026 yeartext preview dismissed flag if it exists
    // This is needed because the yeartext preview was broken in v25.12.0
    const appSettingsStore = useAppSettingsStore();
    if (appSettingsStore?.yeartextPreviewDismissed?.[2026]) {
      delete appSettingsStore.yeartextPreviewDismissed[2026];
    }
    return true;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'resetYeartextPreview2026',
        },
      },
    });
    return false;
  }
};
