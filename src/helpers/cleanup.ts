import type {
  CacheAnalysis,
  CacheFile,
  JwLangCode,
  MediaItem,
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
import { getPubId } from 'src/utils/jw';
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
      .map((f) => remove(join(root, f.name))),
  );
};

const loadFrequentlyUsedDirectories = async (): Promise<Set<string>> => {
  try {
    const currentState = useCurrentStateStore();
    const congregationStore = useCongregationSettingsStore();

    // Get all languages used by any congregation
    const allLanguages = new Set<JwLangCode>();
    Object.values(congregationStore.congregations).forEach((congSettings) => {
      if (congSettings?.lang) {
        allLanguages.add(congSettings.lang);
      }
      if (congSettings?.langFallback) {
        allLanguages.add(congSettings.langFallback);
      }
    });

    // If no congregations exist, fall back to current language or English
    if (allLanguages.size === 0) {
      allLanguages.add(currentState.currentSettings?.lang ?? 'E');
    }

    const getDirectory = async (
      pub: string,
      issue?: 'any' | number | string,
      includeEnglish?: boolean,
    ) => {
      const directories: string[] = [];

      // Always start with all congregation languages; optionally add English
      const languagesToUse = new Set<JwLangCode>(allLanguages);
      if (includeEnglish) languagesToUse.add('E' as JwLangCode);

      for (const langwritten of languagesToUse) {
        // Special handling for "any" issue: protect all issue-tagged folders for this pub symbol
        if (issue === 'any') {
          const baseId = getPubId({ langwritten, pub } as PublicationFetcher);
          const pubsRootDefault = await getPublicationsPath();
          const pubsRootCache = await getPublicationsPath(
            currentState.currentSettings?.cacheFolder,
          );
          directories.push(
            join(pubsRootDefault, baseId),
            join(pubsRootCache, baseId),
          );
        } else {
          const directoryParams: PublicationFetcher = {
            issue,
            langwritten,
            pub,
          };

          if (currentState.currentSettings) {
            directories.push(
              await getPublicationDirectory(directoryParams),
              await getPublicationDirectory(
                directoryParams,
                currentState.currentSettings?.cacheFolder,
              ),
            );
          }
        }
      }

      return directories;
    };

    const directories = [
      // Meeting music and videos
      await getDirectory(currentState.currentSongbook.pub, undefined, true), // Background music
      await getDirectory(currentState.currentSongbook.pub, 0, true), // Songbook videos
      // Bibles
      await getDirectory('nwt'),
      await getDirectory('nwtsty', undefined, true),
      // Frequently used during MW meetings
      await getDirectory('it', 0), // Insight
      await getDirectory('lmd', 0), // Love People
      await getDirectory('lmdv', 0), // Love People Videos
      // Public Talk Media Playlist
      await getDirectory('S-34mp', 'any'),
      // Magazines, low disk usage
      await getDirectory('wp', 'any'), // Public Watchtower
      await getDirectory('w', 'any'), // Study Watchtower
      await getDirectory('g', 'any'), // Awake
      // Various publication info, shouldn't be refreshed often
      await getDirectory('jwlb', undefined),
    ].flat();

    // Add S-34mp directories
    try {
      const pubsRootDefault = await getPublicationsPath();
      const pubsRootCache = await getPublicationsPath(
        currentState.currentSettings?.cacheFolder,
      );
      const roots = [pubsRootDefault, pubsRootCache];
      for (const root of roots) {
        try {
          const items = await readdir(root);
          items
            .filter((i) => i.isDirectory && i.name.startsWith('S-34mp_'))
            .forEach((i) => directories.push(join(root, i.name)));
        } catch (error) {
          errorCatcher(error);
        }
      }
    } catch (error) {
      errorCatcher(error);
    }

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
    const jwStore = useJwStore();

    // Get all media items from all congregations and all dates in the lookup period
    const lookupPeriodsCollections = Object.values(
      jwStore.lookupPeriod,
    ).flatMap((congregationLookupPeriods) =>
      congregationLookupPeriods?.flatMap((lookupPeriods) => {
        if (!lookupPeriods?.mediaSections) return [];
        const allMedia: MediaItem[] = [];
        Object.values(lookupPeriods.mediaSections).forEach((sectionMedia) => {
          allMedia.push(...(sectionMedia.items || []));
        });
        return allMedia;
      }),
    );

    // Create a set of all file URLs that are explicitly referenced in the lookup period
    const referencedFileUrls = new Set<string>();

    lookupPeriodsCollections.forEach((media) => {
      // Add all explicitly referenced file URLs (hidden or not)
      if (media?.fileUrl) {
        referencedFileUrls.add(media.fileUrl);
      }
      if (media?.streamUrl) {
        referencedFileUrls.add(media.streamUrl);
      }
      if (media?.thumbnailUrl) {
        referencedFileUrls.add(media.thumbnailUrl);
      }
      if (media?.subtitlesUrl) {
        referencedFileUrls.add(media.subtitlesUrl);
      }

      // Add child media file URLs
      if (Array.isArray(media?.children)) {
        for (const child of media.children) {
          if (child?.fileUrl) {
            referencedFileUrls.add(child.fileUrl);
          }
          if (child?.streamUrl) {
            referencedFileUrls.add(child.streamUrl);
          }
          if (child?.thumbnailUrl) {
            referencedFileUrls.add(child.thumbnailUrl);
          }
          if (child?.subtitlesUrl) {
            referencedFileUrls.add(child.subtitlesUrl);
          }
        }
      }
    });

    // Get parent directories of all referenced files
    const referencedParentDirectories = new Set<string>();
    referencedFileUrls.forEach((fileUrl) => {
      const parentDir = pathToFileURL(getParentDirectory(fileUrl));
      referencedParentDirectories.add(parentDir);
    });

    const files: CacheFile[] = [];
    for (const cacheDir of cacheDirs) {
      try {
        const items = await readdir(cacheDir, true, true);
        for (const item of items) {
          const filePath = join(item.parentPath, item.name);
          if (item.isFile) {
            const parentFolder = item.parentPath.split('/').pop() || '';
            // Exclude files inside any S-34mp_* folder from deletion consideration
            const isProtectedS34mp = parentFolder.startsWith('S-34mp_');
            if (!isProtectedS34mp) {
              const fileParentDirectoryUrl = pathToFileURL(item.parentPath);
              const isReferenced = referencedParentDirectories.has(
                fileParentDirectoryUrl,
              );

              files.push({
                orphaned: !isReferenced,
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
        const isInUsed = Object.keys(usedParentDirectories).some((dir) => {
          // Use normalized paths for comparison to handle different path separators
          const normalizedFileParent = normalize(file.parentPath);
          const normalizedUsedDir = normalize(dir);
          return normalizedFileParent.startsWith(normalizedUsedDir);
        });

        const isInFrequentlyUsed = [...frequentlyUsedDirectories].some(
          (dir) => {
            const normalizedFileParent = normalize(file.parentPath);
            const normalizedFreqDir = normalize(dir);
            return normalizedFileParent.startsWith(normalizedFreqDir);
          },
        );

        const isInUntouchable = [...untouchableDirectories].some(
          (dir) => normalize(file.parentPath) === normalize(dir),
        );

        if (!isInUsed && !isInFrequentlyUsed && !isInUntouchable) {
          // Add debugging for files that are being marked as unused
          console.log('🗑️ File marked as unused:', {
            filePath: file.path,
            frequentlyUsedDirs: [...frequentlyUsedDirectories],
            isInFrequentlyUsed,
            isInUntouchable,
            isInUsed,
            parentPath: file.parentPath,
            size: file.size,
            untouchableDirs: [...untouchableDirectories],
            usedParentDirs: Object.keys(usedParentDirectories),
          });
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
): Promise<{
  bytesFreed: number;
  itemsDeleted: number;
  mode: 'all' | 'smart';
}> => {
  const { updateLookupPeriod } = await import('src/helpers/date');
  try {
    const analysis = await analyzeCacheFiles();

    console.log('[Cache] Analyzed cache:', analysis);

    const filepathsToDelete =
      type === 'smart'
        ? Object.keys(analysis.unusedParentDirectories)
        : analysis.cacheFiles.map((f) => f.path);

    console.log('[Cache] Filepaths to delete:', filepathsToDelete);

    // Delete cache files/directories
    try {
      const results = await Promise.allSettled(
        filepathsToDelete.map((f) => remove(f)),
      );

      // Calculate deleted count and bytes freed
      const itemsDeleted = results.filter(
        (r) => r.status === 'fulfilled',
      ).length;

      let bytesFreed = 0;
      if (type === 'smart') {
        // Sum sizes for successfully deleted directories based on the analysis map
        for (let i = 0; i < results.length; i++) {
          if (results[i]?.status === 'fulfilled') {
            const p = filepathsToDelete[i] as string;
            if (typeof p === 'string') {
              const sizeForDir = analysis.unusedParentDirectories[p] || 0;
              bytesFreed += sizeForDir;
            }
          }
        }
      } else {
        // Build a quick lookup for file sizes
        const sizeByPath = new Map<string, number>();
        for (const f of analysis.cacheFiles) {
          sizeByPath.set(f.path, f.size || 0);
        }
        for (let i = 0; i < results.length; i++) {
          if (results[i]?.status === 'fulfilled') {
            const p = filepathsToDelete[i] as string;
            if (typeof p === 'string') {
              bytesFreed += sizeByPath.get(p) || 0;
            }
          }
        }
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
        console.log('[Cache] Updating lookup period (all cache cleared)');
        updateLookupPeriod(true);
      }
      console.log('[Cache] Cleared successfully', {
        bytesFreed,
        itemsDeleted,
        mode: type,
      });

      return { bytesFreed, itemsDeleted, mode: type };
    } catch (e) {
      errorCatcher(e);
      throw e;
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
