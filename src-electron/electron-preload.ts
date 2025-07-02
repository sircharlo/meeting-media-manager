import type { ElectronApi } from 'src/types';

import { contextBridge, webUtils } from 'electron/renderer';
import fs from 'fs-extra';
import { initCloseListeners } from 'src-electron/preload/close';
import {
  convertHeic,
  convertPdfToImages,
  decompress,
  getNrOfPdfPages,
} from 'src-electron/preload/converters';
import {
  fileUrlToPath,
  getVideoDuration,
  inferExtension,
  parseMediaFile,
  pathToFileURL,
  readDirectory,
} from 'src-electron/preload/fs';
import {
  invoke,
  listen,
  removeAllIpcListeners,
  send,
} from 'src-electron/preload/ipc';
import { initScreenListeners } from 'src-electron/preload/screen';
import { executeQuery } from 'src-electron/preload/sqlite';
import {
  closeWebsiteWindow,
  initWebsiteListeners,
  navigateWebsiteWindow,
  openWebsiteWindow,
  startWebsiteStream,
  zoomWebsiteWindow,
} from 'src-electron/preload/website';
import path from 'upath';

initCloseListeners();
initScreenListeners();
initWebsiteListeners();

const electronApi: ElectronApi = {
  askForMediaAccess: () => send('askForMediaAccess'),
  checkForUpdates: () => send('checkForUpdates'),
  closeWebsiteWindow,
  convertHeic,
  convertPdfToImages,
  createVideoFromNonVideo: (f, fP) => invoke('createVideoFromNonVideo', f, fP),
  decompress,
  downloadFile: (u, sD, dF, lP) => invoke('downloadFile', u, sD, dF, lP),
  executeQuery,
  fileUrlToPath,
  fs,
  getAllScreens: () => invoke('getAllScreens'),
  getAppDataPath: () => invoke('getAppDataPath'),
  getLocales: () => invoke('getLocales'),
  getLocalPathFromFileObject: (fo) =>
    fo ? (typeof fo === 'string' ? fo : webUtils.getPathForFile(fo)) : '',
  getNrOfPdfPages,
  getScreenAccessStatus: () => invoke('getScreenAccessStatus'),
  getUserDataPath: () => invoke('getUserDataPath'),
  getVideoDuration,
  inferExtension,
  isDownloadErrorExpected: () => invoke('isDownloadErrorExpected'),
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
  readdir: readDirectory,
  registerShortcut: (n, s) => invoke('registerShortcut', n, s),
  removeListeners: (c) => removeAllIpcListeners(c),
  setAutoStartAtLogin: (v) => send('toggleOpenAtLogin', v),
  setElectronUrlVariables: (v) => send('setElectronUrlVariables', v),
  setScreenPreferences: (s) => send('setScreenPreferences', s),
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
