import type { MigrationFunction } from './types';

import { addBaseUrlToAllCongregations } from './add-base-url';
import { autoEnrollMeetingSync } from './auto-enroll-meeting-sync';
import { backfillLastUsed } from './backfill-last-used';
import { firstRun } from './first-run';
import { localStorageToPiniaPersist } from './local-storage-to-pinia';
import { moveAdditionalMediaMaps } from './move-additional-media';
import { moveCacheToMachineWide } from './move-cache-to-machine-wide';
import { newMediaSections } from './new-media-sections';
import { refreshDynamicMedia } from './refresh-dynamic-media';
import { resetYeartextPreview2026 } from './reset-yeartext-preview-2026';

// In the migration registry, the version is the one that was live when the migration was added
export const MIGRATION_REGISTRY: Record<string, MigrationFunction> = {
  '25.3.2-refreshDynamicMedia': refreshDynamicMedia,
  '25.4.3-refreshDynamicMedia': refreshDynamicMedia,
  '25.8.4-newMediaSections': newMediaSections,
  '25.10.1-refreshDynamicMedia': refreshDynamicMedia,
  '25.11.0-refreshDynamicMedia': refreshDynamicMedia,
  '25.12.0-resetYeartextPreview2026': resetYeartextPreview2026,
  '25.12.1-refreshDynamicMedia': refreshDynamicMedia,
  '25.12.2 (1) moveCacheToMachineWide': moveCacheToMachineWide,
  '25.12.2 (2) refreshDynamicMedia': refreshDynamicMedia,
  '25.12.2 (3) backfillLastUsed': backfillLastUsed,
  '26.1.1 autoEnrollMeetingSync': autoEnrollMeetingSync,
  addBaseUrlToAllCongregations,
  firstRun,
  localStorageToPiniaPersist,
  moveAdditionalMediaMaps,
};
