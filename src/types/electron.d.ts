// ipcMain.on / ipcRenderer.send channels
export type ElectronIpcSendKey =
  | 'authorizedClose'
  | 'moveMediaWindow'
  | 'navigateWebsiteWindow'
  | 'openExternal'
  | 'toggleOpenAtLogin'
  | 'toggleWebsiteWindow'
  | 'unregisterShortcut'
  | 'zoomWebsiteWindow';

// ipcMain.handle / ipcRenderer.invoke channels
export type ElectronIpcInvokeKey =
  | 'downloadErrorIsExpected'
  | 'getAllScreens'
  | 'getVersion'
  | 'openFileDialog'
  | 'registerShortcut';

// BrowserWindow.webContents.send / ipcRenderer.on channels
export type ElectronIpcListenKey =
  | 'attemptedClose'
  | 'log'
  | 'screenChange'
  | 'screenPrefsChange'
  | 'shortcut'
  | 'websiteWindowClosed';

export type ExternalWebsite = 'docs' | 'repo';
export type NavigateWebsiteAction = 'back' | 'forward' | 'refresh';
export type FileDialogFilter = 'image' | 'jwpub' | 'jwpub+image';
export type Display = {
  mainWindow?: boolean;
  mediaWindow?: boolean;
} & Electron.Display;
