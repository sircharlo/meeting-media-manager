import type { ElectronApi } from 'src/types';

import { contextBridge, webUtils } from 'electron/renderer';
import fs from 'fs-extra';
import path from 'upath';

import { initCloseListeners } from './preload/close';
import {
  convertHeic,
  convertPdfToImages,
  decompress,
  getNrOfPdfPages,
} from './preload/converters';
import {
  fileUrlToPath,
  getVideoDuration,
  parseMediaFile,
  pathToFileURL,
} from './preload/fs';
import { invoke, listen, removeAllIpcListeners, send } from './preload/ipc';
import { initScreenListeners } from './preload/screen';
import { executeQuery } from './preload/sqlite';
import {
  closeWebsiteWindow,
  initWebsiteListeners,
  navigateWebsiteWindow,
  openWebsiteWindow,
  startWebsiteStream,
  zoomWebsiteWindow,
} from './preload/website';

initCloseListeners();
initScreenListeners();
initWebsiteListeners();

const electronApi: ElectronApi = {
  askForMediaAccess: () => send('askForMediaAccess'),
  checkForUpdates: () => send('checkForUpdates'),
  closeWebsiteWindow,
  convertHeic,
  convertPdfToImages,
  decompress,
  downloadFile: (u, sD, dF, lP) => invoke('downloadFile', u, sD, dF, lP),
  executeQuery,
  fileUrlToPath,
  fs,
  getAllScreens: () => invoke('getAllScreens'),
  getAppDataPath: () => invoke('getAppDataPath'),
  getAppVersion: () => invoke('getVersion'),
  getLocalPathFromFileObject: (fo) => webUtils.getPathForFile(fo),
  getNrOfPdfPages,
  getScreenAccessStatus: () => invoke('getScreenAccessStatus'),
  getUserDataPath: () => invoke('getUserDataPath'),
  getVideoDuration,
  moveMediaWindow: (t, w, ne) =>
    send('moveMediaWindow', t, w === undefined ? undefined : !w, ne),
  navigateWebsiteWindow,
  onDownloadCancelled: (cb) => listen('downloadCancelled', cb),
  onDownloadCompleted: (cb) => listen('downloadCompleted', cb),
  onDownloadError: (cb) => listen('downloadError', cb),
  onDownloadProgress: (cb) => listen('downloadProgress', cb),
  onDownloadStarted: (cb) => listen('downloadStarted', cb),
  onLog: (cb) => listen('log', cb),
  onShortcut: (cb) => listen('shortcut', cb),
  onWatchFolderUpdate: (cb) => listen('watchFolderUpdate', cb),
  openDiscussion: (c, t, p) => send('openDiscussion', c, t, p),
  openExternal: (w) => send('openExternal', w),
  openFileDialog: (s, f) => invoke('openFileDialog', s, f),
  openFolderDialog: () => invoke('openFolderDialog'),
  openWebsiteWindow,
  parseMediaFile,
  path,
  pathToFileURL,
  readdir: (p, withSizes, recursive) =>
    invoke('readdir', p, withSizes, recursive),
  registerShortcut: (n, s) => invoke('registerShortcut', n, s),
  removeListeners: (c) => removeAllIpcListeners(c),
  setAutoStartAtLogin: (v) => send('toggleOpenAtLogin', v),
  setScreenPreferences: (s) => send('setScreenPreferences', s),
  setUrlVariables: (v) => send('setUrlVariables', v),
  startWebsiteStream,
  toggleMediaWindow: (s) => send('toggleMediaWindow', s),
  unregisterAllShortcuts: () => send('unregisterAllShortcuts'),
  unregisterShortcut: (s) => send('unregisterShortcut', s),
  unwatchFolders: () => send('unwatchFolders'),
  watchFolder: (p) => send('watchFolder', p),
  zoomWebsiteWindow,
};

listen('toggleFullScreenFromMediaWindow', () => {
  window.dispatchEvent(
    new CustomEvent<undefined>('toggleFullScreenFromMediaWindow'),
  );
});

contextBridge.exposeInMainWorld('electronApi', electronApi);
