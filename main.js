const {
    app,
    BrowserWindow,
    ipcMain
  } = require("electron"), {
    autoUpdater
  } = require("electron-updater"),
  os = require("os"),
  remote = require("@electron/remote/main");
var win = null;
remote.initialize();
function createUpdateWindow() {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    width: 700,
    height: 700,
    resizable: false,
    title: "JW Meeting Media Fetcher"
  });
  remote.enable(win.webContents);
  win.setMenuBarVisibility(false);
  win.loadFile("index.html");
}
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  ipcMain.on("autoUpdate", () => {
    autoUpdater.checkForUpdates();
  });
  autoUpdater.on("error", () => {
    win.webContents.send("goAhead");
  });
  autoUpdater.on("update-not-available", () => {
    win.webContents.send("goAhead");
  });
  autoUpdater.on("update-available", () => {
    if (os.platform() == "darwin") {
      win.webContents.send("goAhead");
      win.webContents.send("macUpdate");
    } else {
      win.webContents.send("overlay", ["cloud-download-alt fa-beat", "circle-notch fa-spin text-success"]);
      autoUpdater.downloadUpdate();
    }
  });
  autoUpdater.on("update-downloaded", () => {
    win.webContents.send("overlay", ["cloud-download-alt fa-beat", "check-circle"]);
    setImmediate(() => {
      autoUpdater.quitAndInstall();
    });
  });
  autoUpdater.logger = console;
  autoUpdater.autoDownload = false;
  app.whenReady().then(createUpdateWindow);
  app.on("window-all-closed", () => {
    app.exit();
  });
}
