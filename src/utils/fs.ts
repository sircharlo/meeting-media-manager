import type { PublicationFetcher } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { getPubId } from 'src/utils/jw';

const { checkForUpdates, fileUrlToPath, fs, getUserDataPath, path, readdir } =
  window.electronApi;
const {
  ensureDir,
  ensureFile,
  exists,
  pathExists,
  readFile,
  remove,
  writeFile,
} = fs;
const { dirname, extname, join } = path;

export const isFileUrl = (path?: string) => path?.startsWith('file://');

// Paths

const PUBLICATION_FOLDER = 'Publications';
const CONG_PREFERENCES_FOLDER = 'Cong Preferences';
const GLOBAL_PREFERENCES_FOLDER = 'Global Preferences';

/**
 * Gets the full path of a directory in the cache folder.
 * @param paths The paths to the directory, relative to the cache folder.
 * @param create Whether to create the directory if it doesn't exist.
 * @param cacheDir The cache directory if it is not the default.
 * @returns The full path of the directory.
 */
const getCachePath = async (
  paths: string[],
  create = false,
  cacheDir?: null | string,
) => {
  const dir = join(
    cacheDir || (await getUserDataPath()),
    ...paths.filter((p) => !!p),
  );
  if (create) {
    try {
      await ensureDir(dir);
    } catch (e) {
      errorCatcher(e);
    }
  }
  return dir;
};

export const getFontsPath = () => getCachePath(['Fonts']);
export const getTempPath = () => getCachePath(['Temp'], true);
export const getPublicationsPath = (cacheDir?: null | string) =>
  getCachePath([PUBLICATION_FOLDER], false, cacheDir);
export const getAdditionalMediaPath = (cacheDir?: null | string) =>
  getCachePath(['Additional Media'], false, cacheDir);

// Directories

/**
 * Gets the parent directory of a file.
 * @param filepath The path to the file.
 * @returns The path to the parent directory.
 */
export const getParentDirectory = (filepath?: string) => {
  if (!filepath) return '';
  if (isFileUrl(filepath)) {
    filepath = fileUrlToPath(filepath);
  }
  return dirname(filepath);
};

/**
 * Gets the cache directory of a publication.
 * @param publication The publication to get the cache directory of.
 * @returns The cache directory of the publication.
 */
export const getPublicationDirectory = async (
  publication: PublicationFetcher,
  cacheDir?: null | string,
) => {
  return getCachePath(
    [PUBLICATION_FOLDER, getPubId(publication)],
    true,
    cacheDir,
  );
};

/**
 * Checks if a directory is empty.
 * @param directory The directory to check.
 * @returns Whether the directory is empty.
 */
const isEmptyDir = async (directory: string) => {
  try {
    const files = await readdir(directory);
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
    try {
      await remove(directory);
    } catch (e) {
      errorCatcher(e);
    }
  }
};

/**
 * Removes all empty directories inside a root directory.
 * @param rootDir The root directory to remove empty directories from.
 */
export const removeEmptyDirs = async (rootDir: string) => {
  try {
    const dirs = (await readdir(rootDir))
      .filter((item) => item.isDirectory)
      .map((item) => join(rootDir, item.name));

    await Promise.allSettled(dirs.map((dir) => removeEmptyDir(dir)));
  } catch (error) {
    errorCatcher(error);
  }
};

// Files

/**
 * Find a file in a directory
 * @param dir The directory to search in.
 * @param search The search string.
 * @returns The path to the file.
 */
export const findFile = async (dir: string | undefined, search: string) => {
  if (!dir) return undefined;
  try {
    if (!(await pathExists(dir))) return undefined;
    const files = await readdir(dir);
    return files
      .map((file) => join(dir, file.name))
      .find((filename) => filename.includes(search));
  } catch (error) {
    errorCatcher(error);
    return undefined;
  }
};

/**
 * Gets the files inside a publication directory.
 * @param publication The publication to get the files of.
 * @param ext The extension filter to apply to the files.
 * @param cacheFolder The cache folder if it is not the default.
 * @returns The files inside the publication directory.
 */
export const getPublicationDirectoryContents = async (
  publication: PublicationFetcher,
  ext?: string,
  cacheFolder?: null | string,
) => {
  try {
    const dir = await getPublicationDirectory(publication, cacheFolder);
    if (!(await pathExists(dir))) return [];
    const items = await readdir(dir);
    return items
      .filter(
        (item) =>
          item.isFile &&
          (!ext || item.name.toLowerCase().endsWith(ext.toLowerCase())),
      )
      .map((item) => ({ path: join(dir, item.name) }));
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
  const fileDir = dirname(filepath);
  let filepathSize = new Blob([filepath]).size;
  while (filepathSize > 230) {
    const uniqueId =
      '_' +
      Math.floor(Math.random() * Date.now())
        .toString(16)
        .slice(0, 4);

    const overBy = filepathSize - 230 + uniqueId.length;

    const baseName = path
      .basename(filepath)
      .slice(0, -extname(filepath).length);

    const newBaseName = baseName.slice(0, -overBy) + uniqueId;

    filepath = join(fileDir, newBaseName + extname(filepath));

    filepathSize = new Blob([filepath]).size;
  }
  return filepath;
};

// Global Preferences

const disableUpdatesPath = () =>
  getCachePath([GLOBAL_PREFERENCES_FOLDER, 'disable-updates']);

/**
 * Checks if auto updates are disabled.
 * @returns Whether auto updates are disabled.
 */
export const updatesDisabled = async () => exists(await disableUpdatesPath());

/**
 * Toggles auto updates.
 * @param enable Wether to enable beta updates.
 */
export const toggleAutoUpdates = async (enable: boolean) => {
  try {
    if (enable) {
      await remove(await disableUpdatesPath());
      checkForUpdates();
    } else {
      await ensureFile(await disableUpdatesPath());
    }
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'enableUpdates' } } });
  }
};

const betaUpdatesPath = () =>
  getCachePath([GLOBAL_PREFERENCES_FOLDER, 'beta-updates']);

/**
 * Checks if beta updates are disabled.
 * @returns Wether beta updates are disabled.
 */
export const betaUpdatesDisabled = async () =>
  !(await exists(await betaUpdatesPath()));

/**
 * Toggles beta updates
 * @param enable Wether to enable beta updates.
 */
export const toggleBetaUpdates = async (enable: boolean) => {
  try {
    if (enable) {
      await ensureFile(await betaUpdatesPath());
    } else {
      await remove(await betaUpdatesPath());
    }
    checkForUpdates();
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'toggleBetaUpdates' } } });
  }
};

export const congPreferencesPath = () =>
  getCachePath([CONG_PREFERENCES_FOLDER]);

const lastVersionPath = (congId: string) =>
  getCachePath([CONG_PREFERENCES_FOLDER, congId, 'last-version']);

/**
 * Verifies whether a new version has been installed.
 */
export const wasUpdateInstalled = async (congId: string, newCong = false) => {
  try {
    const lastVersionFile = await lastVersionPath(congId);
    await ensureDir(dirname(lastVersionFile));

    if (newCong) {
      await writeFile(lastVersionFile, process.env.version ?? '');
      return false;
    }

    if (await exists(lastVersionFile)) {
      const lastVersion = await readFile(lastVersionFile, {
        encoding: 'utf-8',
      });
      await writeFile(lastVersionFile, process.env.version ?? '');
      return lastVersion !== (process.env.version ?? '');
    } else {
      await writeFile(lastVersionFile, process.env.version ?? '', {
        encoding: 'utf-8',
      });
      return true;
    }
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'wasUpdateInstalled' } } });
    return false;
  }
};
