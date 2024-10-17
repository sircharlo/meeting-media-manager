import type * as MusicMetadata from 'music-metadata';
import type { IOptions } from 'music-metadata';
import type * as PdfJs from 'pdfjs-dist';
import type { PDFPageProxy } from 'pdfjs-dist';
import type { RenderParameters } from 'pdfjs-dist/types/src/display/api';
import type { ElectronApi } from 'src/helpers/electron-api';
import type { QueryResponseItem, ScreenPreferences } from 'src/types';
import type Url from 'url';

import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  screen,
} from '@electron/remote';
import AdmZip from 'adm-zip';
import * as sqlite3 from 'better-sqlite3';
import {
  contextBridge,
  ipcRenderer,
  shell,
  type ShortcutDetails,
  webUtils,
} from 'electron';
import fs from 'fs-extra';
import convert from 'heic-convert';
import klawSync from 'klaw-sync';
import os from 'os';
import { FULL_HD } from 'src/helpers/converters';
import path from 'upath';

import { errorCatcher, throttle } from './utils';

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

const bc = new BroadcastChannel('mediaPlayback');
let websiteWindow: Electron.CrossProcessExports.BrowserWindow | null = null;

const zoomWebsiteWindow = (action: string) => {
  if (!websiteWindow) return;
  if (action === 'in') {
    websiteWindow.webContents.zoomFactor =
      websiteWindow.webContents.getZoomFactor() + 0.2;
  } else if (action === 'out') {
    websiteWindow.webContents.zoomFactor =
      websiteWindow.webContents.getZoomFactor() - 0.2;
  }
};

const navigateWebsiteWindow = (action: string) => {
  if (!websiteWindow) return;
  if (action === 'back') {
    websiteWindow.webContents.navigationHistory.goBack();
  } else if (action === 'forward') {
    websiteWindow.webContents.navigationHistory.goForward();
  } else if (action === 'refresh') {
    websiteWindow.webContents.reload();
  }
};

const closeWebsiteWindow = () => {
  const websiteWindow = BrowserWindow.getAllWindows().find((w) =>
    w.webContents.getURL().includes('https://'),
  );
  if (websiteWindow && !websiteWindow.isDestroyed()) {
    websiteWindow.close();
  }
};

const openWebsiteWindow = () => {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  websiteWindow = new BrowserWindow({
    alwaysOnTop: true,
    height: 720,
    title: 'Website Stream',
    useContentSize: true,
    width: 1280,
  });

  // websiteWindow.webContents.openDevTools();
  if (!websiteWindow) return;

  websiteWindow.webContents.setVisualZoomLevelLimits(1, 5);
  websiteWindow.webContents.on('zoom-changed', (event, zoomDirection) => {
    if (!websiteWindow) return;
    const currentZoom = websiteWindow.webContents.getZoomFactor();
    if (zoomDirection === 'in') {
      websiteWindow.webContents.setZoomFactor(currentZoom + 0.2);
    } else if (zoomDirection === 'out') {
      websiteWindow.webContents.zoomFactor = currentZoom - 0.2;
    }
  });
  websiteWindow.webContents.setWindowOpenHandler((details) => {
    // Prevent popups from opening new windows; open them in the main browser window instead
    websiteWindow?.webContents.loadURL(details.url);
    return { action: 'deny' };
  });

  const setAspectRatio = () => {
    if (!websiteWindow) return;
    // Compute the new aspect ratio that, when the frame is removed, results in a 16:9 aspect ratio for the content
    const size = websiteWindow.getSize();
    const contentSize = websiteWindow.getContentSize();
    const frameSize = [size[0] - contentSize[0], size[1] - contentSize[1]];
    const aspectRatio = 16 / 9;
    const newAspectRatio =
      (contentSize[0] + frameSize[0]) /
      (contentSize[0] / aspectRatio + frameSize[1]);
    websiteWindow.setAspectRatio(newAspectRatio);
  };
  setAspectRatio();
  websiteWindow.on('resize', setAspectRatio);

  websiteWindow.loadURL('https://www.jw.org');
  websiteWindow.on('close', () => stopStream());

  const source = {
    id: websiteWindow.getMediaSourceId(),
    name: websiteWindow.getTitle(),
  };

  mainWindow.webContents.session.setDisplayMediaRequestHandler(
    (request, callback) => {
      callback({
        audio: 'loopback',
        video: source as Electron.Video,
      } as Electron.Streams);
    },
  );
  bc.postMessage({ webStream: true });
};

const stopStream = () => {
  bc.postMessage({ webStream: false });
};

const getScreens = () =>
  screen
    .getAllDisplays()
    .sort((a, b) => a.bounds.x + a.bounds.y - (b.bounds.x + b.bounds.y));

const getAllScreens = () => {
  const displays = getScreens();
  const mainWindow = getMainWindow();
  const mediaWindow = getMediaWindow();
  if (mainWindow) {
    try {
      const mainWindowScreen = displays.find(
        (display) =>
          display.id === screen.getDisplayMatching(mainWindow.getBounds()).id,
      ) as { mainWindow?: boolean } & Electron.Display;
      if (mainWindowScreen) mainWindowScreen.mainWindow = true;
    } catch (err) {
      errorCatcher(err);
    }
  }
  if (mediaWindow) {
    try {
      const mediaWindowScreen = displays.find(
        (display) =>
          display.id === screen.getDisplayMatching(mediaWindow.getBounds()).id,
      ) as { mediaWindow?: boolean } & Electron.Display;
      if (mediaWindowScreen) mediaWindowScreen.mediaWindow = true;
    } catch (err) {
      errorCatcher(err);
    }
  }
  return displays as ({
    mainWindow?: boolean;
    mediaWindow?: boolean;
  } & Electron.Display)[];
};

const getWindowScreen = (window: Electron.BrowserWindow) => {
  if (!window) return 0;
  const allScreens = getAllScreens();
  const windowDisplay = screen.getDisplayMatching(window.getBounds());
  return allScreens.findIndex((display) => display.id === windowDisplay.id);
};

const setWindowPosition = (
  targetWindow: Electron.BrowserWindow,
  targetScreenNumber: number | undefined,
  windowedMode = false,
  noEvent?: boolean,
) => {
  try {
    if (!targetWindow) return;
    const allScreens = getAllScreens();
    const currentMediaScreenNumber = getWindowScreen(targetWindow);
    const targetScreen = allScreens[targetScreenNumber ?? 0];
    if (!targetScreen) return;
    const targetScreenBounds = targetScreen.bounds;
    if (!targetScreenBounds) return;
    if (windowedMode) {
      const newBounds = {
        height: 720,
        width: 1280,
        x: targetScreenBounds.x + 50,
        y: targetScreenBounds.y + 50,
      };
      if (targetWindow.isAlwaysOnTop() || targetWindow.isFullScreen()) {
        targetWindow.setAlwaysOnTop(false);
        targetWindow.setFullScreen(false);
        targetWindow.setBounds(newBounds);
      }
      if (targetScreenNumber === currentMediaScreenNumber) return;
      const currentBounds = targetWindow.getBounds();
      if (
        currentBounds.height !== newBounds.height ||
        currentBounds.width !== newBounds.width ||
        currentBounds.x !== newBounds.x ||
        currentBounds.y !== newBounds.y
      ) {
        targetWindow.setBounds(newBounds);
      }
    } else {
      if (
        targetScreenNumber === currentMediaScreenNumber &&
        targetWindow.isAlwaysOnTop()
      )
        return;
      targetWindow.setPosition(targetScreenBounds.x, targetScreenBounds.y);
      if (!targetWindow.isAlwaysOnTop()) targetWindow.setAlwaysOnTop(true);
      if (!targetWindow.isFullScreen()) targetWindow.setFullScreen(true);
    }
    if (!noEvent)
      window.dispatchEvent(
        new CustomEvent('windowScreen-update', {
          detail: { targetScreenNumber, windowedMode },
        }),
      );
  } catch (err) {
    errorCatcher(err);
  }
};

const moveMediaWindow = (
  targetScreenNumber?: number,
  windowedMode?: boolean,
  noEvent?: boolean,
) => {
  try {
    const allScreens = getAllScreens();
    const otherScreens = allScreens.filter((screen) => !screen.mainWindow);
    const mainWindow = getMainWindow();
    const mediaWindow = getMediaWindow();
    if (!mediaWindow || !mainWindow) return;
    if (targetScreenNumber === undefined || windowedMode === undefined) {
      try {
        const screenPreferences = JSON.parse(
          window.localStorage
            .getItem('screenPreferences')
            ?.replace('__q_objt|', '') ?? '{}', // This is a hack, we need to replace the string __q_objt| with an empty string due to Quasar's implementation of LocalStorage
        ) as ScreenPreferences;
        targetScreenNumber = screenPreferences.preferredScreenNumber;
        windowedMode = screenPreferences.preferWindowed;
      } catch (err) {
        errorCatcher(err);
      }
    }
    if (otherScreens.length > 0) {
      if (windowedMode === undefined)
        windowedMode = !mediaWindow.isFullScreen();
      if (targetScreenNumber === undefined || otherScreens.length >= 1) {
        if (otherScreens.length === 1) {
          targetScreenNumber = allScreens.findIndex((s) => !s.mainWindow);
        } else {
          const mainWindowScreen = allScreens.findIndex((s) => s.mainWindow);
          targetScreenNumber =
            targetScreenNumber !== mainWindowScreen
              ? targetScreenNumber
              : allScreens.findIndex((s) => !s.mainWindow);
        }
      }
    } else {
      targetScreenNumber = 0;
      windowedMode = true;
    }
    setWindowPosition(mediaWindow, targetScreenNumber, windowedMode, noEvent);
    window.dispatchEvent(new CustomEvent('screen-trigger-update'));
  } catch (err) {
    errorCatcher(err);
  }
};

const moveMediaWindowThrottled = throttle(() => moveMediaWindow(), 100);

getMainWindow()?.on('move', moveMediaWindowThrottled);

window.addEventListener('beforeunload', () => {
  getMainWindow()?.removeAllListeners('move');
});

screen.removeAllListeners('display-metrics-changed');
screen.removeAllListeners('display-added');
screen.removeAllListeners('display-removed');

screen.on('display-metrics-changed', () => {
  moveMediaWindow();
});

screen.on('display-added', () => {
  moveMediaWindow();
});

screen.on('display-removed', () => {
  moveMediaWindow();
});

// const isWritable = (filePath: fs.PathLike) => {
//   let fileAccess = false;
//   try {
//     if (fs.existsSync(filePath)) {
//       fs.closeSync(fs.openSync(filePath, 'r+'));
//       fileAccess = true;
//     }
//   } catch (err) {
//     errorCatcher('can not open file:' + filePath);
//     errorCatcher(err);
//   }
//   return fileAccess;
// };

// function sleepSync(ms: number) {
//   const start = Date.now();
//   while (Date.now() - start < ms) {
//     // Busy wait
//   }
// }

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

const registerShortcut = (keySequence: string, callback: () => void) => {
  if (!keySequence) return;
  try {
    unregisterShortcut(keySequence);
    const ret = globalShortcut.register(keySequence, callback);
    if (!ret) {
      errorCatcher('registration failed');
    }
  } catch (err) {
    errorCatcher(err);
  }
};

const unregisterShortcut = (keySequence: string) => {
  if (!keySequence) return;
  try {
    if (globalShortcut.isRegistered(keySequence))
      globalShortcut.unregister(keySequence);
  } catch (err) {
    errorCatcher(err);
  }
};

const bcClose = new BroadcastChannel('closeAttempts');
ipcRenderer.on('attemptedClose', () => {
  bcClose.postMessage({ attemptedClose: true });
});

bcClose.onmessage = (event) => {
  if (event.data.authorizedClose) ipcRenderer.send('authorizedClose');
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
  closeWebsiteWindow,
  convert,
  convertPdfToImages,
  decompress: async (inputZip: string, outputFolder: string) => {
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
  executeQuery: (dbPath: string, query: string): QueryResponseItem[] => {
    try {
      // let attempts = 0;
      // const maxAttempts = 10;
      // const delay = 250;

      // while (attempts < maxAttempts) {
      //   if (isWritable(dbPath)) {
      const db = sqlite3.default(dbPath, {
        fileMustExist: true,
        readonly: true,
      });
      return db.prepare(query).all() as QueryResponseItem[];
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
  fileUrlToPath: (fileurl: string) => {
    if (!fileurl) return '';
    if (!isFileUrl(fileurl)) return fileurl;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const url: typeof Url = require('node:url');
    return url.fileURLToPath(fileurl);
  },
  fs,
  getAllScreens,
  getAppDataPath: () => {
    return app.getPath('appData');
  },
  getAppVersion: () => {
    return app.getVersion();
  },
  getLocalPathFromFileObject: (fileObject: File) => {
    return webUtils.getPathForFile(fileObject);
  },
  getUserDataPath: () => {
    return app.getPath('userData');
  },
  getUserDesktopPath: () => {
    return app.getPath('desktop');
  },
  isFileUrl,
  klawSync,
  moveMediaWindow,
  navigateWebsiteWindow,
  openExternalWebsite: (url: string) => {
    shell.openExternal(url);
  },
  openFileDialog: async (single?: boolean, filter?: string[]) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return;

    const filesFilter: Electron.FileFilter[] = [
      {
        extensions: ['*'],
        name: 'All files',
      },
    ];
    if (filter?.includes('jwpub')) {
      filesFilter.push({
        extensions: ['jwpub'],
        name: 'JWPUB',
      });
    }
    if (filter?.includes('images+jwpub')) {
      filesFilter.push({
        extensions: [
          'jwpub',
          'jpg',
          'jpeg',
          'png',
          'gif',
          'bmp',
          'webp',
          'heic',
          'svg',
        ],
        name: 'Background image sources',
      });
    }
    return dialog.showOpenDialog(mainWindow, {
      filters: filesFilter,
      properties: single ? ['openFile'] : ['openFile', 'multiSelections'],
    });
  },
  openWebsiteWindow,
  parseFile: async (filePath: string, options?: IOptions) => {
    const musicMetadata: typeof MusicMetadata = await import('music-metadata');
    return musicMetadata.parseFile(filePath, options);
  },
  path,
  pathToFileURL: (path: string) => {
    if (!path) return '';
    if (isFileUrl(path)) return path;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const url: typeof Url = require('node:url');
    return url.pathToFileURL(path).href;
  },
  readShortcutLink: (path: string): ShortcutDetails => {
    try {
      return shell.readShortcutLink(path);
    } catch (error) {
      errorCatcher(error);
      return { target: '' };
    }
  },
  registerShortcut,
  setAutoStartAtLogin: (value: boolean) => {
    try {
      app.setLoginItemSettings({
        openAtLogin: value,
      });
    } catch (error) {
      errorCatcher(error);
    }
  },
  setMediaWindowPosition: (x: number, y: number) => {
    try {
      const mediaWindow = getMediaWindow();
      if (mediaWindow) {
        mediaWindow.setPosition(x, y);
      }
    } catch (error) {
      errorCatcher(error);
    }
  },
  toggleMediaWindow,
  unregisterShortcut,
  writeShortcutLink: (path: string, details: ShortcutDetails) => {
    try {
      shell.writeShortcutLink(path, 'update', details);
    } catch (error) {
      errorCatcher(error);
    }
  },
  zoomWebsiteWindow,
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
