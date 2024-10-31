import type * as MusicMetadata from 'music-metadata';
import type * as PdfJs from 'pdfjs-dist';
import type { PDFPageProxy } from 'pdfjs-dist';
import type { RenderParameters } from 'pdfjs-dist/types/src/display/api';
import type { ElectronApi } from 'src/helpers/electron-api';
import type {
  ElectronIpcInvokeKey,
  ElectronIpcListenKey,
  ElectronIpcSendKey,
  QueryResponseItem,
  ScreenPreferences,
} from 'src/types';

import { app, BrowserWindow, globalShortcut } from '@electron/remote';
import { videoDuration as getVideoDuration } from '@numairawan/video-duration';
import AdmZip from 'adm-zip';
import BetterSqlite3 from 'better-sqlite3';
import { contextBridge, ipcRenderer, webUtils } from 'electron/renderer';
import fs from 'fs-extra';
import convert from 'heic-convert';
import klawSync from 'klaw-sync';
import os from 'os';
import { FULL_HD } from 'src/constants/media';
import path from 'upath';
import url from 'url';

import pkg from '../package.json';
import { errorCatcher } from './utils';

function invoke(channel: ElectronIpcInvokeKey, ...args: unknown[]) {
  if (process.env.DEBUGGING) {
    console.debug('[preload] invoke', { args, channel });
  }
  return ipcRenderer.invoke(channel, ...args);
}

function send(channel: ElectronIpcSendKey, ...args: unknown[]) {
  if (process.env.DEBUGGING) {
    console.debug('[preload] send', { args, channel });
  }
  ipcRenderer.send(channel, ...args);
}

function listen(
  channel: ElectronIpcListenKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (args: any) => void,
) {
  if (process.env.DEBUGGING) {
    console.debug('[preload] listen', { channel });
  }
  ipcRenderer.on(channel, (_e, args) => callback(args));
}

const getMainWindow = () =>
  BrowserWindow.getAllWindows().find(
    (w) =>
      !w.webContents.getURL().includes('media-player') &&
      !w.webContents.getURL().includes('https://'),
  );

const platform = process.platform || os.platform();
if (platform === 'darwin') {
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

const webStreamBroadcastChannel = new BroadcastChannel('web-stream');

const stopStream = () => {
  webStreamBroadcastChannel.postMessage(false);
};

listen('websiteWindowClosed', stopStream);

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

const convertPdfToImages = async (
  pdfPath: string,
  outputFolder: string,
): Promise<string[]> => {
  const outputImages: string[] = [];
  try {
    const data = [];
    const { getDocument } = (await import(
      'pdfjs-dist/webpack.mjs'
    )) as typeof PdfJs;

    const loadingTask = getDocument(pdfPath);
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    const promises: Promise<PDFPageProxy>[] = [];

    for (let i = 1; i <= numPages; i++) {
      promises.push(pdfDocument.getPage(i));
    }

    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return [];

        const scale = Math.min(
          (2 * FULL_HD.width) / viewport.width,
          (2 * FULL_HD.height) / viewport.height,
        );
        const scaledViewport = page.getViewport({ scale: scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const renderContext: RenderParameters = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        const renderTask = page.render(renderContext);
        await renderTask.promise;

        const pngData = canvas.toDataURL('image/png');
        data.push(pngData);

        const base64Data = pngData.replace(/^data:image\/png;base64,/, '');
        fs.ensureDirSync(outputFolder);
        const outputPath = path.join(
          outputFolder,
          `${path.basename(pdfPath)}_${i}.png`,
        );
        fs.writeFileSync(outputPath, base64Data, 'base64');
        outputImages.push(outputPath);
      } catch (error) {
        errorCatcher(error);
      }
    }
    return outputImages;
  } catch (error) {
    errorCatcher(error);
    return outputImages;
  }
};

const isFileUrl = (path: string) => {
  if (!path) return false;
  try {
    return path.startsWith('file://');
  } catch (err) {
    errorCatcher(err + ': ' + path);
    return false;
  }
};

const electronApi: ElectronApi = {
  closeWebsiteWindow: () => send('toggleWebsiteWindow', false),
  convert,
  convertPdfToImages,
  decompress: async (inputZip, outputFolder) => {
    const zip = new AdmZip(inputZip);
    return new Promise<void>((resolve, reject) => {
      zip.extractAllToAsync(outputFolder, true, true, (error) => {
        if (error) {
          errorCatcher(error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },
  downloadErrorIsExpected: () => invoke('downloadErrorIsExpected'),
  executeQuery: <T = QueryResponseItem>(dbPath: string, query: string) => {
    try {
      // let attempts = 0;
      // const maxAttempts = 10;
      // const delay = 250;

      // while (attempts < maxAttempts) {
      //   if (isWritable(dbPath)) {
      const db: BetterSqlite3.Database = new BetterSqlite3(dbPath, {
        fileMustExist: true,
        readonly: true,
      });
      return db.prepare(query).all() as T[];
      //   }
      //   attempts++;
      //   sleepSync(delay);
      // }
      // throw new Error(
      //   fs.existsSync(dbPath)
      //     ? 'could not connect to database'
      //     : 'database file not found',
      // );
    } catch (error) {
      errorCatcher(error);
      errorCatcher(query + '\n' + dbPath);
      return [];
    }
  },
  fileUrlToPath: (fileurl) => {
    if (!fileurl) return '';
    if (!isFileUrl(fileurl)) return fileurl;
    return url.fileURLToPath(fileurl);
  },
  fs,
  getAllScreens: () => invoke('getAllScreens'),
  getAppDataPath: () => {
    return app.getPath('appData');
  },
  getAppVersion: () => invoke('getVersion'),
  getLocalPathFromFileObject: (fileObject) => {
    return webUtils.getPathForFile(fileObject);
  },
  getUserDataPath,
  getUserDesktopPath: () => {
    return app.getPath('desktop');
  },
  getVideoDuration,
  isFileUrl,
  klawSync,
  moveMediaWindow,
  navigateWebsiteWindow: (action) => send('navigateWebsiteWindow', action),
  onLog: (callback) => listen('log', callback),
  onShortcut: (callback) => listen('shortcut', callback),
  openExternal: (website) => send('openExternal', website),
  openFileDialog: async (single, filter) =>
    invoke('openFileDialog', single, filter),
  openWebsiteWindow: () => {
    send('toggleWebsiteWindow', true);
    webStreamBroadcastChannel.postMessage(true);
  },
  parseFile: async (filePath, options) => {
    const musicMetadata: typeof MusicMetadata = await import('music-metadata');
    return musicMetadata.parseFile(filePath, options);
  },
  path,
  pathToFileURL: (path) => {
    if (!path) return '';
    if (isFileUrl(path)) return path;
    return url.pathToFileURL(path).href;
  },
  registerShortcut: (keySequence, callback) =>
    invoke('registerShortcut', keySequence, callback),
  removeListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  setAutoStartAtLogin: (value) => send('toggleOpenAtLogin', value),
  toggleMediaWindow,
  unregisterShortcut: (keySequence) => send('unregisterShortcut', keySequence),
  zoomWebsiteWindow: (direction) => send('zoomWebsiteWindow', direction),
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
