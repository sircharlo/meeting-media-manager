import type { ElectronApi } from 'src/helpers/electron-api';

import { app } from '@electron/remote';
import { contextBridge, webUtils } from 'electron/renderer';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'upath';

import pkg from '../package.json';
import { initCloseListeners } from './preload/close';
import { convertHeic, convertPdfToImages } from './preload/converters';
import {
  decompress,
  fileUrlToPath,
  getVideoDuration,
  isFileUrl,
  parseMediaFile,
  pathToFileURL,
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
  getAppDataPath: () => app.getPath('appData'),
  getAppVersion: () => invoke('getVersion'),
  getLocalPathFromFileObject: (fo) => webUtils.getPathForFile(fo),
  getUserDataPath: () => path.join(app.getPath('appData'), pkg.productName),
  getUserDesktopPath: () => app.getPath('desktop'),
  getVideoDuration,
  isFileUrl,
  klawSync,
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
  registerShortcut: (n, s) => invoke('registerShortcut', n, s),
  removeListeners: (c) => removeAllIpcListeners(c),
  setAutoStartAtLogin: (v) => send('toggleOpenAtLogin', v),
  setUrlVariables: (v) => send('setUrlVariables', v),
  toggleMediaWindow: (s) => send('toggleMediaWindow', s),
  unregisterShortcut: (s) => send('unregisterShortcut', s),
  zoomWebsiteWindow,
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
