import type { default as FsExtra } from 'fs-extra';
import type { IAudioMetadata, IOptions } from 'music-metadata';
import type robot from 'robotjs';
import type {
  FileItem,
  JwSiteParams,
  QueryResponseItem,
  SettingsValues,
  VideoDuration,
} from 'src/types/electron';
import type Path from 'upath';

export interface ConversionOptions {
  /**
   * the HEIC file buffer
   */
  buffer: ArrayBufferLike;
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
  | 'general'
  | 'ideas'
  | 'polls'
  | 'q-a'
  | 'translations';

export type Display = Electron.Display & {
  mainWindow?: boolean;
  mainWindowBounds?: Electron.Rectangle;
  mediaWindow?: boolean;
};

export interface ElectronApi {
  askForMediaAccess: () => void;
  checkForUpdates: () => void;
  clickZoomElement: (
    handle: number,
    options: Partial<ZoomUIElement>,
  ) => Promise<boolean>;
  closeWebsiteWindow: () => void;
  convertHeic: (image: ConversionOptions) => Promise<ArrayBuffer>;
  convertPdfToImages: (
    pdfPath: string,
    outputFolder: string,
  ) => Promise<string[]>;
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
  ) => Promise<string>;
  downloadFile: (
    url: string,
    saveDir: string,
    destFilename?: string,
    lowPriority?: boolean,
  ) => Promise<null | string>;
  /**
   * Parses metadata from a media file.
   *
   * @param filePath - The path to the media file to be parsed.
   * @param options - Optional configuration for parsing the media file.
   * @returns A promise that resolves to the metadata of the media file.
   */
  ensureZoomRequirements: () => Promise<boolean>;
  executeQuery: <T extends object = QueryResponseItem>(
    dbPath: string,
    query: string,
    params?: (null | number | string)[],
  ) => T[];
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
  fs: typeof FsExtra;
  getAllScreens: () => Promise<Display[]>;
  getAppDataPath: () => Promise<string>;
  getBetaUpdatesPath: () => Promise<string>;
  getLocales: () => Promise<string[]>;
  getLocalPathFromFileObject: (fileObject: File | string | undefined) => string;
  getLowDiskSpaceStatus: () => Promise<boolean>;
  getNrOfPdfPages: (pdfPath: string) => Promise<number>;
  getScreenAccessStatus: () => Promise<MediaAccessStatus>;
  getSharedDataPath: () => Promise<null | string>;
  getUpdatesDisabledPath: () => Promise<string>;
  getUserDataPath: () => Promise<string>;
  getVideoDuration: (filePath: string) => Promise<VideoDuration>;
  getZipEntries: (zipPath: string) => Promise<Record<string, number>>;
  getZoomDialogChildren: (
    className: string,
    parentHandle: number,
  ) => Promise<ZoomUIElement[]>;
  getZoomElementState: (
    handle: number,
    controlId: string,
  ) => Promise<null | {
    legacy_state?: number;
    toggle_state?: number;
    value?: string;
  }>;
  getZoomElementTitle: (
    handle: number,
    controlId: string,
  ) => Promise<null | string>;
  inferExtension: (filename: string, filetype?: string) => Promise<string>;
  isArchitectureMismatch: () => Promise<boolean>;
  isDownloadComplete: (downloadId: string) => Promise<boolean | null>;
  isDownloadErrorExpected: () => Promise<boolean>;
  isUsablePath: (path: string) => Promise<boolean>;
  isZoomPythonInstalled: () => Promise<boolean>;
  launchZoomMeeting: (meetingId: string) => void;
  // listZoomMeetingControls: (handle?: number) => Promise<ZoomUIElement[]>;
  // listZoomWindowChildren: (handle: number) => Promise<ZoomUIElement[]>;
  listZoomWindows: (mainOnly?: boolean) => Promise<ZoomUIElement[]>;
  moveMediaWindow: (
    targetScreenNumber?: number,
    windowedMode?: boolean,
  ) => void;
  navigateWebsiteWindow: (action: NavigateWebsiteAction) => void;
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
  ) => Promise<Electron.OpenDialogReturnValue | undefined>;
  openFolder: (path: string) => Promise<string>;
  openFolderDialog: () => Promise<Electron.OpenDialogReturnValue | undefined>;
  openWebsiteWindow: (websiteParams?: JwSiteParams) => void;
  parseMediaFile: (
    filePath: string,
    options?: IOptions,
  ) => Promise<IAudioMetadata>;
  path: typeof Path;
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
  PLATFORM: string;
  quitAndInstall: () => void;
  readdir: (
    path: string,
    withSizes?: boolean,
    recursive?: boolean,
  ) => Promise<FileItem[]>;
  registerShortcut: (name: keyof SettingsValues, shortcut: string) => void;
  removeListeners: (channel: ElectronIpcListenKey) => void;
  robot: typeof robot;
  sendZoomWindowKeys: (handle: number, keys: string) => Promise<boolean>;
  setAutoStartAtLogin: (value: boolean) => void;
  setElectronUrlVariables: (variables: string) => void;
  setHardwareAcceleration: (disabled: boolean) => void;
  startZoomHelper: () => void;
  stopZoomHelper: () => void;
  toggleAuthorizedClose: (authorized: boolean) => void;
  toggleMediaWindow: (show: boolean, enableFadeTransitions?: boolean) => void;
  unregisterAllShortcuts: () => void;
  unregisterShortcut: (shortcut: string) => void;
  unwatchFolders: () => void;
  unzip: (
    input: string,
    output: string,
    opts?: UnzipOptions,
  ) => Promise<UnzipResult[]>;
  watchFolder: (path: string) => void;
  zoomWebsiteWindow: (direction: 'in' | 'out') => void;
}

// ipcMain.handle / ipcRenderer.invoke channels
export type ElectronIpcInvokeKey =
  | 'clickZoomElement'
  | 'createVideoFromNonVideo'
  | 'downloadFile'
  | 'ensureZoomRequirements'
  | 'getAllScreens'
  | 'getAppDataPath'
  | 'getBetaUpdatesPath'
  | 'getLocales'
  | 'getLowDiskSpaceStatus'
  | 'getScreenAccessStatus'
  | 'getSharedDataPath'
  | 'getUpdatesDisabledPath'
  | 'getUserDataPath'
  | 'getZipEntries'
  | 'getZoomDialogChildren'
  | 'getZoomElementState'
  | 'getZoomElementTitle'
  | 'isArchitectureMismatch'
  | 'isDownloadComplete'
  | 'isDownloadErrorExpected'
  | 'isUsablePath'
  | 'isZoomPythonInstalled'
  | 'listZoomWindows'
  | 'openFileDialog'
  | 'openFolder'
  | 'openFolderDialog'
  | 'registerShortcut'
  | 'sendZoomWindowKeys'
  | 'set-hardware-acceleration'
  | 'startZoomHelper'
  | 'stopZoomHelper'
  | 'unzip';

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
  | 'screenChange'
  | 'screenPrefsChange'
  | 'setShouldQuit'
  | 'shortcut'
  | 'syncMeetingSchedule'
  | 'update-available'
  | 'update-download-progress'
  | 'update-downloaded'
  | 'update-error'
  | 'video-capture-crash-detected'
  | 'watchFolderUpdate'
  | 'websiteWindowClosed';

// ipcMain.on / ipcRenderer.send channels
export type ElectronIpcSendKey =
  | 'askForMediaAccess'
  | 'authorizedClose'
  | 'checkForUpdates'
  | 'focusMediaWindow'
  | 'launchZoomMeeting'
  | 'moveMediaWindow'
  | 'navigateWebsiteWindow'
  | 'openDiscussion'
  | 'openExternal'
  | 'quitAndInstall'
  | 'setElectronUrlVariables'
  | 'startZoomHelper'
  | 'stopZoomHelper'
  | 'toggleMediaWindow'
  | 'toggleOpenAtLogin'
  | 'toggleWebsiteWindow'
  | 'unregisterAllShortcuts'
  | 'unregisterShortcut'
  | 'unwatchFolders'
  | 'watchFolder'
  | 'websiteWindowClosed'
  | 'zoomWebsiteWindow';

export type ExternalWebsite = 'docs' | 'latestRelease' | 'repo';

export type FileDialogFilter =
  | 'image'
  | 'image+pdf'
  | 'jwpub'
  | 'jwpub+image'
  | 'jwpub+image+pdf';

export type MediaAccessStatus =
  | 'denied'
  | 'granted'
  | 'not-determined'
  | 'restricted'
  | 'unknown';

export type NavigateWebsiteAction = 'back' | 'forward' | 'refresh';

export interface UnzipOptions {
  includes?: string[];
}

export interface UnzipResult {
  path: string;
}

export interface ZoomUIElement {
  class_name: string;
  control_id?: string;
  control_type: string;
  handle: null | number;
  help_text?: string;
  is_enabled?: boolean;
  main_zoom_window?: boolean;
  pid: number;
  title: string;
}
