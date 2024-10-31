import type { ElectronApi } from 'src/helpers/electron-api';
import type { ScreenPreferences } from 'src/types';

import { app, BrowserWindow, globalShortcut } from '@electron/remote';
import { contextBridge, webUtils } from 'electron/renderer';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'upath';

import pkg from '../package.json';
import { PLATFORM } from './constants';
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
import { executeQuery } from './preload/sqlite';
import {
  closeWebsiteWindow,
  initWebsiteListeners,
  navigateWebsiteWindow,
  openWebsiteWindow,
  zoomWebsiteWindow,
} from './preload/website';
import { errorCatcher } from './utils';

initWebsiteListeners();

const getMainWindow = () =>
  BrowserWindow.getAllWindows().find(
    (w) =>
      !w.webContents.getURL().includes('media-player') &&
      !w.webContents.getURL().includes('https://'),
  );

if (PLATFORM === 'darwin') {
  try {
    globalShortcut.register('Command+Q', () => {
      getMainWindow()?.close();
    });
  } catch (err) {
    errorCatcher(err);
  }
}

const getMediaWindow = () =>
  BrowserWindow.getAllWindows().find(
    (w) =>
      w.webContents.getURL().includes('media-player') &&
      !w.webContents.getURL().includes('https://'),
  );

const getUserDataPath = () =>
  path.join(app.getPath('appData'), pkg.productName);

listen('screenChange', () => {
  window.dispatchEvent(new CustomEvent('screen-trigger-update'));
});

listen(
  'screenPrefsChange',
  ({ preferredScreenNumber, preferWindowed }: ScreenPreferences) => {
    window.dispatchEvent(
      new CustomEvent('windowScreen-update', {
        detail: { preferredScreenNumber, preferWindowed },
      }),
    );
  },
);

const moveMediaWindow = (
  targetScreenNumber?: number,
  windowedMode?: boolean,
  noEvent?: boolean,
) => {
  if (targetScreenNumber === undefined || windowedMode === undefined) {
    try {
      const screenPreferences =
        JSON.parse(window.localStorage.getItem('app-settings') ?? '{}')
          ?.screenPreferences || ({} as ScreenPreferences);
      targetScreenNumber = screenPreferences.preferredScreenNumber;
      windowedMode = screenPreferences.preferWindowed;
    } catch (err) {
      errorCatcher(err);
    }
  }

  send(
    'moveMediaWindow',
    targetScreenNumber,
    windowedMode === undefined ? undefined : !windowedMode,
    noEvent,
  );
};

window.addEventListener('beforeunload', () => {
  getMainWindow()?.removeAllListeners('move');
});

const toggleMediaWindow = (action: string) => {
  const mediaWindow = getMediaWindow();
  if (!mediaWindow) return;
  if (action === 'show') {
    moveMediaWindow();
    if (!mediaWindow.isVisible()) {
      mediaWindow.show();
    }
  } else if (action === 'hide') {
    mediaWindow.hide();
  }
};

const bcClose = new BroadcastChannel('closeAttempts');

listen('attemptedClose', () => {
  bcClose.postMessage({ attemptedClose: true });
});

bcClose.onmessage = (event) => {
  if (event.data.authorizedClose) send('authorizedClose');
};

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
  getUserDataPath,
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
  toggleMediaWindow,
  unregisterShortcut: (s) => send('unregisterShortcut', s),
  zoomWebsiteWindow,
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
