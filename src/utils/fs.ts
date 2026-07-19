import type { PublicationFetcher } from 'src/types';

import { Buffer } from 'buffer'; // NOSONAR: this is not nodejs Buffer, it's the browser one
import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
import { getPubId } from 'src/utils/jw';

const {
  basename,
  checkForUpdates,
  dirname,
  extname,
  fileUrlToPath,
  fs,
  getAppDataPath,
  getBetaUpdatesPath,
  getUpdatesDisabledPath,
  isUsablePath: isUsablePathRaw,
  join,
  readdir,
} = globalThis.electronApi;

const isUsablePathPromises = new Map<string, Promise<boolean>>();
const isUsablePath = (path: string) => {
  if (isUsablePathPromises.has(path)) {
    return isUsablePathPromises.get(path) as Promise<boolean>;
  }
  const promise = isUsablePathRaw(path).finally(() => {
    isUsablePathPromises.delete(path);
  });
  isUsablePathPromises.set(path, promise);
  return promise;
};
const { ensureDir, ensureFile, pathExists, readFile, remove, writeFile } = fs;

let defaultDataPath: null | string = null;

let getCacheFolderProvider: (() => string | undefined) | null = null;

/**
 * Registers a provider to retrieve the cache folder path.
 * This helps avoid circular dependencies with stores.
 * @param provider A function that returns the cache folder path.
 */
export const registerCachePathProvider = (
  provider: () => string | undefined,
) => {
  getCacheFolderProvider = provider;
};

// Once a real read/write against the custom cache folder fails with a
// permission-class error, the coarse isUsablePath probe can no longer be
// trusted for it (it only tests creating a brand-new file, which can succeed
// even when pre-existing files are unreadable). Rather than re-probing and
// looping on the same broken folder, stop resolving to it for the rest of
// the session so every getPublicationDirectory() caller (extraction,
// playback path building, rediscovery on next launch) consistently lands on
// the writable app-default path instead.
let customCachePathDisabledForSession = false;

/**
 * Disables the custom cache folder for the remainder of the session after a
 * real filesystem operation (not just the startup probe) fails against it
 * with a permission-class error. Safe to call repeatedly/without a custom
 * path configured; it's a no-op after the first call.
 * @param error The filesystem error that triggered the fallback.
 */
export const invalidateCustomCachePath = (error: unknown) => {
  if (customCachePathDisabledForSession) return;
  customCachePathDisabledForSession = true;
  defaultDataPath = null;

  log(
    '📁 Custom cache folder became inaccessible. Using default app data path for the rest of this session.',
    'filesystem',
    'warn',
    error,
  );

  errorCatcher(
    new Error(
      'Custom cache folder became inaccessible; falling back to the default app data location for this session',
    ),
    {
      contexts: {
        fn: {
          errorCode:
            typeof error === 'object' && error !== null && 'code' in error
              ? (error as { code?: unknown }).code
              : undefined,
          name: 'invalidateCustomCachePath',
        },
      },
      fingerprint: ['custom-cache-folder-disabled-for-session'],
    },
  );
};

export const getCachedUserDataPath = async (): Promise<string> => {
  const customPath = customCachePathDisabledForSession
    ? undefined
    : getCacheFolderProvider?.();

  // Fast path: already resolved
  if (defaultDataPath) {
    if (
      (!customPath || defaultDataPath === customPath) &&
      (await isUsablePath(defaultDataPath))
    ) {
      return defaultDataPath;
    }
    log(
      '📁 Cached cache path became unusable. Resolving again.',
      'filesystem',
      'warn',
      defaultDataPath,
    );
    defaultDataPath = null;
  }

  // Try custom path first
  if (
    customPath &&
    defaultDataPath !== customPath &&
    (await isUsablePath(customPath))
  ) {
    defaultDataPath = customPath;
    log('📁 Using custom cache path:', 'filesystem', 'log', customPath);
    return defaultDataPath;
  }

  // Fallback to resolved app data path
  defaultDataPath = await getAppDataPath();
  log(
    '📁 Using default app data path as cache path:',
    'filesystem',
    'log',
    defaultDataPath,
  );
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
const getCachePath = async (
  paths: string | string[],
  create = false,
  { bypassCustomPath = false } = {},
) => {
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
    const basePath = bypassCustomPath
      ? await getAppDataPath()
      : await getCachedUserDataPath();
    if (!basePath) {
      // Both resolvers are typed to always return a string, but the IPC
      // call underlying getAppDataPath() has occasionally resolved to a
      // falsy value in practice (cause unconfirmed - a main-process
      // handler race is suspected). Turn that into a self-describing
      // error instead of the opaque "path argument must be of type
      // string" TypeError that join() would otherwise throw, so the next
      // occurrence is diagnosable from the Sentry report alone.
      throw new Error(
        `getCachePath: base path resolver returned a falsy value (${JSON.stringify(basePath)})`,
      );
    }
    return await buildPath(basePath);
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

// Temp is pure scratch space (jwpub extraction staging, PDF conversion,
// etc.) with no benefit from being shared across installs, unlike
// Publications/Fonts/Additional Media. Routing it through a cloud-synced
// custom cache folder buys nothing and exposes rapid ephemeral read/write
// churn to sync-agent hydration/locking issues (e.g. OneDrive), so it
// always uses the shared/machine-wide-or-per-user path instead.
export const getTempPath = () =>
  getCachePath('Temp', true, { bypassCustomPath: true });
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

    const baseName = basename(filepath, ext);

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
  pathExists(await getUpdatesDisabledPath());

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
  !(await pathExists(await getBetaUpdatesPath()));

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
      await writeFile(lastVersionFile, import.meta.env.version ?? '');
      return false;
    }

    if (await pathExists(lastVersionFile)) {
      const lastVersion = await readFile(lastVersionFile, {
        encoding: 'utf-8',
      });
      await writeFile(lastVersionFile, import.meta.env.version ?? '');
      return lastVersion !== (import.meta.env.version ?? '');
    } else {
      await writeFile(lastVersionFile, import.meta.env.version ?? '', {
        encoding: 'utf-8',
      });
      return true;
    }
  } catch (error) {
    errorCatcher(error, { contexts: { fn: { name: 'wasUpdateInstalled' } } });
    return false;
  }
};
