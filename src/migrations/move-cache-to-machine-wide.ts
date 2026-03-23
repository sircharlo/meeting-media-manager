import type { MediaItem } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useJwStore } from 'stores/jw';

import type { MigrationFunction } from './types';

function hasCustomCacheFolder(): boolean {
  const congStore = useCongregationSettingsStore();
  return Object.values(congStore.congregations).some((s) => !!s?.cacheFolder);
}

async function moveStandardFolders(
  folders: string[],
  userDataPath: string,
  sharedPath: string,
  exists: (p: string) => Promise<boolean>,
  move: (a: string, b: string) => Promise<void>,
  join: (...p: string[]) => string,
) {
  for (const folder of folders) {
    const src = join(userDataPath, folder);
    const dest = join(sharedPath, folder);

    const srcExists = await exists(src);
    if (!srcExists) continue;

    const destExists = await exists(dest);
    if (destExists) continue;

    await move(src, dest);
  }
}

function replaceIfStartsWith(
  url: string | undefined,
  from: string,
  to: string,
) {
  if (!url) return url;
  if (!url.startsWith(from)) return url;
  return url.replace(from, to);
}

function updateLookupPeriodPaths(userDataPath: string, sharedPath: string) {
  const jwStore = useJwStore();
  if (!jwStore.lookupPeriod) return;

  for (const dates of Object.values(jwStore.lookupPeriod)) {
    if (!dates) continue;

    for (const dateInfo of dates) {
      if (!dateInfo?.mediaSections) continue;

      for (const section of Object.values(dateInfo.mediaSections)) {
        if (!section?.items) continue;

        for (const item of section.items) {
          updateMediaItemPaths(item, userDataPath, sharedPath);
        }
      }
    }
  }
}

function updateMediaItemPaths(
  item: MediaItem,
  userDataPath: string,
  sharedPath: string,
) {
  if (item.source === 'additional') {
    item.fileUrl = replaceIfStartsWith(item.fileUrl, userDataPath, sharedPath);
    item.thumbnailUrl = replaceIfStartsWith(
      item.thumbnailUrl,
      userDataPath,
      sharedPath,
    );
    item.subtitlesUrl = replaceIfStartsWith(
      item.subtitlesUrl,
      userDataPath,
      sharedPath,
    );
  }

  if (!item.children?.length) return;

  for (const child of item.children) {
    updateMediaItemPaths(child, userDataPath, sharedPath);
  }
}

export const moveCacheToMachineWide: MigrationFunction = async () => {
  try {
    const { fs, getSharedDataPath, getUserDataPath, path } =
      globalThis.electronApi;
    const { exists, move } = fs;
    const { join } = path;

    const sharedPath = await getSharedDataPath();
    if (!sharedPath) return true;

    const userDataPath = await getUserDataPath();
    if (!userDataPath) return true;

    if (userDataPath === sharedPath) return true;
    if (hasCustomCacheFolder()) return true;

    const foldersToMove = ['Publications', 'Additional Media', 'Fonts'];

    await moveStandardFolders(
      foldersToMove,
      userDataPath,
      sharedPath,
      exists,
      move,
      join,
    );

    try {
      updateLookupPeriodPaths(userDataPath, sharedPath);
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
