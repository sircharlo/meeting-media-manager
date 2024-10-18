import { enable, initialize } from '@electron/remote/main';
import { init } from '@sentry/electron/main';
import packageInfo from 'app/package.json';
import { app, BrowserWindow, ipcMain, Menu, session } from 'electron';
import { autoUpdater } from 'electron-updater';
import windowStateKeeper from 'electron-window-state';
import { existsSync, readFileSync, writeFileSync } from 'fs-extra';
import os from 'os';
import path from 'path';
import { join } from 'upath';

import { errorCatcher } from './utils';

init({
  dsn: 'https://0f2ab1c7ddfb118d25704c85957b8188@o1401005.ingest.us.sentry.io/4507449197920256',
  release: packageInfo.version,
});

initialize();

let updatesDisabled = false;
try {
  updatesDisabled = existsSync(
    path.join(app.getPath('userData'), 'Global Preferences', 'disable-updates'),
  );
} catch (err) {
  console.error(err);
}
if (!updatesDisabled) autoUpdater.checkForUpdatesAndNotify();

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();
let mainWindow: BrowserWindow | null;
let mediaWindow: BrowserWindow | null;

const allowedHostnames = [
  'jw.org',
  'jw-cdn.org',
  'akamaihd.net',
  'cloudfront.net',
];

const jwHostnames = ['jw.org'];

const isValidHostname = (hostname: string) => {
  // Check if the hostname is exactly one of the allowed hostnames
  if (allowedHostnames.includes(hostname)) {
    return true;
  }

  // Check for subdomain matches
  return allowedHostnames.some((allowedHostname) => {
    return (
      hostname === allowedHostname || hostname.endsWith(`.${allowedHostname}`)
    );
  });
};

const isJwHostname = (hostname: string) => {
  // Check if the hostname is exactly one of the allowed hostnames
  if (jwHostnames.includes(hostname)) {
    return true;
  }

  // Check for subdomain matches
  return jwHostnames.some((jwHostname) => {
    return hostname === jwHostname || hostname.endsWith(`.${jwHostname}`);
  });
};

function createMediaWindow() {
  const mediaWindowState = windowStateKeeper({
    defaultHeight: 720,
    defaultWidth: 1280,
    file: 'media-window-state.json',
  });
  const window = new BrowserWindow({
    alwaysOnTop: false,
    backgroundColor: 'black',
    frame: false,
    height: mediaWindowState.height,
    icon: path.resolve(path.join(__dirname, 'icons', 'media-player.png')),
    minHeight: 110,
    minWidth: 195,
    show: false,
    thickFrame: false,
    title: 'Media Window',
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
      sandbox: false,
      webSecurity: false,
    },
    width: mediaWindowState.width,
    x: mediaWindowState.x,
    y: mediaWindowState.y,
  });

  window.setAspectRatio(16 / 9);
  if (platform !== 'darwin') {
    window.setMenuBarVisibility(false);
  }
  if (process.env.DEBUGGING) {
    window.webContents.openDevTools();
  }

  enable(window.webContents);

  window.on('closed', () => {
    mediaWindow = null;
  });

  window.on('ready-to-show', () => {
    mediaWindowState.manage(window);
  });

  return window;
}

function createWindow() {
  // if (platform === 'win32') app.setAppUserModelId(app.getName()); // this causes weirdness with the profile folder
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const parsedUrl = new URL(details.url);
    if (isValidHostname(parsedUrl.hostname)) {
      if (details.requestHeaders) {
        const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/`;
        details.requestHeaders.Referer = baseUrl;
        details.requestHeaders.Origin = baseUrl;
        details.requestHeaders['User-Agent'] = details.requestHeaders[
          'User-Agent'
        ].replace('Electron', '');
      }
    }
    callback({ requestHeaders: details.requestHeaders });
  });
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const parsedUrl = new URL(details.url);
    let passthroughReferrer = false;
    if (details.referrer) {
      const referrerUrl = new URL(details.referrer);
      if (
        (isJwHostname(referrerUrl.hostname) &&
          parsedUrl.hostname !== 'b.jw-cdn.org') ||
        referrerUrl.hostname === parsedUrl.hostname
      )
        passthroughReferrer = true;
    }
    if (isValidHostname(parsedUrl.hostname) && !passthroughReferrer) {
      if (details.responseHeaders) {
        if (
          !details.responseHeaders['access-control-allow-origin'] ||
          !details.responseHeaders['access-control-allow-origin'].includes('*')
        ) {
          details.responseHeaders['access-control-allow-headers'] = [
            'Content-Type,Authorization,X-Client-ID',
          ];
          details.responseHeaders['access-control-allow-origin'] = ['*'];
          details.responseHeaders['access-control-allow-credentials'] = [
            'true',
          ];
        }
        if (details.responseHeaders['x-frame-options'])
          delete details.responseHeaders['x-frame-options'];
      }
    }
    callback({ responseHeaders: details.responseHeaders });
  });
  /**
   * Initial window options
   */

  try {
    const windowStateFilePath = join(
      app.getPath('userData'),
      'window-state.json',
    );

    if (existsSync(windowStateFilePath)) {
      const mainWindowState = JSON.parse(
        readFileSync(windowStateFilePath, 'utf8'),
      );

      const maximumThreshold = 30;
      const { displayBounds, height, width, x, y } = mainWindowState;
      const overflowX = x + width - displayBounds.width - displayBounds.x;
      const overflowY = y + height - displayBounds.height - displayBounds.y;

      if (0 < overflowX && overflowX < maximumThreshold)
        mainWindowState.width -= overflowX;
      if (0 < overflowY && overflowY < maximumThreshold)
        mainWindowState.height -= overflowY;

      if (x < displayBounds.x && x > displayBounds.x - maximumThreshold)
        mainWindowState.x = displayBounds.x;
      if (y < displayBounds.y && y > displayBounds.y - maximumThreshold)
        mainWindowState.y = displayBounds.y;

      writeFileSync(windowStateFilePath, JSON.stringify(mainWindowState));
    }
  } catch (error) {
    errorCatcher(error);
  }

  const mainWindowState = windowStateKeeper({
    defaultHeight: 600,
    defaultWidth: 1000,
  });

  mainWindow = new BrowserWindow({
    backgroundColor: 'grey',
    height: mainWindowState.height,
    icon: path.resolve(path.join(__dirname, 'icons', 'icon.png')),
    minHeight: 400,
    minWidth: 500,
    show: false,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
      sandbox: false,
      webSecurity: false,
    },
    width: mainWindowState.width,
    x: mainWindowState.x,
    y: mainWindowState.y,
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([]));

  enable(mainWindow.webContents);
  mainWindow.webContents.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  );

  if (process.env.DEBUGGING) {
    mainWindow.webContents.openDevTools();
  }

  const closeAllWindows = () => {
    try {
      if (mediaWindow && !mediaWindow.isDestroyed()) mediaWindow.close();
      const websiteWindow = BrowserWindow.getAllWindows().find((w) =>
        w.webContents.getURL().includes('https://'),
      );
      if (websiteWindow && !websiteWindow.isDestroyed()) websiteWindow.close();
    } catch (err) {
      errorCatcher(err);
    }
  };

  let authorizedClose = false;

  mainWindow.on('close', async (e) => {
    try {
      if (!authorizedClose) {
        e.preventDefault();
        mainWindow?.webContents?.send('attemptedClose');
      } else {
        closeAllWindows();
      }
    } catch (err) {
      errorCatcher(err);
      closeAllWindows();
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
    }
  });

  ipcMain.on('authorizedClose', () => {
    authorizedClose = true;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindowState.manage(mainWindow);
    }
  });

  if (!mediaWindow || mediaWindow.isDestroyed()) {
    mediaWindow = createMediaWindow();
  }
  mainWindow.loadURL(
    process.env.APP_URL + '?page=initial-congregation-selector',
  );
  mediaWindow.loadURL(process.env.APP_URL + '?page=media-player');
}

app
  .whenReady()
  .then(createWindow)
  .catch((err) => errorCatcher(err));

// app.on('window-all-closed', () => {
// if (platform !== 'darwin') {
// app.quit();
// }
// });

app.on('activate', () => {
  if (!mainWindow || (mainWindow && mainWindow.isDestroyed())) {
    createWindow();
  } else {
    mainWindow?.show();
  }
});
