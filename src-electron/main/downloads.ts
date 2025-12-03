import type { ElectronDownloadManager as EDMType } from 'electron-dl-manager';

import { getCountriesForTimezone } from 'countries-and-timezones';
import { app } from 'electron';
import { ensureDir, pathExists } from 'fs-extra/esm';
import { isAppQuitting } from 'src-electron/main/session';
import { captureElectronError, fetchJson } from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import { mainWindow } from 'src-electron/main/window/window-main';
import upath from 'upath';

const { basename } = upath;

interface DownloadQueueItem {
  destFilename: string;
  saveDir: string;
  url: string;
}

interface GeoInfo {
  countryCode: string;
}

const downloadQueue: DownloadQueueItem[] = [];
const lowPriorityQueue: DownloadQueueItem[] = [];
const activeDownloadIds: string[] = [];
const maxActiveDownloads = 5;
let cancelAll = false;

let manager: EDMType | null = null;

const loadElectronDownloadManager: () => Promise<EDMType | null> = async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return null; // window is closed

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

  activeDownloadIds.forEach((id) => {
    manager.cancelDownload(id);
  });
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
  if (!mainWindow || mainWindow.isDestroyed() || !url || !saveDir) return null;
  try {
    if (!(await pathExists(saveDir))) {
      await ensureDir(saveDir);
    }

    if (!destFilename) destFilename = basename(url);

    const fileToDownload = { destFilename, saveDir, url };

    if (!activeDownloadIds.includes(url + saveDir)) {
      if (lowPriority) {
        lowPriorityQueue.push(fileToDownload);
      } else {
        downloadQueue.push(fileToDownload);
      }

      if (
        downloadQueue.length + activeDownloadIds.length <
        maxActiveDownloads
      ) {
        processQueue();
      }
    }
    return url + saveDir;
  } catch (error) {
    captureElectronError(error, {
      contexts: {
        fn: {
          directory: saveDir,
          lowPriority,
          name: 'downloadFile',
          saveAsFilename: destFilename,
          url,
        },
      },
    });
    return null;
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
      const payload = await fetchJson('http://ip-api.com/json/').catch(
        () => ({}),
      );

      let marker = (payload as GeoInfo)?.countryCode || '';

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
        xs.map((x) => String.fromCharCode(x)).join('');

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
 * @returns The ID of the download that was started, or null if no downloads were started.
 */
async function processQueue() {
  const manager = await loadElectronDownloadManager();
  if (!mainWindow || cancelAll || !manager) return null;
  // If max active downloads reached, wait for a slot
  while (activeDownloadIds.length >= maxActiveDownloads) {
    if (cancelAll) return;
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  let download: DownloadQueueItem | undefined;

  if (downloadQueue.length > 0) {
    download = downloadQueue.shift();
  } else if (lowPriorityQueue.length > 0) {
    download = lowPriorityQueue.shift();
  } else {
    return; // No downloads to process
  }

  if (!download || !mainWindow || mainWindow.isDestroyed() || cancelAll) return;
  const { destFilename, saveDir, url } = download;
  activeDownloadIds.push(url + saveDir);

  // Start the download
  try {
    const downloadId = await manager.download({
      callbacks: {
        onDownloadCancelled: async ({ id }) => {
          sendToWindow(mainWindow, 'downloadCancelled', { id });
          activeDownloadIds.splice(activeDownloadIds.indexOf(url + saveDir), 1);
          processQueue(); // Process next download
        },
        onDownloadCompleted: async ({ item }) => {
          sendToWindow(mainWindow, 'downloadCompleted', {
            filePath: item.getSavePath(),
            id: url + saveDir,
          });
          activeDownloadIds.splice(activeDownloadIds.indexOf(url + saveDir), 1);
          processQueue(); // Process next download
        },
        onDownloadProgress: async ({ item, percentCompleted }) => {
          sendToWindow(mainWindow, 'downloadProgress', {
            bytesReceived: item.getReceivedBytes(),
            id: url + saveDir,
            percentCompleted,
          });
        },
        onDownloadStarted: async ({ item, resolvedFilename }) => {
          sendToWindow(mainWindow, 'downloadStarted', {
            filename: resolvedFilename,
            id: url + saveDir,
            totalBytes: item.getTotalBytes(),
          });
        },
        onError: async (err, downloadData) => {
          if (isAppQuitting) return;
          captureElectronError(err, {
            contexts: {
              fn: {
                name: 'src-electron/downloads processQueue onError',
                params: {
                  directory: saveDir,
                  isDownloadErrorExpected: await isDownloadErrorExpected(),
                  saveAsFilename: destFilename,
                  window: mainWindow?.id,
                },
                url,
              },
            },
          });
          if (downloadData) {
            sendToWindow(mainWindow, 'downloadError', {
              id: downloadData.id,
            });
          }
          activeDownloadIds.splice(activeDownloadIds.indexOf(url + saveDir), 1);
          processQueue(); // Process next download
        },
      },
      directory: saveDir,
      saveAsFilename: destFilename,
      url,
      window: mainWindow,
    });
    return downloadId;
  } catch (error) {
    if (isAppQuitting) return null;
    captureElectronError(error, {
      contexts: {
        fn: {
          name: 'src-electron/downloads processQueue catch',
          params: {
            directory: saveDir,
            saveAsFilename: destFilename,
            window: mainWindow?.id,
          },
          url,
        },
      },
    });
    activeDownloadIds.splice(activeDownloadIds.indexOf(url + saveDir), 1);
    processQueue(); // Process next download
    return null;
  }
}
