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
  closeAttempts = 0,
  dontClose = false,
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
    icon: "build/icon.ico",
    title: "JW Meeting Media Fetcher"
  });
  win.on("moved", () => {
    win.webContents.send("moveMediaWindow");
  });
  win.on("close", (e) => {
    if (dontClose && closeAttempts < 2) {
      e.preventDefault();
      win.webContents.send("notifyUser", ["warn", "cantCloseMediaWindowOpen"]);
      closeAttempts++;
      setTimeout(() => {
        closeAttempts--;
      }, 10000);
    } else if (mediaWin) {
      mediaWin.destroy();
    }
  });
  remote.enable(win.webContents);
  win.setMenuBarVisibility(false);
  win.loadFile("index.html");
  if (!app.isPackaged) win.webContents.openDevTools();
}
function fadeWindow(browserWindow, fadeType) {
  if (fadeType == "in") win.webContents.send("mediaWindowVisibilityChanged", "shown");
  let opacity = browserWindow.getOpacity();
  const interval = setInterval(() => {
    let wereDone = (fadeType == "in" ? opacity >= 1 : opacity <= 0);
    if (wereDone) {
      clearInterval(interval);
      if (fadeType == "out") win.webContents.send("mediaWindowVisibilityChanged", "hidden");
    }
    browserWindow.setOpacity(opacity);
    opacity = opacity + 0.05 * (fadeType == "in" ? 1 : -1);
  }, 5);
  return interval;
}
function getScreenInfo() {
  let displays = [],
    mainWinMidpoint = {};
  try {
    let mainWinCoordinates = win.getPosition().concat(win.getSize());
    mainWinMidpoint = {
      x: mainWinCoordinates[0] + (mainWinCoordinates[2] / 2),
      y: mainWinCoordinates[1] + (mainWinCoordinates[3] / 2)
    };
    displays = screen.getAllDisplays();
  } catch(err) {
    console.error(err);
  }
  return {
    displays: displays,
    mainWinMidpoint: mainWinMidpoint,
    otherScreens: displays.filter(display => display.id !== screen.getDisplayNearestPoint(mainWinMidpoint).id)
  };
}
function closeMediaWindow() {
  if (mediaWin) {
    authorizedCloseMediaWin = true;
    mediaWin.close();
    mediaWin = null;
    authorizedCloseMediaWin = false;
  }
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
  ipcMain.on("closeMediaWindow", () => {
    closeMediaWindow();
  });
  ipcMain.on("getScreenInfo", (event) => {
    event.returnValue = getScreenInfo();
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
  ipcMain.on("preventQuit", () => {
    dontClose = true;
  });
  ipcMain.on("allowQuit", () => {
    dontClose = false;
  });
  ipcMain.on("startMediaDisplay", (event, prefsFile) => {
    mediaWin.webContents.send("startMediaDisplay", prefsFile);
  });
  ipcMain.on("setMediaWindowDestination", (event, mediaWindowDestination) => {
    try {
      if (mediaWin) {
        let screenInfo = getScreenInfo();
        if (mediaWindowDestination !== "window") {
          if (screen.getDisplayNearestPoint(screenInfo.mainWinMidpoint).id == screen.getDisplayNearestPoint(mediaWin.getBounds()).id) {
            mediaWin.setBounds(screenInfo.displays.find(display => display.id == mediaWindowDestination).bounds);
          }
          if (!mediaWin.isFullScreen()) mediaWin.setFullScreen(true);
        } else {
          if (screenInfo.otherScreens.length > 0 && screen.getDisplayNearestPoint(mediaWin.getBounds()).id == screen.getDisplayNearestPoint(win.getBounds()).id) mediaWin.setBounds(screenInfo.otherScreens[0].bounds);
            if (mediaWin.isFullScreen()) mediaWin.setFullScreen(false);
            mediaWin.setSize(1280, 720);
            mediaWin.center();
        }
        if (!mediaWin.isFocused()) mediaWin.focus();
      }
    } catch(err) {
      console.error(err);
    }
  });
  ipcMain.on("showMediaWindow", (event, mediaWindowDestination) => {
    closeMediaWindow();
    if (!mediaWin) {
      let screenInfo = getScreenInfo();
      let windowOptions = {
        title: "Media Window",
        icon: "build/video-player.ico",
        frame: false,
        webPreferences: {
          backgroundThrottling: false,
          contextIsolation: false,
          nodeIntegration: true,
        },
        minHeight: 100,
        alwaysOnTop: true
      };
      let supplementaryOptions = {
        width: 1280,
        height: 720
      };
      if (mediaWindowDestination !== "window") {
        supplementaryOptions = {
          x: screenInfo.displays.find(display => display.id == mediaWindowDestination).bounds.x + 50,
          y: screenInfo.displays.find(display => display.id == mediaWindowDestination).bounds.y + 50,
          fullscreen: true
        };
      }
      Object.assign(windowOptions, supplementaryOptions);
      mediaWin = new BrowserWindow(windowOptions);
      if (screenInfo.otherScreens.length > 0 && mediaWindowDestination == "window") {
        mediaWin.setBounds(screenInfo.otherScreens[0].bounds);
        mediaWin.setSize(1280, 720);
        mediaWin.center();
      }
      mediaWin.setAlwaysOnTop(true, "pop-up-menu");
      mediaWin.setAspectRatio(16/9);
      mediaWin.setMenuBarVisibility(false);
      remote.enable(mediaWin.webContents);
      mediaWin.loadFile("mediaViewer.html");
      if (!app.isPackaged) mediaWin.webContents.openDevTools();
      mediaWin.on("close", (e) => {
        if (!authorizedCloseMediaWin) e.preventDefault();
      }).on("will-resize", () => {
        mediaWin.webContents.send("windowResizing", mediaWin.getSize());
      }).on("resized", () => {
        mediaWin.webContents.send("windowResized");
      });
      mediaWin.on("closed", () => {
        mediaWin = null;
      });
      win.webContents.send("mediaWindowShown");
    }
  });
  ipcMain.on("toggleMediaWindowFocus", () => {
    if (mediaWin.getOpacity() > 0) {
      fadeWindow(mediaWin, "out");
    } else {
      fadeWindow(mediaWin, "in");
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
    screen.on("display-removed", () => {
      win.webContents.send("moveMediaWindow");
    });
    screen.on("display-added", () => {
      win.webContents.send("moveMediaWindow");
    });
    createUpdateWindow();
  });
  app.on("window-all-closed", () => {
    app.exit();
  });
}
