/* eslint-disable @typescript-eslint/no-dynamic-delete */
import type { DynamicMediaObject } from 'src/types';

import { storeToRefs } from 'pinia';
import { LocalStorage } from 'quasar';
import { dateFromString, isInPast } from 'src/helpers/date';
import { electronApi } from 'src/helpers/electron-api';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getAdditionalMediaPath, removeEmptyDirs } from 'src/helpers/fs';
import { useJwStore } from 'src/stores/jw';

const { fileUrlToPath, fs, klawSync, path } = electronApi;

function cleanUpPastDatesFromLocalStorage(key: string) {
  const data = LocalStorage.getItem(key);
  if (!data) {
    return;
  }

  Object.keys(data).forEach((uid) => {
    // @ts-expect-error LocalStorage typing mishap here
    const datesObj = data[uid];
    Object.keys(datesObj).forEach((dateKey) => {
      if (isInPast(dateFromString(dateKey))) {
        delete datesObj[dateKey];
      }
    });

    if (Object.keys(datesObj).length === 0) {
      // @ts-expect-error LocalStorage typing mishap here
      delete data[uid];
    }
  });

  LocalStorage.set(key, data);
}

const cleanLocalStorage = () => {
  try {
    ['customDurations', 'additionalMediaMaps', 'mediaSort'].forEach((key) => {
      cleanUpPastDatesFromLocalStorage(key);
    });
  } catch (error) {
    errorCatcher(error);
  }
};

const cleanAdditionalMediaFolder = () => {
  try {
    const jwStore = useJwStore();
    const { additionalMediaMaps } = storeToRefs(jwStore);
    const additionalMediaPath = getAdditionalMediaPath();
    if (!fs.existsSync(additionalMediaPath)) {
      additionalMediaMaps.value = {};
      return;
    }
    const flattenedFilePaths = (
      data: Record<string, Record<string, DynamicMediaObject[]>>,
    ) => {
      return Object.values(data).flatMap((dateObj) =>
        Object.values(dateObj).flatMap((files) =>
          files.map((file) => path.resolve(fileUrlToPath(file.fileUrl))),
        ),
      );
    };
    // Check for files present on the filesystem that are not present in the additional media maps
    const filesReferencedInAdditionalMediaMaps = flattenedFilePaths(
      additionalMediaMaps.value,
    );
    const dirListing = klawSync(additionalMediaPath, { nodir: true }).map((f) =>
      path.resolve(f.path),
    );
    for (const additionalMediaFilePath of dirListing) {
      if (
        !filesReferencedInAdditionalMediaMaps.includes(additionalMediaFilePath)
      ) {
        console.log(
          'Removing orphaned file from filesystem:',
          additionalMediaFilePath,
        );
        fs.rmSync(additionalMediaFilePath);
      }
    }

    // Check for files present in the additional media maps that are not present on the filesystem
    for (const [congregation, additionalMediaMap] of Object.entries(
      additionalMediaMaps.value,
    )) {
      for (const [dateKey, mediaObjects] of Object.entries(
        additionalMediaMap,
      )) {
        for (const mediaObject of mediaObjects) {
          const filePath = path.resolve(fileUrlToPath(mediaObject.fileUrl));
          if (!fs.existsSync(filePath)) {
            console.log(
              'Removing orphaned file from additional media maps:',
              filePath,
            );
            additionalMediaMaps.value[congregation][dateKey] =
              mediaObjects.filter((obj) => obj.fileUrl !== mediaObject.fileUrl);
          }
        }
      }
    }
    removeEmptyDirs(additionalMediaPath);
  } catch (error) {
    errorCatcher(error);
  }
};

export { cleanAdditionalMediaFolder, cleanLocalStorage };
