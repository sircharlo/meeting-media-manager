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

import { app, BrowserWindow, globalShortcut, screen } from '@electron/remote';
import { videoDuration as getVideoDuration } from '@numairawan/video-duration';
import { captureMessage, setContext } from '@sentry/electron/renderer';
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
import { errorCatcher, throttle } from './utils';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const openWebsiteWindow = () => {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  websiteWindow = new BrowserWindow({
    alwaysOnTop: true,
    autoHideMenuBar: true,
    height: 720,
    title: 'Website Stream',
    useContentSize: true,
    width: 1280,
  });

  websiteWindow.setMenuBarVisibility(false);

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

  const source: Electron.Video = {
    id: websiteWindow.getMediaSourceId(),
    name: websiteWindow.getTitle(),
  };

  mainWindow.webContents.session.setDisplayMediaRequestHandler(
    (request, callback) => {
      callback({
        audio: 'loopback',
        video: source,
      });
    },
  );
  webStreamBroadcastChannel.postMessage(true);
};

const stopStream = () => {
  webStreamBroadcastChannel.postMessage(false);
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
    setContext('setWindowPosition', {
      noEvent,
      targetScreenNumber,
      targetWindow,
      windowedMode,
    });
    captureMessage('setWindowPosition start');
    if (!targetWindow) return;
    const allScreens = getAllScreens();
    const currentMediaScreenNumber = getWindowScreen(targetWindow);
    const targetScreen = allScreens[targetScreenNumber ?? 0];
    setContext('setWindowPosition', {
      currentMediaScreenNumber,
      noEvent,
      targetScreen,
      targetScreenNumber,
      targetWindow,
      windowedMode,
    });
    captureMessage('setWindowPosition targetScreen');
    if (!targetScreen) return;
    const targetScreenBounds = targetScreen.bounds;
    setContext('setWindowPosition', {
      currentMediaScreenNumber,
      noEvent,
      targetScreenBounds,
      targetScreenNumber,
      targetWindow,
      windowedMode,
    });
    captureMessage('setWindowPosition targetScreenBounds');
    if (!targetScreenBounds) return;
    if (windowedMode) {
      const newBounds = {
        height: 720,
        width: 1280,
        x: targetScreenBounds.x + 50,
        y: targetScreenBounds.y + 50,
      };
      if (
        targetWindow.isAlwaysOnTop() ||
        // On macOS, fullscreen transitions take place asynchronously. Let's not check for isFullScreen() if we're on that platform
        platform === 'darwin' ||
        targetWindow.isFullScreen()
      ) {
        // macOS doesn't play nice when trying to share a fullscreen window in Zoom if it's set to always be on top
        if (platform !== 'darwin') targetWindow.setAlwaysOnTop(false);
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
      setContext('setWindowPosition', {
        currentMediaScreenNumber,
        noEvent,
        targetScreenBounds,
        targetScreenNumber,
        targetWindow,
        targetWindowIsAlwaysOnTop: targetWindow.isAlwaysOnTop(),
        targetWindowIsFullScreen: targetWindow.isFullScreen(),
        windowedMode,
      });
      captureMessage('setWindowPosition targetScreenBounds');
      if (
        targetScreenNumber === currentMediaScreenNumber &&
        targetWindow.isAlwaysOnTop()
      )
        return;
      targetWindow.setPosition(targetScreenBounds.x, targetScreenBounds.y);
      // macOS doesn't play nice when trying to share a fullscreen window in Zoom if it's set to always be on top
      if (platform !== 'darwin' && !targetWindow.isAlwaysOnTop()) {
        targetWindow.setAlwaysOnTop(true);
      }
      // On macOS, fullscreen transitions take place asynchronously. Let's not check for isFullScreen() if we're on that platform
      if (platform === 'darwin' || !targetWindow.isFullScreen())
        targetWindow.setFullScreen(true);
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

const getUserDataPath = () =>
  path.join(app.getPath('appData'), pkg.productName);

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
    setContext('moveMediaWindow', {
      mainWindow,
      mediaWindow,
      noEvent,
      targetScreenNumber,
      windowedMode,
    });
    captureMessage('moveMediaWindow start');
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
    setContext('moveMediaWindow', {
      mainWindow,
      mediaWindow,
      mediaWindowIsFullScreen: !mediaWindow.isFullScreen(),
      noEvent,
      targetScreenNumber,
      windowedMode,
    });
    captureMessage(
      'moveMediaWindow assign targetScreenNumber and windowedMode',
    );
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
    setContext('moveMediaWindow', {
      mainWindow,
      mediaWindow,
      noEvent,
      targetScreenNumber,
      windowedMode,
    });
    captureMessage(
      'moveMediaWindow before setWindowPosition(mediaWindow, targetScreenNumber, windowedMode, noEvent)',
    );
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
  closeWebsiteWindow,
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
  getAllScreens,
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
  navigateWebsiteWindow,
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
  zoomWebsiteWindow,
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
