const {
    app,
    BrowserWindow,
    crashReporter,
    ipcMain,
    screen
  } = require("electron"), {
    autoUpdater
  } = require("electron-updater"),
  fs = require("graceful-fs"),
  os = require("os"),
  path = require("upath"),
  remote = require("@electron/remote/main");
crashReporter.start({
  uploadToServer: false
});
try {
  if (fs.existsSync(path.join(app.getPath("userData"), "disableHardwareAcceleration"))) app.disableHardwareAcceleration();
} catch (err) {
  console.error(err);
}
var win = null,
  mediaWin = null,
  displays = null,
  externalDisplays = null,
  authorizedCloseMediaWin = false;
remote.initialize();
function createUpdateWindow() {
  win = new BrowserWindow({
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: false,
      nodeIntegration: true,
    },
    width: 700,
    height: 700,
    minWidth: 700,
    minHeight: 700,
    title: "JW Meeting Media Fetcher"
  });
  win.on("close", (e) => {
    if (mediaWin) {
      e.preventDefault();
      win.webContents.send("notifyUser", ["warn", "cantCloseMediaWindowOpen"]);
    }
  });
  remote.enable(win.webContents);
  win.setMenuBarVisibility(false);
  win.loadFile("index.html");
  if (!app.isPackaged) win.webContents.openDevTools();
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
  ipcMain.on("attemptAutoUpdate", () => {
    autoUpdater.checkForUpdates();
  });
  ipcMain.on("hideMediaWindow", () => {
    if (mediaWin) {
      authorizedCloseMediaWin = true;
      mediaWin.close();
      mediaWin = null;
      authorizedCloseMediaWin = false;
    }
  });
  ipcMain.on("showMedia", (event, arg) => {
    mediaWin.webContents.send("showMedia", arg);
  });
  ipcMain.on("hideMedia", () => {
    mediaWin.webContents.send("hideMedia");
  });
  ipcMain.on("pauseVideo", () => {
    mediaWin.webContents.send("pauseVideo");
  });
  ipcMain.on("playVideo", () => {
    mediaWin.webContents.send("playVideo");
  });
  ipcMain.on("videoProgress", (event, percent) => {
    win.webContents.send("videoProgress", percent);
  });
  ipcMain.on("videoEnd", () => {
    win.webContents.send("videoEnd");
  });
  ipcMain.on("videoPaused", () => {
    win.webContents.send("videoPaused");
  });
  ipcMain.on("videoScrub", (event, timeAsPercent) => {
    mediaWin.webContents.send("videoScrub", timeAsPercent);
  });
  ipcMain.on("startMediaDisplay", (event, prefsFile) => {
    mediaWin.webContents.send("startMediaDisplay", prefsFile);
  });
  ipcMain.on("showMediaWindow", () => {
    let mainWinPosition = win.getPosition();
    let otherScreens = displays.filter(screen => !(mainWinPosition[0] >= screen.bounds.x && mainWinPosition[0] < (screen.bounds.x + screen.bounds.width)) || !(mainWinPosition[1] >= screen.bounds.y && mainWinPosition[1] < (screen.bounds.y + screen.bounds.height)));
    if (!mediaWin) {
      let windowOptions = {
        title: "JWMMF Media Window",
        frame: !externalDisplays,
        webPreferences: {
          backgroundThrottling: false,
          contextIsolation: false,
          nodeIntegration: true,
        },
        minHeight: 100,
      };
      let supplementaryOptions = {
        width: 1280,
        height: 720
      };
      if (externalDisplays.length > 0) {
        supplementaryOptions = {
          x: otherScreens[otherScreens.length - 1].bounds.x + 50,
          y: otherScreens[otherScreens.length - 1].bounds.y + 50,
          fullscreen: true
        };
      }
      Object.assign(windowOptions, supplementaryOptions);
      mediaWin = new BrowserWindow(windowOptions);
      mediaWin.setAlwaysOnTop(true, "screen-saver");
      mediaWin.setAspectRatio(16/9);
      mediaWin.setMenuBarVisibility(false);
      remote.enable(mediaWin.webContents);
      mediaWin.loadFile("mediaViewer.html");
      if (!app.isPackaged) mediaWin.webContents.openDevTools();
      mediaWin.on("close", (e) => {
        if (!authorizedCloseMediaWin) {
          e.preventDefault();
          win.webContents.send("notifyUser", ["warn", "cantCloseMediaWindowOpen"]);
        }
      }).on("will-resize", () => {
        mediaWin.webContents.send("windowResizing", mediaWin.getSize());
      }).on("resized", () => {
        mediaWin.webContents.send("windowResized");
      });
      mediaWin.on("closed", () => {
        mediaWin = null;
      });
    }
  });
  ipcMain.on("toggleMediaWindowFocus", () => {
    if (mediaWin.isVisible()) {
      mediaWin.hide();
    } else {
      mediaWin.show();
    }
  });
  autoUpdater.on("error", () => {
    win.webContents.send("congregationInitialSelector");
  });
  autoUpdater.on("update-not-available", () => {
    win.webContents.send("congregationInitialSelector");
  });
  autoUpdater.on("update-available", () => {
    if (os.platform() == "darwin") {
      win.webContents.send("congregationInitialSelector");
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
  app.whenReady().then(() => {
    displays = screen.getAllDisplays();
    externalDisplays = displays.filter((display) => display.bounds.x !== 0 || display.bounds.y !== 0);
    createUpdateWindow();
  });
  app.on("window-all-closed", () => {
    app.exit();
  });
}
