// ipcMain.on / ipcRenderer.send channels
export type ElectronIpcSendKey =
  | 'authorizedClose'
  | 'openExternal'
  | 'toggleOpenAtLogin'
  | 'toggleWebsiteWindow'
  | 'unregisterShortcut';

// ipcMain.handle / ipcRenderer.invoke channels
export type ElectronIpcInvokeKey =
  | 'getVersion'
  | 'openFileDialog'
  | 'registerShortcut';

// BrowserWindow.webContents.send / ipcRenderer.on channels
export type ElectronIpcListenKey = 'attemptedClose' | 'log' | 'shortcut';

export type ExternalWebsite = 'docs' | 'repo';
export type FileDialogFilter = 'image' | 'jwpub' | 'jwpub+image';
