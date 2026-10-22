import type { ElectronApi, ElectronIpcInvokeKey } from 'src/types/electron';

import { contextBridge, webUtils } from 'electron/renderer';
import { IS_DEMO_MODE, IS_DEV, PLATFORM } from 'src-electron/constants';
import { initCloseListeners } from 'src-electron/preload/close';
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
import { capturePreloadError } from 'src-electron/preload/log';
import { sendKeyTap } from 'src-electron/preload/robot';
import { initScreenListeners } from 'src-electron/preload/screen';
import {
  closeWebsiteWindow,
  initWebsiteListeners,
  navigateWebsiteWindow,
  openWebsiteWindow,
  zoomWebsiteWindow,
} from 'src-electron/preload/website';
import { launchZoomMeeting } from 'src-electron/preload/zoom';
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

/**
 * Invokes a main-process handler whose result the renderer does not wait for
 * (the matching ElectronApi method returns void), reporting a rejected
 * invoke instead of leaving it unhandled in the renderer.
 * @param name The ElectronApi method name, used to group the error report
 * @param channel The IPC channel to invoke
 * @param args The arguments to pass to the handler
 */
const invokeWithoutResult = (
  name: string,
  channel: ElectronIpcInvokeKey,
  ...args: unknown[]
) => {
  invoke(channel, ...args).catch((error: unknown) => {
    capturePreloadError(error, { contexts: { fn: { channel, name } } });
  });
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
  convertHeic: (image) => invoke('convertHeic', image),
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
  exportHtmlToPdf: (html, name) => invoke('exportHtmlToPdf', html, name),
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
  getMediaWindowCaptureSize: () => invoke('getMediaWindowCaptureSize'),
  getMediaWindowCaptureSourceId: () => invoke('getMediaWindowCaptureSourceId'),
  getScreenAccessStatus: () => invoke('getScreenAccessStatus'),
  getSharedDataPath: () => invoke('getSharedDataPath'),
  getUpdaterState: () => invoke('getUpdaterState'),
  getUpdatesDisabledPath: () => invoke('getUpdatesDisabledPath'),
  getUserDataPath: () => invoke('getUserDataPath'),
  getVideoDuration,
  getZipEntries: (p) => invoke('getZipEntries', p),
  getZoomLayoutTargets: (preferences) =>
    invoke('getZoomLayoutTargets', preferences),
  hideFileOnWindows,
  inferExtension,
  isDemoMode: IS_DEMO_MODE,
  isDev: IS_DEV,
  isDownloadComplete: (downloadId: string) =>
    invoke('isDownloadComplete', downloadId),
  isDownloadErrorExpected: () => invoke('isDownloadErrorExpected'),
  isOnline: () => invoke('isOnline'),
  isSecretEncryptionAvailableSync: () =>
    sendSync('isSecretEncryptionAvailableSync'),
  isSqliteDbCorrupt: (dbPath: string) => invoke('isSqliteDbCorrupt', dbPath),
  isUsablePath: (p) => invoke('isUsablePath', p),
  join,
  launchZoomMeeting,
  markUserWarnedAboutDiskSpace: () => send('markUserWarnedAboutDiskSpace'),
  moveMediaWindow: (t, w) => send('moveMediaWindow', t, w),
  moveTimerWindow: (t, w) => send('moveTimerWindow', t, w),
  navigateWebsiteWindow,
  normalize,
  onDevMenuCommand: (cb) => listen('dev-menu-command', cb),
  onDownloadCancelled: (cb) => listen('downloadCancelled', cb),
  onDownloadCompleted: (cb) => listen('downloadCompleted', cb),
  onDownloadError: (cb) => listen('downloadError', cb),
  onDownloadProgress: (cb) => listen('downloadProgress', cb),
  onDownloadStarted: (cb) => listen('downloadStarted', cb),
  onGpuCrashDetected: (cb) => listen('gpu-crash-detected', cb),
  onHardwareAccelerationTemporaryDisabled: (cb) =>
    listen('hardware-acceleration-temporary-disabled', cb),
  onLog: (cb) => listen('log', cb),
  onMediaWindowRendererGone: (cb) => listen('media-window-renderer-gone', cb),
  onPathProbeNetworkWarning: (cb) => listen('pathProbeNetworkWarning', cb),
  onShortcut: (cb) => listen('shortcut', cb),
  onTimerWindowClosed: (cb) => listen('timerWindowClosed', cb),
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
  passWafChallenge: (url) => invoke('passWafChallenge', url),
  pathToFileURL,
  pauseAllDownloads: () => send('pauseAllDownloads'),
  PLATFORM,
  quitAndInstall: () => send('quitAndInstall'),
  readdir: readDirectory,
  registerShortcut: (n, s) =>
    invokeWithoutResult('registerShortcut', 'registerShortcut', n, s),
  relaunchApp: () => send('relaunchApp'),
  removeListeners: (c) => removeAllIpcListeners(c),
  resolve,
  restartZoomHelper: () => invoke('restartZoomHelper'),
  resumeAllDownloads: () => send('resumeAllDownloads'),
  saveFileDialog: (d, f) => invoke('saveFileDialog', d, f),
  sendDevMenuState: (state) => send('dev-menu-state', state),
  sendKeyTap: (k, m) => sendKeyTap(k, m),
  setAutoStartAtLogin: (v) => send('toggleOpenAtLogin', v),
  setElectronUrlVariables: (v) => send('setElectronUrlVariables', v),
  setExecutable: (p) => invoke('setExecutable', p),
  setHardwareAcceleration: (v) =>
    invokeWithoutResult(
      'setHardwareAcceleration',
      'set-hardware-acceleration',
      v,
    ),
  setPathProbeNotificationPaths: (paths) =>
    send('setPathProbeNotificationPaths', paths),
  showFileOnWindows,
  startTimerRemote: (port) => invoke('startTimerRemote', port),
  startZoomHelper: () => invoke('startZoomHelper'),
  stopTimerRemote: () => send('stopTimerRemote'),
  stopZoomHelper: () => send('stopZoomHelper'),
  timerRemoteText: (t) => send('timerRemoteText', t),
  timerRemoteUpdate: (d) => send('timerRemoteUpdate', d),
  toggleAuthorizedClose: (v) => send('authorizedClose', v),
  toggleMediaWindow: (s, f) => send('toggleMediaWindow', s, f),
  toggleTimerWindow: (s) => send('toggleTimerWindow', s),
  unregisterAllShortcuts: () => send('unregisterAllShortcuts'),
  unregisterShortcut: (s) => send('unregisterShortcut', s),
  unwatchFolders: () => invoke('unwatchFolders'),
  unzip: (i, o, op) => invoke('unzip', i, o, op),
  watchFolder: (p) => invoke('watchFolder', p),
  zoomCommand: (c) => invoke('zoomCommand', c),
  zoomTestParticipants: (r) => invoke('zoomTestParticipants', r),
  zoomWebsiteWindow,
};

contextBridge.exposeInMainWorld('electronApi', electronApi);
