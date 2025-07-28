import type {
  CacheAnalysis,
  CacheFile,
  JwLangCode,
  PublicationFetcher,
} from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { getSpecificWeekday, isInPast } from 'src/utils/date';
import {
  congPreferencesPath,
  getAdditionalMediaPath,
  getParentDirectory,
  getPublicationDirectory,
  getPublicationsPath,
  getTempPath,
  removeEmptyDirs,
} from 'src/utils/fs';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';

const { fs, path, pathToFileURL, readdir } = window.electronApi;
const { exists, pathExists, remove } = fs;
const { join, normalize } = path;

const cleanCongregationRecord = (
  record: Partial<Record<string, unknown>>,
  congIds: Set<string>,
) => {
  if (!record || !congIds) return;
  Object.keys(record).forEach((congId) => {
    if (!congIds.has(congId)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete record[congId];
    }
  });
};

export const cleanPersistedStores = () => {
  const congregationStore = useCongregationSettingsStore();
  const congIds = new Set(Object.keys(congregationStore.congregations));

  // Cleanup old congregation records
  const jwStore = useJwStore();
  const congregationRecords: (keyof typeof jwStore.$state)[] = ['lookupPeriod'];
  congregationRecords.forEach((r) =>
    cleanCongregationRecord(jwStore[r], congIds),
  );
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
      .filter((f) => f.name.startsWith('S-34mp_'))
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
      .map((f) => remove(join(root, f))),
  );
};

const loadFrequentlyUsedDirectories = async (): Promise<Set<string>> => {
  try {
    const currentState = useCurrentStateStore();

    const getDirectory = async (
      pub: string,
      issue?: number | string,
      lang?: '' | JwLangCode,
    ) => {
      const directoryParams: PublicationFetcher = {
        issue,
        langwritten: lang ?? currentState.currentSettings?.lang ?? 'E',
        pub,
      };

      return currentState.currentSettings
        ? [
            await getPublicationDirectory(directoryParams),
            await getPublicationDirectory(
              directoryParams,
              currentState.currentSettings?.cacheFolder,
            ),
          ]
        : '';
    };

    const directories = [
      await getDirectory(currentState.currentSongbook.pub), // Background music
      await getDirectory(currentState.currentSongbook.pub, 0), // Songbook videos
      await getDirectory('nwtsty'), // Study Bible
      await getDirectory('it', 0), // Insight
      await getDirectory('lmd', 0), // Love People
      await getDirectory('lmdv', 0), // Love People Videos
      await getDirectory('jwlb', undefined, 'E'), // JW Library
      await getDirectory('S-34mp', currentState.currentCongregation, ''), // Public Talk Publication
    ].flat();

    return new Set<string>(directories.filter(Boolean));
  } catch (error) {
    errorCatcher(error);
    return new Set<string>();
  }
};

const fetchUntouchableDirectories = async (): Promise<Set<string>> => {
  try {
    const currentState = useCurrentStateStore();
    return new Set([
      await getAdditionalMediaPath(),
      await getAdditionalMediaPath(currentState.currentSettings?.cacheFolder),
      await getPublicationsPath(),
      await getPublicationsPath(currentState.currentSettings?.cacheFolder),
      await getTempPath(),
    ]);
  } catch (error) {
    errorCatcher(error);
    return new Set();
  }
};

const getCacheFiles = async (cacheDirs: string[]): Promise<CacheFile[]> => {
  try {
    const currentState = useCurrentStateStore();
    const jwStore = useJwStore();

    const lookupPeriodsCollections = Object.values(
      jwStore.lookupPeriod,
    ).flatMap((congregationLookupPeriods) =>
      congregationLookupPeriods?.flatMap(
        (lookupPeriods) => lookupPeriods?.dynamicMedia || [],
      ),
    );

    const mediaFileParentDirectories = new Set(
      lookupPeriodsCollections.map((media) =>
        media ? pathToFileURL(getParentDirectory(media.fileUrl)) : '',
      ),
    );

    const files: CacheFile[] = [];
    for (const cacheDir of cacheDirs) {
      try {
        const items = await readdir(cacheDir, true, true);
        for (const item of items) {
          const filePath = join(item.parentPath, item.name);
          if (item.isFile) {
            const parentFolder = item.parentPath.split('/').pop() || '';
            if (
              !parentFolder.startsWith('S-34mp') ||
              parentFolder === `S-34mp_${currentState.currentCongregation}` ||
              /^S-34mp_[A-Z]+_0$/.test(parentFolder)
            ) {
              const fileParentDirectoryUrl = pathToFileURL(item.parentPath);
              files.push({
                orphaned: !mediaFileParentDirectories.has(
                  fileParentDirectoryUrl,
                ),
                parentPath: item.parentPath,
                path: filePath,
                size: item.size || 0,
              });
            }
          }
        }
      } catch (error) {
        errorCatcher(error);
      }
    }
    return files;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

export const analyzeCacheFiles = async (): Promise<CacheAnalysis> => {
  try {
    const currentState = useCurrentStateStore();

    // Fetch untouchable directories
    const untouchableDirectories = await fetchUntouchableDirectories();

    // Load frequently used directories
    const frequentlyUsedDirectories = await loadFrequentlyUsedDirectories();

    // Get cache directories
    const dirs = [
      ...new Set([
        await getPublicationsPath(),
        await getPublicationsPath(currentState.currentSettings?.cacheFolder),
        await getTempPath(),
        join(await getAdditionalMediaPath(), currentState.currentCongregation),
        join(
          await getAdditionalMediaPath(
            currentState.currentSettings?.cacheFolder,
          ),
          currentState.currentCongregation,
        ),
      ]),
    ];

    const cacheDirs = (
      await Promise.all(
        dirs.map(async (dir) => ((await pathExists(dir)) ? dir : null)),
      )
    ).filter((s) => typeof s === 'string');

    // Get all cache files
    const cacheFiles = await getCacheFiles(cacheDirs);

    // Calculate used cache files
    const usedCacheFiles = cacheFiles.filter((f) => !f.orphaned);

    // Calculate used parent directories
    const usedParentDirectories = usedCacheFiles.reduce<Record<string, number>>(
      (acc, file) => {
        acc[file.parentPath] = file.size + (acc[file.parentPath] ?? 0);
        return acc;
      },
      {},
    );

    // Calculate unused parent directories
    const unusedParentDirectories = cacheFiles.reduce<Record<string, number>>(
      (acc, file) => {
        const isInUsed = Object.keys(usedParentDirectories).some((dir) =>
          file.parentPath.startsWith(dir),
        );

        const isInFrequentlyUsed = [...frequentlyUsedDirectories].some((dir) =>
          file.parentPath.startsWith(dir),
        );

        const isInUntouchable = [...untouchableDirectories].some(
          (dir) => normalize(file.parentPath) === normalize(dir),
        );

        if (!isInUsed && !isInFrequentlyUsed && !isInUntouchable) {
          acc[file.parentPath] = file.size + (acc[file.parentPath] ?? 0);
        }
        return acc;
      },
      {},
    );

    // Calculate sizes
    const allCacheFilesSize = cacheFiles.reduce(
      (size, cacheFile) => size + cacheFile.size,
      0,
    );
    const unusedCacheFoldersSize = Object.values(
      unusedParentDirectories,
    ).reduce((a, b) => a + b, 0);

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

export const deleteCacheFiles = async (
  type: 'all' | 'smart' = 'smart',
): Promise<void> => {
  const { updateLookupPeriod } = await import('src/helpers/date');
  try {
    const analysis = await analyzeCacheFiles();

    const filepathsToDelete =
      type === 'smart'
        ? Object.keys(analysis.unusedParentDirectories)
        : analysis.cacheFiles.map((f) => f.path);

    // Delete cache files/directories
    try {
      await Promise.allSettled(filepathsToDelete.map((f) => remove(f)));
    } catch (e) {
      errorCatcher(e);
    }

    // Remove empty directories
    try {
      await Promise.allSettled(
        [...analysis.untouchableDirectories].map((d) => removeEmptyDirs(d)),
      );
    } catch (e) {
      errorCatcher(e);
    }

    // Update lookup period if deleting all cache
    if (type === 'all') {
      updateLookupPeriod(true);
    }
  } catch (error) {
    errorCatcher(error);
    throw error;
  }
};

export const cleanCache = async () => {
  const congregationStore = useCongregationSettingsStore();
  const congIds = new Set(Object.keys(congregationStore.congregations));

  const settings = useCurrentStateStore().currentSettings;

  const additionalMediaPath = await getAdditionalMediaPath(
    settings?.cacheFolder,
  );

  cleanPublicTalkPubs(additionalMediaPath, congIds);
  cleanCongregationFolders(additionalMediaPath, congIds);
  cleanCongregationFolders(await congPreferencesPath(), congIds);

  congIds.forEach((congId) => {
    cleanDateFolders(join(additionalMediaPath, congId));
  });

  if (settings?.enableMediaAutoExport && settings?.mediaAutoExportFolder) {
    cleanDateFolders(settings.mediaAutoExportFolder);
  }
};
