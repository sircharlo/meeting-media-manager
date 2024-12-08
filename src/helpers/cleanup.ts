// import type { DynamicMediaObject } from 'src/types';

// import { storeToRefs } from 'pinia';
// import { dateFromString, isInPast } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
// import { getAdditionalMediaPath, removeEmptyDirs } from 'src/helpers/fs';
// import { useJwStore } from 'src/stores/jw';

// const { fileUrlToPath, fs, readDirectory, path } = window.electronApi;

export const cleanLocalStorage = () => {
  // try {
  //   ['customDurations', 'additionalMediaMaps', 'mediaSort'].forEach((key) => {
  //     cleanUpPastDatesFromLocalStorage(key);
  //   });
  // } catch (error) {
  //   errorCatcher(error);
  // }
};

export const cleanAdditionalMediaFolder = () => {
  try {
    // const jwStore = useJwStore();
    // const { additionalMediaMaps } = storeToRefs(jwStore);
    // const additionalMediaPath = getAdditionalMediaPath();
    // if (!fs.existsSync(additionalMediaPath)) {
    //   additionalMediaMaps.value = {};
    //   return;
    // }
    // const flattenedFilePaths = (
    //   data: Record<string, Record<string, DynamicMediaObject[]>>,
    // ) => {
    //   return Object.values(data).flatMap((dateObj) =>
    //     Object.values(dateObj).flatMap((files) =>
    //       files.map((file) => path.resolve(fileUrlToPath(file.fileUrl))),
    //     ),
    //   );
    // };
    // // Check for files present on the filesystem that are not present in the additional media maps
    // const filesReferencedInAdditionalMediaMaps = flattenedFilePaths(
    //   additionalMediaMaps.value,
    // );
    // const dirListing = readDirectory(additionalMediaPath, { nodir: true }).map((f) =>
    //   path.resolve(f.path),
    // );
    // for (const additionalMediaFilePath of dirListing) {
    //   if (
    //     !filesReferencedInAdditionalMediaMaps.includes(additionalMediaFilePath)
    //   ) {
    //     console.log(
    //       'Removing orphaned file from filesystem:',
    //       additionalMediaFilePath,
    //     );
    //     await fs.remove(additionalMediaFilePath);
    //   }
    // }
    // Check for files present in the additional media maps that are not present on the filesystem
    // for (const [congregation, additionalMediaMap] of Object.entries(
    //   additionalMediaMaps.value,
    // )) {
    //   // for (const [dateKey, mediaObjects] of Object.entries(
    //   //   additionalMediaMap,
    //   // )) {
    //   //   for (const mediaObject of mediaObjects) {
    //   //     const filePath = path.resolve(fileUrlToPath(mediaObject.fileUrl));
    //   //     if (!fs.existsSync(filePath)) {
    //   //       console.log(
    //   //         'Removing orphaned file from additional media maps:',
    //   //         filePath,
    //   //       );
    //   //       additionalMediaMaps.value[congregation][dateKey] =
    //   //         mediaObjects.filter((obj) => obj.fileUrl !== mediaObject.fileUrl);
    //   //     }
    //   //   }
    //   // }
    // }
    // removeEmptyDirs(additionalMediaPath);
  } catch (error) {
    errorCatcher(error);
  }
};
