import type { PublicationFetcher } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';

import { getPubId } from './pub';

export const isFileUrl = (path: string) => path.startsWith('file://');

// Paths

const PUBLICATION_FOLDER = 'Publications';

/**
 * Gets the full path of a directory in the user data folder.
 * @param paths The paths to the directory, relative to the user data folder.
 * @param create Weather to create the directory if it doesn't exist.
 * @returns The full path of the directory.
 */
const getUserDataPath = async (paths: string[], create = false) => {
  const dir = window.electronApi.path.join(
    await window.electronApi.getUserDataPath(),
    ...paths,
  );
  if (create) {
    try {
      await window.electronApi.fs.ensureDir(dir);
    } catch (e) {
      errorCatcher(e);
    }
  }
  return dir;
};

export const getFontsPath = () => getUserDataPath(['Fonts']);
export const getTempPath = () => getUserDataPath(['Temp'], true);
export const getPublicationsPath = () => getUserDataPath([PUBLICATION_FOLDER]);
export const getAdditionalMediaPath = () =>
  getUserDataPath(['Additional Media']);

// Directories

/**
 * Gets the parent directory of a file.
 * @param filepath The path to the file.
 * @returns The path to the parent directory.
 */
export const getParentDirectory = (filepath: string) => {
  if (!filepath) return '';
  if (isFileUrl(filepath)) {
    filepath = window.electronApi.fileUrlToPath(filepath);
  }
  return window.electronApi.path.dirname(filepath);
};

/**
 * Gets the cache directory of a publication.
 * @param publication The publication to get the cache directory of.
 * @returns The cache directory of the publication.
 */
export const getPublicationDirectory = async (
  publication: PublicationFetcher,
) => {
  return getUserDataPath([PUBLICATION_FOLDER, getPubId(publication)], true);
};

/**
 * Checks if a directory is empty.
 * @param directory The directory to check.
 * @returns Weather the directory is empty.
 */
const isEmptyDir = async (directory: string) => {
  try {
    const files = await window.electronApi.readdir(directory);
    return files.length === 0;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

/**
 * Removes a directory if it is empty.
 * @param directory The directory to remove.
 */
const removeEmptyDir = async (directory: string) => {
  if (await isEmptyDir(directory)) {
    await window.electronApi.fs.remove(directory);
  }
};

/**
 * Removes all empty directories inside a root directory.
 * @param rootDir The root directory to remove empty directories from.
 */
export const removeEmptyDirs = async (rootDir: string) => {
  try {
    const dirs = (await window.electronApi.readdir(rootDir))
      .filter((item) => item.isDirectory)
      .map((item) => window.electronApi.path.join(rootDir, item.name));

    dirs.forEach((dir) => removeEmptyDir(dir));
  } catch (error) {
    errorCatcher(error);
  }
};

// Files

/**
 * Gets the files inside a publication directory.
 * @param publication The publication to get the files of.
 * @param filter The filter to apply to the files.
 * @returns The files inside the publication directory.
 */
export const getPublicationDirectoryContents = async (
  publication: PublicationFetcher,
  filter?: string,
) => {
  try {
    const dir = await getPublicationDirectory(publication);
    if (!(await window.electronApi.fs.pathExists(dir))) return [];
    const items = await window.electronApi.readdir(dir);
    return items
      .filter(
        (item) =>
          item.isFile &&
          (!filter || item.name.toLowerCase().includes(filter.toLowerCase())),
      )
      .map((item) => ({ path: window.electronApi.path.join(dir, item.name) }));
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

/**
 * Trims a filepath to comply with the maximum path length.
 * @param filepath The filepath to trim.
 * @returns The trimmed filepath.
 */
export const trimFilepathAsNeeded = (filepath: string) => {
  const fileDir = window.electronApi.path.dirname(filepath);
  let filepathSize = new Blob([filepath]).size;
  while (filepathSize > 230) {
    const uniqueId =
      '_' +
      Math.floor(Math.random() * Date.now())
        .toString(16)
        .slice(0, 4);

    const overBy = filepathSize - 230 + uniqueId.length;

    const baseName = window.electronApi.path
      .basename(filepath)
      .slice(0, -window.electronApi.path.extname(filepath).length);

    const newBaseName = baseName.slice(0, -overBy) + uniqueId;

    filepath = window.electronApi.path.join(
      fileDir,
      newBaseName + window.electronApi.path.extname(filepath),
    );

    filepathSize = new Blob([filepath]).size;
  }
  return filepath;
};

// Disable Updates File

const disableUpdatesPath = () =>
  getUserDataPath(['Global Preferences', 'disable-updates']);

/**
 * Checks if auto updates are disabled.
 * @returns Wether auto updates are disabled.
 */
export const updatesDisabled = async () =>
  window.electronApi.fs.exists(await disableUpdatesPath());

/**
 * Enables auto updates.
 */
export const enableUpdates = async () => {
  try {
    await window.electronApi.fs.remove(await disableUpdatesPath());
  } catch (error) {
    errorCatcher(error);
  }
};

/**
 * Disables auto updates.
 */
export const disableUpdates = async () => {
  try {
    await window.electronApi.fs.writeFile(await disableUpdatesPath(), 'true');
  } catch (error) {
    errorCatcher(error);
  }
};
