import type { ElectronApi } from 'src/types/electron';

import { contextBridge, webUtils } from 'electron/renderer';
import { IS_DEMO_MODE, PLATFORM } from 'src-electron/constants';
import { initCloseListeners } from 'src-electron/preload/close';
import { convertHeic } from 'src-electron/preload/converters';
import {
  fileUrlToPath,
  fs,
  getVideoDuration,
  hideFileOnWindows,
  inferExtension,
  parseMediaFile,
  pathToFileURL,
  readDirectory,
  showFileOnWindows,
} from 'src-electron/preload/fs';
import {
  invoke,
  listen,
  removeAllIpcListeners,
  send,
  sendSync,
} from 'src-electron/preload/ipc';
import { sendKeyTap } from 'src-electron/preload/robot';
import { initScreenListeners } from 'src-electron/preload/screen';
import {
  closeWebsiteWindow,
  initWebsiteListeners,
  navigateWebsiteWindow,
  openWebsiteWindow,
  zoomWebsiteWindow,
} from 'src-electron/preload/website';
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

initCloseListeners();
initScreenListeners();
initWebsiteListeners();

const getPathFromFileObject = (fo?: File | string) => {
  if (!fo) {
    return '';
  }
  if (typeof fo === 'string') {
    return fo;
  }
  return webUtils.getPathForFile(fo);
};

const electronApi: ElectronApi = {
  askForMediaAccess: () => send('askForMediaAccess'),
  basename,
  cancelAllDownloads: () => send('cancelAllDownloads'),
  changeExt,
  checkForUpdates: () => send('checkForUpdates'),
  closeSqliteConnection: (dbPath: string) =>
    invoke('closeSqliteConnection', dbPath),
  closeSqliteConnections: () => invoke('closeSqliteConnections'),
  closeWebsiteWindow,
  convertHeic,
  createVideoFromNonVideo: (f, fP, oD) =>
    invoke('createVideoFromNonVideo', f, fP, oD),
  decryptSecretSync: (cipherText) => sendSync('decryptSecretSync', cipherText),
  dirname,
  downloadFile: (u, sD, dF, lP) => invoke('downloadFile', u, sD, dF, lP),
  encryptSecretSync: (plainText) => sendSync('encryptSecretSync', plainText),
  ensureMacosFolderPermission: (folderPath, prompt) =>
    invoke('ensureMacosFolderPermission', folderPath, prompt),
  executeQuery: (db, query, params) =>
    invoke('executeQuery', db, query, params),
  extname,
  extractNestedZipEntry: (i, e, o, op) =>
    invoke('extractNestedZipEntry', i, e, o, op),
  fileUrlToPath,
  focusMediaWindow: () => send('focusMediaWindow'),
  fs,
  getAllScreens: () => invoke('getAllScreens'),
  getAppDataPath: () => invoke('getAppDataPath'),
  getBetaUpdatesPath: () => invoke('getBetaUpdatesPath'),
  getLocales: () => invoke('getLocales'),
  getLocalPathFromFileObject: (fo) => getPathFromFileObject(fo),
  getLowDiskSpaceStatus: () => invoke('getLowDiskSpaceStatus'),
  getOsSupportWarning: () => invoke('getOsSupportWarning'),
  getScreenAccessStatus: () => invoke('getScreenAccessStatus'),
  getSharedDataPath: () => invoke('getSharedDataPath'),
  getUpdatesDisabledPath: () => invoke('getUpdatesDisabledPath'),
  getUserDataPath: () => invoke('getUserDataPath'),
  getVideoDuration,
  getZipEntries: (p) => invoke('getZipEntries', p),
  hideFileOnWindows,
  inferExtension,
  isArchitectureMismatch: () => invoke('isArchitectureMismatch'),
  isDemoMode: IS_DEMO_MODE,
  isDownloadComplete: (downloadId: string) =>
    invoke('isDownloadComplete', downloadId),
  isDownloadErrorExpected: () => invoke('isDownloadErrorExpected'),
  isUsablePath: (p) => invoke('isUsablePath', p),
  join,
  moveMediaWindow: (t, w) => send('moveMediaWindow', t, w),
  moveTimerWindow: (t, w) => send('moveTimerWindow', t, w),
  navigateWebsiteWindow,
  normalize,
  onDownloadCancelled: (cb) => listen('downloadCancelled', cb),
  onDownloadCompleted: (cb) => listen('downloadCompleted', cb),
  onDownloadError: (cb) => listen('downloadError', cb),
  onDownloadProgress: (cb) => listen('downloadProgress', cb),
  onDownloadStarted: (cb) => listen('downloadStarted', cb),
  onGpuCrashDetected: (cb) => listen('gpu-crash-detected', cb),
  onHardwareAccelerationTemporaryDisabled: (cb) =>
    listen('hardware-acceleration-temporary-disabled', cb),
  onLog: (cb) => listen('log', cb),
  onPathProbeNetworkWarning: (cb) => listen('pathProbeNetworkWarning', cb),
  onShortcut: (cb) => listen('shortcut', cb),
  onUpdateAvailable: (cb) => listen('update-available', cb),
  onUpdateDownloaded: (cb) => listen('update-downloaded', cb),
  onUpdateDownloadProgress: (cb) => listen('update-download-progress', cb),
  onUpdateError: (cb) => listen('update-error', cb),
  onVideoCaptureCrashDetected: (cb) =>
    listen('video-capture-crash-detected', cb),
  onWatchFolderError: (cb) => listen('watchFolderError', cb),
  onWatchFolderUpdate: (cb) => listen('watchFolderUpdate', cb),
  onWebsiteWindowClosed: (cb) => listen('websiteWindowClosed', cb),
  openDiscussion: (c, t, p) => send('openDiscussion', c, t, p),
  openExternal: (w) => send('openExternal', w),
  openFileDialog: (s, f, d) => invoke('openFileDialog', s, f, d),
  openFolder: (path) => invoke('openFolder', path),
  openFolderDialog: () => invoke('openFolderDialog'),
  openWebsiteWindow,
  parse,
  parseMediaFile,
  pathToFileURL,
  pauseAllDownloads: () => send('pauseAllDownloads'),
  PLATFORM,
  quitAndInstall: () => send('quitAndInstall'),
  readdir: readDirectory,
  registerShortcut: (n, s) => invoke('registerShortcut', n, s),
  relaunchApp: () => send('relaunchApp'),
  removeListeners: (c) => removeAllIpcListeners(c),
  resolve,
  resumeAllDownloads: () => send('resumeAllDownloads'),
  saveFileDialog: (d, f) => invoke('saveFileDialog', d, f),
  sendKeyTap: (k, m) => sendKeyTap(k, m),
  setAutoStartAtLogin: (v) => send('toggleOpenAtLogin', v),
  setElectronUrlVariables: (v) => send('setElectronUrlVariables', v),
  setExecutable: (p) => invoke('setExecutable', p),
  setHardwareAcceleration: (v) => invoke('set-hardware-acceleration', v),
  setPathProbeNotificationPaths: (paths) =>
    send('setPathProbeNotificationPaths', paths),
  showFileOnWindows,
  toggleMediaWindow: (s, f) => send('toggleMediaWindow', s, f),
  toggleTimerWindow: (s) => send('toggleTimerWindow', s),
  unregisterAllShortcuts: () => send('unregisterAllShortcuts'),
  unregisterShortcut: (s) => send('unregisterShortcut', s),
  unwatchFolders: () => invoke('unwatchFolders'),
  unzip: (i, o, op) => invoke('unzip', i, o, op),
  watchFolder: (p) => invoke('watchFolder', p),
  zoomWebsiteWindow,
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
