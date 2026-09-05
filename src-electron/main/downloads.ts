import type { ElectronDownloadManager as EDMType } from 'electron-dl-manager';

import { getCountriesForTimezone } from 'countries-and-timezones';
import { app, type BrowserWindow } from 'electron';
import { mkdir, stat } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { IS_DEMO_MODE } from 'src-electron/constants';
import { getLowDiskSpaceStatus } from 'src-electron/main/disk-space';
import { getFallbackDir } from 'src-electron/main/resilient-storage';
import { quitStatus } from 'src-electron/main/session';
import {
  addElectronBreadcrumb,
  captureElectronError,
  fetchJsonFromMainProcess,
} from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
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

interface EnsureDirAttemptDiagnostics {
  attempt: number;
  code?: string;
  dir: string;
  message: string;
  parentCode?: string;
  parentExists?: boolean;
  parentIsDirectory?: boolean;
  parentMessage?: string;
  parentPath: string;
}

interface ErrorWithDirectoryDiagnostics {
  downloadDirDiagnostics?: EnsureDirAttemptDiagnostics[];
}

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

interface OngoingDownload {
  cancelRequested?: boolean;
  item: DownloadQueueItem;
  lowPriority: boolean;
  pauseRequested?: boolean;
  state: DownloadState;
  uuid: string;
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
) => {
  if (typeof error !== 'object' || error === null) return;

  (error as ErrorWithDirectoryDiagnostics).downloadDirDiagnostics = diagnostics;
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

  attachDirectoryDiagnostics(lastError, diagnostics);
  throw lastError;
}

/**
 * Finds the next low priority paused download to resume
 */
function findLowPriorityPausedDownload(
  pausedDownloads: Map<string, OngoingDownload>,
): null | { download: OngoingDownload; key: string } {
  for (const [key, download] of pausedDownloads.entries()) {
    if (download.lowPriority && download.uuid) {
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
    if (!download.lowPriority && download.uuid) {
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
  const activeDownloads = getActiveDownloads();
  const pausedDownloads = getPausedDownloads();
  const activeDetails = Array.from(activeDownloads.entries()).map(
    ([key, download]) => ({
      hasUuid: !!download.uuid,
      key,
      lowPriority: download.lowPriority,
      pauseRequested: !!download.pauseRequested,
      state: download.state,
      url: download.item.url,
    }),
  );
  const pausedDetails = Array.from(pausedDownloads.entries()).map(
    ([key, download]) => ({
      hasUuid: !!download.uuid,
      key,
      lowPriority: download.lowPriority,
      pauseRequested: !!download.pauseRequested,
      state: download.state,
      url: download.item.url,
    }),
  );

  log(
    `Download queue debug snapshot (${reason})`,
    'electronDownloads',
    'warn',
    {
      activeCount: activeDownloads.size,
      activeDownloads: activeDetails,
      lowPriorityQueueLength: lowPriorityQueue.length,
      lowPriorityQueueTop: lowPriorityQueue[0]?.url,
      normalQueueLength: downloadQueue.length,
      normalQueueTop: downloadQueue[0]?.url,
      pausedCount: pausedDownloads.size,
      pausedDownloads: pausedDetails,
    },
  );
}

function logPausedDownloadsContext(reason: string): void {
  const pausedDownloads = getPausedDownloads();
  if (pausedDownloads.size === 0) return;

  const pausedDetails = Array.from(pausedDownloads.entries()).map(
    ([key, download]) => ({
      hasUuid: !!download.uuid,
      key,
      lowPriority: download.lowPriority,
      pauseRequested: !!download.pauseRequested,
      url: download.item.url,
    }),
  );

  log(
    `Paused downloads snapshot (${reason})`,
    'electronDownloads',
    'warn',
    pausedDetails,
  );
}

/**
 * Logs queue blocking reasons for debugging
 */
function logQueueBlockReason(
  itemType: null | QueueItemType,
  hasHighPriorityActiveDownload: boolean,
): void {
  if (itemType === null && hasHighPriorityActiveDownload) {
    log(
      'High priority active. Not processing low priority items.',
      'electronDownloads',
      'log',
    );
  }
}

/**
 * Attempts to resume a paused download
 */
async function resumeDownload(
  manager: EDMType,
  download: OngoingDownload,
  key: string,
  ongoingDownloads: Map<string, OngoingDownload>,
): Promise<boolean> {
  try {
    download.state = DownloadState.ACTIVE;
    manager.resumeDownload(download.uuid);
    return true;
  } catch (error) {
    // Failed to resume, remove from ongoing
    ongoingDownloads.delete(key);
    captureElectronError(error, {
      contexts: {
        fn: {
          download,
          key,
          name: 'download-queue-helpers.ts resumeDownload',
        },
      },
    });
    return false;
  }
}

const downloadQueue: DownloadQueueItem[] = [];
const lowPriorityQueue: DownloadQueueItem[] = [];
const ongoingDownloads = new Map<string, OngoingDownload>();
const maxActiveDownloads = 3;

// `electron-dl-manager` fires `onDownloadProgress` on every native
// `DownloadItem 'updated'` event with no internal throttling. With up to
// `maxActiveDownloads` downloads running at once that can drive a near-
// continuous stream of progress IPC into the renderer, where each message
// mutates the Pinia `current-state` store (invalidating every bound
// getter/component). Sending at most one progress update per throttle
// window per download (with a trailing update carrying the latest byte
// count) keeps that reactivity churn bounded while the progress bar still
// advances smoothly.
export const DOWNLOAD_PROGRESS_THROTTLE_MS = 200;
let cancelAll = false;
const QUEUE_BREADCRUMB_MIN_INTERVAL_MS = 5000;
let lastQueueBreadcrumbAt = 0;
let lastQueueSnapshot = '';

let manager: EDMType | null = null;

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

const loadElectronDownloadManager: () => Promise<EDMType | null> = async () => {
  if (!getDownloadWindow()) return null; // window is closed

  if (manager) return manager; // already initialized

  const { ElectronDownloadManager } = await import('electron-dl-manager');

  // instantiate once and reuse
  manager = new ElectronDownloadManager();
  return manager;
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
  const manager = await loadElectronDownloadManager();
  if (!manager) return;

  cancelAll = true;
  downloadQueue.length = 0;
  lowPriorityQueue.length = 0;

  for (const [key, download] of ongoingDownloads) {
    if (download.uuid) {
      try {
        manager.cancelDownload(download.uuid);
      } catch (error) {
        captureElectronError(error, {
          contexts: {
            fn: {
              download,
              name: 'downloads.ts cancelAllDownloads',
            },
          },
        });
      }
      ongoingDownloads.delete(key);
    } else {
      // Still initializing: manager.download() hasn't resolved a uuid yet,
      // so there's nothing to hand to manager.cancelDownload() right now.
      // Flag it so startDownload's post-await continuation cancels it the
      // moment the uuid arrives, instead of losing track of it here and
      // letting it keep downloading in the background after "cancel all."
      download.cancelRequested = true;
    }
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
    // gains an entry once startDownload actually runs - see BE-4 in
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
          directoryDiagnostics: (error as ErrorWithDirectoryDiagnostics)
            .downloadDirDiagnostics,
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
  const manager = await loadElectronDownloadManager();
  if (!manager) return null;

  // Check if it's in progress
  const ongoing = ongoingDownloads.get(downloadId);
  if (ongoing) {
    if (ongoing.uuid) {
      return (
        manager.getDownloadData(ongoing.uuid)?.isDownloadCompleted() || false
      );
    }
    // If it's in ongoing but has no uuid yet, it's still initializing/queued
    return false;
  }

  // Check if it's still in one of the queues
  const isInQueue =
    downloadQueue.some((d) => d.url + d.saveDir === downloadId) ||
    lowPriorityQueue.some((d) => d.url + d.saveDir === downloadId);

  if (isInQueue) {
    return false;
  }

  // If it's not ongoing and not in queue, it must have finished (or failed and been removed)
  return true;
}

/**
 * Pause all active downloads.
 */
export async function pauseAllDownloads(reason = 'manual') {
  const loadedManager = await loadElectronDownloadManager();
  if (!loadedManager) return;

  const activeDownloads = getActiveDownloads();
  if (activeDownloads.size === 0) {
    log(
      `pauseAllDownloads called (${reason}) but there were no active downloads`,
      'electronDownloads',
      'log',
    );
    return;
  }

  log(
    `Pausing ${activeDownloads.size} active downloads (${reason})`,
    'electronDownloads',
    'warn',
  );
  logDownloadQueueDebugState(`before pause-all (${reason})`);

  activeDownloads.forEach((download, key) => {
    if (!download.uuid) {
      download.pauseRequested = true;
      download.state = DownloadState.PAUSED;
      log(
        `Pause requested before uuid assignment (${reason})`,
        'electronDownloads',
        'warn',
        key,
        download.item.url,
      );
      return;
    }

    try {
      download.state = DownloadState.PAUSED;
      loadedManager.pauseDownload(download.uuid);
      log(
        `Paused download (${reason})`,
        'electronDownloads',
        'warn',
        key,
        download.item.url,
      );
    } catch (error) {
      captureElectronError(error, {
        contexts: {
          fn: {
            download,
            key,
            name: 'downloads.ts pauseAllDownloads',
            reason,
          },
        },
      });
    }
  });

  logDownloadQueueDebugState(`after pause-all (${reason})`);
  addQueueBreadcrumb(`pause-all-${reason}`, { force: true });
}

/**
 * Attempts to resume every paused download and kick queue processing.
 */
export async function resumeAllDownloads(reason = 'manual') {
  const loadedManager = await loadElectronDownloadManager();
  if (!loadedManager) return;

  const pausedDownloads = getPausedDownloads();
  if (pausedDownloads.size === 0) {
    log(
      `resumeAllDownloads called (${reason}) but there were no paused downloads`,
      'electronDownloads',
      'log',
    );
    processQueue();
    return;
  }

  log(
    `Resuming ${pausedDownloads.size} paused downloads (${reason})`,
    'electronDownloads',
    'warn',
  );
  logPausedDownloadsContext(`before resume-all (${reason})`);

  pausedDownloads.forEach((download, key) => {
    // If pause was requested before uuid assignment, clear the request.
    if (download.pauseRequested) {
      download.pauseRequested = false;
    }

    if (!download.uuid) {
      log(
        `Cannot resume paused download without uuid (${reason})`,
        'electronDownloads',
        'warn',
        key,
        download.item.url,
      );
      return;
    }

    try {
      download.state = DownloadState.ACTIVE;
      loadedManager.resumeDownload(download.uuid);
    } catch (error) {
      captureElectronError(error, {
        contexts: {
          fn: {
            download,
            key,
            name: 'downloads.ts resumeAllDownloads',
            reason,
          },
        },
      });
    }
  });

  addQueueBreadcrumb(`resume-all-${reason}`, { force: true });
  processQueue();
}

/**
 * Stop low priority downloads (Pause them).
 */
function stopLowPriorityDownloads(reason = 'high-priority-enqueued') {
  const activeLowPriority = getActiveLowPriorityDownloads();
  let pausedAny = false;
  activeLowPriority.forEach((download, key) => {
    log(
      'Pausing download to free slot:',
      'electronDownloads',
      'log',
      download.uuid || 'no-uuid',
      key,
    );
    if (!manager) return;

    if (download.uuid) {
      try {
        download.state = DownloadState.PAUSED;
        manager.pauseDownload(download.uuid);
        pausedAny = true;
      } catch (error) {
        captureElectronError(error, {
          contexts: {
            fn: {
              download,
              key,
              name: 'downloads.ts stopLowPriorityDownloads',
            },
          },
        });
      }
    } else {
      // UUID is not available yet; request pause once the manager returns it
      download.pauseRequested = true;
    }
  });
  if (pausedAny) {
    logPausedDownloadsContext(`stopLowPriorityDownloads (${reason})`);
    logDownloadQueueDebugState(`stopLowPriorityDownloads (${reason})`);
    addQueueBreadcrumb('low-priority-paused-for-high-priority', {
      force: true,
    });
  }
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

/**
 * Continues processing if slots are available
 */
function continueProcessingIfAvailable(): void {
  if (hasAvailableSlots(getActiveDownloadCount(), maxActiveDownloads)) {
    processQueue(); // Don't await - let it run async
  }
}

/**
 * Processes a low priority new download
 */
async function processLowNewDownload(): Promise<void> {
  const download = lowPriorityQueue.shift();
  if (!download) return;
  await startDownload(download, true);
}

/**
 * Processes a low priority paused download (resume)
 */
async function processLowPausedDownload(
  loadedManager: EDMType,
  pausedDownloads: Map<string, OngoingDownload>,
): Promise<boolean> {
  const found = findLowPriorityPausedDownload(pausedDownloads);
  if (!found) return false;

  const { download, key } = found;
  const success = await resumeDownload(
    loadedManager,
    download,
    key,
    ongoingDownloads,
  );
  return success;
}

/**
 * Processes a normal priority new download
 */
async function processNormalNewDownload(): Promise<void> {
  const download = downloadQueue.shift();
  if (!download) return;
  await startDownload(download, false);
}

/**
 * Processes a normal priority paused download (resume)
 */
async function processNormalPausedDownload(
  loadedManager: EDMType,
  pausedDownloads: Map<string, OngoingDownload>,
): Promise<boolean> {
  const found = findNormalPriorityPausedDownload(pausedDownloads);
  if (!found) return false;

  const { download, key } = found;
  const success = await resumeDownload(
    loadedManager,
    download,
    key,
    ongoingDownloads,
  );
  return success;
}

// BE-8 (full-audit-2026-09-04.md): the only prior low-disk-space check fired
// once, at congregation-switch time, and never gated downloads themselves -
// a long download session (e.g. an initial multi-week sync) could keep
// consuming space with no further check. Throttled since getLowDiskSpaceStatus
// does real disk I/O and processQueue can run very frequently.
const DISK_SPACE_CHECK_INTERVAL_MS = 2 * 60 * 1000;
let lastDiskSpaceCheckAt = 0;

async function isDiskSpaceCriticallyLow(): Promise<boolean> {
  const now = Date.now();
  if (now - lastDiskSpaceCheckAt < DISK_SPACE_CHECK_INTERVAL_MS) return false;
  lastDiskSpaceCheckAt = now;

  try {
    return await getLowDiskSpaceStatus();
  } catch (error) {
    captureElectronError(error, {
      contexts: { fn: { name: 'processQueue isDiskSpaceCriticallyLow' } },
    });
    return false;
  }
}

/**
 * Processes the download queue.
 * This function is called when a new download is added to the queue.
 * It will start downloading as many files as possible, up to the maximum limit.
 */
async function processQueue() {
  try {
    const loadedManager = await loadElectronDownloadManager();
    if (!getDownloadWindow() || cancelAll || !loadedManager) return;

    const activeCount = getActiveDownloadCount();

    // Exit early if max active downloads reached
    if (!hasAvailableSlots(activeCount, maxActiveDownloads)) {
      log(
        'Queue full. Active:',
        'electronDownloads',
        'log',
        activeCount,
        'Max:',
        maxActiveDownloads,
      );
      return;
    }

    // Determine what to process next
    const activeDownloads = getActiveDownloads();
    const pausedDownloads = getPausedDownloads();
    const highPriorityActive = hasHighPriorityActive(activeDownloads);

    const nextItemType = getNextQueueItemType(
      downloadQueue,
      lowPriorityQueue,
      pausedDownloads,
      highPriorityActive,
    );

    // Log blocking reasons for debugging
    logQueueBlockReason(nextItemType, highPriorityActive);

    // Nothing to process
    if (nextItemType === null) {
      if (activeCount === 0 && pausedDownloads.size > 0) {
        log(
          'Queue is stalled: no active downloads but paused downloads exist. Triggering auto-resume.',
          'electronDownloads',
          'warn',
        );
        logPausedDownloadsContext('auto-resume-stalled-queue');
        logDownloadQueueDebugState('auto-resume-stalled-queue');
        await resumeAllDownloads('auto-stalled-queue');
      }
      return;
    }

    if (await isDiskSpaceCriticallyLow()) {
      log(
        'Pausing downloads: disk space is critically low.',
        'electronDownloads',
        'warn',
      );
      await pauseAllDownloads('low-disk-space');
      return;
    }

    // Process the next item
    const success = await processQueueItem(
      nextItemType,
      loadedManager,
      pausedDownloads,
    );

    // If processing failed (e.g., resume failed), try again
    if (!success) {
      processQueue();
      return;
    }

    // Continue processing if slots available
    continueProcessingIfAvailable();
  } catch (error) {
    // Every call site invokes processQueue() fire-and-forget; without this,
    // a failure here (e.g. loadElectronDownloadManager's dynamic import
    // failing) is an unobserved rejection with no Sentry visibility.
    captureElectronError(error, {
      contexts: { fn: { name: 'processQueue' } },
    });
  }
}

/**
 * Processes the next item in the queue based on type
 */
async function processQueueItem(
  itemType: QueueItemType,
  loadedManager: EDMType,
  pausedDownloads: Map<string, OngoingDownload>,
): Promise<boolean> {
  switch (itemType) {
    case QueueItemType.LOW_NEW:
      await processLowNewDownload();
      return true;

    case QueueItemType.LOW_PAUSED:
      return await processLowPausedDownload(loadedManager, pausedDownloads);

    case QueueItemType.NORMAL_NEW:
      await processNormalNewDownload();
      return true;

    case QueueItemType.NORMAL_PAUSED:
      return await processNormalPausedDownload(loadedManager, pausedDownloads);

    default:
      return false;
  }
}

async function startDownload(
  download: DownloadQueueItem,
  isLowPriority: boolean,
) {
  const { destFilename, saveDir, url } = download;
  const key = url + saveDir;
  const downloadWindow = getDownloadWindow();

  if (!downloadWindow || !manager || cancelAll) return;

  ongoingDownloads.set(key, {
    item: download,
    lowPriority: isLowPriority,
    state: DownloadState.ACTIVE,
    uuid: '',
  });

  try {
    log('Starting download via manager:', 'electronDownloads', 'log', url);

    // Each download gets its own throttle instance, so concurrent downloads
    // never suppress or delay each other's progress updates. One-shot events
    // (started/completed/cancelled/error) intentionally bypass it.
    const sendProgress = throttleWithTrailing(
      (data: {
        bytesReceived: number;
        id: string;
        percentCompleted: number;
      }) => {
        sendToWindow(downloadWindow, 'downloadProgress', data);
      },
      DOWNLOAD_PROGRESS_THROTTLE_MS,
    );

    const downloadId = await manager.download({
      callbacks: {
        onDownloadCancelled: async () => {
          log('Download cancelled:', 'electronDownloads', 'log', url);
          sendToWindow(downloadWindow, 'downloadCancelled', {
            id: key,
          });
          ongoingDownloads.delete(key);
          addQueueBreadcrumb('download-cancelled', { force: true });
          processQueue();
        },
        onDownloadCompleted: async ({ item }) => {
          log('Download completed:', 'electronDownloads', 'log', url);
          sendToWindow(downloadWindow, 'downloadCompleted', {
            filePath: item.getSavePath(),
            id: key,
          });
          ongoingDownloads.delete(key);
          addQueueBreadcrumb('download-completed', { force: true });
          processQueue();
        },
        onDownloadProgress: async ({ item, percentCompleted }) => {
          sendProgress({
            bytesReceived: item.getReceivedBytes(),
            id: key,
            percentCompleted,
          });
        },
        onDownloadStarted: async ({ item, resolvedFilename }) => {
          log('Download started:', 'electronDownloads', 'log', url);
          sendToWindow(downloadWindow, 'downloadStarted', {
            filename: resolvedFilename,
            id: key,
            totalBytes: item.getTotalBytes(),
          });
        },
        onError: async (err, downloadData) => {
          if (isDestroyedObjectError(err)) {
            ongoingDownloads.delete(key);
            addQueueBreadcrumb('download-window-destroyed', { force: true });
            processQueue();
            return;
          }
          if (quitStatus.isAppQuitting) return;
          log('Download error:', 'electronDownloads', 'log', url);
          captureElectronError(err, {
            contexts: {
              fn: {
                isDownloadErrorExpected: await isDownloadErrorExpected(),
                name: 'src-electron/downloads startDownload onError',
                params: {
                  destFilename,
                  directory: saveDir,
                  window: mainWindowInfo.mainWindow?.id,
                },
                url,
              },
            },
          });
          if (downloadData) {
            sendToWindow(downloadWindow, 'downloadError', {
              id: key,
            });
          }
          ongoingDownloads.delete(key);
          addQueueBreadcrumb('download-error', { force: true });
          processQueue();
        },
      },
      directory: saveDir,
      saveAsFilename: destFilename,
      url,
      window: downloadWindow,
    });

    const current = ongoingDownloads.get(key);
    if (current) {
      current.uuid = downloadId;

      // If cancel-all was requested while initializing (race condition),
      // cancel now instead of letting an untracked download keep running in
      // the background. manager.cancelDownload() triggers the same
      // onDownloadCancelled callback registered above, which handles
      // cleanup/notification/queue-processing consistently with a normal
      // cancel - no need to duplicate that here.
      if (current.cancelRequested) {
        manager.cancelDownload(downloadId);
        log(
          'Applied deferred cancel to initializing download',
          'electronDownloads',
          'warn',
          key,
          url,
        );
        return;
      }

      // If pause was requested while initializing (race condition), pause now
      if (current.pauseRequested) {
        current.pauseRequested = false;
        current.state = DownloadState.PAUSED;
        manager.pauseDownload(downloadId);
        log(
          'Applied deferred pause to initializing download',
          'electronDownloads',
          'warn',
          key,
          url,
        );
        processQueue();
      }
    }
  } catch (error) {
    if (isDestroyedObjectError(error) || cancelAll) {
      ongoingDownloads.delete(key);
      addQueueBreadcrumb('download-window-destroyed', { force: true });
      processQueue();
      return;
    }
    if (quitStatus.isAppQuitting) return;
    captureElectronError(error, {
      contexts: {
        fn: {
          name: 'src-electron/downloads startDownload catch',
          params: {
            destFilename,
            directory: saveDir,
            window: mainWindowInfo.mainWindow?.id,
          },
          url,
        },
      },
    });
    ongoingDownloads.delete(key);
    processQueue();
  }
}
