import type { ConversionOptions } from 'app/src-electron/preload/converters';
import type FsExtra from 'fs-extra';
import type KlawSync from 'klaw-sync';
import type { IAudioMetadata, IOptions } from 'music-metadata';
import type {
  Display,
  ElectronIpcListenKey,
  ExternalWebsite,
  FileDialogFilter,
  NavigateWebsiteAction,
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
  executeQuery: <T = QueryResponseItem>(dbPath: string, query: string) => T[];
  fileUrlToPath: (url: string) => string;
  fs: typeof FsExtra;
  getAllScreens: () => Promise<Display[]>;
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
  navigateWebsiteWindow: (action: NavigateWebsiteAction) => void;
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
  parseMediaFile: (
    filePath: string,
    options?: IOptions,
  ) => Promise<IAudioMetadata>;
  path: typeof Path;
  pathToFileURL: (path: string) => string;
  registerShortcut: (name: keyof SettingsValues, shortcut: string) => void;
  removeListeners: (channel: ElectronIpcListenKey) => void;
  setAutoStartAtLogin: (value: boolean) => void;
  toggleMediaWindow: (action: string) => void;
  unregisterShortcut: (shortcut: string) => void;
  zoomWebsiteWindow: (direction: 'in' | 'out') => void;
}

export const electronApi: ElectronApi = window.electronApi;
