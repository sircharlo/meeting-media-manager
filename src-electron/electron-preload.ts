import type { ElectronApi } from 'src/helpers/electron-api';
import type { ScreenPreferences } from 'src/types';

import { app, BrowserWindow, globalShortcut, screen } from '@electron/remote';
import { captureMessage, setContext } from '@sentry/electron/renderer';
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
import { errorCatcher, throttle } from './utils';

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
        // On macOS, fullscreen transitions take place asynchronously. Let's not check for isFullScreen() if we're on that PLATFORM
        PLATFORM === 'darwin' ||
        targetWindow.isFullScreen()
      ) {
        // macOS doesn't play nice when trying to share a fullscreen window in Zoom if it's set to always be on top
        if (PLATFORM !== 'darwin') targetWindow.setAlwaysOnTop(false);
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
      if (PLATFORM !== 'darwin' && !targetWindow.isAlwaysOnTop()) {
        targetWindow.setAlwaysOnTop(true);
      }
      // On macOS, fullscreen transitions take place asynchronously. Let's not check for isFullScreen() if we're on that PLATFORM
      if (PLATFORM === 'darwin' || !targetWindow.isFullScreen())
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

const electronApi: ElectronApi = {
  closeWebsiteWindow,
  convertHeic,
  convertPdfToImages,
  decompress,
  downloadErrorIsExpected: () => invoke('downloadErrorIsExpected'),
  executeQuery,
  fileUrlToPath,
  fs,
  getAllScreens,
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
