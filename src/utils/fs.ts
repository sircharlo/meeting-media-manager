import type { PublicationFetcher } from 'src/types';

import { Buffer } from 'node:buffer';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { getPubId } from 'src/utils/jw';

const {
  checkForUpdates,
  fileUrlToPath,
  fs,
  getAppDataPath,
  getBetaUpdatesPath,
  getUpdatesDisabledPath,
  isUsablePath: isUsablePathRaw,
  path,
  readdir,
} = globalThis.electronApi;

const isUsablePathPromises: Record<string, Promise<boolean>> = {};
const isUsablePath = (path: string) => {
  if (isUsablePathPromises[path]) return isUsablePathPromises[path];
  isUsablePathPromises[path] = isUsablePathRaw(path);
  return isUsablePathPromises[path];
};
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

let defaultDataPath: null | string = null;

export const getCachedUserDataPath = async (): Promise<string> => {
  const { currentSettings } = useCurrentStateStore();
  const customPath = currentSettings?.cacheFolder;

  // Fast path: already resolved
  if (defaultDataPath) {
    if (!customPath || defaultDataPath === customPath) {
      return defaultDataPath;
    }
  }

  // Try custom path first
  if (
    customPath &&
    defaultDataPath !== customPath &&
    (await isUsablePath(customPath))
  ) {
    defaultDataPath = customPath;
    console.log('📁 Using custom cache path:', customPath);
    return defaultDataPath;
  }

  // Fallback to resolved app data path
  defaultDataPath = await getAppDataPath();
  console.log('📁 Using default app data path as cache path:', defaultDataPath);
  return defaultDataPath;
};

export const isFileUrl = (path?: string) => path?.startsWith('file://');

// Paths

const PUBLICATION_FOLDER = 'Publications';
const CONG_PREFERENCES_FOLDER = 'Cong Preferences';

/**
 * Gets the full path of a directory in the cache folder.
 * @param paths The paths to the directory, relative to the cache folder.
 * @param create Whether to create the directory if it doesn't exist.
 * @returns The full path of the directory.
 */
const getCachePath = async (paths: string | string[], create = false) => {
  const pathArray = Array.isArray(paths) ? paths : [paths];
  const parts = pathArray.filter((p) => !!p);

  const buildPath = async (base: string) => {
    const dir = join(base, ...parts);
    if (create) {
      await ensureDir(dir);
    }
    return dir;
  };

  try {
    return await buildPath(await getCachedUserDataPath());
  } catch (error) {
    defaultDataPath = await getAppDataPath();
    const fallbackPath = await buildPath(defaultDataPath);
    errorCatcher(error, {
      contexts: {
        fn: {
          create,
          fallbackPath,
          name: 'getCachePath',
          newDefaultDataPath: defaultDataPath,
          paths,
        },
      },
    });
    return fallbackPath;
  }
};

export const getFontsPath = () => getCachePath('Fonts');
export const getTempPath = () => getCachePath('Temp', true);
export const getPublicationsPath = () =>
  getCachePath(PUBLICATION_FOLDER, false);
export const getAdditionalMediaPath = () =>
  getCachePath('Additional Media', false);

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
) => {
  return getCachePath([PUBLICATION_FOLDER, getPubId(publication)], true);
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
 * @returns The files inside the publication directory.
 */
export const getPublicationDirectoryContents = async (
  publication: PublicationFetcher,
  ext?: string,
) => {
  try {
    const dir = await getPublicationDirectory(publication);
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
 * Trims a filepath to comply with the maximum path length (UTF-8 bytes).
 * @param filepath The filepath to trim.
 * @param maxBytes Maximum allowed UTF-8 byte length.
 * @returns The trimmed filepath.
 */
export const trimFilepathAsNeeded = (filepath: string, maxBytes = 230) => {
  const fileDir = dirname(filepath);
  const ext = extname(filepath);

  const getSize = (str: string) => Buffer.byteLength(str, 'utf8');

  let size = getSize(filepath);

  while (size > maxBytes) {
    const uniqueId = '_' + Math.random().toString(16).slice(2, 6);

    const baseName = path.basename(filepath, ext);

    const bytesOver = size - maxBytes + Buffer.byteLength(uniqueId, 'utf8');

    // Ensure we don’t slice too much
    const sliceAmount = Math.max(1, baseName.length - bytesOver);

    const newBaseName = baseName.slice(0, sliceAmount) + uniqueId;

    filepath = join(fileDir, newBaseName + ext);
    size = getSize(filepath);
  }

  return filepath;
};

/**
 * Checks if auto updates are disabled.
 * @returns Whether auto updates are disabled.
 */
export const updatesDisabled = async () =>
  exists(await getUpdatesDisabledPath());

/**
 * Toggles auto updates.
 * @param enable Wether to enable beta updates.
 */
export const toggleAutoUpdates = async (enable: boolean) => {
  try {
    if (enable) {
      await remove(await getUpdatesDisabledPath());
      checkForUpdates();
    } else {
      await ensureFile(await getUpdatesDisabledPath());
    }
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'enableUpdates' } } });
  }
};

/**
 * Checks if beta updates are disabled.
 * @returns Wether beta updates are disabled.
 */
export const betaUpdatesDisabled = async () =>
  !(await exists(await getBetaUpdatesPath()));

/**
 * Toggles beta updates
 * @param enable Wether to enable beta updates.
 */
export const toggleBetaUpdates = async (enable: boolean) => {
  try {
    if (enable) {
      await ensureFile(await getBetaUpdatesPath());
    } else {
      await remove(await getBetaUpdatesPath());
    }
    checkForUpdates();
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'toggleBetaUpdates' } } });
  }
};

export const congPreferencesPath = () => getCachePath(CONG_PREFERENCES_FOLDER);

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
