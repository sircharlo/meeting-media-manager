// ipcMain.on / ipcRenderer.send channels
export type ElectronIpcSendKey = 'authorizedClose' | 'openExternal';

// ipcMain.handle / ipcRenderer.invoke channels
export type ElectronIpcInvokeKey = 'getVersion';

// BrowserWindow.webContents.send / ipcRenderer.on channels
export type ElectronIpcListenKey = 'attemptedClose' | 'log';

export type ExternalWebsite = 'docs' | 'repo';
export type FileDialogFilter = 'image' | 'jwpub' | 'jwpub+image';
