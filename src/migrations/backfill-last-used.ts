import type { MediaItem } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { updateLastUsedDate } from 'src/helpers/usage';
import { formatDate } from 'src/utils/date';
import {
  getAdditionalMediaPath,
  getParentDirectory,
  getPublicationsPath,
  isFileUrl,
} from 'src/utils/fs';
import { useJwStore } from 'stores/jw';

import type { MigrationFunction } from './types';

const { fileUrlToPath, fs, path, readdir } = window.electronApi;
const { join } = path;

export const backfillLastUsed: MigrationFunction = async () => {
  try {
    const today = formatDate(new Date(), 'YYYY-MM-DD');

    // 1. Initialize all existing folders with TODAY
    // This ensures they are not immediately deleted, but will be candidates for deletion tomorrow if not used.
    const roots = [
      await getPublicationsPath(),
      // Check for custom cache folder if needed, but getPublicationsPath follows logic
    ];
    // Add additional media path
    roots.push(await getAdditionalMediaPath());

    // Basic recursion to find leaf folders (simplified: just 1 or 2 levels deep might be enough for typical structure)
    // Publications/pubId
    // Additional Media/CongId/YYYYMMDD

    // Actually, updateLastUsedDate puts file in the folder passed.
    // For publications, "root folder" is `Publications/pubId`.
    // For additional media, it is `Additional Media/CongId/YYYYMMDD`?
    // User said "in each additional media's folder".

    // Let's iterate Publications directory
    const pubsPath = await getPublicationsPath();
    if (await fs.exists(pubsPath)) {
      const items = await readdir(pubsPath, false, false); // non-recursive initial
      for (const item of items) {
        if (item.isDirectory) {
          // item.name is pubId usually (e.g. 'nwt', 'w_E_202301')
          // This is the "publication's root folder".
          const fullPath = join(pubsPath, item.name);
          await updateLastUsedDate(fullPath, today);
        }
      }
    }

    const additionalMediaPath = await getAdditionalMediaPath();
    if (await fs.exists(additionalMediaPath)) {
      // Structure: CongId/YYYYMMDD
      const congAdditionalMediaDirs = await readdir(
        additionalMediaPath,
        false,
        false,
      );
      for (const congAdditionalMediaDir of congAdditionalMediaDirs) {
        if (congAdditionalMediaDir.isDirectory) {
          const fullCongPath = join(
            additionalMediaPath,
            congAdditionalMediaDir.name,
          );
          const datedAdditionalMediaDirs = await readdir(
            fullCongPath,
            false,
            false,
          );
          for (const datedAdditionalMediaDir of datedAdditionalMediaDirs) {
            if (datedAdditionalMediaDir.isDirectory) {
              const fullDatedAdditionalMediaPath = join(
                fullCongPath,
                datedAdditionalMediaDir.name,
              );
              await updateLastUsedDate(fullDatedAdditionalMediaPath, today);
            }
          }
        }
      }
    }

    // 2. Update with scheduled dates from Lookup Period
    const jwStore = useJwStore();
    const lookupPeriods = jwStore.lookupPeriod;

    if (lookupPeriods) {
      for (const congId in lookupPeriods) {
        const periods = lookupPeriods[congId];
        if (!periods) continue;

        for (const day of periods) {
          if (!day.mediaSections) continue;
          const meetingDate = formatDate(day.date, 'YYYY-MM-DD');

          // Collect all media items
          const items: MediaItem[] = [];
          Object.values(day.mediaSections).forEach((sec) =>
            items.push(...(sec.items || [])),
          );

          for (const item of items) {
            if (item.fileUrl && isFileUrl(item.fileUrl)) {
              const filePath = fileUrlToPath(item.fileUrl);
              const folderPath = getParentDirectory(filePath);
              // We want the "publication root folder" usually?
              // But updateLastUsedDate just writes to the folder passed.
              // If we write to `Publications/nwt/imgs`, cleanup checks `Publications/nwt/imgs` OR `Publications/nwt`.
              // So writing to the specific folder containing the file is safer/more direct.
              if (folderPath) {
                await updateLastUsedDate(folderPath, meetingDate);
              }
            }
          }
        }
      }
    }

    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};
