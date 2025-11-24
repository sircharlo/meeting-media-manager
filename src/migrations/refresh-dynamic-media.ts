import { updateLookupPeriod } from 'src/helpers/date';

import type { MigrationFunction } from './types';

export const refreshDynamicMedia: MigrationFunction = async () => {
  // Refresh dynamic media for all congregations
  updateLookupPeriod({ allCongregations: true, reset: true });
  return true;
};
