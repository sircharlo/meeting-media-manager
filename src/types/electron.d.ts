import type { default as FsExtra } from 'fs-extra';
import type { IAudioMetadata, IOptions } from 'music-metadata';
import type { Stats, WriteFileOptions } from 'node:fs';
import type {
  FileItem,
  JwSiteParams,
  QueryResponseItem,
  SettingsValues,
  VideoDuration,
} from 'src/types/electron';
import type { OsSupportWarning } from 'src/types/general';
import type {
  basename,
  changeExt,
  dirname,
  extname,
  join,
  normalize,
  parse,
  resolve,
} from 'upath';

export interface ConversionOptions {
  /**
   * the HEIC file buffer
   */
  buffer: Uint8Array;
  /**
   * output format
   */
  format: 'JPEG' | 'PNG';
  /**
   * the JPEG compression quality, between 0 and 1
   * @default 0.92
   */
  quality?: number;
}

export type DiscussionCategory =
  'general' | 'ideas' | 'polls' | 'q-a' | 'translations';

export type Display = Electron.Display & {
  mainWindow?: boolean;
  mainWindowBounds?: Electron.Rectangle;
  mediaWindow?: boolean;
  timerWindow?: boolean;
};

export interface ElectronApi {
  askForMediaAccess: () => void;
  basename: typeof basename;
  cancelAllDownloads: () => void;
  changeExt: typeof changeExt;
  checkForUpdates: () => void;
  closeWebsiteWindow: () => void;
  convertHeic: (image: ConversionOptions) => Promise<ArrayBuffer>;
  /**
   * Converts a non-video file into a video file.
   *
   * @param originalFile - The path to the original non-video file.
   * @param ffmpegPath - The path to the FFmpeg executable.
   * @returns A promise that resolves to the path of the converted video file.
   */
  createVideoFromNonVideo: (
    originalFile: string,
    ffmpegPath: string,
    outputDir?: string,
  ) => Promise<string>;
  /**
   * Decrypts a secret previously encrypted with {@link encryptSecretSync}.
   * @param cipherText The stored value to decrypt
   */
  decryptSecretSync: (cipherText: string) => string;
  dirname: typeof dirname;
  downloadFile: (
    url: string,
    saveDir: string,
    destFilename?: string,
    lowPriority?: boolean,
  ) => Promise<null | { key: string; saveDir: string }>;
  /**
   * Encrypts a secret (e.g. the OBS websocket password) using the OS
   * keychain, so it isn't persisted to disk as plain text.
   * @param plainText The secret to encrypt
   */
  encryptSecretSync: (plainText: string) => string;
  ensureMacosFolderPermission: (
    folderPath: string,
    prompt?: boolean,
  ) => Promise<MacosFolderPermissionResult>;
  executeQuery: <T extends object = QueryResponseItem>(
    dbPath: string,
    query: string,
    params?: (null | number | string)[],
  ) => T[];
  extname: typeof extname;
  extractNestedZipEntry: (
    input: string,
    outerEntryName: string,
    output: string,
    opts: ExtractNestedZipEntryOptions,
  ) => Promise<UnzipResult>;
  /**
   * Converts a file URL to a file path.
   *
   * @param fileurl File URL
   * @returns File path
   *
   * @example
   * fileUrlToPath('file:///home/user/document.pdf')
   *   // => '/home/user/document.pdf'
   */
  fileUrlToPath: (url?: string) => string;
  focusMediaWindow: () => void;
  fs: ElectronFsApi;
  getAllScreens: () => Promise<Display[]>;
  getAppDataPath: () => Promise<string>;
  getBetaUpdatesPath: () => Promise<string>;
  getLocales: () => Promise<string[]>;
  getLocalPathFromFileObject: (fileObject: File | string | undefined) => string;
  getLowDiskSpaceStatus: () => Promise<boolean>;
  getOsSupportWarning: () => Promise<null | OsSupportWarning>;
  getScreenAccessStatus: () => Promise<MediaAccessStatus>;
  getSharedDataPath: () => Promise<null | string>;
  getUpdatesDisabledPath: () => Promise<string>;
  getUserDataPath: () => Promise<string>;
  /**
   * Parses metadata from a media file.
   *
   * @param filePath - The path to the media file to be parsed.
   * @param options - Optional configuration for parsing the media file.
   * @returns A promise that resolves to the metadata of the media file.
   */
  getVideoDuration: (filePath: string) => Promise<VideoDuration>;
  getZipEntries: (zipPath: string) => Promise<Record<string, number>>;
  hideFileOnWindows: (filePath: string) => Promise<void>;
  inferExtension: (filename: string, filetype?: string) => Promise<string>;
  isArchitectureMismatch: () => Promise<boolean>;
  isDownloadComplete: (downloadId: string) => Promise<boolean | null>;
  isDownloadErrorExpected: () => Promise<boolean>;
  isUsablePath: (path: string) => Promise<boolean>;
  join: typeof join;
  moveMediaWindow: (
    targetScreenNumber?: number,
    windowedMode?: boolean,
  ) => void;
  moveTimerWindow: (
    targetScreenNumber?: number,
    windowedMode?: boolean,
  ) => void;
  navigateWebsiteWindow: (action: NavigateWebsiteAction) => void;
  normalize: typeof normalize;
  onDownloadCancelled: (callback: (args: { id: string }) => void) => void;
  onDownloadCompleted: (
    callback: (args: { filePath: string; id: string }) => void,
  ) => void;
  onDownloadError: (callback: (args: { id: string }) => void) => void;
  onDownloadProgress: (
    callback: (args: {
      bytesReceived: number;
      id: string;
      percentCompleted: number;
    }) => void,
  ) => void;
  onDownloadStarted: (
    callback: (args: {
      filename: string;
      id: string;
      totalBytes: number;
    }) => void,
  ) => void;
  onGpuCrashDetected: (callback: () => void) => void;
  onHardwareAccelerationTemporaryDisabled: (callback: () => void) => void;
  onLog: (
    callback: (args: {
      ctx: Record<string, unknown>;
      level: 'error' | 'info' | 'warn';
      msg: string;
    }) => void,
  ) => void;
  onPathProbeNetworkWarning: (callback: () => void) => void;
  onShortcut: (
    callback: (args: { shortcut: keyof SettingsValues }) => void,
  ) => void;
  onUpdateAvailable: (callback: () => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  onUpdateDownloadProgress: (
    callback: (args: {
      bytesPerSecond: number;
      delta: number;
      percent: number;
      total: number;
      transferred: number;
    }) => void,
  ) => void;
  onUpdateError: (callback: () => void) => void;
  onVideoCaptureCrashDetected: (callback: () => void) => void;
  onWatchFolderError: (
    callback: (args: {
      folderPath: string;
      isPossiblyNetwork: boolean;
    }) => void,
  ) => void;
  onWatchFolderUpdate: (
    callback: (args: {
      changedPath: string;
      day: string;
      event: string;
    }) => void,
  ) => void;
  onWebsiteWindowClosed: (callback: () => void) => void;
  openDiscussion: (
    category: DiscussionCategory,
    title: string,
    params?: string,
  ) => void;
  openExternal: (website: ExternalWebsite) => void;
  openFileDialog: (
    single?: boolean,
    filter?: FileDialogFilter,
    defaultPath?: string,
  ) => Promise<Electron.OpenDialogReturnValue | undefined>;
  openFolder: (path: string) => Promise<string>;
  openFolderDialog: () => Promise<Electron.OpenDialogReturnValue | undefined>;
  openWebsiteWindow: (websiteParams?: JwSiteParams) => void;
  parse: typeof parse;
  parseMediaFile: (
    filePath: string,
    options?: IOptions,
  ) => Promise<IAudioMetadata>;
  /**
   * Converts a file path to a file url.
   *
   * @param path File path
   * @returns File URL
   *
   * @example
   * pathToFileURL('/home/user/document.pdf')
   *   // => 'file:///home/user/document.pdf'
   */
  pathToFileURL: (path: string) => string;
  pauseAllDownloads: () => void;
  PLATFORM: string;
  quitAndInstall: () => void;
  readdir: (
    path: string,
    withSizes?: boolean,
    recursive?: boolean,
  ) => Promise<FileItem[]>;
  registerShortcut: (name: keyof SettingsValues, shortcut: string) => void;
  relaunchApp: () => void;
  removeListeners: (channel: ElectronIpcListenKey) => void;
  resolve: typeof resolve;
  resumeAllDownloads: () => void;
  saveFileDialog: (
    defaultPath: string,
    filter?: FileDialogFilter,
  ) => Promise<Electron.SaveDialogReturnValue | undefined>;
  /**
   * Taps a key, optionally with modifier keys held down.
   * @param key The key to tap.
   * @param modifiers Modifier keys to hold while tapping.
   */
  sendKeyTap: (key: string, modifiers?: string[]) => void;
  setAutoStartAtLogin: (value: boolean) => void;
  setElectronUrlVariables: (variables: string) => void;
  setHardwareAcceleration: (disabled: boolean) => void;
  setPathProbeNotificationPaths: (paths: string[]) => void;
  showFileOnWindows: (filePath: string) => Promise<void>;
  toggleMediaWindow: (show: boolean, enableFadeTransitions?: boolean) => void;
  toggleTimerWindow: (show: boolean) => void;
  unregisterAllShortcuts: () => void;
  unregisterShortcut: (shortcut: string) => void;
  unwatchFolders: () => Promise<void>;
  unzip: (
    input: string,
    output: string,
    opts?: UnzipOptions,
  ) => Promise<UnzipResult[]>;
  watchFolder: (path: string) => Promise<void>;
  zoomWebsiteWindow: (direction: 'in' | 'out') => void;
}

/**
 * The subset of fs-extra actually used by renderer code, exposed across the
 * context bridge instead of the full fs-extra module so the renderer cannot
 * reach filesystem capabilities (e.g. symlinks, permission changes, raw
 * streams) that no app feature needs.
 *
 * The passthrough fs methods below (copyFile, readFile, readJSON, rename,
 * stat, writeFile) are hand-typed instead of picked from `typeof FsExtra`:
 * @types/fs-extra re-exports these from Node's plain callback/sync `fs`
 * types, which don't reflect that fs-extra wraps them with `universalify`
 * to also support promises. Picking from the merged type produces target
 * signatures the actual (string-path-only) promise-based values can't
 * satisfy.
 */
export type ElectronFsApi = Pick<
  typeof FsExtra,
  | 'copy'
  | 'emptyDir'
  | 'ensureDir'
  | 'ensureFile'
  | 'move'
  | 'pathExists'
  | 'remove'
> & {
  copyFile: (src: string, dest: string, mode?: number) => Promise<void>;
  readFile: {
    (
      path: string,
      options?:
        | null
        | undefined
        | { encoding?: null | undefined; flag?: string | undefined },
    ): Promise<Buffer>;
    (
      path: string,
      options:
        | BufferEncoding
        | { encoding: BufferEncoding; flag?: string | undefined },
    ): Promise<string>;
    (
      path: string,
      options?:
        | null
        | string
        | undefined
        | {
            encoding?: BufferEncoding | null | undefined;
            flag?: string | undefined;
          },
    ): Promise<Buffer | string>;
  };
  readJSON: (
    file: string,
    options?:
      | null
      | string
      | undefined
      | {
          encoding?: string | undefined;
          flag?: string | undefined;
          throws?: boolean | undefined;
        },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<any>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
  stat: (path: string) => Promise<Stats>;
  writeFile: (
    path: string,
    data: NodeJS.ArrayBufferView | string,
    options?: BufferEncoding | WriteFileOptions,
  ) => Promise<void>;
};

// ipcMain.handle / ipcRenderer.invoke channels
export type ElectronIpcInvokeKey =
  | 'createVideoFromNonVideo'
  | 'downloadFile'
  | 'ensureMacosFolderPermission'
  | 'extractNestedZipEntry'
  | 'getAllScreens'
  | 'getAppDataPath'
  | 'getBetaUpdatesPath'
  | 'getLocales'
  | 'getLowDiskSpaceStatus'
  | 'getOsSupportWarning'
  | 'getScreenAccessStatus'
  | 'getSharedDataPath'
  | 'getUpdatesDisabledPath'
  | 'getUserDataPath'
  | 'getZipEntries'
  | 'isArchitectureMismatch'
  | 'isDownloadComplete'
  | 'isDownloadErrorExpected'
  | 'isUsablePath'
  | 'openFileDialog'
  | 'openFolder'
  | 'openFolderDialog'
  | 'registerShortcut'
  | 'saveFileDialog'
  | 'set-hardware-acceleration'
  | 'unwatchFolders'
  | 'unzip'
  | 'watchFolder';

// BrowserWindow.webContents.send / ipcRenderer.on channels
export type ElectronIpcListenKey =
  | 'attemptedClose'
  | 'downloadCancelled'
  | 'downloadCompleted'
  | 'downloadError'
  | 'downloadProgress'
  | 'downloadStarted'
  | 'gpu-crash-detected'
  | 'hardware-acceleration-temporary-disabled'
  | 'log'
  | 'pathProbeNetworkWarning'
  | 'screenChange'
  | 'screenPrefsChange'
  | 'shortcut'
  | 'update-available'
  | 'update-download-progress'
  | 'update-downloaded'
  | 'update-error'
  | 'video-capture-crash-detected'
  | 'watchFolderError'
  | 'watchFolderUpdate'
  | 'websiteWindowClosed';

// ipcMain.on / ipcRenderer.send channels
export type ElectronIpcSendKey =
  | 'askForMediaAccess'
  | 'authorizedClose'
  | 'cancelAllDownloads'
  | 'checkForUpdates'
  | 'focusMediaWindow'
  | 'moveMediaWindow'
  | 'moveTimerWindow'
  | 'navigateWebsiteWindow'
  | 'openDiscussion'
  | 'openExternal'
  | 'pauseAllDownloads'
  | 'quitAndInstall'
  | 'relaunchApp'
  | 'resumeAllDownloads'
  | 'setElectronUrlVariables'
  | 'setPathProbeNotificationPaths'
  | 'toggleMediaWindow'
  | 'toggleOpenAtLogin'
  | 'toggleTimerWindow'
  | 'toggleWebsiteWindow'
  | 'unregisterAllShortcuts'
  | 'unregisterShortcut'
  | 'websiteWindowClosed'
  | 'zoomWebsiteWindow';

// ipcMain.on with event.returnValue / ipcRenderer.sendSync channels
export type ElectronIpcSendSyncKey = 'decryptSecretSync' | 'encryptSecretSync';

export type ExternalWebsite = 'docs' | 'latestRelease' | 'repo';

export interface ExtractNestedZipEntryOptions {
  innerEntryName?: string;
  innerEntryNameSuffix?: string;
  maxEntrySize?: number;
  maxTotalSize?: number;
}

export type FileDialogFilter =
  'image' | 'image+pdf' | 'json' | 'jwpub' | 'jwpub+image' | 'jwpub+image+pdf';

export interface MacosFolderPermissionResult {
  errorCode?: string;
  path: string;
  selectedPath?: string;
  status: 'cancelled' | 'failed' | 'granted' | 'not-needed';
}

export type MediaAccessStatus =
  'denied' | 'granted' | 'not-determined' | 'restricted' | 'unknown';

export type NavigateWebsiteAction = 'back' | 'forward' | 'refresh';

export interface UnzipOptions {
  includes?: string[];
}

export interface UnzipResult {
  path: string;
}
