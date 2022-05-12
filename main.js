const {
    app,
    BrowserWindow,
    crashReporter,
    ipcMain,
    screen
  } = require("electron"), {
    autoUpdater
  } = require("electron-updater"),
  appLongName = "JW Meeting Media Fetcher",
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
    minWidth: 600,
    minHeight: 410,
    icon: path.join(__dirname, "build", "icon.ico"),
    title: appLongName
  });
  win.on("will-move", () => {
    if (mediaWin) {
      let screenInfo = getScreenInfo();
      if (screenInfo.otherScreens.length > 0) {
        if (screenInfo.winMidpoints) {
          let mainWinSameAsMedia = Object.entries(screenInfo.winMidpoints).map(item => screen.getDisplayNearestPoint(item[1])).every( (val, i, arr) => val.id === arr[0].id );
          if (mainWinSameAsMedia) win.webContents.send("moveMediaWindowToOtherScreen");
        }
      }
    }
  });
  win.setAppDetails({
    appId: appLongName
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
function fadeWindow(browserWindow) {
  // shelving the graceful fade for now, as it seems to be causing more issues than what it's worth
  // if (os.platform() == "linux") {
  if (!browserWindow.isVisible()) {
    browserWindow.show();
    win.webContents.send("mediaWindowVisibilityChanged", "shown");
  } else {
    browserWindow.hide();
    win.webContents.send("mediaWindowVisibilityChanged", "hidden");
  }
  // } else {
  //   let fadeType = mediaWin.getOpacity() > 0 ? "out" : "in";
  //   if (fadeType == "in") win.webContents.send("mediaWindowVisibilityChanged", "shown");
  //   let opacity = browserWindow.getOpacity();
  //   const interval = setInterval(() => {
  //     let wereDone = (fadeType == "in" ? opacity >= 1 : opacity <= 0);
  //     if (wereDone) {
  //       clearInterval(interval);
  //       if (fadeType == "out") win.webContents.send("mediaWindowVisibilityChanged", "hidden");
  //     }
  //     browserWindow.setOpacity(opacity);
  //     opacity = opacity + 0.05 * (fadeType == "in" ? 1 : -1);
  //   }, 5);
  //   return interval;
  // }
}
function getScreenInfo() {
  let displays = [],
    winMidpoints = {},
    winCoordinates = {};
  try {
    winCoordinates.main = win.getPosition().concat(win.getSize());
    winMidpoints.main = {
      x: winCoordinates.main[0] + (winCoordinates.main[2] / 2),
      y: winCoordinates.main[1] + (winCoordinates.main[3] / 2)
    };
    if (mediaWin) {
      winCoordinates.media = mediaWin.getPosition().concat(win.getSize());
      winMidpoints.media = {
        x: winCoordinates.media[0] + (winCoordinates.media[2] / 2),
        y: winCoordinates.media[1] + (winCoordinates.media[3] / 2)
      };
    }
    displays = screen.getAllDisplays().map((display, i) => {
      display.humanFriendlyNumber = i + 1;
      return display;
    });
  } catch(err) {
    console.error(err);
  }
  return {
    displays: displays,
    winMidpoints: winMidpoints,
    otherScreens: displays.filter(display => display.id !== screen.getDisplayNearestPoint(winMidpoints.main).id)
  };
}
function setMediaWindowPosition(mediaWindowOpts) {
  try {
    if (mediaWin) {
      let screenInfo = getScreenInfo();
      mediaWin.setBounds({
        x: screenInfo.displays.find(display => display.id == mediaWindowOpts.destination).bounds.x + 50,
        y: screenInfo.displays.find(display => display.id == mediaWindowOpts.destination).bounds.y + 50,
        ...(mediaWindowOpts.type == "window") && {width: 1280},
        ...(mediaWindowOpts.type == "window") && {height: 720}
      });
      if (mediaWindowOpts.type == "fullscreen" && screenInfo.otherScreens.length > 0 && !mediaWin.isFullScreen()) {
        mediaWin.setFullScreen(true);
      } else if (mediaWindowOpts.type == "window" && mediaWin.isFullScreen()) {
        mediaWin.setFullScreen(false);
      }
    }
  } catch(err) {
    console.error(err);
  }
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
  ipcMain.on("setMediaWindowPosition", (event, mediaWindowOpts) => {
    setMediaWindowPosition(mediaWindowOpts);
  });
  ipcMain.on("showMediaWindow", (event, mediaWindowOpts) => {
    if (!mediaWin) {
      let screenInfo = getScreenInfo();
      let windowOptions = {
        title: "Media Window",
        icon: path.join(__dirname, "public", "videoPlayer.ico"),
        frame: false,
        webPreferences: {
          backgroundThrottling: false,
          contextIsolation: false,
          nodeIntegration: true,
        },
        backgroundColor: "black",
        minHeight: 100,
        alwaysOnTop: true,
        width: 1280,
        height: 720,
        show: false,
        thickFrame: false,
        x: screenInfo.displays.find(display => display.id == mediaWindowOpts.destination).bounds.x + 50,
        y: screenInfo.displays.find(display => display.id == mediaWindowOpts.destination).bounds.y + 50,
      };
      if (mediaWindowOpts.type == "fullscreen") windowOptions.fullscreen = true;
      mediaWin = new BrowserWindow(windowOptions);
      mediaWin.setAppDetails({
        appId: appLongName
      });
      mediaWin.setAlwaysOnTop(true, "screen-saver");
      mediaWin.setAspectRatio(16/9);
      mediaWin.setMenuBarVisibility(false);
      remote.enable(mediaWin.webContents);
      mediaWin.loadFile("mediaViewer.html");
      // if (!app.isPackaged) mediaWin.webContents.openDevTools();
      mediaWin.on("close", (e) => {
        if (!authorizedCloseMediaWin) e.preventDefault();
      }).on("will-resize", () => {
        mediaWin.webContents.send("windowResizing", mediaWin.getSize());
      }).on("resized", () => {
        mediaWin.webContents.send("windowResized");
      }).once("ready-to-show", () => {
        mediaWin.show();
      });
      // mediaWin.on("closed", () => {
      //   mediaWin = null;
      // });
      win.webContents.send("mediaWindowShown");
    } else {
      setMediaWindowPosition(mediaWindowOpts);
    }
  });
  ipcMain.on("toggleMediaWindowFocus", () => {
    fadeWindow(mediaWin);
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
      win.webContents.send("displaysChanged");
    });
    screen.on("display-added", () => {
      win.webContents.send("displaysChanged");
    });
    createUpdateWindow();
  });
  app.on("window-all-closed", () => {
    app.exit();
  });
}
