import type PQueue from 'p-queue';
import type {
  DateInfo,
  FileItem,
  MediaItem,
  MediaSectionWithConfig,
} from 'src/types';

import { i18n } from 'boot/i18n';
import { getMeetingSections } from 'src/constants/media';
import { isCoWeek, isMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { setupFFmpeg } from 'src/helpers/fs';
import { datesAreSame, formatDate, getSpecificWeekday } from 'src/utils/date';
import { trimFilepathAsNeeded } from 'src/utils/fs';
import { pad } from 'src/utils/general';
import { isJwPlaylist, isVideo } from 'src/utils/media';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

const { createVideoFromNonVideo, fileUrlToPath, fs, path, readdir } =
  globalThis.electronApi;
const { copy, ensureDir, exists, remove, stat } = fs;
const { basename, extname, join } = path;

// Create a queue to limit the number of exports running at the same time
let folderExportQueue: PQueue | undefined;

// Track days that are currently exporting
export const pendingDays = new Set<string>();
// Track days that requested another export while one was already running
const dirtyDays = new Set<string>();

const getQueue = async () => {
  if (!folderExportQueue) {
    const { default: PQueue } = await import('p-queue');
    folderExportQueue = new PQueue({ concurrency: 2 });
  }
  return folderExportQueue;
};

export const addDayToExportQueue = async (targetDate?: Date) => {
  if (!targetDate) return;
  const dateStr = formatDate(targetDate, 'YYYY-MM-DD');

  if (pendingDays.has(dateStr)) {
    // If already exporting, mark as dirty so it runs again after finishing
    dirtyDays.add(dateStr);
    return;
  }
  pendingDays.add(dateStr);

  const queue = await getQueue();

  queue.add(async () => {
    try {
      // Run the export
      await exportDayToFolder(targetDate);

      // If the day was marked as dirty while running, run it again until it's clean
      while (dirtyDays.has(dateStr)) {
        dirtyDays.delete(dateStr);
        await exportDayToFolder(targetDate);
      }
    } catch (error) {
      errorCatcher(error);
    } finally {
      pendingDays.delete(dateStr);
      dirtyDays.delete(dateStr); // Just in case
    }
  });
};

const exportDayToFolder = async (targetDate?: Date) => {
  try {
    const jwStore = useJwStore();

    if (!targetDate || !shouldExportDay(targetDate)) {
      return;
    }

    const day = findDayData(targetDate, jwStore);
    if (!day?.mediaSections) {
      return;
    }

    const destFolder = getDestinationFolder(targetDate);
    if (!(await ensureDestinationFolder(destFolder))) {
      return;
    }

    const expectedFiles = await processAllSections(day, destFolder);

    await cleanupUnexpectedFiles(destFolder, expectedFiles);
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          args: {
            targetDate,
          },
          name: 'exportDayToFolder',
        },
      },
    });
  }
};

// Helper functions

const shouldExportDay = (targetDate: Date | undefined): boolean => {
  const currentStateStore = useCurrentStateStore();
  return !!(
    targetDate &&
    currentStateStore?.currentCongregation &&
    currentStateStore.currentSettings?.enableMediaAutoExport &&
    currentStateStore.currentSettings?.mediaAutoExportFolder
  );
};

const findDayData = (
  targetDate: Date,
  jwStore: ReturnType<typeof useJwStore>,
) => {
  const currentStateStore = useCurrentStateStore();
  return jwStore.lookupPeriod?.[currentStateStore.currentCongregation]?.find(
    (d) => d.date && datesAreSame(d.date, targetDate),
  );
};

const getDestinationFolder = (targetDate: Date): string => {
  const currentStateStore = useCurrentStateStore();
  if (!currentStateStore.currentSettings?.mediaAutoExportFolder) {
    throw new Error('No media auto export folder set');
  }
  const dateFolderName = formatDate(targetDate, 'YYYY-MM-DD');
  return join(
    currentStateStore.currentSettings.mediaAutoExportFolder,
    dateFolderName,
  );
};

const ensureDestinationFolder = async (
  destFolder: string,
): Promise<boolean> => {
  try {
    await ensureDir(destFolder);
    return true;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          destFolder,
          name: 'exportDayToFolder ensureDir',
        },
      },
    });
    return false;
  }
};

const processAllSections = async (
  day: DateInfo,
  destFolder: string,
): Promise<Set<string>> => {
  const expectedFiles = new Set<string>();
  const { default: sanitize } = await import('sanitize-filename');

  const sortedSections = getSortedSections(day);
  let sectionIndex = 1;

  for (const section of sortedSections) {
    if (!section.items?.length) continue;

    const visibleItems = getVisibleItems(section);
    if (!visibleItems.length) continue;

    const sectionName = (i18n.global.t as (key: string) => string)(
      section.config.uniqueId,
    );
    const sanitizedSectionName = sanitize(sectionName);
    const sectionPrefix = pad(sectionIndex++);

    await processSectionItems(
      visibleItems,
      destFolder,
      sectionPrefix,
      sanitizedSectionName,
      expectedFiles,
    );
  }

  return expectedFiles;
};

const getSortedSections = (day: DateInfo) => {
  const currentStateStore = useCurrentStateStore();

  const meetingType = currentStateStore.getMeetingType(day.date);
  const meetingSections = getMeetingSections(meetingType, isCoWeek(day.date));
  const sectionsToShow = determineSectionsToShow(day, meetingSections);

  return day.mediaSections
    .filter((m) => !!m.config)
    .filter((m) => sectionsToShow.includes(m.config?.uniqueId || ''))
    .sort((a, b) => sortBySectionOrder(a, b, sectionsToShow));
};

const determineSectionsToShow = (
  day: DateInfo,
  meetingSections: string[],
): string[] => {
  const sectionsToShow: string[] = [...meetingSections];
  const isMeetingToday = isMeetingDay(day.date);

  day.mediaSections.forEach((sectionData) => {
    const sectionId = sectionData.config.uniqueId;
    const shouldInclude =
      !sectionsToShow.includes(sectionId) &&
      ((!isMeetingToday && !meetingSections.includes(sectionId)) ||
        (isMeetingToday && sectionData?.items?.length));

    if (shouldInclude) {
      sectionsToShow.push(sectionId);
    }
  });

  return sectionsToShow;
};

const sortBySectionOrder = (
  a: MediaSectionWithConfig,
  b: MediaSectionWithConfig,
  sectionsToShow: string[],
): number => {
  const aId = a.config?.uniqueId || '';
  const bId = b.config?.uniqueId || '';
  const aIndex = sectionsToShow.indexOf(aId);
  const bIndex = sectionsToShow.indexOf(bId);

  if (aIndex !== -1 && bIndex !== -1) {
    return aIndex - bIndex;
  }

  if (aIndex !== -1) return -1;
  if (bIndex !== -1) return 1;

  return aId.localeCompare(bId);
};

const getVisibleItems = (section: MediaSectionWithConfig) => {
  return (
    section.items
      ?.flatMap((item) =>
        Array.isArray(item.children) ? item.children : [item],
      )
      .filter((item) => !item.hidden) || []
  );
};

const processSectionItems = async (
  visibleItems: MediaItem[],
  destFolder: string,
  sectionPrefix: string,
  sanitizedSectionName: string,
  expectedFiles: Set<string>,
) => {
  for (let i = 0; i < visibleItems.length; i++) {
    try {
      const mediaItem = visibleItems[i];
      if (!mediaItem) continue;

      await processMediaItem({
        destFolder,
        expectedFiles,
        index: i,
        mediaItem,
        sanitizedSectionName,
        sectionPrefix,
        totalItems: visibleItems.length,
      });
    } catch (error) {
      errorCatcher(error);
    }
  }
};

const processMediaItem = async ({
  destFolder,
  expectedFiles,
  index,
  mediaItem,
  sanitizedSectionName,
  sectionPrefix,
  totalItems,
}: {
  destFolder: string;
  expectedFiles: Set<string>;
  index: number;
  mediaItem: MediaItem;
  sanitizedSectionName: string;
  sectionPrefix: string;
  totalItems: number;
}) => {
  const sourceFilePath = fileUrlToPath(mediaItem.fileUrl);
  if (!sourceFilePath || !(await exists(sourceFilePath))) return;

  const destFilePath = await buildDestinationPath({
    destFolder,
    index,
    mediaItem,
    sanitizedSectionName,
    sectionPrefix,
    sourceFilePath,
    totalItems,
  });

  const fileBaseName = basename(destFilePath);

  if (await canSkipFile(sourceFilePath, destFilePath)) {
    expectedFiles.add(fileBaseName);
    return;
  }

  const finalSourcePath = await convertIfNeeded(sourceFilePath);
  if (!finalSourcePath) return;

  expectedFiles.add(fileBaseName);
  await copy(finalSourcePath, destFilePath);
};

const buildDestinationPath = async ({
  destFolder,
  index,
  mediaItem,
  sanitizedSectionName,
  sectionPrefix,
  sourceFilePath,
  totalItems,
}: {
  destFolder: string;
  index: number;
  mediaItem: MediaItem;
  sanitizedSectionName: string;
  sectionPrefix: string;
  sourceFilePath: string;
  totalItems: number;
}): Promise<string> => {
  const { default: sanitize } = await import('sanitize-filename');
  const currentStateStore = useCurrentStateStore();

  const shouldConvert =
    !isVideo(sourceFilePath) &&
    !isJwPlaylist(sourceFilePath) &&
    currentStateStore.currentSettings?.convertFilesToMp4;

  const effectiveExt = shouldConvert ? '.mp4' : extname(sourceFilePath);
  const mediaPrefix = pad(index + 1, totalItems > 99 ? 3 : 2);

  const mediaTitle = mediaItem.title
    ? sanitize(mediaItem.title.replace(extname(sourceFilePath), ''))
    : basename(sourceFilePath, extname(sourceFilePath));

  const songPrefix =
    mediaItem.tag?.type === 'song' && mediaItem.tag?.value
      ? `${(i18n.global.t as (key: string) => string)('song')} ${mediaItem.tag.value} - `
      : '';

  const destFileName = `${sectionPrefix} ${sanitizedSectionName} - ${mediaPrefix} ${songPrefix}${mediaTitle}${effectiveExt}`;

  return trimFilepathAsNeeded(join(destFolder, destFileName));
};

const canSkipFile = async (
  sourceFilePath: string,
  destFilePath: string,
): Promise<boolean> => {
  if (!(await exists(destFilePath))) {
    return false;
  }

  const currentStateStore = useCurrentStateStore();

  const sourceStats = await stat(sourceFilePath);
  const destStats = await stat(destFilePath);

  const shouldConvert =
    !isVideo(sourceFilePath) &&
    !isJwPlaylist(sourceFilePath) &&
    currentStateStore.currentSettings?.convertFilesToMp4;

  if (shouldConvert) {
    return destStats.mtimeMs > sourceStats.mtimeMs && destStats.size > 0;
  }

  return sourceStats.size === destStats.size;
};

const convertIfNeeded = async (
  sourceFilePath: string,
): Promise<null | string> => {
  const currentStateStore = useCurrentStateStore();

  const shouldConvert =
    !isVideo(sourceFilePath) &&
    !isJwPlaylist(sourceFilePath) &&
    currentStateStore.currentSettings?.convertFilesToMp4;

  if (!shouldConvert) {
    return sourceFilePath;
  }

  try {
    const ffmpegPath = await setupFFmpeg();
    return await createVideoFromNonVideo(sourceFilePath, ffmpegPath);
  } catch (error) {
    errorCatcher(error);
    return null;
  }
};

const cleanupUnexpectedFiles = async (
  destFolder: string,
  expectedFiles: Set<string>,
) => {
  try {
    const dirItems = await readdir(destFolder);
    const filesInDestFolder = dirItems.map((f) => f.name);

    await Promise.allSettled(
      filesInDestFolder
        .filter((f) => !expectedFiles.has(f))
        .map((f) => remove(join(destFolder, f))),
    );
  } catch (error) {
    errorCatcher(error);
  }
};

const deleteOldExportFolders = async () => {
  const currentStateStore = useCurrentStateStore();
  if (
    !currentStateStore.currentSettings?.enableMediaAutoExport ||
    !currentStateStore.currentSettings?.mediaAutoExportFolder
  ) {
    return;
  }

  const destFolder = currentStateStore.currentSettings.mediaAutoExportFolder;

  try {
    if (!(await exists(destFolder))) return;

    const dirItems: FileItem[] = await readdir(destFolder);
    const today = new Date();
    const lastMonday = getSpecificWeekday(today, 0);
    const lastMondayStr = formatDate(lastMonday, 'YYYY-MM-DD');

    await Promise.allSettled(
      dirItems
        .filter((f) => {
          // Ensure it's a directory
          if (f.isDirectory === false) return false;
          // Ensure it's a valid date
          if (!/^\d{4}-\d{2}-\d{2}$/.test(f.name)) return false;
          // Ensure it's older than last Monday
          return f.name < lastMondayStr;
        })
        .map((f) => remove(join(destFolder, f.name))),
    );
  } catch (error) {
    errorCatcher(error);
  }
};

export const exportAllDays = async () => {
  await deleteOldExportFolders();
  try {
    const jwStore = useJwStore();
    const currentStateStore = useCurrentStateStore();
    if (
      !currentStateStore.currentSettings?.enableMediaAutoExport ||
      !currentStateStore.currentSettings?.mediaAutoExportFolder
    ) {
      return;
    }
    const daysToExport = (
      jwStore.lookupPeriod[currentStateStore.currentCongregation] || []
    )
      .map((d) => {
        const hasMedia = d.mediaSections
          ? Object.values(d.mediaSections).some(
              (section) => !!section.items?.length,
            )
          : false;
        return hasMedia ? d.date : undefined;
      })
      .filter((d): d is Date => !!d);

    // Call addDayToExportQueue for each day to ensure consolidated queuing logic
    await Promise.all(daysToExport.map((date) => addDayToExportQueue(date)));
  } catch (error) {
    errorCatcher(error);
  }
};
