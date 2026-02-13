import type {
  CacheAnalysis,
  CacheFile,
  JwLangCode,
  MediaItem,
  PublicationFetcher,
} from 'src/types';

import { updateLookupPeriod } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getLastUsedDate, LAST_USED_FILENAME } from 'src/helpers/usage';
import { dateFromString, getSpecificWeekday, isInPast } from 'src/utils/date';
import {
  congPreferencesPath,
  getAdditionalMediaPath,
  getParentDirectory,
  getPublicationDirectory,
  getPublicationsPath,
  getTempPath,
  removeEmptyDirs,
} from 'src/utils/fs';
import { getPubId } from 'src/utils/jw';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

const { fs, path, readdir } = globalThis.electronApi;
const { exists, pathExists, remove } = fs;
const { join, normalize } = path;

/**
 * Builds a map of file sizes by path
 */
function buildFileSizeMap(cacheFiles: CacheFile[]): Map<string, number> {
  const sizeByPath = new Map<string, number>();
  for (const file of cacheFiles) {
    sizeByPath.set(file.path, file.size || 0);
  }
  return sizeByPath;
}

/**
 * Creates a set of normalized parent directories from file URLs
 */
function buildReferencedParentDirectories(fileUrls: Set<string>): Set<string> {
  const parentDirectories = new Set<string>();

  fileUrls.forEach((fileUrl) => {
    const parentDir = normalizePath(getParentDirectory(fileUrl));
    parentDirectories.add(parentDir);
  });

  return parentDirectories;
}

/**
 * Calculates bytes freed from deletion results
 */
function calculateBytesFreed(
  results: PromiseSettledResult<void>[],
  filepaths: string[],
  sizeSource: Map<string, number> | Record<string, number>,
): number {
  let bytesFreed = 0;

  for (let i = 0; i < results.length; i++) {
    if (results[i]?.status !== 'fulfilled') continue;

    const path = filepaths[i];
    if (typeof path !== 'string') continue;

    const size =
      sizeSource instanceof Map ? sizeSource.get(path) : sizeSource[path];

    bytesFreed += size || 0;
  }

  return bytesFreed;
}

/**
 * Collects all file URLs referenced in media items
 */
function collectReferencedFileUrls(media: MediaItem): Set<string> {
  const urls = new Set<string>();
  const urlKeys = [
    'fileUrl',
    'streamUrl',
    'thumbnailUrl',
    'subtitlesUrl',
  ] as const;

  const addUrls = (item?: Partial<MediaItem>) => {
    if (!item) return;
    for (const key of urlKeys) {
      const value = item[key];
      if (value) urls.add(value);
    }
  };

  addUrls(media);

  if (Array.isArray(media?.children)) {
    for (const child of media.children) {
      addUrls(child);
    }
  }

  return urls;
}

/**
 * Counts successful deletions from results
 */
function countSuccessfulDeletions(
  results: PromiseSettledResult<void>[],
): number {
  return results.filter((r) => r.status === 'fulfilled').length;
}

/**
 * Checks if a directory should be considered unused
 */
function isDirectoryUnused(
  filePath: string,
  parentPath: string,
  usedParentDirectories: Record<string, number>,
  frequentlyUsedDirectories: Set<string>,
  untouchableDirectories: Set<string>,
): boolean {
  const normalizedPath = normalizePath(parentPath);

  // Check if in used directories
  const isInUsed = Object.keys(usedParentDirectories).some((dir) =>
    pathsOverlap(parentPath, dir),
  );

  if (isInUsed) return false;

  // Check if in frequently used directories
  const isInFrequentlyUsed = [...frequentlyUsedDirectories].some((dir) =>
    pathsOverlap(parentPath, dir),
  );

  if (isInFrequentlyUsed) return false;

  // Check if in untouchable directories
  const isInUntouchable = [...untouchableDirectories].some((dir) => {
    const normalizedDir = normalizePath(dir);
    return normalizedPath === normalizedDir;
  });

  if (isInUntouchable) return false;

  // Log debugging information
  console.log('🗑️ File marked as unused:', {
    filePath,
    frequentlyUsedDirs: [...frequentlyUsedDirectories],
    isInFrequentlyUsed,
    isInUntouchable,
    isInUsed,
    parentPath,
    untouchableDirs: [...untouchableDirectories],
    usedParentDirs: Object.keys(usedParentDirectories),
  });

  return true;
}

/**
 * Checks if a file is referenced by checking parent directories
 */
function isFileReferenced(
  normalizedParentPath: string,
  referencedParentDirectories: Set<string>,
): boolean {
  return Array.from(referencedParentDirectories).includes(normalizedParentPath);
}

/**
 * Checks if a file should be protected from deletion
 */
function isProtectedFile(fileName: string, parentFolder: string): boolean {
  // Never delete .last-used files directly
  if (fileName === LAST_USED_FILENAME) {
    return true;
  }

  // Protect files inside S-34mp_* or S-34_* folders
  const isProtectedS34Folder = /^S-34(?:mp_|_)/.test(parentFolder);
  return isProtectedS34Folder;
}

/**
 * Normalizes a path for cross-platform, case-insensitive comparison
 */
function normalizePath(path: string): string {
  return normalize(path)
    .replaceAll(/[\\/]+/g, '\\')
    .toLowerCase();
}

/**
 * Checks if a path is inside or contains another path (bidirectional)
 */
function pathsOverlap(path1: string, path2: string): boolean {
  const normalized1 = normalizePath(path1);
  const normalized2 = normalizePath(path2);
  return (
    normalized1.startsWith(normalized2) || normalized2.startsWith(normalized1)
  );
}

/**
 * Processes a single cache directory and returns its files
 */
async function processCacheDirectory(
  cacheDir: string,
  referencedParentDirectories: Set<string>,
): Promise<CacheFile[]> {
  const files: CacheFile[] = [];

  try {
    const items = await readdir(cacheDir, true, true);

    for (const item of items) {
      if (!item.isFile) continue;

      const filePath = join(item.parentPath, item.name);
      const parentFolder = item.parentPath.split('/').pop() || '';

      // Skip protected files
      if (isProtectedFile(item.name, parentFolder)) {
        continue;
      }

      // Check if file is referenced
      const normalizedParentPath = normalizePath(item.parentPath);
      let isReferenced = isFileReferenced(
        normalizedParentPath,
        referencedParentDirectories,
      );

      // If not proactively referenced, check the "last used" date
      if (!isReferenced) {
        isReferenced = await wasFileUsedRecently(item.parentPath);
      }

      files.push({
        orphaned: !isReferenced,
        parentPath: item.parentPath,
        path: filePath,
        size: item.size || 0,
      });
    }
  } catch (error) {
    errorCatcher(error);
  }

  return files;
}

/**
 * Calculates the sum of values in a record
 */
function sumRecordValues(record: Record<string, number>): number {
  return Object.values(record).reduce((sum, value) => sum + value, 0);
}

/**
 * Checks if a file was used recently based on last-used date
 */
async function wasFileUsedRecently(parentPath: string): Promise<boolean> {
  try {
    // Check current directory and parent directory (for subfolders)
    const lastUsedDateStr =
      (await getLastUsedDate(parentPath)) ||
      (await getLastUsedDate(getParentDirectory(parentPath)));

    if (lastUsedDateStr) {
      const lastUsedDate = dateFromString(lastUsedDateStr);
      return !isInPast(lastUsedDate);
    }

    return false;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
}

const cleanCongregationRecord = (
  record: Partial<Record<string, unknown>> | undefined,
  congIds: Set<string>,
) => {
  if (!record) return;

  Object.keys(record).forEach((congId) => {
    if (!congIds.has(congId)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete record[congId];
    }
  });
};

export const cleanPersistedStores = () => {
  const { congregations } = useCongregationSettingsStore();
  const congIds = new Set(Object.keys(congregations));

  cleanCongregationRecord(useJwStore().lookupPeriod, congIds);
};

const cleanCongregationFolders = async (root: string, congIds: Set<string>) => {
  if (!root || !congIds || !(await exists(root))) return;
  const folders = await readdir(root);
  await Promise.allSettled(
    folders
      .filter((f) => !congIds.has(f.name))
      .map((f) => remove(join(root, f.name))),
  );
};

const cleanPublicTalkPubs = async (folder: string, congIds: Set<string>) => {
  if (!folder || !congIds || !(await exists(folder))) return;
  const files = await readdir(folder);

  await Promise.allSettled(
    files
      .filter((f) => /^S-34(?:mp_|_)/.test(f.name))
      .map((f) => {
        const congIdOrLang = f.name.split('_')[1];
        if (!congIdOrLang?.includes('-') || congIds.has(congIdOrLang))
          return Promise.resolve();
        return remove(join(folder, f));
      }),
  );
};

const cleanDateFolders = async (root?: string) => {
  if (!root || !(await exists(root))) return;

  const folders = await readdir(root);

  await Promise.allSettled(
    folders
      .filter((f) => !f.name.includes('.jwlplaylist'))
      .filter((f) => isInPast(getSpecificWeekday(f.name, 6)))
      .map((f) => remove(join(root, f.name))),
  );
};

/**
 * Collects all languages used by any congregation
 */
const collectAllCongregationLanguages = (): Set<JwLangCode> => {
  const congregationStore = useCongregationSettingsStore();
  const currentState = useCurrentStateStore();
  const languages = new Set<JwLangCode>();

  Object.values(congregationStore.congregations).forEach((congSettings) => {
    if (congSettings?.lang) {
      languages.add(congSettings.lang);
    }
    if (congSettings?.langFallback) {
      languages.add(congSettings.langFallback);
    }
  });

  // Fallback if no congregations exist
  if (languages.size === 0) {
    languages.add(currentState.currentSettings?.lang ?? 'E');
  }

  return languages;
};

/**
 * Gets publication directories for given languages
 */
const getPublicationDirectories = async (
  pub: string,
  languages: Set<JwLangCode>,
  issue?: number | string,
  includeEnglish?: boolean,
): Promise<string[]> => {
  const directories: string[] = [];
  const languagesToUse = new Set<JwLangCode>(languages);

  if (includeEnglish) {
    languagesToUse.add('E' as JwLangCode);
  }

  for (const langwritten of languagesToUse) {
    // Special handling for "any" issue: protect all issue-tagged folders
    if (issue === 'any') {
      const baseId = getPubId({ langwritten, pub } as PublicationFetcher);
      const pubsRootDefault = await getPublicationsPath();
      directories.push(join(pubsRootDefault, baseId));
    } else {
      const directoryParams: PublicationFetcher = {
        issue,
        langwritten,
        pub,
      };
      directories.push(await getPublicationDirectory(directoryParams));
    }
  }

  return directories;
};

/**
 * Adds S-34 directories to the list
 */
const addS34Directories = async (directories: string[]): Promise<void> => {
  try {
    const pubsRootDefault = await getPublicationsPath();
    const items = await readdir(pubsRootDefault);

    items
      .filter((i) => i.isDirectory && /^S-34(?:mp_|_)/.test(i.name))
      .forEach((i) => directories.push(join(pubsRootDefault, i.name)));
  } catch (error) {
    errorCatcher(error);
  }
};

const loadFrequentlyUsedDirectories = async (): Promise<Set<string>> => {
  try {
    const currentState = useCurrentStateStore();
    const allLanguages = collectAllCongregationLanguages();

    // Helper function to get directories for a publication
    const getDir = (
      pub: string,
      issue?: number | string,
      includeEnglish?: boolean,
    ) => getPublicationDirectories(pub, allLanguages, issue, includeEnglish);

    const directories = (
      await Promise.all([
        // Meeting music and videos
        getDir(currentState.currentSongbook.pub, undefined, true),
        getDir(currentState.currentSongbook.pub, 0, true),
        // Bibles
        getDir('nwt'),
        getDir('nwtsty', undefined, true),
        // Frequently used during MW meetings
        getDir('ip-1', 0),
        getDir('ip-2', 0),
        getDir('it', 0),
        getDir('lff', 0),
        getDir('lmd', 0),
        getDir('lmdv', 0),
        // Public Talk media
        getDir('S-34', 'any'),
        getDir('S-34mp', 'any'),
        // Magazines
        getDir('g', 'any'),
        getDir('w', 'any'),
        getDir('wp', 'any'),
        // Various publication info
        getDir('jwlb', undefined, true),
      ])
    ).flat();

    // Add S-34 directories
    await addS34Directories(directories);

    return new Set<string>(directories.filter(Boolean));
  } catch (error) {
    errorCatcher(error);
    return new Set<string>();
  }
};

const fetchUntouchableDirectories = async (): Promise<Set<string>> => {
  try {
    return new Set([
      await getAdditionalMediaPath(),
      await getPublicationsPath(),
      await getTempPath(),
    ]);
  } catch (error) {
    errorCatcher(error);
    return new Set();
  }
};

/**
 * Collects all media items from all congregations and dates
 */
const collectAllMediaItems = (): MediaItem[] => {
  const jwStore = useJwStore();

  return Object.values(jwStore.lookupPeriod).flatMap(
    (congregationLookupPeriods) =>
      congregationLookupPeriods?.flatMap((lookupPeriod) => {
        if (!lookupPeriod?.mediaSections) return [];

        const allMedia: MediaItem[] = [];
        Object.values(lookupPeriod.mediaSections).forEach((sectionMedia) => {
          allMedia.push(...(sectionMedia.items || []));
        });

        return allMedia;
      }) || [],
  );
};

/**
 * Builds the set of all referenced file URLs from media items
 */
const buildReferencedFileUrls = (mediaItems: MediaItem[]): Set<string> => {
  const referencedFileUrls = new Set<string>();

  mediaItems.forEach((media) => {
    const urls = collectReferencedFileUrls(media);
    urls.forEach((url) => referencedFileUrls.add(url));
  });

  return referencedFileUrls;
};

const getCacheFiles = async (cacheDirs: string[]): Promise<CacheFile[]> => {
  try {
    // Collect all media items
    const allMediaItems = collectAllMediaItems();

    // Build set of referenced file URLs
    const referencedFileUrls = buildReferencedFileUrls(allMediaItems);

    // Build set of referenced parent directories (normalized)
    const referencedParentDirectories =
      buildReferencedParentDirectories(referencedFileUrls);

    // Process each cache directory
    const fileArrays = await Promise.all(
      cacheDirs.map((cacheDir) =>
        processCacheDirectory(cacheDir, referencedParentDirectories),
      ),
    );

    // Flatten the results
    return fileArrays.flat();
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

/**
 * Calculates used parent directories from cache files
 */
const calculateUsedParentDirectories = (
  cacheFiles: CacheFile[],
): Record<string, number> => {
  const usedCacheFiles = cacheFiles.filter((f) => !f.orphaned);

  return usedCacheFiles.reduce<Record<string, number>>((acc, file) => {
    acc[file.parentPath] = file.size + (acc[file.parentPath] ?? 0);
    return acc;
  }, {});
};

/**
 * Calculates unused parent directories from cache files
 */
const calculateUnusedParentDirectories = (
  cacheFiles: CacheFile[],
  usedParentDirectories: Record<string, number>,
  frequentlyUsedDirectories: Set<string>,
  untouchableDirectories: Set<string>,
): Record<string, number> => {
  return cacheFiles.reduce<Record<string, number>>((acc, file) => {
    if (
      isDirectoryUnused(
        file.path,
        file.parentPath,
        usedParentDirectories,
        frequentlyUsedDirectories,
        untouchableDirectories,
      )
    ) {
      acc[file.parentPath] = file.size + (acc[file.parentPath] ?? 0);
    }
    return acc;
  }, {});
};

export const analyzeCacheFiles = async (): Promise<CacheAnalysis> => {
  try {
    const currentState = useCurrentStateStore();

    // Fetch configuration directories
    const untouchableDirectories = await fetchUntouchableDirectories();
    const frequentlyUsedDirectories = await loadFrequentlyUsedDirectories();

    // Get cache directories
    const dirs = [
      ...new Set([
        await getPublicationsPath(),
        await getTempPath(),
        ...(currentState.currentCongregation
          ? [
              join(
                await getAdditionalMediaPath(),
                currentState.currentCongregation,
              ),
            ]
          : []),
      ]),
    ];

    const cacheDirs = (
      await Promise.all(
        dirs.map(async (dir) => ((await pathExists(dir)) ? dir : null)),
      )
    ).filter((s) => typeof s === 'string');

    // Get all cache files
    const cacheFiles = await getCacheFiles(cacheDirs);

    // Calculate used and unused directories
    const usedParentDirectories = calculateUsedParentDirectories(cacheFiles);

    const unusedParentDirectories = calculateUnusedParentDirectories(
      cacheFiles,
      usedParentDirectories,
      frequentlyUsedDirectories,
      untouchableDirectories,
    );

    // Calculate sizes
    const allCacheFilesSize = cacheFiles.reduce(
      (size, cacheFile) => size + cacheFile.size,
      0,
    );
    const unusedCacheFoldersSize = sumRecordValues(unusedParentDirectories);

    return {
      allCacheFilesSize,
      cacheFiles,
      frequentlyUsedDirectories,
      untouchableDirectories,
      unusedCacheFoldersSize,
      unusedParentDirectories,
      usedParentDirectories,
    };
  } catch (error) {
    errorCatcher(error);
    return {
      allCacheFilesSize: 0,
      cacheFiles: [],
      frequentlyUsedDirectories: new Set(),
      untouchableDirectories: new Set(),
      unusedCacheFoldersSize: 0,
      unusedParentDirectories: {},
      usedParentDirectories: {},
    };
  }
};

/**
 * Performs smart cache deletion (only unused directories)
 */
const performSmartDeletion = async (
  filepaths: string[],
  unusedParentDirectories: Record<string, number>,
): Promise<{ bytesFreed: number; itemsDeleted: number }> => {
  const results = await Promise.allSettled(filepaths.map((f) => remove(f)));

  const itemsDeleted = countSuccessfulDeletions(results);
  const bytesFreed = calculateBytesFreed(
    results,
    filepaths,
    unusedParentDirectories,
  );

  return { bytesFreed, itemsDeleted };
};

/**
 * Performs full cache deletion (all files)
 */
const performFullDeletion = async (
  filepaths: string[],
  cacheFiles: CacheFile[],
): Promise<{ bytesFreed: number; itemsDeleted: number }> => {
  const results = await Promise.allSettled(filepaths.map((f) => remove(f)));

  const itemsDeleted = countSuccessfulDeletions(results);
  const sizeByPath = buildFileSizeMap(cacheFiles);
  const bytesFreed = calculateBytesFreed(results, filepaths, sizeByPath);

  return { bytesFreed, itemsDeleted };
};

/**
 * Cleans up empty directories after deletion
 */
const cleanupEmptyDirectories = async (
  untouchableDirectories: Set<string>,
): Promise<void> => {
  try {
    await Promise.allSettled(
      [...untouchableDirectories].map((d) => removeEmptyDirs(d)),
    );
  } catch (error) {
    errorCatcher(error);
  }
};

export const deleteCacheFiles = async (
  type: 'all' | 'smart' = 'smart',
): Promise<{
  bytesFreed: number;
  itemsDeleted: number;
  mode: 'all' | 'smart';
}> => {
  try {
    const analysis = await analyzeCacheFiles();

    console.log('[Cache] Analyzed cache:', analysis);

    const filepathsToDelete =
      type === 'smart'
        ? Object.keys(analysis.unusedParentDirectories)
        : analysis.cacheFiles.map((f) => f.path);

    console.log('[Cache] Filepaths to delete:', filepathsToDelete);

    // Delete cache files/directories
    const deletionResult =
      type === 'smart'
        ? await performSmartDeletion(
            filepathsToDelete,
            analysis.unusedParentDirectories,
          )
        : await performFullDeletion(filepathsToDelete, analysis.cacheFiles);

    // Remove empty directories
    await cleanupEmptyDirectories(analysis.untouchableDirectories);

    // Update lookup period if deleting all cache
    if (type === 'all') {
      console.log('[Cache] Updating lookup period (all cache cleared)');
      updateLookupPeriod({ reset: true });
    }

    console.log('[Cache] Cleared successfully', {
      ...deletionResult,
      filepathsToDelete,
      mode: type,
    });

    return { ...deletionResult, mode: type };
  } catch (error) {
    errorCatcher(error);
    throw error;
  }
};

export const cleanCache = async () => {
  try {
    const congregationStore = useCongregationSettingsStore();
    const congIds = new Set(Object.keys(congregationStore.congregations));

    const settings = useCurrentStateStore().currentSettings;

    const additionalMediaPath = await getAdditionalMediaPath();

    cleanPublicTalkPubs(additionalMediaPath, congIds);
    cleanCongregationFolders(additionalMediaPath, congIds);
    cleanCongregationFolders(await congPreferencesPath(), congIds);

    congIds.forEach((congId) => {
      cleanDateFolders(join(additionalMediaPath, congId));
    });

    if (settings?.enableMediaAutoExport && settings?.mediaAutoExportFolder) {
      cleanDateFolders(settings.mediaAutoExportFolder);
    }

    return true;
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: { name: 'cleanCache' },
      },
    });
    return false;
  }
};
