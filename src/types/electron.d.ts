import type { ConversionOptions } from 'app/src-electron/preload/converters';
import type { default as FsExtra } from 'fs-extra';
import type { IAudioMetadata, IOptions } from 'music-metadata';
import type {
  FileItem,
  QueryResponseItem,
  SettingsValues,
  VideoDuration,
} from 'src/types';
import type Path from 'upath';

export interface ElectronApi {
  closeWebsiteWindow: () => void;
  convertHeic: (image: ConversionOptions) => Promise<ArrayBuffer>;
  convertPdfToImages: (
    pdfPath: string,
    outputFolder: string,
  ) => Promise<string[]>;
  decompress: (inputZip: string, outputFolder: string) => Promise<void>;
  downloadErrorIsExpected: () => Promise<boolean>;
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
  getUserDataPath: () => Promise<string>;
  getVideoDuration: (filePath: string) => Promise<VideoDuration>;
  isFileUrl: (url: string) => boolean;
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
  openExternal: (website: ExternalWebsite) => void;
  openFileDialog: (
    single?: boolean,
    filter?: FileDialogFilter,
  ) => Promise<Electron.OpenDialogReturnValue | undefined>;
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
  setUrlVariables: (variables: string) => void;
  toggleMediaWindow: (show: boolean) => void;
  unregisterShortcut: (shortcut: string) => void;
  zoomWebsiteWindow: (direction: 'in' | 'out') => void;
}

// ipcMain.on / ipcRenderer.send channels
export type ElectronIpcSendKey =
  | 'authorizedClose'
  | 'moveMediaWindow'
  | 'navigateWebsiteWindow'
  | 'openExternal'
  | 'setUrlVariables'
  | 'toggleMediaWindow'
  | 'toggleOpenAtLogin'
  | 'toggleWebsiteWindow'
  | 'unregisterShortcut'
  | 'zoomWebsiteWindow';

// ipcMain.handle / ipcRenderer.invoke channels
export type ElectronIpcInvokeKey =
  | 'downloadErrorIsExpected'
  | 'downloadFile'
  | 'getAllScreens'
  | 'getAppDataPath'
  | 'getUserDataPath'
  | 'getVersion'
  | 'openFileDialog'
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
  | 'websiteWindowClosed';

export type ExternalWebsite = 'docs' | 'latestRelease' | 'repo';
export type NavigateWebsiteAction = 'back' | 'forward' | 'refresh';
export type FileDialogFilter =
  | 'image'
  | 'image+pdf'
  | 'jwpub'
  | 'jwpub+image'
  | 'jwpub+image+pdf';
export type Display = {
  mainWindow?: boolean;
  mediaWindow?: boolean;
} & Electron.Display;
