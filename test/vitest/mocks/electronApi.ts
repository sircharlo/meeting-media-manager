/* eslint-disable @typescript-eslint/no-unused-vars */

import type { ElectronApi, ElectronFsApi } from 'src/types';

import fs, { ensureDir } from 'fs-extra';
import {
  fileUrlToPath,
  pathToFileURL,
  readDirectory,
} from 'src-electron/preload/fs';
import { log } from 'src/shared/vanilla';
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
  askForMediaAccess: function () {
    throw new Error('Function not implemented.');
  },
  basename,
  cancelAllDownloads: () => void 0,
  changeExt,
  checkForUpdates: () => void 0,
  closeSqliteConnection: async () => undefined,
  closeSqliteConnections: async () => undefined,

  closeWebsiteWindow: function () {
    throw new Error('Function not implemented.');
  },
  convertHeic: function (image) {
    throw new Error('Function not implemented.');
  },
  createVideoFromNonVideo: function (originalFile, ffmpegPath) {
    throw new Error('Function not implemented.');
  },
  decryptSecretSync: (cipherText) => cipherText,
  dirname,
  downloadFile: function (url, saveDir, destFilename, lowPriority) {
    throw new Error('Function not implemented.');
  },
  encryptSecretSync: (plainText) => plainText,
  ensureMacosFolderPermission: async (folderPath) => ({
    path: folderPath,
    status: 'not-needed',
  }),
  executeQuery: async function (dbPath, query) {
    throw new Error('Function not implemented.');
  },
  exportHtmlToPdf: async () => ({ canceled: true }),
  extname,
  extractNestedZipEntry: function () {
    throw new Error('Function not implemented.');
  },
  fileUrlToPath,
  focusMediaWindow: function () {
    throw new Error('Function not implemented.');
  },
  fs: fs as unknown as ElectronFsApi,
  getAllScreens: function () {
    throw new Error('Function not implemented.');
  },
  getAppDataPath: async () => fakePath('app'),
  getBetaUpdatesPath: async () => fakePath('app/beta-updates', false),
  getLocales: async () => [],
  getLocalPathFromFileObject: function (fileObject) {
    throw new Error('Function not implemented.');
  },
  getLowDiskSpaceStatus: function () {
    throw new Error('Function not implemented.');
  },
  getMediaWindowCaptureSourceId: function () {
    throw new Error('Function not implemented.');
  },
  getOsSupportWarning: async () => null,
  getScreenAccessStatus: function () {
    throw new Error('Function not implemented.');
  },
  getSharedDataPath: async () => fakePath('/app/shared'),
  getUpdaterState: async () => ({
    phase: null,
    progress: null,
    versionInfo: null,
  }),
  getUpdatesDisabledPath: async () => fakePath('app/updates-disabled', false),
  getUserDataPath: async () => fakePath('app/meeting-media-manager'),
  getVideoDuration: function (filePath) {
    throw new Error('Function not implemented.');
  },
  getZipEntries: function () {
    throw new Error('Function not implemented.');
  },
  hideFileOnWindows: async () => undefined,
  inferExtension: async function (filename, filetype) {
    throw new Error('Function not implemented.');
  },
  isArchitectureMismatch: async () => false,
  isDemoMode: false,
  isDev: false,
  isDownloadComplete: async () => null,
  isDownloadErrorExpected: async () => false,
  isOnline: async () => true,
  isSecretEncryptionAvailableSync: () => true,
  isSqliteDbCorrupt: async () => false,
  isUsablePath: async function (path) {
    return true;
  },
  join,
  launchZoomMeeting: function (meetingId) {
    throw new Error('Function not implemented.');
  },
  moveMediaWindow: function (targetScreenNumber, windowedMode) {
    throw new Error('Function not implemented.');
  },
  moveTimerWindow: function (targetScreenNumber, windowedMode) {
    throw new Error('Function not implemented.');
  },
  navigateWebsiteWindow: function (action) {
    throw new Error('Function not implemented.');
  },
  normalize,
  onDevMenuCommand: function () {
    return () => undefined;
  },
  onDownloadCancelled: function (callback) {
    throw new Error('Function not implemented.');
  },
  onDownloadCompleted: function (callback) {
    throw new Error('Function not implemented.');
  },
  onDownloadError: function (callback) {
    throw new Error('Function not implemented.');
  },
  onDownloadProgress: function (callback) {
    throw new Error('Function not implemented.');
  },
  onDownloadStarted: function (callback) {
    throw new Error('Function not implemented.');
  },
  onGpuCrashDetected: function (callback) {
    throw new Error('Function not implemented.');
  },
  onHardwareAccelerationTemporaryDisabled: function (callback) {
    throw new Error('Function not implemented.');
  },
  onLog: function (callback) {
    throw new Error('Function not implemented.');
  },
  onPathProbeNetworkWarning: function (callback) {
    throw new Error('Function not implemented.');
  },
  onShortcut: function (callback) {
    throw new Error('Function not implemented.');
  },
  onTimerWindowClosed: function () {
    return () => void 0;
  },
  onUpdateAvailable: function (callback) {
    log('onUpdateAvailable called but not implemented');
  },
  onUpdateDownloaded: function (callback) {
    log('onUpdateDownloaded called but not implemented');
  },
  onUpdateDownloadProgress: function (callback) {
    log('onUpdateDownloadProgress called but not implemented');
  },
  onUpdateError: function (callback) {
    log('onUpdateError called but not implemented');
  },
  onVideoCaptureCrashDetected: function () {
    throw new Error('Function not implemented.');
  },
  onWatchFolderError: function () {
    throw new Error('Function not implemented.');
  },
  onWatchFolderUpdate: function (callback) {
    throw new Error('Function not implemented.');
  },
  onWebsiteWindowClosed: function (callback) {
    log('onWebsiteWindowClosed called but not implemented');
    return () => undefined;
  },
  openDiscussion: function (category, title, params) {
    throw new Error('Function not implemented.');
  },
  openExternal: function (website) {
    throw new Error('Function not implemented.');
  },
  openFileDialog: function (single, filter) {
    throw new Error('Function not implemented.');
  },
  openFolder: function (path) {
    throw new Error('Function not implemented.');
  },
  openFolderDialog: function () {
    throw new Error('Function not implemented.');
  },
  openWebsiteWindow: function (lang) {
    throw new Error('Function not implemented.');
  },
  parse,
  parseMediaFile: function (filePath, options) {
    throw new Error('Function not implemented.');
  },
  passWafChallenge: async () => false,
  pathToFileURL,
  pauseAllDownloads: function () {
    throw new Error('Function not implemented.');
  },
  PLATFORM: 'win32',
  quitAndInstall: function () {
    throw new Error('Function not implemented.');
  },
  readdir: readDirectory,
  registerShortcut: function (name, shortcut) {
    throw new Error('Function not implemented.');
  },
  relaunchApp: function () {
    throw new Error('Function not implemented.');
  },
  removeListeners: function (channel) {
    throw new Error('Function not implemented.');
  },
  resolve,
  restartZoomHelper: async () => ({ ok: true }),
  resumeAllDownloads: function () {
    throw new Error('Function not implemented.');
  },
  saveFileDialog: function (defaultPath, filter) {
    throw new Error('Function not implemented.');
  },
  sendDevMenuState: function () {
    // no-op in tests
  },
  sendKeyTap: function (key, modifiers) {
    // no-op in tests
  },
  setAutoStartAtLogin: function (value) {
    throw new Error('Function not implemented.');
  },
  setElectronUrlVariables: function (variables) {
    throw new Error('Function not implemented.');
  },
  setExecutable: function (path) {
    throw new Error('Function not implemented.');
  },
  setHardwareAcceleration: function (disabled) {
    throw new Error('Function not implemented.');
  },
  setPathProbeNotificationPaths: function (paths) {
    throw new Error('Function not implemented.');
  },
  showFileOnWindows: async () => undefined,
  startZoomHelper: async () => ({ ok: true }),
  stopZoomHelper: () => void 0,
  toggleAuthorizedClose: function () {
    throw new Error('Function not implemented.');
  },
  toggleMediaWindow: function (show) {
    throw new Error('Function not implemented.');
  },
  toggleTimerWindow: function (show) {
    throw new Error('Function not implemented.');
  },
  unregisterAllShortcuts: function () {
    throw new Error('Function not implemented.');
  },
  unregisterShortcut: function (shortcut) {
    throw new Error('Function not implemented.');
  },
  unwatchFolders: async function () {
    throw new Error('Function not implemented.');
  },
  unzip: function (input, output, opts) {
    throw new Error('Function not implemented.');
  },
  watchFolder: async function (path) {
    throw new Error('Function not implemented.');
  },
  zoomCommand: async function (command) {
    if (command.type === 'meeting') {
      return { meeting: { found: false, sharing: false }, ok: true };
    }
    return { error: 'helper-not-running', ok: false };
  },
  zoomTestParticipants: async function () {
    return { error: 'development-builds-only', ok: false };
  },
  zoomWebsiteWindow: function (direction) {
    throw new Error('Function not implemented.');
  },
};
