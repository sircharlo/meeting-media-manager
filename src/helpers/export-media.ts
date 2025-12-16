import type PQueue from 'p-queue';

import { i18n } from 'boot/i18n';
import { getMeetingSections } from 'src/constants/media';
import { isCoWeek, isMeetingDay } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { setupFFmpeg } from 'src/helpers/fs';
import { datesAreSame, formatDate } from 'src/utils/date';
import { trimFilepathAsNeeded } from 'src/utils/fs';
import { pad } from 'src/utils/general';
import { isJwPlaylist, isVideo } from 'src/utils/media';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

const { createVideoFromNonVideo, fileUrlToPath, fs, path, readdir } =
  window.electronApi;
const { copy, ensureDir, exists, remove, stat } = fs;
const { basename, extname, join } = path;

// Create a queue to limit the number of exports running at the same time
let folderExportQueue: PQueue | undefined;

// Track days that are currently exporting
export const pendingDays = new Set<string>();
// Track days that requested another export while one was already running
const dirtyDays = new Set<string>();

export const addDayToExportQueue = async (targetDate?: Date) => {
  if (!targetDate) return;
  const dateStr = formatDate(targetDate, 'YYYY-MM-DD');

  if (pendingDays.has(dateStr)) {
    // If already exporting, mark as dirty so it runs again after finishing
    dirtyDays.add(dateStr);
    return;
  }
  pendingDays.add(dateStr);

  if (!folderExportQueue) {
    const { default: PQueue } = await import('p-queue');
    folderExportQueue = new PQueue({ concurrency: 2 });
  }

  folderExportQueue.add(async () => {
    try {
      // Run the export
      await exportDayToFolder(targetDate);

      // If the day was marked as dirty while running, run it again until it's clean
      while (dirtyDays.has(dateStr)) {
        dirtyDays.delete(dateStr);
        await exportDayToFolder(targetDate);
      }
    } finally {
      pendingDays.delete(dateStr);
      dirtyDays.delete(dateStr); // Just in case
    }
  });
};

const exportDayToFolder = async (targetDate?: Date) => {
  const currentStateStore = useCurrentStateStore();
  const jwStore = useJwStore();

  if (
    !targetDate ||
    !currentStateStore?.currentCongregation ||
    !currentStateStore.currentSettings?.enableMediaAutoExport ||
    !currentStateStore.currentSettings?.mediaAutoExportFolder
  ) {
    return;
  }

  const dateFolderName = formatDate(targetDate, 'YYYY-MM-DD');

  const day = jwStore.lookupPeriod?.[
    currentStateStore.currentCongregation
  ]?.find((d) => d.date && datesAreSame(d.date, targetDate));

  if (!day?.mediaSections) {
    return;
  }

  const destFolder = join(
    currentStateStore.currentSettings.mediaAutoExportFolder,
    dateFolderName,
  );

  try {
    await ensureDir(destFolder);
  } catch (error) {
    errorCatcher(error);
    return; // Exit early if we can't create the folder
  }

  const expectedFiles = new Set<string>();

  const { default: sanitize } = await import('sanitize-filename');

  // Iterate through sections to preserve order and structure
  let sectionIndex = 1;
  const { getMeetingType } = currentStateStore;

  const meetingType = getMeetingType(day.date);

  // Get the appropriate meeting sections based on meeting type (MW vs WE)
  const meetingSections = getMeetingSections(meetingType, isCoWeek(day.date));

  // Create a list of all sections that should be displayed
  const sectionsToShow: string[] = [...meetingSections];

  // Add any custom sections that have items (not already in meeting sections)
  day.mediaSections.forEach((sectionData) => {
    const sectionId = sectionData.config.uniqueId;
    const isMeetingToday = isMeetingDay(day.date);
    if (
      !sectionsToShow.includes(sectionId) &&
      ((!isMeetingToday && !meetingSections.includes(sectionId)) ||
        (isMeetingToday && sectionData?.items?.length))
    ) {
      sectionsToShow.push(sectionId);
    }
  });

  const sortedSections = day.mediaSections
    .filter((m) => !!m.config)
    .filter((m) => {
      const sectionId = m.config?.uniqueId || '';
      // Include if it's a meeting section OR if it has items
      return sectionsToShow.includes(sectionId);
    })
    .sort((a, b) => {
      const aId = a.config?.uniqueId || '';
      const bId = b.config?.uniqueId || '';

      // Get indices from our sectionsToShow array
      const aIndex = sectionsToShow.indexOf(aId);
      const bIndex = sectionsToShow.indexOf(bId);

      // If both are in the list, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only one is in the list, prioritize the one in the list
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // If neither is in the list, sort alphabetically
      return aId.localeCompare(bId);
    });

  console.log('sections', sortedSections);

  for (const section of sortedSections) {
    if (!section.items?.length) continue;

    // Filter visible items and flatten children
    const visibleItems = section.items
      .flatMap((item) =>
        Array.isArray(item.children) ? item.children : [item],
      )
      .filter((item) => !item.hidden);

    console.log('visibleItems', visibleItems);

    if (!visibleItems.length) continue;

    const sectionName = (i18n.global.t as (key: string) => string)(
      section.config.uniqueId,
    );
    const sanitizedSectionName = sanitize(sectionName);
    const sectionPrefix = pad(sectionIndex++);

    for (let i = 0; i < visibleItems.length; i++) {
      try {
        const m = visibleItems[i];
        if (!m) continue;
        let sourceFilePath = fileUrlToPath(m.fileUrl);
        if (!sourceFilePath || !(await exists(sourceFilePath))) continue;

        const shouldConvert =
          !isVideo(sourceFilePath) &&
          !isJwPlaylist(sourceFilePath) &&
          currentStateStore.currentSettings?.convertFilesToMp4;

        const effectiveExt = shouldConvert ? '.mp4' : extname(sourceFilePath);

        const mediaPrefix = pad(i + 1, visibleItems.length > 99 ? 3 : 2);

        // Construct filename format: [SectionIndex] [SectionName] - [ItemIndex] [ItemName]
        const mediaTitle = m.title
          ? sanitize(m.title.replace(extname(sourceFilePath), ''))
          : basename(sourceFilePath, extname(sourceFilePath));

        const destFileName = `${sectionPrefix} ${sanitizedSectionName} - ${mediaPrefix} ${mediaTitle}${effectiveExt}`;

        const destFilePath = trimFilepathAsNeeded(
          join(destFolder, destFileName),
        );
        const fileBaseName = basename(destFilePath);

        // Check if destination file exists and matches criteria
        if (await exists(destFilePath)) {
          const sourceStats = await stat(sourceFilePath);
          const destStats = await stat(destFilePath);

          if (shouldConvert) {
            // For converted files, check if destination is newer than source and has content
            if (destStats.mtimeMs > sourceStats.mtimeMs && destStats.size > 0) {
              expectedFiles.add(fileBaseName);
              continue;
            }
          } else {
            // For direct copies, check size match
            if (sourceStats.size === destStats.size) {
              expectedFiles.add(fileBaseName);
              continue;
            }
          }
        }

        // Perform conversion if needed
        if (shouldConvert) {
          try {
            const ffmpegPath = await setupFFmpeg();
            const convertedFilePath = await createVideoFromNonVideo(
              sourceFilePath,
              ffmpegPath,
            );
            sourceFilePath = convertedFilePath;
          } catch (error) {
            errorCatcher(error);
            continue;
          }
        }

        // Copy file
        expectedFiles.add(fileBaseName);
        await copy(sourceFilePath, destFilePath);
      } catch (error) {
        errorCatcher(error);
      }
    }
  }

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

export const exportAllDays = async () => {
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

    if (!folderExportQueue) {
      const { default: PQueue } = await import('p-queue');
      folderExportQueue = new PQueue({ concurrency: 2 });
    }

    // Only add days that are not already pending
    const newDays = daysToExport.filter((date) => {
      const dateStr = formatDate(date, 'YYYY-MM-DD');
      if (pendingDays.has(dateStr)) return false;
      pendingDays.add(dateStr);
      return true;
    });

    folderExportQueue.addAll(
      newDays.map((date) => async () => {
        try {
          await exportDayToFolder(date);
        } finally {
          const dateStr = formatDate(date, 'YYYY-MM-DD');
          pendingDays.delete(dateStr);
        }
      }),
    );
  } catch (error) {
    errorCatcher(error);
  }
};
