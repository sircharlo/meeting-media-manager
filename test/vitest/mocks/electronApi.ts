/* eslint-disable @typescript-eslint/no-unused-vars */

import type { ElectronApi } from 'src/types';

const robot = {
  getMousePos: () => ({ x: 0, y: 0 }),
  mouseClick: () => undefined,
  moveMouse: () => undefined,
};
import fs, { ensureDir } from 'fs-extra';
import {
  fileUrlToPath,
  pathToFileURL,
  readDirectory,
} from 'src-electron/preload/fs';
import {
  basename,
  changeExt,
  dirname,
  extname,
  join,
  normalize,
  parse,
  resolve,
} from 'upath';

export const basePath = join(__dirname, '..', 'fs');
const fakePath = async (path: string, create = true) => {
  const dir = join(basePath, path);
  if (create) {
    await ensureDir(dir);
  }
  return dir;
};

export const electronApi: ElectronApi = {
  askForMediaAccess: () => {
    throw new Error('Function not implemented.');
  },
  basename,
  cancelAllDownloads: () => {
    throw new Error('Function not implemented.');
  },
  changeExt,
  checkForUpdates: () => void 0,

  closeWebsiteWindow: () => {
    throw new Error('Function not implemented.');
  },
  convertHeic: (image) => {
    throw new Error('Function not implemented.');
  },
  createVideoFromNonVideo: (originalFile, ffmpegPath) => {
    throw new Error('Function not implemented.');
  },
  dirname,
  downloadFile: (url, saveDir, destFilename, lowPriority) => {
    throw new Error('Function not implemented.');
  },
  executeQuery: (dbPath, query) => {
    throw new Error('Function not implemented.');
  },
  extname,
  fileUrlToPath,
  focusMediaWindow: () => {
    throw new Error('Function not implemented.');
  },
  fs,
  getAllScreens: () => {
    throw new Error('Function not implemented.');
  },
  getAppDataPath: async () => fakePath('app'),
  getBetaUpdatesPath: async () => fakePath('app/beta-updates', false),
  getLocales: async () => [],
  getLocalPathFromFileObject: (fileObject) => {
    throw new Error('Function not implemented.');
  },
  getLowDiskSpaceStatus: () => {
    throw new Error('Function not implemented.');
  },
  getScreenAccessStatus: () => {
    throw new Error('Function not implemented.');
  },
  getSharedDataPath: async () => fakePath('/app/shared'),
  getUpdatesDisabledPath: async () => fakePath('app/updates-disabled', false),
  getUserDataPath: async () => fakePath('app/meeting-media-manager'),
  getVideoDuration: (filePath) => {
    throw new Error('Function not implemented.');
  },
  getZipEntries: () => {
    throw new Error('Function not implemented.');
  },
  inferExtension: async (filename, filetype) => {
    throw new Error('Function not implemented.');
  },
  isArchitectureMismatch: async () => false,
  isDownloadComplete: async () => null,
  isDownloadErrorExpected: async () => false,
  isUsablePath: async (path) => true,
  join,
  moveMediaWindow: (targetScreenNumber, windowedMode) => {
    throw new Error('Function not implemented.');
  },
  moveTimerWindow: (targetScreenNumber, windowedMode) => {
    throw new Error('Function not implemented.');
  },
  navigateWebsiteWindow: (action) => {
    throw new Error('Function not implemented.');
  },
  normalize,
  onDownloadCancelled: (callback) => {
    throw new Error('Function not implemented.');
  },
  onDownloadCompleted: (callback) => {
    throw new Error('Function not implemented.');
  },
  onDownloadError: (callback) => {
    throw new Error('Function not implemented.');
  },
  onDownloadProgress: (callback) => {
    throw new Error('Function not implemented.');
  },
  onDownloadStarted: (callback) => {
    throw new Error('Function not implemented.');
  },
  onGpuCrashDetected: (callback) => {
    throw new Error('Function not implemented.');
  },
  onHardwareAccelerationTemporaryDisabled: (callback) => {
    throw new Error('Function not implemented.');
  },
  onLog: (callback) => {
    throw new Error('Function not implemented.');
  },
  onPathProbeNetworkWarning: (callback) => {
    throw new Error('Function not implemented.');
  },
  onShortcut: (callback) => {
    throw new Error('Function not implemented.');
  },
  onUpdateAvailable: (callback) => {
    console.log('onUpdateAvailable called but not implemented');
  },
  onUpdateDownloaded: (callback) => {
    console.log('onUpdateDownloaded called but not implemented');
  },
  onUpdateDownloadProgress: (callback) => {
    console.log('onUpdateDownloadProgress called but not implemented');
  },
  onUpdateError: (callback) => {
    console.log('onUpdateError called but not implemented');
  },
  onVideoCaptureCrashDetected: () => {
    throw new Error('Function not implemented.');
  },
  onWatchFolderError: () => {
    throw new Error('Function not implemented.');
  },
  onWatchFolderUpdate: (callback) => {
    throw new Error('Function not implemented.');
  },
  onWebsiteWindowClosed: (callback) => {
    console.log('onWebsiteWindowClosed called but not implemented');
  },
  openDiscussion: (category, title, params) => {
    throw new Error('Function not implemented.');
  },
  openExternal: (website) => {
    throw new Error('Function not implemented.');
  },
  openFileDialog: (single, filter) => {
    throw new Error('Function not implemented.');
  },
  openFolder: (path) => {
    throw new Error('Function not implemented.');
  },
  openFolderDialog: () => {
    throw new Error('Function not implemented.');
  },
  openWebsiteWindow: (lang) => {
    throw new Error('Function not implemented.');
  },
  parse,
  parseMediaFile: (filePath, options) => {
    throw new Error('Function not implemented.');
  },
  pathToFileURL,
  pauseAllDownloads: () => {
    throw new Error('Function not implemented.');
  },
  PLATFORM: 'win32',
  quitAndInstall: () => {
    throw new Error('Function not implemented.');
  },
  readdir: readDirectory,
  registerShortcut: (name, shortcut) => {
    throw new Error('Function not implemented.');
  },
  removeListeners: (channel) => {
    throw new Error('Function not implemented.');
  },
  resolve,
  resumeAllDownloads: () => {
    throw new Error('Function not implemented.');
  },
  robot,
  setAutoStartAtLogin: (value) => {
    throw new Error('Function not implemented.');
  },
  setElectronUrlVariables: (variables) => {
    throw new Error('Function not implemented.');
  },
  setHardwareAcceleration: (disabled) => {
    throw new Error('Function not implemented.');
  },
  setPathProbeNotificationPaths: (paths) => {
    throw new Error('Function not implemented.');
  },
  toggleMediaWindow: (show) => {
    throw new Error('Function not implemented.');
  },
  toggleTimerWindow: (show) => {
    throw new Error('Function not implemented.');
  },
  unregisterAllShortcuts: () => {
    throw new Error('Function not implemented.');
  },
  unregisterShortcut: (shortcut) => {
    throw new Error('Function not implemented.');
  },
  unwatchFolders: () => {
    throw new Error('Function not implemented.');
  },
  unzip: (input, output, opts) => {
    throw new Error('Function not implemented.');
  },
  watchFolder: (path) => {
    throw new Error('Function not implemented.');
  },
  zoomWebsiteWindow: (direction) => {
    throw new Error('Function not implemented.');
  },
};
