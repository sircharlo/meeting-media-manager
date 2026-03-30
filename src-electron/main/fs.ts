import type { FileDialogFilter, UnzipOptions, UnzipResult } from 'src/types';

import { watch as filesystemWatch, type FSWatcher } from 'chokidar';
import { app, dialog } from 'electron';
import { ensureDir, type Stats } from 'fs-extra';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { setTimeout as delay } from 'node:timers/promises';
import {
  addElectronBreadcrumb,
  captureElectronError,
  getSharedDataPath,
} from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import {
  IMG_EXTENSIONS,
  JWPUB_EXTENSIONS,
  PDF_EXTENSIONS,
} from 'src/constants/media';
import { log, uuid } from 'src/shared/vanilla';
import upath from 'upath';
import yauzl from 'yauzl';

const { basename, dirname, join, resolve, toUnix } = upath;

const ongoingDecompressions = new Map<string, Promise<UnzipResult[]>>();

const MAX_FILES = 10000;
const MAX_SIZE = 2000000000; // 2 GB
const THRESHOLD_RATIO = 100;
const PATH_PROBE_SETTLE_DELAY_MS = 50;
const PATH_PROBE_RETRY_DELAY_MS = 50;
const PATH_PROBE_RETRY_COUNT = 4;
const SHARED_PATH_BACKOFF_MS = 10 * 60 * 1000;
const SHARED_PATH_HEALTH_FILENAME = 'shared-path-health.json';
const SHARED_PATH_HEALTH_FOLDERS = [
  'Additional Media',
  'Fonts',
  'Publications',
];

let defaultAppDataPath: null | string = null;
let sharedPathBackoffUntil: null | number = null;
let sharedPathBackoffLoaded = false;

type PathMode = 'shared' | 'user';

type PathProbeResult = 'backoff' | 'failed' | 'not-machine-wide' | 'passed';

interface UnzipContext {
  input: string;
  opts?: UnzipOptions;
  output: string;
}
interface ZipfileState {
  checkIfComplete: () => Promise<void>;
  extractedFiles: UnzipResult[];
  fileCount: number;
  pendingOperations: Promise<void>[];
  reject: (reason?: unknown) => void;
  totalUncompressedSize: number;
  zipfile: yauzl.ZipFile;
}

const getSharedPathHealthFile = () =>
  join(app.getPath('userData'), SHARED_PATH_HEALTH_FILENAME);

const setPathTelemetry = async (
  pathMode: PathMode,
  pathProbeResult: PathProbeResult,
) => {
  const { setTag } = await import('@sentry/electron/main');
  setTag('path_mode', pathMode);
  setTag('path_probe_result', pathProbeResult);
  addElectronBreadcrumb({
    category: 'filesystem',
    data: { pathMode, pathProbeResult },
    level: 'info',
    message: '[getAppDataPath] storage selection',
  });
};

const loadSharedPathBackoff = async () => {
  if (sharedPathBackoffLoaded) return;
  sharedPathBackoffLoaded = true;
  try {
    const healthPath = getSharedPathHealthFile();
    const content = await readFile(healthPath, 'utf8')
      .then((raw) => JSON.parse(raw) as { unhealthyUntil?: number })
      .catch(() => null);
    sharedPathBackoffUntil = content?.unhealthyUntil ?? null;
  } catch {
    sharedPathBackoffUntil = null;
  }
};

const persistSharedPathBackoff = async (unhealthyUntil: null | number) => {
  sharedPathBackoffUntil = unhealthyUntil;
  try {
    const healthPath = getSharedPathHealthFile();
    if (!unhealthyUntil) {
      await rm(healthPath, { force: true });
      return;
    }
    await writeFile(
      healthPath,
      JSON.stringify({ unhealthyUntil }, null, 2),
      'utf8',
    );
  } catch (error) {
    captureElectronError(error, {
      contexts: {
        fn: {
          name: 'persistSharedPathBackoff',
          unhealthyUntil,
        },
      },
    });
  }
};

const isSharedPathBackoffActive = async () => {
  await loadSharedPathBackoff();
  return !!sharedPathBackoffUntil && Date.now() < sharedPathBackoffUntil;
};

const markSharedPathUnhealthy = async () => {
  await persistSharedPathBackoff(Date.now() + SHARED_PATH_BACKOFF_MS);
};

const probeSharedSubfolders = async (sharedPath: string) => {
  for (const folder of SHARED_PATH_HEALTH_FOLDERS) {
    const dirPath = join(sharedPath, folder);
    const testFile = join(dirPath, `.health-check-${uuid()}.tmp`);
    await mkdir(dirPath, { recursive: true });
    await writeFile(testFile, 'ok', 'utf8');
    await rm(testFile, { force: true });
  }
};

/**
 * Gets the app data path (shared or user data)
 * @returns The app data path
 */
export async function getAppDataPath(): Promise<string> {
  if (defaultAppDataPath) {
    if (await isUsablePath(defaultAppDataPath)) {
      await setPathTelemetry(
        defaultAppDataPath === app.getPath('userData') ? 'user' : 'shared',
        'passed',
      );
      return defaultAppDataPath;
    }
    log(
      '📁 Cached app data path became unusable. Falling back.',
      'electronFilesystem',
      'warn',
      defaultAppDataPath,
    );
    defaultAppDataPath = null;
  }

  const userDataPath = app.getPath('userData');
  const userDataUsable = await isUsablePath(userDataPath);
  if (userDataUsable) {
    if (await isSharedPathBackoffActive()) {
      defaultAppDataPath = userDataPath;
      await setPathTelemetry('user', 'backoff');
      return defaultAppDataPath;
    }

    const usableSharedPath = await getSharedDataPath();

    if (usableSharedPath) {
      try {
        await probeSharedSubfolders(usableSharedPath);
        await persistSharedPathBackoff(null);
        log(
          '📁 Using shared data path:',
          'electronFilesystem',
          'log',
          usableSharedPath,
        );
        defaultAppDataPath = usableSharedPath;
        await setPathTelemetry('shared', 'passed');
        return defaultAppDataPath;
      } catch (error) {
        captureElectronError(error, {
          contexts: {
            fn: {
              name: 'getAppDataPath.probeSharedSubfolders',
              sharedPath: usableSharedPath,
            },
          },
          tags: {
            path_mode: 'shared',
            path_probe_result: 'failed',
          },
        });
        await markSharedPathUnhealthy();
        await setPathTelemetry('user', 'failed');
      }
    } else {
      await setPathTelemetry('user', 'not-machine-wide');
    }

    defaultAppDataPath = userDataPath;
    log(
      '📁 Shared data path not available, fallback to user data path:',
      'electronFilesystem',
      'log',
      defaultAppDataPath,
    );
    return defaultAppDataPath;
  }

  log(
    '📁 User data path is not usable. Returning user data path as last resort:',
    'electronFilesystem',
    'warn',
    userDataPath,
  );
  await setPathTelemetry('user', 'failed');
  defaultAppDataPath = userDataPath;
  return defaultAppDataPath;
}

const isUsablePathPromises = new Map<string, Promise<boolean>>();

const WINDOWS_RETRYABLE_PROBE_CODES = new Set(['EBUSY', 'EPERM']);

const getErrorCode = (error: unknown) => (error as { code?: string })?.code;

const isRetryableProbeCleanupError = (error: unknown) =>
  process.platform === 'win32' &&
  WINDOWS_RETRYABLE_PROBE_CODES.has(getErrorCode(error) ?? '');

const logProbeCleanupWarning = (
  error: unknown,
  basePath: string,
  targetPath: string,
  stage: 'directory' | 'file',
) => {
  addElectronBreadcrumb({
    category: 'filesystem',
    data: {
      basePath,
      code: getErrorCode(error),
      stage,
      targetPath,
    },
    level: 'warning',
    message: `[isUsablePath] Probe cleanup skipped after transient lock`,
  });
};

const cleanupProbePath = async (
  targetPath: string,
  options: { force: boolean; recursive?: boolean },
  basePath: string,
  stage: 'directory' | 'file',
) => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= PATH_PROBE_RETRY_COUNT; attempt += 1) {
    try {
      await rm(targetPath, options);
      return;
    } catch (error) {
      lastError = error;
      if (
        !isRetryableProbeCleanupError(error) ||
        attempt === PATH_PROBE_RETRY_COUNT
      ) {
        break;
      }
      await delay(PATH_PROBE_RETRY_DELAY_MS);
    }
  }

  if (isRetryableProbeCleanupError(lastError)) {
    logProbeCleanupWarning(lastError, basePath, targetPath, stage);
    return;
  }

  captureElectronError(lastError, {
    contexts: {
      fn: {
        args: { basePath, stage, targetPath },
        name: 'isUsablePath.cleanupProbePath',
      },
    },
  });
};

const cleanupProbe = async (
  basePath: string,
  testDir: string,
  testFile: string,
) => {
  await cleanupProbePath(testFile, { force: true }, basePath, 'file');
  await cleanupProbePath(
    testDir,
    { force: true, recursive: true },
    basePath,
    'directory',
  );
};

export function isUsablePath(basePath?: string): Promise<boolean> {
  if (!basePath) return Promise.resolve(false);

  if (!isUsablePathPromises.has(basePath)) {
    const promise = (async () => {
      try {
        const resolvedBase = resolve(basePath);
        const testDir = join(resolvedBase, '.cache-test-' + uuid());

        await mkdir(testDir, { recursive: true });

        const testFile = join(testDir, 'test.txt');
        await writeFile(testFile, 'ok');
        await delay(PATH_PROBE_SETTLE_DELAY_MS);

        await cleanupProbe(basePath, testDir, testFile);

        return true;
      } catch (e) {
        const PERMISSION_ERRORS = new Set(['EACCES', 'EPERM']);
        const code = (e as { code?: string }).code;
        if (!PERMISSION_ERRORS.has(code ?? '')) {
          captureElectronError(e, {
            contexts: {
              fn: {
                args: { basePath },
                name: 'isUsablePath',
              },
            },
          });
        }
        return false;
      }
    })().finally(() => {
      // Remove from cache after it resolves
      // so failures OR success can be retried later
      isUsablePathPromises.delete(basePath);
    });

    isUsablePathPromises.set(basePath, promise);
  }

  return isUsablePathPromises.get(basePath) || Promise.resolve(false);
}

export async function openFileDialog(
  single: boolean,
  filter: FileDialogFilter,
) {
  if (!mainWindowInfo.mainWindow) return;

  const filters: Electron.FileFilter[] = [];

  if (!filter) {
    filters.push({ extensions: ['*'], name: 'All files' });
  }

  if (filter?.includes('jwpub+image+pdf')) {
    filters.push({
      extensions:
        JWPUB_EXTENSIONS.concat(IMG_EXTENSIONS).concat(PDF_EXTENSIONS),
      name: 'JWPUB + Images + PDF',
    });
  }

  if (filter?.includes('jwpub+image')) {
    filters.push({
      extensions: JWPUB_EXTENSIONS.concat(IMG_EXTENSIONS),
      name: 'JWPUB + Images',
    });
  }

  if (filter?.includes('jwpub')) {
    filters.push({ extensions: JWPUB_EXTENSIONS, name: 'JWPUB' });
  }
  if (filter?.includes('image')) {
    filters.push({ extensions: IMG_EXTENSIONS, name: 'Images' });
  }

  return dialog.showOpenDialog(mainWindowInfo.mainWindow, {
    filters,
    properties: single ? ['openFile'] : ['openFile', 'multiSelections'],
  });
}

export async function openFolderDialog() {
  if (!mainWindowInfo.mainWindow) return;
  return dialog.showOpenDialog(mainWindowInfo.mainWindow, {
    properties: ['openDirectory'],
  });
}

/**
 * Creates a directory with retry logic
 */
const createDirectory = async (
  fullPath: string,
  context: UnzipContext,
  state: ZipfileState,
): Promise<void> => {
  const attemptCreateDir = async (attempt = 1): Promise<void> => {
    try {
      await ensureDir(fullPath);
      state.zipfile.readEntry();
    } catch (e) {
      if (attempt < 3) {
        log(
          `[unzipFile] Failed to create directory, retrying (${attempt}/3): ${fullPath}`,
          'electronFilesystem',
          'warn',
        );
        await new Promise((r) => {
          setTimeout(r, 100 * attempt);
        });
        return attemptCreateDir(attempt + 1);
      }
      captureElectronError(e, {
        contexts: {
          fn: {
            args: {
              attempt,
              fullPath,
              input: context.input,
              output: context.output,
            },
            name: 'unzipFile ensureDir (dir entry)',
          },
        },
      });
      state.zipfile.close();
      state.reject(e);
    }
  };

  await attemptCreateDir();
};

/**
 * Processes a file entry with retry logic
 */
const processFileEntry = async (
  entry: yauzl.Entry,
  readStream: NodeJS.ReadableStream,
  fullPath: string,
  context: UnzipContext,
  state: ZipfileState,
): Promise<void> => {
  const attemptProcessFile = async (attempt = 1): Promise<void> => {
    try {
      await ensureDir(dirname(fullPath));
      const writeStream = createWriteStream(fullPath);

      writeStream.on('error', (e) => {
        captureElectronError(e, {
          contexts: {
            fn: {
              args: {
                attempt,
                fullPath,
                input: context.input,
                output: context.output,
              },
              name: 'unzipFile writeStream error',
            },
          },
        });
      });

      await pipeline(readStream, writeStream);
      state.extractedFiles.push({ path: entry.fileName });
      state.zipfile.readEntry();
    } catch (e) {
      if (
        attempt < 3 &&
        e instanceof Error &&
        (e as { code?: string }).code === 'ENOENT'
      ) {
        log(
          `[unzipFile] ENOENT during pipeline, retrying (${attempt}/3): ${fullPath}`,
          'electronFilesystem',
          'warn',
        );
        await new Promise((r) => {
          setTimeout(r, 100 * attempt);
        });
        return attemptProcessFile(attempt + 1);
      }

      captureElectronError(e, {
        contexts: {
          fn: {
            args: {
              attempt,
              fullPath,
              input: context.input,
              output: context.output,
            },
            name: 'unzipFile pipeline',
          },
        },
      });
      state.zipfile.close();
      state.reject(new Error(String(e)));
    }
  };

  await attemptProcessFile();
};

/**
 * Handles a zip entry
 */
const handleZipEntry = async (
  entry: yauzl.Entry,
  context: UnzipContext,
  state: ZipfileState,
): Promise<void> => {
  const fullPath = join(context.output, entry.fileName);

  // Apply filter if provided
  if (
    context.opts?.includes?.length &&
    !context.opts.includes.includes(entry.fileName)
  ) {
    state.zipfile.readEntry();
    return;
  }

  // Failsafe checks
  state.fileCount++;
  if (state.fileCount > MAX_FILES) {
    state.zipfile.close();
    return state.reject(new Error('Reached max. number of files (failsafe)'));
  }

  state.totalUncompressedSize += entry.uncompressedSize;
  if (state.totalUncompressedSize > MAX_SIZE) {
    state.zipfile.close();
    return state.reject(new Error('Reached max. size (failsafe)'));
  }

  if (entry.compressedSize > 0) {
    const compressionRatio = entry.uncompressedSize / entry.compressedSize;
    if (compressionRatio > THRESHOLD_RATIO) {
      state.zipfile.close();
      return state.reject(
        new Error('Reached max. compression ratio (failsafe)'),
      );
    }
  }

  if (entry.fileName.endsWith('/')) {
    // Directory
    await createDirectory(fullPath, context, state);
  } else {
    // File
    state.zipfile.openReadStream(entry, async (err, readStream) => {
      if (err) {
        captureElectronError(err, {
          contexts: {
            fn: {
              args: {
                entry: entry.fileName,
                input: context.input,
                output: context.output,
              },
              name: 'unzipFile openReadStream',
            },
          },
        });
        state.zipfile.close();
        return state.reject(new Error(String(err)));
      }
      if (!readStream) {
        state.zipfile.close();
        return state.reject(new Error('Read stream not found'));
      }

      const operationPromise = processFileEntry(
        entry,
        readStream,
        fullPath,
        context,
        state,
      );

      state.pendingOperations.push(operationPromise);

      operationPromise.finally(() => {
        const index = state.pendingOperations.indexOf(operationPromise);
        if (index > -1) {
          state.pendingOperations.splice(index, 1);
        }
        state.checkIfComplete();
      });
    });
  }
};

/**
 * Decompresses a zip file
 */
const decompress = async (
  input: string,
  output: string,
  opts?: UnzipOptions,
): Promise<UnzipResult[]> => {
  const stats = await stat(input).catch(() => undefined);
  const fileSize = stats?.size ?? 0;

  addElectronBreadcrumb({
    category: 'unzip',
    data: { fileSize, input, output },
    message: 'Starting unzip',
  });

  const context: UnzipContext = { input, opts, output };

  return new Promise<UnzipResult[]>((resolve, reject) => {
    const extractedFiles: UnzipResult[] = [];
    const pendingOperations: Promise<void>[] = [];
    let zipfileEnded = false;

    const checkIfComplete = async () => {
      if (zipfileEnded && pendingOperations.length === 0) {
        addElectronBreadcrumb({
          category: 'unzip',
          data: { extractedFilesCount: extractedFiles.length },
          message: 'Unzip complete',
        });

        setTimeout(() => {
          resolve(extractedFiles);
        }, 50);
      }
    };

    yauzl.open(input, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        addElectronBreadcrumb({
          category: 'unzip',
          data: { fileSize, input, output },
          message: 'Error opening zipfile',
        });
        return reject(new Error(String(err)));
      }
      if (!zipfile) return reject(new Error('Zipfile not found'));

      const state: ZipfileState = {
        checkIfComplete,
        extractedFiles,
        fileCount: 0,
        pendingOperations,
        reject,
        totalUncompressedSize: 0,
        zipfile,
      };

      zipfile.readEntry();

      zipfile.on('entry', async (entry: yauzl.Entry) => {
        await handleZipEntry(entry, context, state);
      });

      zipfile.on('end', () => {
        zipfileEnded = true;
        checkIfComplete();
      });

      zipfile.on('error', (err) => {
        captureElectronError(err, {
          contexts: {
            fn: { args: { input, output }, name: 'unzipFile zipfile error' },
          },
        });
        reject(new Error(String(err)));
      });
    });
  });
};

/**
 * Lists entries in a zip file with their uncompressed sizes
 */
export async function getZipEntries(
  zipPath: string,
): Promise<Record<string, number>> {
  return new Promise((resolve, reject) => {
    const entries: Record<string, number> = {};

    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        captureElectronError(err, {
          contexts: {
            fn: {
              args: { zipPath },
              name: 'getZipEntries yauzl.open',
            },
          },
        });
        return reject(err);
      }
      if (!zipfile) return reject(new Error('Zipfile not found'));

      let fileCount = 0;
      let totalUncompressedSize = 0;

      zipfile.readEntry();
      zipfile.on('entry', (entry: yauzl.Entry) => {
        fileCount++;
        if (fileCount > MAX_FILES) {
          zipfile.close();
          return reject(new Error('Reached max. number of files (failsafe)'));
        }

        totalUncompressedSize += entry.uncompressedSize;
        if (totalUncompressedSize > MAX_SIZE) {
          zipfile.close();
          return reject(new Error('Reached max. size (failsafe)'));
        }

        if (entry.compressedSize > 0) {
          const compressionRatio =
            entry.uncompressedSize / entry.compressedSize;
          if (compressionRatio > THRESHOLD_RATIO) {
            zipfile.close();
            return reject(
              new Error('Reached max. compression ratio (failsafe)'),
            );
          }
        }

        entries[entry.fileName] = entry.uncompressedSize;
        zipfile.readEntry();
      });

      zipfile.on('end', () => {
        resolve(entries);
      });

      zipfile.on('error', (err) => {
        captureElectronError(err, {
          contexts: {
            fn: {
              args: { zipPath },
              name: 'getZipEntries zipfile error',
            },
          },
        });
        reject(err);
      });
    });
  });
}

/**
 * Decompresses a file using yauzl for memory efficiency
 * Properly waits for all write streams to finish and flush to disk
 * before resolving the promise.
 */
export async function unzipFile(
  input: string,
  output: string,
  opts?: UnzipOptions,
): Promise<UnzipResult[]> {
  const cacheKey = `${input}->${output}`;
  const existing = ongoingDecompressions.get(cacheKey);
  if (existing) return existing;

  const decompressionPromise = decompress(input, output, opts).finally(() => {
    ongoingDecompressions.delete(cacheKey);
  });

  ongoingDecompressions.set(cacheKey, decompressionPromise);
  return decompressionPromise;
}

const watchers = new Set<FSWatcher>();
const datePattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const WATCH_POLL_INTERVAL_MS = 1000;

const isNetworkFolderPath = (folderPath: string) => {
  const normalizedPath = toUnix(folderPath).replaceAll('\\', '/');
  return normalizedPath.startsWith('//');
};

const shouldIgnoreWatchFolderError = (
  folderPath: string,
  error: Error & { code?: string; syscall?: string },
) => {
  // Ignore harmless stat errors
  if (
    error.syscall === 'stat' &&
    ['EINVAL', 'UNKNOWN'].includes(error.code ?? '')
  ) {
    return true;
  }

  // Ignore known flaky watch errors on network folders (WebDAV/UNC shares).
  if (isNetworkFolderPath(folderPath)) {
    if (error.code === 'UNKNOWN' && error.syscall === 'watch') return true;
    if (error.code === 'EISDIR' && error.syscall === 'watch') return true;
  }

  return false;
};

export async function unwatchFolders() {
  for (const watcher of watchers) {
    try {
      if (!watcher?.closed) await watcher?.close();
      watchers.delete(watcher);
    } catch (error) {
      captureElectronError(error, {
        contexts: { fn: { name: 'unwatchFolders' } },
      });
    }
  }
}

export async function watchFolder(folderPath: string) {
  const networkFolderPath = isNetworkFolderPath(folderPath);

  watchers.add(
    filesystemWatch(folderPath, {
      atomic: false,
      awaitWriteFinish: true,
      ignored: (fp: string, stats?: Stats) => {
        try {
          if (toUnix(folderPath) === fp) return false; // Don't ignore the root folder itself
          if (!stats) return false; // Don't ignore anything if no stats are available
          const dirPath = toUnix(stats.isDirectory() ? fp : dirname(fp)); // If this isn't a directory, get the parent directory
          const dirOfNote = basename(dirPath); // Get the name of the directory
          return !datePattern.test(dirOfNote); // Ignore files in a directory whose name doesn't match YYYY-MM-DD
        } catch (error) {
          captureElectronError(error, {
            contexts: {
              fn: { folderPath, fp, name: 'watchFolder.ignored', stats },
            },
          });
          return true;
        }
      },
      ignorePermissionErrors: true,
      interval: networkFolderPath ? WATCH_POLL_INTERVAL_MS : undefined,
      usePolling: networkFolderPath,
    })
      .on('error', (error: unknown) => {
        const context = {
          contexts: { fn: { folderPath, name: 'watchFolder.error' } },
        };

        try {
          const e = error as Error & { code?: string; syscall?: string };
          if (shouldIgnoreWatchFolderError(folderPath, e)) return;
          captureElectronError(error, context);
        } catch (err) {
          // Log the failure of the original try
          captureElectronError(err, {
            contexts: { fn: { folderPath, name: 'watchFolder.error catch' } },
          });
          // Still log the original error as well
          captureElectronError(error, context);
        }
      })
      .on('all', (event, changedPath, stats) => {
        try {
          if (!changedPath || (!stats && !event.includes('unlink'))) return; // Don't do anything if no stats are available or if no path is available
          const dirPath = toUnix(
            stats?.isDirectory() || event === 'unlinkDir'
              ? changedPath
              : dirname(changedPath),
          ); // If this isn't a directory, get the parent directory
          const dirOfNote = basename(dirPath); // Get the name of the directory
          sendToWindow(mainWindowInfo.mainWindow, 'watchFolderUpdate', {
            changedPath,
            day: dirOfNote,
            event,
          });
        } catch (error) {
          captureElectronError(error, {
            contexts: {
              fn: { changedPath, event, name: 'watchFolder.all', stats },
            },
          });
          return true;
        }
      }),
  );
}
