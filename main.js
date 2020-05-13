const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron'), {
  autoUpdater
} = require("electron-updater");
var win = {};

function createUpdateWindow() {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    width: 600,
    height: 600,
    resizable: false,
    icon: __dirname + '/icon.png'
  })
  win.setMenuBarVisibility(false)
  win.loadFile('index.html')
  //win.webContents.openDevTools()
}

ipcMain.on('autoUpdate', () => {
  autoUpdater.checkForUpdates();
})

autoUpdater.on('update-not-available', () => {
  win.webContents.send('hideThenShow', ['UpdateCheck', 'PleaseWait']);
  win.webContents.send('goAhead');
});

autoUpdater.on('update-available', () => {
  win.webContents.send('hideThenShow', ['UpdateCheck', 'UpdateAvailable'])
  autoUpdater.downloadUpdate();
});

autoUpdater.on('download-progress', (prog) => {
  var timeleft = "...";
  try {
    var timeleft = ((prog.total - prog.transferred) / prog.bytesPerSecond).toFixed(0);
  } catch (err) {
    console.log(err)
  }
  win.webContents.send('updateDownloadProgress', [prog.percent, timeleft])
});

autoUpdater.on('update-downloaded', () => {
  win.webContents.send('hideThenShow', ['UpdateAvailable', 'UpdateDownloaded']);
  setImmediate(() => {
    autoUpdater.quitAndInstall();
  });
})

autoUpdater.logger = console;
autoUpdater.autoDownload = false;

app.whenReady().then(createUpdateWindow);

/*app.on('window-all-closed', () => {
  app.quit()
})*/

/*app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})*/