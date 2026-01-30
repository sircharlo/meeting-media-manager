import type { MediaItem } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useJwStore } from 'stores/jw';

import type { MigrationFunction } from './types';

export const moveCacheToMachineWide: MigrationFunction = async () => {
  try {
    const { fs, getSharedDataPath, getUserDataPath, path } =
      globalThis.electronApi;
    const { exists, move } = fs;
    const { join } = path;

    // Check if we are in a machine-wide installation
    const sharedPath = await getSharedDataPath();
    if (!sharedPath) return true;
    // Not machine-wide installation, or shared data path is not accessible, so nothing to do

    const userDataPath = await getUserDataPath();
    if (!userDataPath) return true;
    // User data path is not accessible, so nothing to do

    if (userDataPath === sharedPath) return true;
    // User data path is the same as shared data path, so nothing to do

    // Check if custom cache folder is set for any congregation
    const congStore = useCongregationSettingsStore();
    const hasCustomCache = Object.values(congStore.congregations).some(
      (s) => !!s?.cacheFolder,
    );

    if (hasCustomCache) return true;
    // Custom cache folder is set, so nothing to do

    const foldersToMove = ['Publications', 'Additional Media', 'Fonts'];

    for (const folder of foldersToMove) {
      const src = join(userDataPath, folder);
      const dest = join(sharedPath, folder);

      if ((await exists(src)) && !(await exists(dest))) {
        await move(src, dest);
      }
    }

    try {
      // Attempt to update paths for additional media in the lookup periods
      const jwStore = useJwStore();
      if (jwStore.lookupPeriod) {
        Object.values(jwStore.lookupPeriod).forEach((dates) => {
          if (!dates) return;
          dates.forEach((dateInfo) => {
            if (!dateInfo?.mediaSections) return;
            Object.values(dateInfo.mediaSections).forEach((section) => {
              if (!section?.items) return;

              const updateItemPath = (item: MediaItem) => {
                if (item?.source === 'additional') {
                  const replacePath = (url: string | undefined) => {
                    if (url?.startsWith(userDataPath)) {
                      return url.replace(userDataPath, sharedPath);
                    }
                    return url;
                  };

                  item.fileUrl = replacePath(item.fileUrl);
                  item.thumbnailUrl = replacePath(item.thumbnailUrl);
                  item.subtitlesUrl = replacePath(item.subtitlesUrl);
                }

                if (item?.children) {
                  item.children.forEach((element) => {
                    updateItemPath(element);
                  });
                }
              };

              section?.items?.forEach((element) => {
                updateItemPath(element);
              });
            });
          });
        });
      }
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            name: 'moveCacheToMachineWide',
            subroutine: 'updateItemPath',
          },
        },
      });
    }

    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};
