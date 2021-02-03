const {
    app,
    BrowserWindow,
    ipcMain
  } = require("electron"), {
    autoUpdater
  } = require("electron-updater");
var win = {};

function createUpdateWindow() {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    },
    width: 600,
    height: 600,
    resizable: false,
    title: "JW Meeting Media Fetcher"
  });
  win.setMenuBarVisibility(false);
  win.loadFile("index.html");
}

ipcMain.on("autoUpdate", () => {
  win.webContents.send("hideThenShow", ["InternetCheck", "UpdateCheck"]);
  autoUpdater.checkForUpdates();
});

ipcMain.on("noInternet", () => {
  win.webContents.send("hideThenShow", ["InternetCheck", "InternetFail"]);
  setInterval(() => {
    win.webContents.send("checkInternet");
  }, 10000);
});

autoUpdater.on("error", (err) => {
  console.log(err);
  win.webContents.send("goAhead");
});


autoUpdater.on("update-not-available", () => {
  win.webContents.send("goAhead");
});

autoUpdater.on("update-available", () => {
  win.webContents.send("hideThenShow", ["UpdateCheck", "UpdateAvailable"]);
  autoUpdater.downloadUpdate();
});

autoUpdater.on("download-progress", (prog) => {
  var timeleft = "...";
  try {
    timeleft = ((prog.total - prog.transferred) / prog.bytesPerSecond).toFixed(0);
  } catch (err) {
    console.log(err);
  }
  win.webContents.send("updateDownloadProgress", [prog.percent, timeleft]);
});

autoUpdater.on("update-downloaded", () => {
  win.webContents.send("hideThenShow", ["UpdateAvailable", "UpdateDownloaded"]);
  setImmediate(() => {
    autoUpdater.quitAndInstall();
  });
});

autoUpdater.logger = console;
autoUpdater.autoDownload = false;

app.whenReady().then(createUpdateWindow);

app.on("window-all-closed", () => {
  app.quit();
});
