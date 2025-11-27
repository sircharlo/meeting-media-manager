import type PQueue from 'p-queue';
import type { MediaItem, MediaSectionIdentifier } from 'src/types';

import { i18n } from 'boot/i18n';
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

export const addDayToExportQueue = async (targetDate?: Date) => {
  if (!targetDate) return;
  const dateStr = formatDate(targetDate, 'YYYY-MM-DD');

  if (pendingDays.has(dateStr)) return;
  pendingDays.add(dateStr);

  if (!folderExportQueue) {
    const { default: PQueue } = await import('p-queue');
    folderExportQueue = new PQueue({ concurrency: 2 });
  }

  folderExportQueue.add(async () => {
    try {
      await exportDayToFolder(targetDate);
    } finally {
      pendingDays.delete(dateStr);
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

  // Get all media from all sections
  const allMedia: MediaItem[] = [];
  Object.values(day.mediaSections).forEach((sectionMedia) => {
    allMedia.push(...(sectionMedia.items || []));
  });

  const filteredMedia = Array.from(
    new Map(
      allMedia
        // Flatten items with children
        .flatMap((item) =>
          Array.isArray(item.children) ? item.children : [item],
        )
        // Filter out hidden items
        .filter((item) => !item.hidden)
        // Use Map to deduplicate by fileUrl
        .map((item) => [item.fileUrl, item]),
    ).values(),
  ); // No sorting needed since we're not using section-based sorting anymore

  const dayMediaLength = filteredMedia.length;

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
  const sections: Partial<Record<MediaSectionIdentifier, number>> = {}; // Object to store dynamic section prefixes

  for (let i = 0; i < dayMediaLength; i++) {
    try {
      const m = filteredMedia[i];
      if (!m) continue;
      let sourceFilePath = fileUrlToPath(m.fileUrl);
      if (!sourceFilePath || !(await exists(sourceFilePath))) continue;

      const shouldConvert =
        !isVideo(sourceFilePath) &&
        !isJwPlaylist(sourceFilePath) &&
        currentStateStore.currentSettings?.convertFilesToMp4;

      const effectiveExt = shouldConvert ? '.mp4' : extname(sourceFilePath);

      const sectionPrefix = pad(sections['imported-media'] ?? 1);
      const mediaPrefix = pad(i + 1, dayMediaLength > 99 ? 3 : 2);
      const mediaTag = m.tag?.type
        ? `${(i18n.global.t as (key: string) => string)(m.tag.type)} ${m.tag.value}`
        : null;
      const mediaTitle = m.title
        ? sanitize(m.title.replace(extname(sourceFilePath), '')) + effectiveExt
        : basename(sourceFilePath, extname(sourceFilePath)) + effectiveExt;

      const destFilePath = trimFilepathAsNeeded(
        join(
          destFolder,
          `${sectionPrefix}-${mediaPrefix}${mediaTag ? ` - ${mediaTag} - ` : ' '}${mediaTitle}`,
        ),
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
          // Fallback to original file if conversion fails?
          // For now, let's continue with original to avoid breaking flow,
          // but filename might be wrong. Ideally we should skip or handle error.
          // Given existing logic, we'll just log error and maybe skip copy to avoid confusion.
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

let folderExportQueue: PQueue | undefined;
const pendingDays = new Set<string>();

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
