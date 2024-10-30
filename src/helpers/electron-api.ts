import type FsExtra from 'fs-extra';
import type HeicConvert from 'heic-convert';
import type KlawSync from 'klaw-sync';
import type { IAudioMetadata, IOptions } from 'music-metadata';
import type {
  ElectronIpcListenKey,
  ExternalWebsite,
  FileDialogFilter,
  QueryResponseItem,
  SettingsValues,
  VideoDuration,
} from 'src/types';
import type Path from 'upath';

export interface ElectronApi {
  closeWebsiteWindow: () => void;
  convert: typeof HeicConvert;
  convertPdfToImages: (
    pdfPath: string,
    outputFolder: string,
  ) => Promise<string[]>;
  decompress: (inputZip: string, outputFolder: string) => Promise<void>;
  executeQuery: <T = QueryResponseItem>(dbPath: string, query: string) => T[];
  fileUrlToPath: (url: string) => string;
  fs: typeof FsExtra;
  getAllScreens: (
    type?: string,
  ) => ({ mainWindow?: boolean; mediaWindow?: boolean } & Electron.Display)[];
  getAppDataPath: () => string;
  getAppVersion: () => Promise<string>;
  getLocalPathFromFileObject: (fileObject: File) => string;
  getUserDataPath: () => string;
  getUserDesktopPath: () => string;
  getVideoDuration: (filePath: string) => Promise<VideoDuration>;
  isFileUrl: (url: string) => boolean;
  klawSync: typeof KlawSync;
  moveMediaWindow: (
    targetScreenNumber?: number,
    windowedMode?: boolean,
    noEvent?: boolean,
  ) => void;
  navigateWebsiteWindow: (action: string) => void;
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
  openWebsiteWindow: () => void;
  parseFile: (filePath: string, options?: IOptions) => Promise<IAudioMetadata>;
  path: typeof Path;
  pathToFileURL: (path: string) => string;
  registerShortcut: (name: keyof SettingsValues, shortcut: string) => void;
  removeListeners: (channel: ElectronIpcListenKey) => void;
  setAutoStartAtLogin: (value: boolean) => void;
  toggleMediaWindow: (action: string) => void;
  unregisterShortcut: (shortcut: string) => void;
  zoomWebsiteWindow: (action: string) => void;
}

export const electronApi: ElectronApi = window.electronApi;
