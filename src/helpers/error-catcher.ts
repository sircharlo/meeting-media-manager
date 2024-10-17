import type { SettingsValues } from 'src/types';

import * as Sentry from '@sentry/vue';
import { extend } from 'quasar';

const errorCatcher = async (originalError: Error | string | unknown) => {
  if (!originalError) return;
  const currentSettingsSnapshot = {} as SettingsValues;
  try {
    const { useCurrentStateStore } = await import('src/stores/current-state');
    const currentState = useCurrentStateStore();
    const { currentSettings } = currentState;
    extend(true, currentSettingsSnapshot, currentSettings) as SettingsValues;
    if (currentSettingsSnapshot.obsPassword?.length)
      currentSettingsSnapshot.obsPassword = '*'.repeat(
        currentSettingsSnapshot.obsPassword.length,
      );
  } catch (error) {
    console.error(error);
  }
  if (process.env.NODE_ENV === 'production') {
    if (Object.keys(currentSettingsSnapshot).length)
      Sentry.setContext('currentSettings', currentSettingsSnapshot);
    Sentry.captureException(originalError);
  } else {
    console.error(originalError);
  }
};

// const warningCatcher = (warning: string) => {
//   if (process.env.NODE_ENV === 'production') {
//     Sentry.captureMessage(warning);
//   } else {
//     console.warn(warning);
//   }
// };

export { errorCatcher };
