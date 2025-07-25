import type decompress from 'decompress';
import type { default as FsExtra } from 'fs-extra';
import type { IAudioMetadata, IOptions } from 'music-metadata';
import type { ConversionOptions } from 'src-electron/preload/converters';
import type {
  FileItem,
  QueryResponseItem,
  SettingsValues,
  VideoDuration,
} from 'src/types';
import type Path from 'upath';

export type DiscussionCategory =
  | 'general'
  | 'ideas'
  | 'polls'
  | 'q-a'
  | 'translations';

export type Display = Electron.Display & {
  mainWindow?: boolean;
  mediaWindow?: boolean;
};

export interface ElectronApi {
  askForMediaAccess: () => void;
  checkForUpdates: () => void;
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
  decompress: typeof decompress;
  downloadFile: (
    url: string,
    saveDir: string,
    destFilename?: string,
    lowPriority?: boolean,
  ) => Promise<null | string>;
  executeQuery: <T = QueryResponseItem>(dbPath: string, query: string) => T[];
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
  fs: typeof FsExtra;
  getAllScreens: () => Promise<Display[]>;
  getAppDataPath: () => Promise<string>;
  getLocales: () => Promise<string[]>;
  getLocalPathFromFileObject: (fileObject: File | string | undefined) => string;
  getNrOfPdfPages: (pdfPath: string) => Promise<number>;
  getScreenAccessStatus: () => Promise<MediaAccessStatus>;
  getUserDataPath: () => Promise<string>;
  /**
   * Parses metadata from a media file.
   *
   * @param filePath - The path to the media file to be parsed.
   * @param options - Optional configuration for parsing the media file.
   * @returns A promise that resolves to the metadata of the media file.
   */
  getVideoDuration: (filePath: string) => Promise<VideoDuration>;
  inferExtension: (filename: string, filetype?: string) => Promise<string>;
  isDownloadErrorExpected: () => Promise<boolean>;
  moveMediaWindow: (
    targetScreenNumber?: number,
    windowedMode?: boolean,
    noEvent?: boolean,
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
  onWatchFolderUpdate: (
    callback: (args: {
      changedPath: string;
      day: string;
      event: string;
    }) => void,
  ) => void;
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
  openFolderDialog: () => Promise<Electron.OpenDialogReturnValue | undefined>;
  openWebsiteWindow: (lang?: string) => void;
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
  readdir: (
    path: string,
    withSizes?: boolean,
    recursive?: boolean,
  ) => Promise<FileItem[]>;
  registerShortcut: (name: keyof SettingsValues, shortcut: string) => void;
  removeListeners: (channel: ElectronIpcListenKey) => void;
  setAutoStartAtLogin: (value: boolean) => void;
  setElectronUrlVariables: (variables: string) => void;
  setScreenPreferences: (screenPreferences: string) => void;
  startWebsiteStream: () => void;
  toggleMediaWindow: (show: boolean) => void;
  unregisterAllShortcuts: () => void;
  unregisterShortcut: (shortcut: string) => void;
  unwatchFolders: () => void;
  watchFolder: (path: string) => void;
  zoomWebsiteWindow: (direction: 'in' | 'out') => void;
}

// ipcMain.handle / ipcRenderer.invoke channels
export type ElectronIpcInvokeKey =
  | 'createVideoFromNonVideo'
  | 'downloadFile'
  | 'getAllScreens'
  | 'getAppDataPath'
  | 'getLocales'
  | 'getScreenAccessStatus'
  | 'getUserDataPath'
  | 'isDownloadErrorExpected'
  | 'openFileDialog'
  | 'openFolderDialog'
  | 'registerShortcut';

// BrowserWindow.webContents.send / ipcRenderer.on channels
export type ElectronIpcListenKey =
  | 'attemptedClose'
  | 'downloadCancelled'
  | 'downloadCompleted'
  | 'downloadError'
  | 'downloadProgress'
  | 'downloadStarted'
  | 'log'
  | 'screenChange'
  | 'screenPrefsChange'
  | 'shortcut'
  | 'toggleFullScreenFromMediaWindow'
  | 'watchFolderUpdate'
  | 'websiteWindowClosed';

// ipcMain.on / ipcRenderer.send channels
export type ElectronIpcSendKey =
  | 'askForMediaAccess'
  | 'authorizedClose'
  | 'checkForUpdates'
  | 'moveMediaWindow'
  | 'navigateWebsiteWindow'
  | 'openDiscussion'
  | 'openExternal'
  | 'setElectronUrlVariables'
  | 'setScreenPreferences'
  | 'toggleMediaWindow'
  | 'toggleOpenAtLogin'
  | 'toggleWebsiteWindow'
  | 'unregisterAllShortcuts'
  | 'unregisterShortcut'
  | 'unwatchFolders'
  | 'watchFolder'
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
