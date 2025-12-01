import type { MigrationFunction } from './types';

import { addBaseUrlToAllCongregations } from './add-base-url';
import { firstRun } from './first-run';
import { localStorageToPiniaPersist } from './local-storage-to-pinia';
import { moveAdditionalMediaMaps } from './move-additional-media';
import { newMediaSections } from './new-media-sections';
import { refreshDynamicMedia } from './refresh-dynamic-media';

// In the migration registry, the version is the one that was live when the migration was added
export const MIGRATION_REGISTRY: Record<string, MigrationFunction> = {
  '25.3.2-refreshDynamicMedia': refreshDynamicMedia,
  '25.4.3-refreshDynamicMedia': refreshDynamicMedia,
  '25.8.4-newMediaSections': newMediaSections,
  '25.10.1-refreshDynamicMedia': refreshDynamicMedia,
  '25.11.0-refreshDynamicMedia': refreshDynamicMedia,
  addBaseUrlToAllCongregations,
  firstRun,
  localStorageToPiniaPersist,
  moveAdditionalMediaMaps,
};
