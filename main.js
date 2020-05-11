const {
  app,
  BrowserWindow
} = require('electron'), {
  autoUpdater
} = require("electron-updater");
var win = {};

app.whenReady().then(createUpdateWindow);

function createUpdateWindow() {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    width: 800,
    height: 700,
    icon: __dirname + '/icon.png'
  })
  win.loadFile('updateCheck.html')
  win.setMenuBarVisibility(false)
  //win.webContents.openDevTools()
}

function goAhead() {
  win.loadFile('index.html')
}

autoUpdater.on('update-available', () => {
  win.loadFile('updateAvailable.html')
  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-not-available', () => {
  goAhead();
});

autoUpdater.on('update-downloaded', () => {
  win.loadFile('updateDownloaded.html');
  setImmediate(() => {
    autoUpdater.quitAndInstall();
  })
})

autoUpdater.checkForUpdates();

app.on('window-all-closed', () => {
  app.quit()
})

/*app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})*/