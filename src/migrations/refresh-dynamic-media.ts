import { updateLookupPeriod } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';

import type { MigrationFunction } from './types';

export const refreshDynamicMedia: MigrationFunction = async () => {
  try {
    // Refresh dynamic media for all congregations
    updateLookupPeriod({ allCongregations: true, reset: true });
    return true;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          name: 'refresh-dynamic-media',
        },
      },
    });
    return false;
  }
};
