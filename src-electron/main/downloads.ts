import type { ElectronDownloadManager as EDMType } from 'electron-dl-manager';

import { getCountriesForTimezone } from 'countries-and-timezones';
import { app } from 'electron';
import { ensureDir } from 'fs-extra/esm';
import { quitStatus } from 'src-electron/main/session';
import { captureElectronError, fetchJson } from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import upath from 'upath';

const { basename } = upath;

enum DownloadState {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
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
  item: DownloadQueueItem;
  lowPriority: boolean;
  state: DownloadState;
  uuid: string;
}

const downloadQueue: DownloadQueueItem[] = [];
const lowPriorityQueue: DownloadQueueItem[] = [];
const ongoingDownloads = new Map<string, OngoingDownload>();
const maxActiveDownloads = 3;
let cancelAll = false;

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

const loadElectronDownloadManager: () => Promise<EDMType | null> = async () => {
  if (!mainWindowInfo.mainWindow || mainWindowInfo.mainWindow.isDestroyed())
    return null; // window is closed

  if (manager) return manager; // already initialized

  const { ElectronDownloadManager } = await import('electron-dl-manager');

  // instantiate once and reuse
  manager = new ElectronDownloadManager();
  return manager;
};

/**
 * Cancels all downloads.
 */
export async function cancelAllDownloads() {
  const manager = await loadElectronDownloadManager();
  if (!manager) return;

  cancelAll = true;
  downloadQueue.length = 0;
  lowPriorityQueue.length = 0;

  ongoingDownloads.forEach((download) => {
    if (download.uuid) {
      try {
        manager?.cancelDownload(download.uuid);
      } catch (error) {
        captureElectronError(error, {
          contexts: {
            fn: {
              name: 'downloads.ts cancelAllDownloads',
              params: {
                download,
              },
            },
          },
        });
      }
    }
  });

  ongoingDownloads.clear();
}

/**
 * Downloads a file from the specified URL to the specified directory.
 * @param url The URL of the file to download.
 * @param saveDir The directory to save the file to.
 * @param destFilename The name of the file to save as.
 * @param lowPriority Whether to download the file at a low priority.
 * @returns The url concatenated with saveDir, or null if the download failed.
 */
export async function downloadFile(
  url: string,
  saveDir: string,
  destFilename?: string,
  lowPriority = false,
) {
  if (
    !mainWindowInfo.mainWindow ||
    mainWindowInfo.mainWindow.isDestroyed() ||
    !url ||
    !saveDir
  )
    return null;
  try {
    await ensureDir(saveDir);

    if (!destFilename) destFilename = basename(url);

    const fileToDownload = { destFilename, saveDir, url };
    const key = url + saveDir;

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
      }

      return key;
    }

    // New Download
    if (lowPriority) {
      lowPriorityQueue.push(fileToDownload);
    } else {
      // Stop low priority downloads to make room for high priority
      stopLowPriorityDownloads();
      downloadQueue.push(fileToDownload);
    }

    console.log('fileToDownload', fileToDownload, 'lowPriority', lowPriority);

    // Trigger queue processing
    processQueue();

    return key;
  } catch (error) {
    captureElectronError(error, {
      contexts: {
        fn: {
          directory: saveDir,
          lowPriority,
          name: 'downloads.ts downloadFile',
          saveAsFilename: destFilename,
          url,
        },
      },
    });
    return null;
  }
}

/**
 * Stop low priority downloads (Pause them).
 */
function stopLowPriorityDownloads() {
  const activeLowPriority = getActiveLowPriorityDownloads();
  activeLowPriority.forEach((download, key) => {
    console.log(
      'Pausing download to free slot:',
      download.uuid || 'no-uuid',
      key,
    );
    if (!manager) return;

    // Always mark as PAUSED so if the download ID comes in later, it catches it
    download.state = DownloadState.PAUSED;

    if (download.uuid) {
      try {
        manager.pauseDownload(download.uuid);
      } catch (error) {
        captureElectronError(error, {
          contexts: {
            fn: {
              name: 'downloads.ts stopLowPriorityDownloads',
              params: {
                download,
                key,
              },
            },
          },
        });
      }
    }
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
      const payload = await fetchJson<GeoInfo>(
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
 * Processes the download queue.
 * This function is called when a new download is added to the queue.
 * It will start downloading as many files as possible, up to the maximum limit.
 */
async function processQueue() {
  const loadedManager = await loadElectronDownloadManager();
  if (!mainWindowInfo.mainWindow || cancelAll || !loadedManager) return;

  const activeCount = getActiveDownloadCount();

  // If max active downloads reached, exit and wait for completion callback to trigger next processing
  if (activeCount >= maxActiveDownloads) {
    console.log('Queue full. Active:', activeCount, 'Max:', maxActiveDownloads);
    return;
  }

  // Priority:
  // 1. Normal Queue (New)
  // 2. Paused Downloads (Resume) - Prefer Normal paused, then Low paused
  // 3. Low Priority Queue (New)

  if (downloadQueue.length > 0) {
    const download = downloadQueue.shift();
    if (!download) return;
    await startDownload(download, false);
    // Process next in queue if slots available
    if (getActiveDownloadCount() < maxActiveDownloads) {
      processQueue(); // Don't await - let it run async
    }
    return;
  }

  // Check if active high priority download exists
  const activeDownloads = getActiveDownloads();
  const highPriorityActive = Array.from(activeDownloads.values()).some(
    (d) => !d.lowPriority,
  );

  // Check for paused items to resume
  const pausedDownloads = getPausedDownloads();
  if (pausedDownloads.size > 0) {
    let resumeKey: null | string = null;
    let resumeDownload: null | OngoingDownload = null;

    // Look for normal priority in paused
    for (const [key, download] of pausedDownloads.entries()) {
      if (!download.lowPriority && download.uuid) {
        resumeKey = key;
        resumeDownload = download;
        break;
      }
    }

    // If no normal, take any (Low) BUT ONLY IF NO HIGH PRIORITY ACTIVE
    if (!resumeKey) {
      if (highPriorityActive) {
        console.log(
          'High priority active. Not resuming low priority paused downloads.',
        );
      } else {
        for (const [key, download] of pausedDownloads.entries()) {
          if (download.uuid) {
            resumeKey = key;
            resumeDownload = download;
            break;
          }
        }
      }
    }

    if (resumeKey && resumeDownload) {
      try {
        resumeDownload.state = DownloadState.ACTIVE;
        loadedManager.resumeDownload(resumeDownload.uuid);
        // Process next in queue if slots available
        if (getActiveDownloadCount() < maxActiveDownloads) {
          processQueue(); // Don't await - let it run async
        }
      } catch (e) {
        // failed to resume, remove from ongoing
        ongoingDownloads.delete(resumeKey);
        captureElectronError(e, {
          contexts: {
            fn: {
              name: 'downloads.ts processQueue resume',
              params: {
                resumeDownload,
                resumeKey,
              },
            },
          },
        });
        // Try processing queue again
        processQueue();
      }
      return;
    }
  }

  if (lowPriorityQueue.length > 0) {
    if (highPriorityActive) {
      console.log(
        'High priority active. Not starting new low priority downloads.',
      );
      return;
    }
    // Only start low priority if we didn't start anything else
    const download = lowPriorityQueue.shift();
    if (!download) return;
    await startDownload(download, true);
    // Process next in queue if slots available
    if (getActiveDownloadCount() < maxActiveDownloads) {
      processQueue(); // Don't await - let it run async
    }
  }
}

async function startDownload(
  download: DownloadQueueItem,
  isLowPriority: boolean,
) {
  const { destFilename, saveDir, url } = download;
  const key = url + saveDir;

  if (!mainWindowInfo.mainWindow || !manager) return;

  ongoingDownloads.set(key, {
    item: download,
    lowPriority: isLowPriority,
    state: DownloadState.ACTIVE,
    uuid: '',
  });

  try {
    console.log('Starting download via manager:', url);
    const downloadId = await manager.download({
      callbacks: {
        onDownloadCancelled: async () => {
          sendToWindow(mainWindowInfo.mainWindow, 'downloadCancelled', {
            id: key,
          });
          ongoingDownloads.delete(key);
          processQueue();
        },
        onDownloadCompleted: async ({ item }) => {
          sendToWindow(mainWindowInfo.mainWindow, 'downloadCompleted', {
            filePath: item.getSavePath(),
            id: key,
          });
          ongoingDownloads.delete(key);
          processQueue();
        },
        onDownloadProgress: async ({ item, percentCompleted }) => {
          sendToWindow(mainWindowInfo.mainWindow, 'downloadProgress', {
            bytesReceived: item.getReceivedBytes(),
            id: key,
            percentCompleted,
          });
        },
        onDownloadStarted: async ({ item, resolvedFilename }) => {
          sendToWindow(mainWindowInfo.mainWindow, 'downloadStarted', {
            filename: resolvedFilename,
            id: key,
            totalBytes: item.getTotalBytes(),
          });
        },
        onError: async (err, downloadData) => {
          if (quitStatus.isAppQuitting) return;
          captureElectronError(err, {
            contexts: {
              fn: {
                name: 'src-electron/downloads startDownload onError',
                params: {
                  directory: saveDir,
                  isDownloadErrorExpected: await isDownloadErrorExpected(),
                  saveAsFilename: destFilename,
                  window: mainWindowInfo.mainWindow?.id,
                },
                url,
              },
            },
          });
          if (downloadData) {
            sendToWindow(mainWindowInfo.mainWindow, 'downloadError', {
              id: key,
            });
          }
          ongoingDownloads.delete(key);
          processQueue();
        },
      },
      directory: saveDir,
      saveAsFilename: destFilename,
      url,
      window: mainWindowInfo.mainWindow,
    });

    const current = ongoingDownloads.get(key);
    if (current) {
      current.uuid = downloadId;

      // If it was paused while initializing (race condition), pause it now
      if (current.state === DownloadState.PAUSED) {
        manager.pauseDownload(downloadId);
      }
    }
  } catch (error) {
    if (quitStatus.isAppQuitting) return;
    captureElectronError(error, {
      contexts: {
        fn: {
          name: 'src-electron/downloads startDownload catch',
          params: {
            directory: saveDir,
            saveAsFilename: destFilename,
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
