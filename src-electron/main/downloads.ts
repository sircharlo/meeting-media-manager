import { getCountriesForTimezone } from 'countries-and-timezones';
import { app, type BrowserWindow } from 'electron';
import { randomUUID } from 'node:crypto';
import { lstat, mkdir, stat } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { IS_DEMO_MODE } from 'src-electron/constants';
import { getLowDiskSpaceStatus } from 'src-electron/main/disk-space';
import {
  discardPartialDownload,
  type ResumeInfo,
  runTransfer,
  type TransferFailure,
  type TransferResult,
} from 'src-electron/main/download-transfer';
import { getFallbackDir } from 'src-electron/main/resilient-storage';
import {
  addElectronBreadcrumb,
  captureElectronError,
  fetchJsonFromMainProcess,
} from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import {
  getFilesystemErrorCode,
  getFilesystemErrorSyscall,
  isExpectedNetworkPathAccessError,
} from 'src/shared/filesystem-errors';
import { log, throttleWithTrailing } from 'src/shared/vanilla';
import { basename, dirname, join } from 'upath';

const ENSURE_DIR_RETRYABLE_CODES = new Set([
  'EACCES',
  'EBUSY',
  'ENOENT',
  'EPERM',
]);
const ENSURE_DIR_RETRY_COUNT = 6;
const ENSURE_DIR_RETRY_BASE_DELAY_MS = 100;
const ENSURE_DIR_RETRY_MAX_DELAY_MS = 1500;

/**
 * Full-jitter exponential backoff. Shared machine-wide cache folders can see
 * many concurrent downloads/unzips hitting the same parent directory at
 * once, which on Windows/NTFS (and occasionally other filesystems under
 * heavy contention) can cause `mkdir` to transiently fail with ENOENT/EBUSY
 * even though the parent directory exists. Jitter avoids every stalled
 * caller retrying in lockstep against that same contended directory.
 */
const getEnsureDirRetryDelay = (attempt: number) => {
  const exponentialDelay = ENSURE_DIR_RETRY_BASE_DELAY_MS * 2 ** attempt;
  const cappedDelay = Math.min(exponentialDelay, ENSURE_DIR_RETRY_MAX_DELAY_MS);
  return Math.random() * cappedDelay;
};

// BE-9 (full-audit-2026-09-04.md): a failed download is retried
// automatically instead of needing the user to resubmit it. Bounded so a
// download that keeps failing still gives up promptly rather than hammering
// the same URL forever - but only failures that made no progress count
// towards the bound: a retry resumes where the last attempt stopped, so a
// large file on a flaky connection that keeps advancing is never given up on.
const DOWNLOAD_ERROR_RETRY_COUNT = 2;
const DOWNLOAD_ERROR_RETRY_BASE_DELAY_MS = 1000;
const DOWNLOAD_ERROR_RETRY_MAX_DELAY_MS = 8000;

const getDownloadErrorRetryDelay = (attempt: number) => {
  const exponentialDelay = DOWNLOAD_ERROR_RETRY_BASE_DELAY_MS * 2 ** attempt;
  const cappedDelay = Math.min(
    exponentialDelay,
    DOWNLOAD_ERROR_RETRY_MAX_DELAY_MS,
  );
  return Math.random() * cappedDelay;
};

interface EnsureDirAttemptDiagnostics {
  attempt: number;
  code?: string;
  dir: string;
  // Whether the directory itself is (or isn't, and why) a symlink/junction:
  // a folder that "exists" yet can't be created or opened (MMM-V2-3KM).
  dirIsSymlink?: boolean;
  dirLstatCode?: string;
  message: string;
  parentCode?: string;
  parentExists?: boolean;
  parentIsDirectory?: boolean;
  parentMessage?: string;
  parentPath: string;
}

interface ErrorWithDirectoryDiagnostics {
  downloadDirDiagnostics?: EnsureDirAttemptDiagnostics[];
  downloadDirFallbackError?: { code?: string; dir: string; message: string };
}

// Sentry flattens context values nested this deep to "[Object]", which hid
// every per-attempt detail (MMM-V2-3KM) - send each attempt as a string.
const formatDirectoryDiagnostics = (error: unknown) => {
  const { downloadDirDiagnostics, downloadDirFallbackError } =
    error as ErrorWithDirectoryDiagnostics;
  return {
    directoryDiagnostics: downloadDirDiagnostics?.map((attempt) =>
      JSON.stringify(attempt),
    ),
    fallbackDirError:
      downloadDirFallbackError && JSON.stringify(downloadDirFallbackError),
  };
};

const getErrorCode = (error: unknown) => (error as { code?: string })?.code;
const getErrorMessage = (error: unknown) =>
  (error as { message?: string })?.message ?? '';

const isDestroyedObjectError = (error: unknown) =>
  getErrorMessage(error).includes('Object has been destroyed');

const getDownloadWindow = (): BrowserWindow | null => {
  const { mainWindow } = mainWindowInfo;

  if (!mainWindow || mainWindow.isDestroyed()) return null;

  try {
    if (mainWindow.webContents.isDestroyed()) return null;
  } catch (error) {
    if (isDestroyedObjectError(error)) return null;
    throw error;
  }

  return mainWindow;
};

enum DownloadState {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
}

/**
 * Types of downloads in priority order
 */
enum QueueItemType {
  LOW_NEW = 'LOW_NEW',
  LOW_PAUSED = 'LOW_PAUSED',
  NORMAL_NEW = 'NORMAL_NEW',
  NORMAL_PAUSED = 'NORMAL_PAUSED',
}

interface DownloadQueueItem {
  destFilename: string;
  saveDir: string;
  url: string;
}

interface GeoInfo {
  countryCode: string;
}

/**
 * A download that has been started. It stays tracked - holding its slot
 * while ACTIVE - until it completes, fails for good, or is cancelled.
 */
interface OngoingDownload {
  /**
   * Stops the running transfer. Absent while no transfer is running: while
   * paused, and while waiting to retry (which still holds the slot).
   */
  controller?: AbortController;
  /**
   * Consecutive failed attempts that got no further into the file than an
   * earlier attempt already had.
   */
  failedAttempts: number;
  item: DownloadQueueItem;
  lowPriority: boolean;
  /**
   * Makes this download's `.part` file its own: two downloads of different
   * URLs can be saved under the same name, and must not write into, or clean
   * up, each other's unfinished file.
   */
  partialId: string;
  /** The furthest any attempt has got into the file, in bytes. */
  reachedBytes: number;
  /** How to resume the unfinished `.part` file, if it can be. */
  resume: null | ResumeInfo;
  /**
   * Where the file is actually written: `item.saveDir`, unless a retry had
   * to fall back to another directory (BE-13).
   */
  saveDir: string;
  state: DownloadState;
}

const getDirectoryFailureDiagnostics = async (
  dir: string,
  attempt: number,
  error: unknown,
): Promise<EnsureDirAttemptDiagnostics> => {
  const parentPath = dirname(dir);
  const diagnostics: EnsureDirAttemptDiagnostics = {
    attempt,
    code: getErrorCode(error),
    dir,
    message: getErrorMessage(error),
    parentPath,
  };

  try {
    diagnostics.dirIsSymlink = (await lstat(dir)).isSymbolicLink();
  } catch (dirError) {
    diagnostics.dirLstatCode = getErrorCode(dirError);
  }

  try {
    const parentStats = await stat(parentPath);
    diagnostics.parentExists = true;
    diagnostics.parentIsDirectory = parentStats.isDirectory();
  } catch (parentError) {
    diagnostics.parentCode = getErrorCode(parentError);
    diagnostics.parentExists = false;
    diagnostics.parentIsDirectory = false;
    diagnostics.parentMessage = getErrorMessage(parentError);
  }

  return diagnostics;
};

const attachDirectoryDiagnostics = (
  error: unknown,
  diagnostics: EnsureDirAttemptDiagnostics[],
  fallbackDir: string,
  fallbackError: unknown,
) => {
  if (typeof error !== 'object' || error === null) return;

  (error as ErrorWithDirectoryDiagnostics).downloadDirDiagnostics = diagnostics;
  (error as ErrorWithDirectoryDiagnostics).downloadDirFallbackError = {
    code: getErrorCode(fallbackError),
    dir: fallbackDir,
    message: getErrorMessage(fallbackError),
  };
};

const ensureDirPromises = new Map<string, Promise<string>>();
const DOWNLOAD_FALLBACK_FINGERPRINT = ['download-directory-fallback-to-temp'];

// Same-directory calls are already coalesced above, but a burst of *different*
// publications downloading at once (e.g. rapidly browsing many weeks in the
// media calendar) has no such coalescing - each still needs its own `mkdir`.
// Capping how many of those run at once (independent of maxActiveDownloads,
// which only throttles the download itself, not this earlier directory-setup
// step) keeps the number of simultaneous `mkdir` calls hitting the shared
// `Publications` parent low enough for the retry/backoff above to actually
// win the race, instead of every caller in the burst contending at once.
const ENSURE_DIR_MAX_CONCURRENT = 3;
let ensureDirActiveCount = 0;
const ensureDirWaitQueue: (() => void)[] = [];

/**
 * Creates a directory with retry logic, falling back to a directory under
 * the OS temp folder if the requested directory remains unusable after all
 * retries (e.g. a user-configured cache folder that lost permission). Only
 * the fallback attempt itself is reported to Sentry, with a fixed generic
 * message/fingerprint so occurrences across many users' machines group
 * together instead of being split by their individual paths.
 * Concurrent requests for the exact same directory (common when several
 * files for the same publication are queued at once) are coalesced into a
 * single attempt so parallel downloads don't pile more concurrent `mkdir`
 * calls onto an already-contended shared folder. Requests for *different*
 * directories are still capped at ENSURE_DIR_MAX_CONCURRENT (see above).
 * @returns The directory that is actually usable (the requested one, or the
 * temp fallback).
 */
export function ensureDirWithRetry(dir: string): Promise<string> {
  const existing = ensureDirPromises.get(dir);
  if (existing) return existing;

  const promise = (async () => {
    await acquireEnsureDirSlot();
    try {
      return await createDirWithRetry(dir);
    } finally {
      releaseEnsureDirSlot();
    }
  })().finally(() => {
    ensureDirPromises.delete(dir);
  });
  ensureDirPromises.set(dir, promise);
  return promise;
}

function acquireEnsureDirSlot(): Promise<void> {
  if (ensureDirActiveCount < ENSURE_DIR_MAX_CONCURRENT) {
    ensureDirActiveCount += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    ensureDirWaitQueue.push(() => {
      ensureDirActiveCount += 1;
      resolve();
    });
  });
}

function releaseEnsureDirSlot(): void {
  ensureDirActiveCount -= 1;
  ensureDirWaitQueue.shift()?.();
}

async function tryCreateDir(
  dir: string,
): Promise<undefined | { error: unknown }> {
  try {
    await mkdir(dir, { recursive: true });
    const dirStats = await stat(dir);
    if (!dirStats.isDirectory()) {
      const error = new Error(
        `Download destination is not a directory: ${dir}`,
      );
      (error as NodeJS.ErrnoException).code = 'ENOTDIR';
      return { error };
    }
    return undefined;
  } catch (error) {
    return { error };
  }
}

const getDownloadFallbackDir = (dir: string) =>
  join(getFallbackDir(), 'Downloads', basename(dir));

async function createDirWithRetry(dir: string): Promise<string> {
  let lastError: unknown;
  const diagnostics: EnsureDirAttemptDiagnostics[] = [];

  for (let attempt = 0; attempt <= ENSURE_DIR_RETRY_COUNT; attempt += 1) {
    const result = await tryCreateDir(dir);
    if (!result) {
      if (attempt > 0) {
        addElectronBreadcrumb({
          category: 'downloads.filesystem',
          data: { attempt, dir },
          level: 'info',
          message: 'download-directory-created-after-retry',
        });
      }
      return dir;
    }

    const { error } = result;
    lastError = error;
    const attemptDiagnostics = await getDirectoryFailureDiagnostics(
      dir,
      attempt,
      error,
    );
    diagnostics.push(attemptDiagnostics);

    addElectronBreadcrumb({
      category: 'downloads.filesystem',
      data: attemptDiagnostics,
      level: 'warning',
      message: 'download-directory-create-failed',
    });

    const code = getErrorCode(error);
    const shouldRetry =
      ENSURE_DIR_RETRYABLE_CODES.has(code ?? '') &&
      attempt < ENSURE_DIR_RETRY_COUNT;
    if (!shouldRetry) break;
    await delay(getEnsureDirRetryDelay(attempt));
  }

  const fallbackDir = getDownloadFallbackDir(dir);
  const fallbackResult = await tryCreateDir(fallbackDir);
  if (!fallbackResult) {
    addElectronBreadcrumb({
      category: 'downloads.filesystem',
      data: { attempts: diagnostics.length, dir, fallbackDir },
      level: 'warning',
      message: 'download-directory-fell-back-to-temp',
    });
    captureElectronError(
      new Error(
        'Download destination directory became unusable; falling back to a temp directory',
      ),
      {
        contexts: {
          fn: {
            attempts: diagnostics.length,
            lastErrorCode: getErrorCode(lastError),
            name: 'createDirWithRetry',
          },
        },
        fingerprint: DOWNLOAD_FALLBACK_FINGERPRINT,
      },
    );
    return fallbackDir;
  }

  attachDirectoryDiagnostics(
    lastError,
    diagnostics,
    fallbackDir,
    fallbackResult.error,
  );
  throw lastError;
}

/**
 * A paused download can resume once its transfer has finished winding down:
 * until then, that transfer may still be writing to the `.part` file a
 * resumed transfer would append to.
 */
const canResume = (download: OngoingDownload) => !download.controller;

/**
 * Finds the next low priority paused download to resume
 */
function findLowPriorityPausedDownload(
  pausedDownloads: Map<string, OngoingDownload>,
): null | { download: OngoingDownload; key: string } {
  for (const [key, download] of pausedDownloads.entries()) {
    if (download.lowPriority && canResume(download)) {
      return { download, key };
    }
  }
  return null;
}

/**
 * Finds the next normal priority paused download to resume
 */
function findNormalPriorityPausedDownload(
  pausedDownloads: Map<string, OngoingDownload>,
): null | { download: OngoingDownload; key: string } {
  for (const [key, download] of pausedDownloads.entries()) {
    if (!download.lowPriority && canResume(download)) {
      return { download, key };
    }
  }
  return null;
}

/**
 * Determines what type of download should be processed next
 */
function getNextQueueItemType(
  normalQueue: DownloadQueueItem[],
  lowPriorityQueue: DownloadQueueItem[],
  pausedDownloads: Map<string, OngoingDownload>,
  hasHighPriorityActiveDownload: boolean,
): null | QueueItemType {
  // Priority 1: Normal queue (new downloads)
  if (normalQueue.length > 0) {
    return QueueItemType.NORMAL_NEW;
  }

  // Priority 2: Paused downloads (resume)
  if (pausedDownloads.size > 0) {
    // Check for normal priority paused first
    const hasNormalPaused = findNormalPriorityPausedDownload(pausedDownloads);
    if (hasNormalPaused) {
      return QueueItemType.NORMAL_PAUSED;
    }

    // Only resume low priority paused if no high priority is active
    if (!hasHighPriorityActiveDownload) {
      const hasLowPaused = findLowPriorityPausedDownload(pausedDownloads);
      if (hasLowPaused) {
        return QueueItemType.LOW_PAUSED;
      }
    }
  }

  // Priority 3: Low priority queue (new downloads)
  // Only start if no high priority is active
  if (lowPriorityQueue.length > 0 && !hasHighPriorityActiveDownload) {
    return QueueItemType.LOW_NEW;
  }

  return null;
}

/**
 * Checks if there are slots available for new downloads
 */
function hasAvailableSlots(
  activeCount: number,
  maxActiveDownloads: number,
): boolean {
  return activeCount < maxActiveDownloads;
}

/**
 * Checks if any high priority downloads are currently active
 */
function hasHighPriorityActive(
  activeDownloads: Map<string, OngoingDownload>,
): boolean {
  return Array.from(activeDownloads.values()).some((d) => !d.lowPriority);
}

function logDownloadQueueDebugState(reason: string): void {
  const describe = ([key, download]: [string, OngoingDownload]) => ({
    failedAttempts: download.failedAttempts,
    isTransferring: !!download.controller,
    key,
    lowPriority: download.lowPriority,
    state: download.state,
    url: download.item.url,
  });

  log(
    `Download queue debug snapshot (${reason})`,
    'electronDownloads',
    'warn',
    {
      activeDownloads: Array.from(getActiveDownloads().entries(), describe),
      lowPriorityQueueLength: lowPriorityQueue.length,
      lowPriorityQueueTop: lowPriorityQueue[0]?.url,
      normalQueueLength: downloadQueue.length,
      normalQueueTop: downloadQueue[0]?.url,
      pausedDownloads: Array.from(getPausedDownloads().entries(), describe),
    },
  );
}

const downloadQueue: DownloadQueueItem[] = [];
const lowPriorityQueue: DownloadQueueItem[] = [];
const ongoingDownloads = new Map<string, OngoingDownload>();
const maxActiveDownloads = 3;

// A transfer reports progress on every chunk it receives. With up to
// `maxActiveDownloads` downloads running at once that can drive a near-
// continuous stream of progress IPC into the renderer, where each message
// mutates the Pinia `current-state` store (invalidating every bound
// getter/component). Sending at most one progress update per throttle
// window per download (with a trailing update carrying the latest byte
// count) keeps that reactivity churn bounded while the progress bar still
// advances smoothly.
export const DOWNLOAD_PROGRESS_THROTTLE_MS = 200;
let cancelAll = false;
// Set by pauseAllDownloads(): nothing starts or resumes until
// resumeAllDownloads() is called.
let downloadsHeld = false;
const QUEUE_BREADCRUMB_MIN_INTERVAL_MS = 5000;
let lastQueueBreadcrumbAt = 0;
let lastQueueSnapshot = '';

let isProcessingQueue = false;
let queueRerunRequested = false;
let diskSpaceRecheckTimer: null | ReturnType<typeof setTimeout> = null;

// Helper getters for filtered views
const getActiveDownloads = () => {
  const active = new Map<string, OngoingDownload>();
  ongoingDownloads.forEach((download, key) => {
    if (download.state === DownloadState.ACTIVE) {
      active.set(key, download);
    }
  });
  return active;
};

const getPausedDownloads = () => {
  const paused = new Map<string, OngoingDownload>();
  ongoingDownloads.forEach((download, key) => {
    if (download.state === DownloadState.PAUSED) {
      paused.set(key, download);
    }
  });
  return paused;
};

const getActiveLowPriorityDownloads = () => {
  const activeLowPriority = new Map<string, OngoingDownload>();
  ongoingDownloads.forEach((download, key) => {
    if (download.state === DownloadState.ACTIVE && download.lowPriority) {
      activeLowPriority.set(key, download);
    }
  });
  return activeLowPriority;
};

const getActiveDownloadCount = () => {
  return getActiveDownloads().size;
};

const getQueueSnapshot = () => {
  const activeDownloads = getActiveDownloads();
  const pausedDownloads = getPausedDownloads();
  return {
    active: activeDownloads.size,
    lowPending: lowPriorityQueue.length,
    normalPending: downloadQueue.length,
    paused: pausedDownloads.size,
  };
};

const addQueueBreadcrumb = (
  reason: string,
  opts?: { force?: boolean; includeTopItem?: boolean },
) => {
  const snapshot = getQueueSnapshot();
  const snapshotKey = JSON.stringify(snapshot);
  const now = Date.now();
  const force = !!opts?.force;

  if (
    !force &&
    (snapshotKey === lastQueueSnapshot ||
      now - lastQueueBreadcrumbAt < QUEUE_BREADCRUMB_MIN_INTERVAL_MS)
  ) {
    return;
  }

  lastQueueSnapshot = snapshotKey;
  lastQueueBreadcrumbAt = now;

  addElectronBreadcrumb({
    category: 'downloads.queue',
    data: {
      ...snapshot,
      topLow: opts?.includeTopItem ? lowPriorityQueue[0]?.url : undefined,
      topNormal: opts?.includeTopItem ? downloadQueue[0]?.url : undefined,
    },
    level: 'info',
    message: reason,
  });
};

/**
 * Stops tracking `download`, unless something else has already replaced it
 * under the same key.
 */
const releaseDownload = (key: string, download: OngoingDownload) => {
  if (ongoingDownloads.get(key) === download) ongoingDownloads.delete(key);
};

const getDestPath = (download: OngoingDownload) =>
  join(download.saveDir, download.item.destFilename);

const getPartialPath = (download: OngoingDownload) =>
  `${getDestPath(download)}.${download.partialId}.part`;

const getPercentCompleted = (receivedBytes: number, totalBytes: number) => {
  if (totalBytes <= 0) return 0;
  return Math.min(Number(((receivedBytes / totalBytes) * 100).toFixed(2)), 100);
};

export interface DownloadFileResult {
  /** The queue/progress-tracking key: the url concatenated with the resolved saveDir. */
  key: string;
  /**
   * The directory the file will actually be saved to. Usually equal to the
   * requested `saveDir`, but may point at a temp fallback directory if the
   * requested directory turned out to be unusable.
   */
  saveDir: string;
}

/**
 * Cancels all downloads.
 */
export async function cancelAllDownloads() {
  cancelAll = true;
  downloadQueue.length = 0;
  lowPriorityQueue.length = 0;
  clearDiskSpaceRecheck();

  for (const [key, download] of ongoingDownloads) {
    ongoingDownloads.delete(key);
    if (download.controller) {
      // Its transfer removes the `.part` file and reports the cancellation.
      download.controller.abort('cancel');
      continue;
    }
    // Paused, or waiting to retry: nothing is running, so clean up here.
    discardPartialDownload(getPartialPath(download)).catch(() => undefined);
    sendToWindow(getDownloadWindow(), 'downloadCancelled', { id: key });
  }
}

/**
 * Downloads a file from the specified URL to the specified directory.
 * @param url The URL of the file to download.
 * @param saveDir The directory to save the file to.
 * @param destFilename The name of the file to save as.
 * @param lowPriority Whether to download the file at a low priority.
 * @returns The resolved save directory and queue key, or null if the download failed.
 */
export async function downloadFile(
  url: string,
  saveDir: string,
  destFilename?: string,
  lowPriority = false,
): Promise<DownloadFileResult | null> {
  if (IS_DEMO_MODE || !getDownloadWindow() || !url || !saveDir) return null;
  try {
    // Allow queue processing again after a previous cancelAll cycle
    cancelAll = false;

    const resolvedSaveDir = await ensureDirWithRetry(saveDir);

    // SEC-7 (full-audit-2026-09-04.md): basename() strips any directory
    // components (../, absolute paths) regardless of platform separator, so
    // a crafted destFilename can no longer escape resolvedSaveDir - not
    // reachable today (gated by isSelf(), and every current renderer call
    // site only ever passes a plain filename), but a defense-in-depth
    // backstop against a future caller passing something untrusted through.
    destFilename = basename(destFilename || url);

    const fileToDownload = { destFilename, saveDir: resolvedSaveDir, url };
    const key = url + resolvedSaveDir;

    // Check if already in progress
    const existing = ongoingDownloads.get(key);
    if (existing) {
      // If active and we want normal priority but it's low, promote it
      if (!lowPriority && existing.lowPriority) {
        existing.lowPriority = false;
      }

      // If paused and we want normal priority, promote it and trigger resume
      if (existing.state === DownloadState.PAUSED && !lowPriority) {
        existing.lowPriority = false;
        // Stop other low priority downloads to free up slots
        stopLowPriorityDownloads();
        processQueue();
        addQueueBreadcrumb('priority-promoted-paused-download', {
          force: true,
        });
      }

      return { key, saveDir: resolvedSaveDir };
    }

    // Check if already queued but not yet started (ongoingDownloads only
    // gains an entry once a download actually starts - see BE-4 in
    // full-audit-2026-09-04.md). Without this, two rapid calls for the same
    // URL/directory while the queue is saturated could both miss each other
    // here and enqueue the same download twice, racing to write the same
    // destination file once both are eventually dequeued.
    const isSameKey = (item: DownloadQueueItem) =>
      item.url + item.saveDir === key;
    const queuedLowPriorityIndex = lowPriorityQueue.findIndex(isSameKey);
    const alreadyQueued =
      downloadQueue.some(isSameKey) || queuedLowPriorityIndex !== -1;

    if (alreadyQueued) {
      // Promote a still-queued low-priority item the same way an
      // already-ongoing one is promoted above.
      if (!lowPriority && queuedLowPriorityIndex !== -1) {
        const [promoted] = lowPriorityQueue.splice(queuedLowPriorityIndex, 1);
        if (promoted) {
          stopLowPriorityDownloads();
          downloadQueue.push(promoted);
          processQueue();
          addQueueBreadcrumb('priority-promoted-queued-download', {
            force: true,
          });
        }
      }
      return { key, saveDir: resolvedSaveDir };
    }

    // New Download
    if (lowPriority) {
      lowPriorityQueue.push(fileToDownload);
    } else {
      // Stop low priority downloads to make room for high priority
      stopLowPriorityDownloads();
      downloadQueue.push(fileToDownload);
    }
    addQueueBreadcrumb('download-enqueued', { includeTopItem: true });

    log(
      'fileToDownload',
      'electronDownloads',
      'log',
      fileToDownload,
      'lowPriority',
      lowPriority,
    );

    // Trigger queue processing
    processQueue();

    return { key, saveDir: resolvedSaveDir };
  } catch (error) {
    captureElectronError(error, {
      contexts: {
        fn: {
          destFilename,
          directory: saveDir,
          ...formatDirectoryDiagnostics(error),
          lowPriority,
          name: 'downloads.ts downloadFile',
          url,
        },
      },
    });
    return null;
  }
}

export async function isDownloadComplete(downloadId: string) {
  if (!getDownloadWindow()) return null;

  // Started but not finished yet (running, paused, or waiting to retry)
  if (ongoingDownloads.has(downloadId)) return false;

  // Check if it's still in one of the queues
  const isInQueue =
    downloadQueue.some((d) => d.url + d.saveDir === downloadId) ||
    lowPriorityQueue.some((d) => d.url + d.saveDir === downloadId);

  // If it's not ongoing and not in queue, it must have finished (or failed and been removed)
  return !isInQueue;
}

/**
 * Pauses every running download, and holds the queue - nothing starts or
 * resumes - until resumeAllDownloads() is called.
 */
export async function pauseAllDownloads(reason = 'manual') {
  downloadsHeld = true;
  pauseActiveDownloads(reason);
}

/**
 * Releases a pauseAllDownloads() hold and lets paused downloads resume, as
 * many as there are free slots for, by priority.
 */
export async function resumeAllDownloads(reason = 'manual') {
  downloadsHeld = false;
  log(
    `Resuming ${getPausedDownloads().size} paused downloads as slots allow (${reason})`,
    'electronDownloads',
    'log',
  );
  addQueueBreadcrumb(`resume-all-${reason}`, { force: true });
  processQueue();
}

function pauseActiveDownloads(reason: string) {
  const activeDownloads = getActiveDownloads();
  if (activeDownloads.size === 0) return;

  log(
    `Pausing ${activeDownloads.size} active downloads (${reason})`,
    'electronDownloads',
    'warn',
  );
  activeDownloads.forEach((download) => pauseDownload(download));
  logDownloadQueueDebugState(`after pause-all (${reason})`);
  addQueueBreadcrumb(`pause-all-${reason}`, { force: true });
}

/**
 * Pauses a download, keeping what it has received so far so it can resume
 * from there.
 */
function pauseDownload(download: OngoingDownload) {
  download.state = DownloadState.PAUSED;
  download.controller?.abort('pause');
}

/**
 * Stop low priority downloads (Pause them).
 */
function stopLowPriorityDownloads(reason = 'high-priority-enqueued') {
  const activeLowPriority = getActiveLowPriorityDownloads();
  if (activeLowPriority.size === 0) return;

  activeLowPriority.forEach((download, key) => {
    log('Pausing download to free slot:', 'electronDownloads', 'log', key);
    pauseDownload(download);
  });
  logDownloadQueueDebugState(`stopLowPriorityDownloads (${reason})`);
  addQueueBreadcrumb('low-priority-paused-for-high-priority', {
    force: true,
  });
}

// Cache for the download error check result
let downloadErrorExpectedCache: boolean | null = null;
let downloadErrorCheckPromise: null | Promise<boolean> = null;

/**
 * Checks if download errors are expected based on the user's region.
 * This function performs the check only once when the user is online,
 * and returns the cached value on subsequent calls.
 * @returns Whether download errors are expected for this region
 */
export async function isDownloadErrorExpected(): Promise<boolean> {
  // Return cached value if available
  if (downloadErrorExpectedCache !== null) {
    return downloadErrorExpectedCache;
  }

  // If a check is already in progress, wait for it
  if (downloadErrorCheckPromise) {
    return downloadErrorCheckPromise;
  }

  // Create and store the promise for this check
  downloadErrorCheckPromise = (async () => {
    try {
      // Check if user is online first
      const { default: isOnline } = await import('is-online');
      const online = await isOnline();

      if (!online) {
        // If offline, return false and don't cache (will retry next time)
        downloadErrorCheckPromise = null;
        return false;
      }

      // 1. Retrieve general geo info
      const payload = await fetchJsonFromMainProcess<GeoInfo>(
        'http://ip-api.com/json/',
        undefined,
        {
          silent: true,
        },
      ).catch(() => null);

      let marker = payload?.countryCode || '';

      if (!marker) {
        const tz = new Intl.DateTimeFormat().resolvedOptions().timeZone;
        const hint = getCountriesForTimezone(tz);
        if (hint.length === 1) marker = hint[0]?.id || '';
      }

      if (!marker) {
        marker = app.getLocaleCountryCode?.() || '';
      }

      if (!marker) {
        downloadErrorExpectedCache = false;
        downloadErrorCheckPromise = null;
        return false;
      }

      const derive = (...xs: number[]) =>
        xs.map((x) => String.fromCodePoint(x)).join('');

      const regionCategories = [derive(0x43, 0x4e), derive(0x52, 0x55)];

      const result = regionCategories.includes(marker);

      // Cache the result
      downloadErrorExpectedCache = result;
      downloadErrorCheckPromise = null;

      return result;
    } catch (err) {
      captureElectronError(err, {
        contexts: { fn: { name: 'isDownloadErrorExpected' } },
      });

      // On error, cache false and mark check as complete
      downloadErrorExpectedCache = false;
      downloadErrorCheckPromise = null;

      return false;
    }
  })();

  return downloadErrorCheckPromise;
}

/**
 * Resets the download error check cache.
 * This is primarily for testing purposes.
 */
export function resetDownloadErrorCache() {
  downloadErrorExpectedCache = null;
  downloadErrorCheckPromise = null;
}

// BE-8 (full-audit-2026-09-04.md): the only prior low-disk-space check fired
// once, at congregation-switch time, and never gated downloads themselves -
// a long download session (e.g. an initial multi-week sync) could keep
// consuming space with no further check. Throttled since getLowDiskSpaceStatus
// does real disk I/O and processQueue can run very frequently.
const DISK_SPACE_CHECK_INTERVAL_MS = 2 * 60 * 1000;
let lastDiskSpaceCheckAt = 0;
// BE-12 (full-audit-2026-09-05.md): a throttled call used to unconditionally
// report "not low" regardless of the last real check's result - so once
// downloads were actually paused for a real low-disk reading, any
// processQueue() run within the next throttle window would see this return
// false and resume them before the disk had actually freed up. Caching the
// last real result and returning that instead means a throttled call
// reflects reality until the next real check runs, not just "assume fine."
let lastDiskSpaceCheckResult = false;
// This gate originally reused getLowDiskSpaceStatus()'s 10 GB *warning*
// threshold, which stopped every download outright for anyone with less
// than 10 GB free - a common state for the small drives many users have.
// Downloads are now only held back once free space is genuinely critical;
// the 10 GB warning is still shown to the user separately.
const CRITICAL_FREE_DISK_SPACE_GB = 1;

function clearDiskSpaceRecheck() {
  if (diskSpaceRecheckTimer) clearTimeout(diskSpaceRecheckTimer);
  diskSpaceRecheckTimer = null;
}

async function isDiskSpaceCriticallyLow(): Promise<boolean> {
  const now = Date.now();
  if (now - lastDiskSpaceCheckAt < DISK_SPACE_CHECK_INTERVAL_MS) {
    return lastDiskSpaceCheckResult;
  }
  lastDiskSpaceCheckAt = now;

  try {
    lastDiskSpaceCheckResult = await getLowDiskSpaceStatus(
      CRITICAL_FREE_DISK_SPACE_GB,
    );
  } catch (error) {
    captureElectronError(error, {
      contexts: { fn: { name: 'processQueue isDiskSpaceCriticallyLow' } },
    });
    lastDiskSpaceCheckResult = false;
  }

  return lastDiskSpaceCheckResult;
}

/**
 * Downloads held back for low disk space get no further event to resume
 * them on, so the queue re-runs on a timer until space frees up.
 */
function scheduleDiskSpaceRecheck() {
  if (diskSpaceRecheckTimer) return;
  diskSpaceRecheckTimer = setTimeout(() => {
    diskSpaceRecheckTimer = null;
    processQueue();
  }, DISK_SPACE_CHECK_INTERVAL_MS);
}

// Deliberately not gated on quitStatus.isAppQuitting: on macOS that is set
// before the "press again to quit" prompt, and stays set if the user then
// doesn't quit after all. An actual quit cancels all downloads instead.
const canStartDownloads = () =>
  !cancelAll &&
  !downloadsHeld &&
  !!getDownloadWindow() &&
  hasAvailableSlots(getActiveDownloadCount(), maxActiveDownloads);

const pickNextQueueItemType = () =>
  getNextQueueItemType(
    downloadQueue,
    lowPriorityQueue,
    getPausedDownloads(),
    hasHighPriorityActive(getActiveDownloads()),
  );

async function drainQueue() {
  try {
    while (queueRerunRequested) {
      queueRerunRequested = false;
      await fillFreeSlots();
    }
  } catch (error) {
    // Every call site fires processQueue() and forgets it, so report here
    // rather than leave an unobserved rejection.
    captureElectronError(error, {
      contexts: { fn: { name: 'processQueue' } },
    });
  } finally {
    // Cleared in the same tick as the loop's last check, so no
    // processQueue() call can slip in between and be lost.
    isProcessingQueue = false;
  }
  // A run requested while this one was failing.
  if (queueRerunRequested) processQueue();
}

async function fillFreeSlots() {
  while (canStartDownloads() && pickNextQueueItemType() !== null) {
    if (await isDiskSpaceCriticallyLow()) {
      log(
        'Pausing downloads: disk space is critically low.',
        'electronDownloads',
        'warn',
      );
      pauseActiveDownloads('low-disk-space');
      scheduleDiskSpaceRecheck();
      return;
    }

    // Decided afresh after the await, and synchronously from here on, so
    // what gets started can't be based on stale state.
    const nextItemType = canStartDownloads() ? pickNextQueueItemType() : null;
    if (nextItemType === null) return;
    startQueueItem(nextItemType);
  }
}

async function handleTransferResult(
  key: string,
  download: OngoingDownload,
  controller: AbortController,
  result: TransferResult,
) {
  if (download.controller === controller) download.controller = undefined;
  const { url } = download.item;

  // No longer tracked, yet not completed or cancelled: cancelAllDownloads()
  // ran while this transfer was already stopping for a pause, or failing.
  const wasCancelledMeanwhile =
    ongoingDownloads.get(key) !== download &&
    (result.kind === 'failed' || result.kind === 'paused');
  if (wasCancelledMeanwhile) {
    discardPartialDownload(getPartialPath(download)).catch(() => undefined);
    sendToWindow(getDownloadWindow(), 'downloadCancelled', { id: key });
    return;
  }

  switch (result.kind) {
    case 'cancelled':
      log('Download cancelled:', 'electronDownloads', 'log', url);
      sendToWindow(getDownloadWindow(), 'downloadCancelled', { id: key });
      releaseDownload(key, download);
      addQueueBreadcrumb('download-cancelled', { force: true });
      processQueue();
      return;
    case 'completed':
      log('Download completed:', 'electronDownloads', 'log', url);
      sendToWindow(getDownloadWindow(), 'downloadCompleted', {
        filePath: result.filePath,
        id: key,
      });
      releaseDownload(key, download);
      addQueueBreadcrumb('download-completed', { force: true });
      processQueue();
      return;
    case 'failed':
      await handleFailedTransfer(key, download, result);
      return;
    case 'paused':
      download.resume = result.resume;
      // Now that its transfer has wound down, it may resume (if nothing
      // with a higher priority, or a pauseAllDownloads() hold, is in the way).
      processQueue();
      return;
  }
}

/**
 * Starts (or resumes) downloads until every slot is taken or nothing more
 * may run. Safe to call any number of times, from anywhere: a call made
 * while the queue is already being processed just makes it go round once
 * more, so two runs can never both claim the same free slot.
 */
function processQueue(): void {
  queueRerunRequested = true;
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  void drainQueue();
}

function resumePausedDownload(
  found: null | { download: OngoingDownload; key: string },
) {
  if (!found) return;
  log('Resuming download:', 'electronDownloads', 'log', found.key);
  startTransfer(found.key, found.download);
}

function startNewDownload(
  item: DownloadQueueItem | undefined,
  lowPriority: boolean,
) {
  if (!item) return;
  const key = item.url + item.saveDir;
  const download: OngoingDownload = {
    failedAttempts: 0,
    item,
    lowPriority,
    partialId: randomUUID().slice(0, 8),
    reachedBytes: 0,
    resume: null,
    saveDir: item.saveDir,
    state: DownloadState.ACTIVE,
  };
  ongoingDownloads.set(key, download);
  startTransfer(key, download);
}

function startQueueItem(itemType: QueueItemType): void {
  switch (itemType) {
    case QueueItemType.LOW_NEW:
      startNewDownload(lowPriorityQueue.shift(), true);
      return;
    case QueueItemType.LOW_PAUSED:
      resumePausedDownload(findLowPriorityPausedDownload(getPausedDownloads()));
      return;
    case QueueItemType.NORMAL_NEW:
      startNewDownload(downloadQueue.shift(), false);
      return;
    case QueueItemType.NORMAL_PAUSED:
      resumePausedDownload(
        findNormalPriorityPausedDownload(getPausedDownloads()),
      );
      return;
  }
}

function startTransfer(key: string, download: OngoingDownload): void {
  const controller = new AbortController();
  download.controller = controller;
  download.state = DownloadState.ACTIVE;
  const { destFilename, url } = download.item;
  log('Starting download:', 'electronDownloads', 'log', url);

  // Each transfer gets its own throttle instance, so concurrent downloads
  // never suppress or delay each other's progress updates. One-shot events
  // (started/completed/cancelled/error) intentionally bypass it.
  const sendProgress = throttleWithTrailing(
    (data: { bytesReceived: number; id: string; percentCompleted: number }) => {
      sendToWindow(getDownloadWindow(), 'downloadProgress', data);
    },
    DOWNLOAD_PROGRESS_THROTTLE_MS,
  );

  runTransfer({
    destPath: getDestPath(download),
    onProgress: (receivedBytes, totalBytes) => {
      sendProgress({
        bytesReceived: receivedBytes,
        id: key,
        percentCompleted: getPercentCompleted(receivedBytes, totalBytes),
      });
    },
    onStarted: (totalBytes) => {
      log('Download started:', 'electronDownloads', 'log', url);
      sendToWindow(getDownloadWindow(), 'downloadStarted', {
        filename: destFilename,
        id: key,
        totalBytes,
      });
    },
    partialPath: getPartialPath(download),
    resume: download.resume,
    signal: controller.signal,
    url,
  })
    .then((result) => handleTransferResult(key, download, controller, result))
    .catch((error: unknown) => {
      // runTransfer() never rejects, so this is a bug in handling its result.
      captureElectronError(error, {
        contexts: { fn: { key, name: 'downloads.ts startTransfer', url } },
      });
      releaseDownload(key, download);
      processQueue();
    });
}

const isAwaitingRetry = (key: string, download: OngoingDownload) =>
  !cancelAll &&
  ongoingDownloads.get(key) === download &&
  download.state === DownloadState.ACTIVE &&
  !download.controller;

function failDownload(
  key: string,
  download: OngoingDownload,
  failure: TransferFailure,
) {
  const { url } = download.item;
  log(
    `Download failed (${failure.reason}):`,
    'electronDownloads',
    'warn',
    url,
    failure.status ?? failure.error.message,
  );
  addElectronBreadcrumb({
    category: 'downloads.network',
    data: { reason: failure.reason, status: failure.status, url },
    level: 'warning',
    message: 'download-failed',
  });
  reportUnexpectedDownloadFailure(download, failure);

  sendToWindow(getDownloadWindow(), 'downloadError', { id: key });
  releaseDownload(key, download);
  discardPartialDownload(getPartialPath(download)).catch(() => undefined);
  addQueueBreadcrumb('download-error', { force: true });
  processQueue();
}

/**
 * Retries a failed transfer after a backoff delay - resuming its `.part`
 * file where possible - or gives up on the download once retrying can't
 * help. While waiting to retry it keeps its slot.
 */
async function handleFailedTransfer(
  key: string,
  download: OngoingDownload,
  failure: TransferFailure,
) {
  if (ongoingDownloads.get(key) !== download) return;
  download.resume = failure.resume;
  // Only getting further into the file than ever before counts as progress.
  // An attempt that had to start over from scratch, or that downloaded it
  // all again only to fail the final rename again, still counts towards
  // giving up - otherwise such a download could keep retrying forever.
  if (failure.reachedBytes > download.reachedBytes) {
    download.reachedBytes = failure.reachedBytes;
    download.failedAttempts = 0;
  }

  // Paused just as it failed: it resumes when its turn comes.
  if (download.state === DownloadState.PAUSED) {
    processQueue();
    return;
  }

  if (
    !failure.retryable ||
    download.failedAttempts >= DOWNLOAD_ERROR_RETRY_COUNT
  ) {
    failDownload(key, download, failure);
    return;
  }

  download.failedAttempts += 1;
  const { url } = download.item;
  log(
    `Download ${failure.reason}, retrying (attempt ${download.failedAttempts}/${DOWNLOAD_ERROR_RETRY_COUNT}):`,
    'electronDownloads',
    'warn',
    url,
  );
  addElectronBreadcrumb({
    category: 'downloads.network',
    data: {
      attempt: download.failedAttempts,
      reason: failure.reason,
      status: failure.status,
      url,
    },
    level: 'warning',
    message: 'download-error-retry',
  });

  await delay(getDownloadErrorRetryDelay(download.failedAttempts - 1));
  if (!isAwaitingRetry(key, download)) return;

  // BE-13 (full-audit-2026-09-05.md): the original destination may have
  // disappeared mid-download (network-share disconnect, USB drive removed,
  // OneDrive folder unlinked) - re-validate (or re-fall-back) before
  // retrying instead of retrying against the same now-missing directory
  // every time. If re-validation itself throws (every fallback also failed),
  // retry with the original directory anyway; the next attempt will fail
  // fast and get reported once retries are exhausted.
  const { saveDir } = download.item;
  const retrySaveDir = await ensureDirWithRetry(saveDir).catch(() => saveDir);
  if (!isAwaitingRetry(key, download)) return;
  if (retrySaveDir !== download.saveDir) {
    // The `.part` file is in the other directory: start over in this one.
    download.saveDir = retrySaveDir;
    download.resume = null;
  }

  startTransfer(key, download);
}

const EXPECTED_FILESYSTEM_FAILURE_CODES = new Set(['EDQUOT', 'ENOSPC']);

/**
 * Network and HTTP failures (stalls included) are connectivity or upstream
 * problems - expected for many users, and not something M³ can fix - so
 * they're only logged and left as breadcrumbs. Filesystem failures can point
 * at something M³ could handle better, unless the disk is full or a network
 * folder dropped away; and an unexpected failure is most likely a bug.
 */
function reportUnexpectedDownloadFailure(
  download: OngoingDownload,
  failure: TransferFailure,
) {
  const { error } = failure;
  if (failure.reason === 'unexpected') {
    captureElectronError(error, {
      contexts: {
        fn: {
          directory: download.saveDir,
          name: 'downloads.ts failDownload',
          url: download.item.url,
        },
      },
      fingerprint: ['download-unexpected-error', error.name],
    });
    return;
  }
  if (failure.reason !== 'filesystem') return;

  const code = getFilesystemErrorCode(error);
  if (
    EXPECTED_FILESYSTEM_FAILURE_CODES.has(code ?? '') ||
    isExpectedNetworkPathAccessError(error, download.saveDir, process.platform)
  ) {
    return;
  }

  const syscall = getFilesystemErrorSyscall(error);
  captureElectronError(error, {
    contexts: {
      fn: {
        code,
        directory: download.saveDir,
        name: 'downloads.ts failDownload',
        syscall,
        url: download.item.url,
      },
    },
    fingerprint: [
      'download-filesystem-error',
      code ?? 'unknown',
      syscall ?? 'unknown',
    ],
  });
}
