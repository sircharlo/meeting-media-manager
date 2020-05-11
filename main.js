const {
  app,
  BrowserWindow,
  ipcMain,
  dialog
} = require('electron');
const {
  autoUpdater
} = require("electron-updater");

app.whenReady().then(createUpdateWindow);

var win = {};

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

autoUpdater.on('update-available', () => {
  win.loadFile('updateAvailable.html')
  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-not-available', () => {
  goAhead();

  /*dialog.showMessageBox({
    title: 'No updates available',
    message: 'Current version is up-to-date.'
  })
  updater.enabled = true
  updater = null*/

  //  win.close();
});

autoUpdater.on('update-downloaded', () => {
  win.loadFile('updateDownloaded.html');
  setInterval(() => {
    autoUpdater.quitAndInstall();
  }, 5000);
  //win.webContents.openDevTools()

  /*dialog.showMessageBox({
    title: 'Install update',
    message: 'Update downloaded, application will now quit and update...'
  }, () => {
    setImmediate(() => */

  /*)
    })*/
})

autoUpdater.checkForUpdates();

/*function goAhead() {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(createWindow)
}*/

function goAhead() {
  // Create the browser window.
  /*  const win = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true
      },
      width: 800,
      height: 700,
      icon: __dirname + '/icon.png'
    })*/

  // and load the index.html of the app.
  win.loadFile('index.html')
  //win.setMenuBarVisibility(false)

  // Open the DevTools.
  //win.webContents.openDevTools()
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //  if (process.platform !== 'darwin') {
  app.quit()
  //  }
})

/*app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})*/

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.