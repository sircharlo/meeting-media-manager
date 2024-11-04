import type { ElectronApi } from 'src/types';

import { contextBridge, webUtils } from 'electron/renderer';
import fs from 'fs-extra';
import path from 'upath';

import { initCloseListeners } from './preload/close';
import { convertHeic, convertPdfToImages } from './preload/converters';
import {
  decompress,
  fileUrlToPath,
  getVideoDuration,
  isFileUrl,
  parseMediaFile,
  pathToFileURL,
  // readDirectory,
} from './preload/fs';
import { invoke, listen, removeAllIpcListeners, send } from './preload/ipc';
import { initScreenListeners, moveMediaWindow } from './preload/screen';
import { executeQuery } from './preload/sqlite';
import {
  closeWebsiteWindow,
  initWebsiteListeners,
  navigateWebsiteWindow,
  openWebsiteWindow,
  zoomWebsiteWindow,
} from './preload/website';

initCloseListeners();
initScreenListeners();
initWebsiteListeners();

const electronApi: ElectronApi = {
  closeWebsiteWindow,
  convertHeic,
  convertPdfToImages,
  decompress,
  downloadErrorIsExpected: () => invoke('downloadErrorIsExpected'),
  executeQuery,
  fileUrlToPath,
  fs,
  getAllScreens: () => invoke('getAllScreens'),
  getAppDataPath: () => invoke('getAppPath'),
  getAppVersion: () => invoke('getVersion'),
  getLocalPathFromFileObject: (fo) => webUtils.getPathForFile(fo),
  getUserDataPath: () => invoke('getUserDataPath'),
  getVideoDuration,
  isFileUrl,
  moveMediaWindow,
  navigateWebsiteWindow,
  onLog: (cb) => listen('log', cb),
  onShortcut: (cb) => listen('shortcut', cb),
  openExternal: (w) => send('openExternal', w),
  openFileDialog: (s, f) => invoke('openFileDialog', s, f),
  openWebsiteWindow,
  parseMediaFile,
  path,
  pathToFileURL,
  readdir: (p, withSizes, recursive) =>
    invoke('readdir', p, withSizes, recursive),
  registerShortcut: (n, s) => invoke('registerShortcut', n, s),
  removeListeners: (c) => removeAllIpcListeners(c),
  setAutoStartAtLogin: (v) => send('toggleOpenAtLogin', v),
  setUrlVariables: (v) => send('setUrlVariables', v),
  toggleMediaWindow: (s) => send('toggleMediaWindow', s),
  unregisterShortcut: (s) => send('unregisterShortcut', s),
  unwatchFolders: () => send('unwatchFolders'),
  watchFolder: (p) => send('watchFolder', p),
  zoomWebsiteWindow,
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
