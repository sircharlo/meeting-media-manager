import { errorCatcher } from 'src/helpers/error-catcher';
import { useCongregationSettingsStore } from 'stores/congregation-settings';

import type { MigrationFunction } from './types';

export const moveCacheToMachineWide: MigrationFunction = async () => {
  try {
    const { fs, getSharedDataPath, getUserDataPath, path } = window.electronApi;
    const { exists, move } = fs;
    const { join } = path;

    // Check if we are in a machine-wide installation
    const sharedPath = await getSharedDataPath();
    if (!sharedPath) return true; // Not machine-wide, nothing to do

    const userDataPath = await getUserDataPath();
    if (!userDataPath) return true;

    if (userDataPath === sharedPath) return true;

    // Check if custom cache folder is set for any congregation
    const congStore = useCongregationSettingsStore();
    const hasCustomCache = Object.values(congStore.congregations).some(
      (s) => !!s?.cacheFolder,
    );

    if (hasCustomCache) return true; // Custom cache set, skip migration

    const foldersToMove = ['Publications', 'Additional Media', 'Fonts'];

    for (const folder of foldersToMove) {
      const src = join(userDataPath, folder);
      const dest = join(sharedPath, folder);

      if ((await exists(src)) && !(await exists(dest))) {
        await move(src, dest);
      }
    }

    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};
