// ipcMain.on / ipcRenderer.send channels
export type ElectronIpcSendKey =
  | 'authorizedClose'
  | 'navigateWebsiteWindow'
  | 'openExternal'
  | 'setUrlVariables'
  | 'toggleOpenAtLogin'
  | 'toggleWebsiteWindow'
  | 'unregisterShortcut'
  | 'zoomWebsiteWindow';

// ipcMain.handle / ipcRenderer.invoke channels
export type ElectronIpcInvokeKey =
  | 'downloadErrorIsExpected'
  | 'getVersion'
  | 'openFileDialog'
  | 'registerShortcut';

// BrowserWindow.webContents.send / ipcRenderer.on channels
export type ElectronIpcListenKey =
  | 'attemptedClose'
  | 'log'
  | 'shortcut'
  | 'websiteWindowClosed';

export type ExternalWebsite = 'docs' | 'repo';
export type NavigateWebsiteAction = 'back' | 'forward' | 'refresh';
export type FileDialogFilter = 'image' | 'jwpub' | 'jwpub+image';
