import type PQueue from 'p-queue';
import type { MediaSectionIdentifier } from 'src/types';

import { i18n } from 'boot/i18n';
import { errorCatcher } from 'src/helpers/error-catcher';
import { setupFFmpeg } from 'src/helpers/fs';
import { datesAreSame, formatDate } from 'src/utils/date';
import { trimFilepathAsNeeded } from 'src/utils/fs';
import { pad } from 'src/utils/general';
import { isVideo } from 'src/utils/media';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

export const addDayToExportQueue = async (targetDate?: Date) => {
  if (!folderExportQueue) {
    const { default: PQueue } = await import('p-queue');
    folderExportQueue = new PQueue({ concurrency: 1 });
  }
  folderExportQueue.add(() => exportDayToFolder(targetDate));
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

  const dynamicMedia =
    jwStore.lookupPeriod?.[currentStateStore.currentCongregation]?.find(
      (d) => d.date && datesAreSame(d.date, targetDate),
    )?.dynamicMedia || [];

  const dynamicMediaFiltered = Array.from(
    new Map(
      dynamicMedia
        .filter((item) => !item.hidden)
        .map((item) => [item.fileUrl, item]),
    ).values(),
  ).sort((a, b) => {
    const sectionOrder: MediaSectionIdentifier[] = [
      'tgw',
      'ayfm',
      'lac',
      'wt',
      'circuitOverseer',
    ];
    return sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section);
  });

  const dayMediaLength = dynamicMediaFiltered.length;

  const destFolder = window.electronApi.path.join(
    currentStateStore.currentSettings.mediaAutoExportFolder,
    dateFolderName,
  );

  try {
    await window.electronApi.fs.ensureDir(destFolder);
  } catch (error) {
    errorCatcher(error);
    return; // Exit early if we can't create the folder
  }

  const expectedFiles = new Set<string>();

  const { default: sanitize } = await import('sanitize-filename');
  const sections: Partial<Record<MediaSectionIdentifier, number>> = {}; // Object to store dynamic section prefixes
  for (let i = 0; i < dayMediaLength; i++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const m = dynamicMediaFiltered[i]!;
      let sourceFilePath = window.electronApi.fileUrlToPath(m.fileUrl);
      if (
        !sourceFilePath ||
        !(await window.electronApi.fs.exists(sourceFilePath))
      )
        continue;

      if (
        !isVideo(sourceFilePath) &&
        currentStateStore.currentSettings?.convertFilesToMp4
      ) {
        try {
          const ffmpegPath = await setupFFmpeg();
          const convertedFilePath =
            await window.electronApi.createVideoFromNonVideo(
              sourceFilePath,
              ffmpegPath,
            );
          sourceFilePath = convertedFilePath;
        } catch (error) {
          errorCatcher(error);
        }
      }

      if (!sections[m.section]) {
        sections[m.section] = Object.keys(sections).length + 1;
      }

      const sectionPrefix = pad(sections[m.section] || 0);
      const mediaPrefix = pad(i + 1, dayMediaLength > 99 ? 3 : 2);
      const mediaTag = m.tag?.type
        ? `${(i18n.global.t as (key: string) => string)(m.tag.type)} ${m.tag.value}`
        : null;
      const mediaTitle = m.title
        ? sanitize(
            m.title.replace(
              window.electronApi.path.extname(sourceFilePath),
              '',
            ),
          ) + window.electronApi.path.extname(sourceFilePath)
        : window.electronApi.path.basename(sourceFilePath);
      const destFilePath = trimFilepathAsNeeded(
        window.electronApi.path.join(
          destFolder,
          `${sectionPrefix}-${mediaPrefix}${mediaTag ? ` - ${mediaTag} - ` : ' '}${mediaTitle}`,
        ),
      );
      const fileBaseName = window.electronApi.path.basename(destFilePath);

      // Check if destination file exists and matches size
      if (await window.electronApi.fs.exists(destFilePath)) {
        const sourceStats = await window.electronApi.fs.stat(sourceFilePath);
        const destStats = await window.electronApi.fs.stat(destFilePath);

        if (sourceStats.size === destStats.size) {
          expectedFiles.add(fileBaseName); // Mark as expected without copying
          continue;
        }
      }

      // Copy file if it doesn't exist or size doesn't match
      expectedFiles.add(fileBaseName);
      await window.electronApi.fs.copy(sourceFilePath, destFilePath);
    } catch (error) {
      errorCatcher(error);
    }
  }

  try {
    const filesInDestFolder = await window.electronApi.fs.readdir(destFolder);
    for (const file of filesInDestFolder) {
      try {
        if (!expectedFiles.has(file)) {
          await window.electronApi.fs.remove(
            window.electronApi.path.join(destFolder, file),
          );
        }
      } catch (error) {
        errorCatcher(error);
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

let folderExportQueue: PQueue | undefined;

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
      .map((d) => (d.dynamicMedia.length ? d.date : undefined))
      .filter((d): d is Date => !!d);

    if (!folderExportQueue) {
      const { default: PQueue } = await import('p-queue');
      folderExportQueue = new PQueue({ concurrency: 1 });
    }
    await folderExportQueue.addAll(
      daysToExport.map((day) => () => exportDayToFolder(day)),
    );
  } catch (error) {
    errorCatcher(error);
  }
};
