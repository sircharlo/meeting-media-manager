import type { ConversionOptions } from 'app/src-electron/preload/converters';
import type decompress from 'decompress';
import type { default as FsExtra } from 'fs-extra';
import type { IAudioMetadata, IOptions } from 'music-metadata';
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
  closeWebsiteWindow: () => void;
  convertHeic: (image: ConversionOptions) => Promise<ArrayBuffer>;
  convertPdfToImages: (
    pdfPath: string,
    outputFolder: string,
  ) => Promise<string[]>;
  decompress: typeof decompress;
  downloadFile: (
    url: string,
    saveDir: string,
    destFilename?: string,
    lowPriority?: boolean,
  ) => Promise<null | string>;
  executeQuery: <T = QueryResponseItem>(dbPath: string, query: string) => T[];
  fileUrlToPath: (url: string) => string;
  fs: typeof FsExtra;
  getAllScreens: () => Promise<Display[]>;
  getAppDataPath: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  getLocalPathFromFileObject: (fileObject: File) => string;
  getNrOfPdfPages: (pdfPath: string) => Promise<number>;
  getScreenAccessStatus: () => Promise<MediaAccessStatus>;
  getUserDataPath: () => Promise<string>;
  getVideoDuration: (filePath: string) => Promise<VideoDuration>;
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
  pathToFileURL: (path: string) => string;
  readdir: (
    path: string,
    withSizes?: boolean,
    recursive?: boolean,
  ) => Promise<FileItem[]>;
  registerShortcut: (name: keyof SettingsValues, shortcut: string) => void;
  removeListeners: (channel: ElectronIpcListenKey) => void;
  setAutoStartAtLogin: (value: boolean) => void;
  setScreenPreferences: (screenPreferences: string) => void;
  setUrlVariables: (variables: string) => void;
  toggleMediaWindow: (show: boolean) => void;
  unregisterAllShortcuts: () => void;
  unregisterShortcut: (shortcut: string) => void;
  unwatchFolders: () => void;
  watchFolder: (path: string) => void;
  zoomWebsiteWindow: (direction: 'in' | 'out') => void;
}

// ipcMain.handle / ipcRenderer.invoke channels
export type ElectronIpcInvokeKey =
  | 'downloadFile'
  | 'getAllScreens'
  | 'getAppDataPath'
  | 'getScreenAccessStatus'
  | 'getUserDataPath'
  | 'getVersion'
  | 'openFileDialog'
  | 'openFolderDialog'
  | 'readdir'
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
  | 'watchFolderUpdate'
  | 'websiteWindowClosed';

// ipcMain.on / ipcRenderer.send channels
export type ElectronIpcSendKey =
  | 'askForMediaAccess'
  | 'authorizedClose'
  | 'moveMediaWindow'
  | 'navigateWebsiteWindow'
  | 'openDiscussion'
  | 'openExternal'
  | 'setScreenPreferences'
  | 'setUrlVariables'
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
