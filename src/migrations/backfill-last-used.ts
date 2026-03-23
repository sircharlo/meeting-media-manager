import type { DateInfo, MediaItem } from 'src/types';

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

const { fileUrlToPath, fs, path, readdir } = globalThis.electronApi;
const { join } = path;

async function backfillFromLookupPeriods() {
  const jwStore = useJwStore();
  const lookupPeriods = jwStore.lookupPeriod;
  if (!lookupPeriods) return;

  for (const periods of Object.values(lookupPeriods)) {
    if (!periods) continue;

    for (const day of periods) {
      const meetingDate = formatDate(day.date, 'YYYY-MM-DD');
      const mediaItems = collectMediaItems(day);

      for (const item of mediaItems) {
        await updateFromMediaItem(item, meetingDate);
      }
    }
  }
}

function collectMediaItems(day: DateInfo): MediaItem[] {
  if (!day?.mediaSections) return [];
  return Object.values(day.mediaSections).flatMap((sec) => sec.items || []);
}

async function updateAllSubdirsWithDate(basePath: string, date: string) {
  if (!(await fs.exists(basePath))) return;

  const items = await readdir(basePath, false, false);
  const dirs = items.filter((i) => i.isDirectory);

  for (const dir of dirs) {
    await updateLastUsedDate(join(basePath, dir.name), date);
  }
}

async function updateFromMediaItem(item: MediaItem, date: string) {
  if (!item.fileUrl || !isFileUrl(item.fileUrl)) return;

  const filePath = fileUrlToPath(item.fileUrl);
  const folderPath = getParentDirectory(filePath);
  if (!folderPath) return;

  await updateLastUsedDate(folderPath, date);
}

async function updateTwoLevelSubdirsWithDate(basePath: string, date: string) {
  if (!(await fs.exists(basePath))) return;

  const level1 = await readdir(basePath, false, false);
  const level1Dirs = level1.filter((d) => d.isDirectory);

  for (const dir1 of level1Dirs) {
    const level1Path = join(basePath, dir1.name);
    await updateAllSubdirsWithDate(level1Path, date);
  }
}

export const backfillLastUsed: MigrationFunction = async () => {
  try {
    const today = formatDate(new Date(), 'YYYY-MM-DD');

    const pubsPath = await getPublicationsPath();
    await updateAllSubdirsWithDate(pubsPath, today);

    const additionalMediaPath = await getAdditionalMediaPath();
    await updateTwoLevelSubdirsWithDate(additionalMediaPath, today);

    await backfillFromLookupPeriods();

    return true;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};
