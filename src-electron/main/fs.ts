import type {
  ExtractNestedZipEntryOptions,
  FileDialogFilter,
  UnzipOptions,
  UnzipResult,
} from 'src/types';

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
import {
  getFilesystemErrorCode,
  isExpectedNetworkPathAccessError,
  isPossiblyNetworkFolderPath,
  shouldIgnoreWatchFolderError,
} from 'src/shared/filesystem-errors';
import { NETWORK_ERROR_CODES } from 'src/shared/network-errors';
import { log, uuid } from 'src/shared/vanilla';
import { basename, dirname, join, resolve, toUnix } from 'upath';
import {
  type Entry,
  fromBufferPromise,
  openPromise,
  type ZipFile,
} from 'yauzl';

const ongoingDecompressions = new Map<string, Promise<UnzipResult[]>>();

const MAX_FILES = 10000;
const MAX_SIZE = 2000000000; // 2 GB
const THRESHOLD_RATIO = 100;
const MAX_IN_MEMORY_ZIP_ENTRY_SIZE = 150000000; // 150 MB
const MAX_IN_MEMORY_ZIP_TOTAL_SIZE = 250000000; // 250 MB
const PATH_PROBE_SETTLE_DELAY_MS = 50;
const PATH_PROBE_RETRY_DELAY_MS = 50;
const PATH_PROBE_RETRY_COUNT = 4;
const ZIP_ENTRY_DIAGNOSTIC_LIMIT = 50;
const SHARED_PATH_BACKOFF_MS = 10 * 60 * 1000;
const SHARED_PATH_HEALTH_FILENAME = 'shared-path-health.json';
const PATH_PROBE_NETWORK_WARNING_THROTTLE_MS = 30000;
const ZIP_OPEN_RETRY_COUNT = 3;
const ZIP_OPEN_RETRY_DELAY_MS = 1000;
const SHARED_PATH_HEALTH_FOLDERS = [
  'Additional Media',
  'Fonts',
  'Publications',
];

const getCloudStorageProvider = (filePath: string) => {
  const normalizedPath = toUnix(filePath).toLowerCase();

  if (normalizedPath.includes('/library/mobile documents/')) return 'iCloud';
  if (normalizedPath.includes('/icloud drive/')) return 'iCloud';
  if (normalizedPath.includes('/dropbox/')) return 'Dropbox';
  if (normalizedPath.includes('/onedrive')) return 'OneDrive';
  if (normalizedPath.includes('/google drive/')) return 'Google Drive';

  return undefined;
};

const isRetryableZipError = (error: unknown) => {
  const errorCode = getErrorCode(error);
  if (errorCode && NETWORK_ERROR_CODES.has(errorCode)) return true;
  if (errorCode === 'ENOENT') return true;

  const message = error instanceof Error ? error.message : String(error);
  if (isIncompleteZipReadError(message)) return true;

  return /connection timed out|resource busy|temporarily unavailable/i.test(
    message,
  );
};

const isIncompleteZipReadError = (message: string) =>
  /End of central directory record signature not found|not a zip file|file is truncated|unexpected EOF|file is corrupted/i.test(
    message,
  );

const isZipGuardError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /^Reached max\. (compression ratio|entry size|number of files|size) \(failsafe\)$/.test(
    message,
  );
};

const capturedZipErrors = new WeakSet<object>();

const captureZipErrorOnce = (
  error: unknown,
  fn: { args?: Record<string, unknown>; name: string },
) => {
  if (isZipGuardError(error)) return;
  if (typeof error === 'object' && error !== null) {
    if (capturedZipErrors.has(error)) return;
    capturedZipErrors.add(error);
  }
  captureElectronError(error, {
    contexts: {
      fn,
    },
  });
};

const getZipRetryDelay = (attempt: number) => ZIP_OPEN_RETRY_DELAY_MS * attempt;

let defaultAppDataPath: null | string = null;
let sharedPathBackoffUntil: null | number = null;
let sharedPathBackoffLoaded = false;
let lastPathProbeNetworkWarningAt = 0;
const pathProbeNotificationPaths = new Set<string>();

type PathMode = 'shared' | 'user';

type PathProbeResult = 'backoff' | 'failed' | 'not-machine-wide' | 'passed';

interface UnzipContext {
  input: string;
  opts?: UnzipOptions;
  output: string;
}
interface ZipfileState {
  extractedFiles: UnzipResult[];
  fileCount: number;
  totalUncompressedSize: number;
}

interface ZipGuardState {
  fileCount: number;
  totalUncompressedSize: number;
}

const getZipEntryGuardError = (
  entry: Entry,
  state: ZipGuardState,
  limits: {
    maxEntrySize?: number;
    maxFiles?: number;
    maxTotalSize?: number;
  } = {},
) => {
  const maxFiles = limits.maxFiles ?? MAX_FILES;
  const maxTotalSize = limits.maxTotalSize ?? MAX_SIZE;

  state.fileCount++;
  if (state.fileCount > maxFiles) {
    return new Error('Reached max. number of files (failsafe)');
  }

  if (
    limits.maxEntrySize !== undefined &&
    entry.uncompressedSize > limits.maxEntrySize
  ) {
    return new Error('Reached max. entry size (failsafe)');
  }

  state.totalUncompressedSize += entry.uncompressedSize;
  if (state.totalUncompressedSize > maxTotalSize) {
    return new Error('Reached max. size (failsafe)');
  }

  if (entry.compressedSize > 0) {
    const compressionRatio = entry.uncompressedSize / entry.compressedSize;
    if (compressionRatio > THRESHOLD_RATIO) {
      return new Error('Reached max. compression ratio (failsafe)');
    }
  }

  return undefined;
};

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
    const testDir = join(dirPath, `.health-check-${uuid()}`);
    const testFile = join(testDir, 'test.txt');
    await mkdir(testDir, { recursive: true });
    await writeFile(testFile, 'ok', 'utf8');
    await rm(testDir, { force: true, recursive: true });
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
      'Cached app data path became unusable. Falling back.',
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
          'Using shared data path:',
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
      'Shared data path not available, fallback to user data path:',
      'electronFilesystem',
      'log',
      defaultAppDataPath,
    );
    return defaultAppDataPath;
  }

  log(
    'User data path is not usable. Returning user data path as last resort:',
    'electronFilesystem',
    'warn',
    userDataPath,
  );
  await setPathTelemetry('user', 'failed');
  defaultAppDataPath = userDataPath;
  return defaultAppDataPath;
}

const isUsablePathPromises = new Map<string, Promise<boolean>>();

const getProbePathContext = (basePath: string) => {
  const resolvedBase = resolve(basePath);
  const testDir = join(resolvedBase, '.cache-test-' + uuid());
  const testFile = join(testDir, 'test.txt');
  return { resolvedBase, testDir, testFile };
};

const isInvalidWindowsResolvedPath = (resolvedBase: string) => {
  if (process.platform !== 'win32') return false;

  const unixResolvedBase = toUnix(resolvedBase);
  return unixResolvedBase === '/?' || unixResolvedBase === '//?';
};

const WINDOWS_RETRYABLE_PROBE_CODES = new Set(['EBUSY', 'EPERM']);

const getErrorCode = getFilesystemErrorCode;

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

export const setPathProbeNotificationPaths = (paths: string[] = []) => {
  pathProbeNotificationPaths.clear();
  for (const path of paths) {
    if (path) pathProbeNotificationPaths.add(path);
  }
};

const hasPossibleNetworkPathInNotificationSettings = () => {
  return [...pathProbeNotificationPaths].some((path) =>
    isPossiblyNetworkFolderPath(path),
  );
};

const notifyPathProbeNetworkWarning = () => {
  const now = Date.now();
  if (
    now - lastPathProbeNetworkWarningAt <
    PATH_PROBE_NETWORK_WARNING_THROTTLE_MS
  ) {
    return;
  }
  lastPathProbeNetworkWarningAt = now;
  sendToWindow(mainWindowInfo.mainWindow, 'pathProbeNetworkWarning');
};

export function isUsablePath(basePath?: string): Promise<boolean> {
  if (!basePath) return Promise.resolve(false);

  if (!isUsablePathPromises.has(basePath)) {
    const promise = (async () => {
      const { resolvedBase, testDir, testFile } = getProbePathContext(basePath);
      const likelyNetworkPath = isPossiblyNetworkFolderPath(basePath);

      try {
        if (isInvalidWindowsResolvedPath(resolvedBase)) {
          throw new Error('Invalid Windows path resolved for filesystem probe');
        }

        await mkdir(testDir, { recursive: true });

        await writeFile(testFile, 'ok');
        await delay(PATH_PROBE_SETTLE_DELAY_MS);

        await cleanupProbe(basePath, testDir, testFile);

        return true;
      } catch (e) {
        const PERMISSION_ERRORS = new Set(['EACCES', 'EPERM']);
        const code = getErrorCode(e);
        const transientNetworkError = isExpectedNetworkPathAccessError(
          e,
          basePath,
        );
        if (hasPossibleNetworkPathInNotificationSettings()) {
          notifyPathProbeNetworkWarning();
        }
        addElectronBreadcrumb({
          category: 'filesystem',
          data: {
            basePath,
            code,
            configuredPathCount: pathProbeNotificationPaths.size,
            hasConfiguredNetworkPath:
              hasPossibleNetworkPathInNotificationSettings(),
            likelyNetworkPath,
            resolvedBase,
            testDir,
          },
          level: transientNetworkError ? 'warning' : 'error',
          message: '[isUsablePath] Probe failed',
        });
        if (!PERMISSION_ERRORS.has(code ?? '') && !transientNetworkError) {
          captureElectronError(e, {
            contexts: {
              fn: {
                args: { basePath, likelyNetworkPath, resolvedBase, testDir },
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

  if (filter?.includes('json')) {
    filters.push({ extensions: ['json'], name: 'JSON' });
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

export async function saveFileDialog(
  defaultPath: string,
  filter?: FileDialogFilter,
) {
  if (!mainWindowInfo.mainWindow) return;

  const filters: Electron.FileFilter[] = [];

  if (filter?.includes('json')) {
    filters.push({ extensions: ['json'], name: 'JSON' });
  }

  if (!filters.length) {
    filters.push({ extensions: ['*'], name: 'All files' });
  }

  return dialog.showSaveDialog(mainWindowInfo.mainWindow, {
    defaultPath,
    filters,
  });
}

/**
 * Creates a directory with retry logic
 */
const createDirectory = async (
  fullPath: string,
  context: UnzipContext,
): Promise<void> => {
  const attemptCreateDir = async (attempt = 1): Promise<void> => {
    try {
      await ensureDir(fullPath);
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
      throw e;
    }
  };

  await attemptCreateDir();
};

/**
 * Processes a file entry with retry logic
 */
const processFileEntry = async (
  entry: Entry,
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
      throw e;
    }
  };

  await attemptProcessFile();
};

/**
 * Handles a zip entry
 */
const handleZipEntry = async (
  entry: Entry,
  context: UnzipContext,
  state: ZipfileState,
  zipfile: ZipFile,
): Promise<void> => {
  const fullPath = join(context.output, entry.fileName);

  // Apply filter if provided
  if (
    context.opts?.includes?.length &&
    !context.opts.includes.includes(entry.fileName)
  ) {
    return;
  }

  const guardError = getZipEntryGuardError(entry, state);
  if (guardError) {
    throw guardError;
  }

  if (entry.fileName.endsWith('/')) {
    // Directory
    await createDirectory(fullPath, context);
  } else {
    // File
    let readStream: NodeJS.ReadableStream;
    try {
      readStream = await zipfile.openReadStreamPromise(entry);
    } catch (error) {
      captureElectronError(error, {
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
      throw error;
    }

    await processFileEntry(entry, readStream, fullPath, context, state);
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
    data: { fileSize, includes: opts?.includes, input, output },
    message: 'Starting unzip',
  });

  const context: UnzipContext = { input, opts, output };
  const extractedFiles: UnzipResult[] = [];
  const state: ZipfileState = {
    extractedFiles,
    fileCount: 0,
    totalUncompressedSize: 0,
  };
  const zipfile = await openZipFileForUnzip(input, output, fileSize, opts);

  try {
    for await (const entry of zipfile.eachEntry()) {
      await handleZipEntry(entry, context, state, zipfile);
    }
  } catch (error) {
    zipfile.close();
    captureElectronError(error, {
      contexts: {
        fn: { args: { input, output }, name: 'unzipFile zipfile error' },
      },
    });
    throw error;
  }

  addElectronBreadcrumb({
    category: 'unzip',
    data: {
      extractedFilesCount: extractedFiles.length,
      extractedFilesSample: extractedFiles
        .map((file) => file.path)
        .slice(0, ZIP_ENTRY_DIAGNOSTIC_LIMIT),
      includes: opts?.includes,
    },
    message: 'Unzip complete',
  });

  return extractedFiles;
};

const openZipFileForUnzip = async (
  input: string,
  output: string,
  fileSize: number,
  opts?: UnzipOptions,
): Promise<ZipFile> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= ZIP_OPEN_RETRY_COUNT; attempt++) {
    try {
      return await openPromise(input);
    } catch (error) {
      lastError = error;
      const errorCode = getErrorCode(error);
      const shouldRetry = shouldRetryZipRead(error, attempt);

      addElectronBreadcrumb({
        category: 'unzip',
        data: {
          attempt: attempt + 1,
          errorCode,
          fileSize,
          includes: opts?.includes,
          input,
          maxAttempts: ZIP_OPEN_RETRY_COUNT + 1,
          output,
          retrying: shouldRetry,
        },
        level: errorCode === 'ENOENT' ? 'info' : 'error',
        message: 'Error opening zipfile',
      });

      if (!shouldRetry) throw error;

      await delay(getZipRetryDelay(attempt + 1));
    }
  }

  throw lastError;
};

const getZipDiagnostics = (zipPath: string, fileSize: number) => {
  const cloudProvider = getCloudStorageProvider(zipPath);

  return {
    cloudProvider,
    fileSize,
    isCloudStoragePath: !!cloudProvider,
    isPossiblyNetworkPath: isPossiblyNetworkFolderPath(dirname(zipPath)),
    zipPath,
  };
};

const shouldRetryZipRead = (error: unknown, attempt: number) =>
  attempt < ZIP_OPEN_RETRY_COUNT && isRetryableZipError(error);

const getZipFileStats = async (zipPath: string) => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= ZIP_OPEN_RETRY_COUNT; attempt++) {
    try {
      return await stat(zipPath);
    } catch (error) {
      lastError = error;
      const errorCode = getErrorCode(error);
      const shouldRetry = shouldRetryZipRead(error, attempt);

      addElectronBreadcrumb({
        category: 'zip',
        data: {
          ...getZipDiagnostics(zipPath, 0),
          attempt: attempt + 1,
          errorCode,
          maxAttempts: ZIP_OPEN_RETRY_COUNT + 1,
          retrying: shouldRetry,
        },
        level: errorCode === 'ENOENT' ? 'info' : 'error',
        message: 'Zip file unavailable before listing entries',
      });

      if (!shouldRetry) {
        if (errorCode !== 'ENOENT') {
          captureElectronError(error, {
            contexts: {
              cloud_resource: {
                ...getZipDiagnostics(zipPath, 0),
                retryAttempts: attempt,
              },
              fn: {
                args: { zipPath },
                name: 'getZipEntries stat',
              },
            },
          });
        }

        throw error;
      }

      await delay(getZipRetryDelay(attempt + 1));
    }
  }

  throw lastError;
};

const openZipFileForEntries = async (
  zipPath: string,
  fileSize: number,
): Promise<ZipFile> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= ZIP_OPEN_RETRY_COUNT; attempt++) {
    try {
      return await openPromise(zipPath);
    } catch (error) {
      lastError = error;
      const errorCode = getErrorCode(error);
      const shouldRetry = shouldRetryZipRead(error, attempt);

      addElectronBreadcrumb({
        category: 'zip',
        data: {
          ...getZipDiagnostics(zipPath, fileSize),
          attempt: attempt + 1,
          errorCode,
          maxAttempts: ZIP_OPEN_RETRY_COUNT + 1,
          retrying: shouldRetry,
        },
        level: errorCode === 'ENOENT' ? 'info' : 'error',
        message: 'Error opening zip entries',
      });

      if (!shouldRetry) {
        const message = error instanceof Error ? error.message : String(error);
        if (errorCode !== 'ENOENT' && !isIncompleteZipReadError(message)) {
          captureElectronError(error, {
            contexts: {
              cloud_resource: {
                ...getZipDiagnostics(zipPath, fileSize),
                retryAttempts: attempt,
              },
              fn: {
                args: { fileSize, zipPath },
                name: 'getZipEntries openPromise',
              },
            },
          });
        }

        throw error;
      }

      await delay(getZipRetryDelay(attempt + 1));
    }
  }

  throw lastError;
};

const openZipBuffer = async (buffer: Buffer): Promise<ZipFile> =>
  await fromBufferPromise(buffer);

const readStreamIntoBuffer = async (
  readStream: NodeJS.ReadableStream,
  maxEntrySize: number,
) =>
  await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    readStream.on('data', (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalSize += buffer.length;
      if (totalSize > maxEntrySize) {
        (
          readStream as NodeJS.ReadableStream & {
            destroy: (error: Error) => void;
          }
        ).destroy(new Error('Reached max. entry size (failsafe)'));
        return;
      }
      chunks.push(buffer);
    });
    readStream.on('end', () => {
      resolve(Buffer.concat(chunks, totalSize));
    });
    readStream.on('error', reject);
  });

const readZipEntriesIntoMemory = async (
  zipPath: string,
  includes: string[],
  options: Pick<ExtractNestedZipEntryOptions, 'maxTotalSize'> &
    Required<Pick<ExtractNestedZipEntryOptions, 'maxEntrySize'>>,
) => {
  const { size: fileSize } = await stat(zipPath);
  const zipfile = await openZipFileForEntries(zipPath, fileSize);
  const entries: { data: Buffer; path: string }[] = [];
  const guardState: ZipGuardState = {
    fileCount: 0,
    totalUncompressedSize: 0,
  };

  try {
    for await (const entry of zipfile.eachEntry()) {
      try {
        const guardError = getZipEntryGuardError(entry, guardState, {
          maxEntrySize: options.maxEntrySize,
          maxTotalSize: options.maxTotalSize ?? MAX_IN_MEMORY_ZIP_TOTAL_SIZE,
        });
        if (guardError) throw guardError;

        if (
          entry.fileName.endsWith('/') ||
          !includes.includes(entry.fileName)
        ) {
          continue;
        }

        const readStream = await zipfile.openReadStreamPromise(entry);
        entries.push({
          data: await readStreamIntoBuffer(readStream, options.maxEntrySize),
          path: entry.fileName,
        });
        if (entries.length === includes.length) break;
      } catch (error) {
        captureZipErrorOnce(error, {
          args: { entry: entry.fileName, includes, zipPath },
          name: 'readZipEntriesIntoMemory entry',
        });
        throw error;
      }
    }
  } catch (error) {
    captureZipErrorOnce(error, {
      args: { includes, zipPath },
      name: 'readZipEntriesIntoMemory',
    });
    throw error;
  } finally {
    zipfile.close();
  }

  return entries;
};

export async function extractNestedZipEntry(
  input: string,
  outerEntryName: string,
  output: string,
  opts: ExtractNestedZipEntryOptions,
): Promise<UnzipResult> {
  const maxEntrySize = opts.maxEntrySize ?? MAX_IN_MEMORY_ZIP_ENTRY_SIZE;
  const maxTotalSize = opts.maxTotalSize ?? MAX_IN_MEMORY_ZIP_TOTAL_SIZE;
  const [outerEntry] = await readZipEntriesIntoMemory(input, [outerEntryName], {
    maxEntrySize,
    maxTotalSize,
  });

  if (!outerEntry) {
    throw new Error(`Zip entry not found: ${outerEntryName}`);
  }

  const innerZipfile = await openZipBuffer(outerEntry.data);
  const guardState: ZipGuardState = {
    fileCount: 0,
    totalUncompressedSize: 0,
  };
  const matchesRequestedEntry = (entry: Entry) => {
    if (opts.innerEntryName) return entry.fileName === opts.innerEntryName;
    if (opts.innerEntryNameSuffix) {
      return entry.fileName.endsWith(opts.innerEntryNameSuffix);
    }
    return false;
  };

  try {
    for await (const entry of innerZipfile.eachEntry()) {
      try {
        const guardError = getZipEntryGuardError(entry, guardState, {
          maxEntrySize,
          maxTotalSize,
        });
        if (guardError) throw guardError;

        if (entry.fileName.endsWith('/') || !matchesRequestedEntry(entry)) {
          continue;
        }

        const readStream = await innerZipfile.openReadStreamPromise(entry);
        const fullPath = join(output, entry.fileName);
        await ensureDir(dirname(fullPath));
        await pipeline(readStream, createWriteStream(fullPath));
        return { path: fullPath };
      } catch (error) {
        captureZipErrorOnce(error, {
          args: {
            entry: entry.fileName,
            innerEntryName: opts.innerEntryName,
            innerEntryNameSuffix: opts.innerEntryNameSuffix,
            input,
            outerEntryName,
            output,
          },
          name: 'extractNestedZipEntry entry',
        });
        throw error;
      }
    }

    throw new Error('Nested zip entry not found');
  } catch (error) {
    captureZipErrorOnce(error, {
      args: {
        innerEntryName: opts.innerEntryName,
        innerEntryNameSuffix: opts.innerEntryNameSuffix,
        input,
        outerEntryName,
        output,
      },
      name: 'extractNestedZipEntry',
    });
    throw error;
  } finally {
    innerZipfile.close();
  }
}

/**
 * Lists entries in a zip file with their uncompressed sizes
 */
export async function getZipEntries(
  zipPath: string,
): Promise<Record<string, number>> {
  const stats = await getZipFileStats(zipPath);
  const fileSize = stats.size;

  addElectronBreadcrumb({
    category: 'zip',
    data: getZipDiagnostics(zipPath, fileSize),
    message: 'Reading zip entries',
  });

  const entries: Record<string, number> = {};
  const entryNamesSample: string[] = [];
  const guardState: ZipGuardState = {
    fileCount: 0,
    totalUncompressedSize: 0,
  };
  const zipfile = await openZipFileForEntries(zipPath, fileSize);

  try {
    for await (const entry of zipfile.eachEntry()) {
      const guardError = getZipEntryGuardError(entry, guardState);
      if (guardError) throw guardError;

      entries[entry.fileName] = entry.uncompressedSize;
      if (entryNamesSample.length < ZIP_ENTRY_DIAGNOSTIC_LIMIT) {
        entryNamesSample.push(entry.fileName);
      }
    }
  } catch (error) {
    addElectronBreadcrumb({
      category: 'zip',
      data: getZipDiagnostics(zipPath, fileSize),
      level: 'error',
      message: 'Zip entry stream error',
    });
    captureElectronError(error, {
      contexts: {
        cloud_resource: getZipDiagnostics(zipPath, fileSize),
        fn: {
          args: { fileSize, zipPath },
          name: 'getZipEntries zipfile error',
        },
      },
    });
    throw error;
  } finally {
    zipfile.close();
  }

  addElectronBreadcrumb({
    category: 'zip',
    data: {
      ...getZipDiagnostics(zipPath, fileSize),
      contentsSize: entries.contents,
      entryCount: guardState.fileCount,
      entryNamesSample,
      totalUncompressedSize: guardState.totalUncompressedSize,
    },
    message: 'Finished reading zip entries',
  });

  return entries;
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
  const pathIsPossiblyNetwork = isPossiblyNetworkFolderPath(folderPath);

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
      interval: pathIsPossiblyNetwork ? WATCH_POLL_INTERVAL_MS : undefined,
      usePolling: pathIsPossiblyNetwork,
    })
      .on('error', (error: unknown) => {
        const context = {
          contexts: { fn: { folderPath, name: 'watchFolder.error' } },
        };

        try {
          const e = error as Error & { code?: string; syscall?: string };

          sendToWindow(mainWindowInfo.mainWindow, 'watchFolderError', {
            folderPath,
            isPossiblyNetwork: pathIsPossiblyNetwork,
          });

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
