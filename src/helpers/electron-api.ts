import type { ShortcutDetails } from 'electron';
import type FsExtra from 'fs-extra';
import type HeicConvert from 'heic-convert';
import type KlawSync from 'klaw-sync';
import type { IAudioMetadata, IOptions } from 'music-metadata';
import type { QueryResponseItem } from 'src/types';
import type Path from 'upath';

export interface ElectronFileFilter {
  extensions: string[];
  name: string;
}

export interface ElectronApi {
  closeWebsiteWindow: () => void;
  convert: typeof HeicConvert;
  convertPdfToImages: (
    pdfPath: string,
    outputFolder: string,
  ) => Promise<string[]>;
  decompress: (inputZip: string, outputFolder: string) => Promise<void>;
  executeQuery: (dbPath: string, query: string) => QueryResponseItem[];
  fileUrlToPath: (url: string) => string;
  fs: typeof FsExtra;
  getAllScreens: (
    type?: string,
  ) => ({ mainWindow?: boolean; mediaWindow?: boolean } & Electron.Display)[];
  getAppDataPath: () => string;
  getAppVersion: () => string;
  getLocalPathFromFileObject: (fileObject: File) => string;
  getUserDataPath: () => string;
  getUserDesktopPath: () => string;
  isFileUrl: (url: string) => boolean;
  klawSync: typeof KlawSync;
  moveMediaWindow: (
    targetScreenNumber?: number,
    windowedMode?: boolean,
    noEvent?: boolean,
  ) => void;
  navigateWebsiteWindow: (action: string) => void;
  openExternalWebsite: (url: string) => void;
  openFileDialog: (
    single?: boolean,
    filter?: string[],
  ) => Promise<Electron.OpenDialogReturnValue | undefined>;
  openWebsiteWindow: () => void;
  parseFile: (filePath: string, options?: IOptions) => Promise<IAudioMetadata>;
  path: typeof Path;
  pathToFileURL: (path: string) => string;
  readShortcutLink: (shortcutPath: string) => ShortcutDetails;
  registerShortcut: (shortcut: string, callback: () => void) => void;
  setAutoStartAtLogin: (value: boolean) => void;
  setMediaWindowPosition: (x: number, y: number) => void;
  toggleMediaWindow: (action: string) => void;
  unregisterShortcut: (shortcut: string) => void;
  writeShortcutLink: (shortcutPath: string, details: ShortcutDetails) => void;
  zoomWebsiteWindow: (action: string) => void;
}

export const electronApi: ElectronApi = window.electronApi;
