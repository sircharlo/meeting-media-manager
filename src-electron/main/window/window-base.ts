import type { ElectronIpcListenKey, JwSiteParams } from 'src/types';

import {
  app,
  BrowserWindow,
  type BrowserWindowConstructorOptions,
} from 'electron';
import { fileURLToPath } from 'node:url';
import {
  IS_BETA,
  IS_DEV,
  PLATFORM,
  PRODUCT_NAME,
} from 'src-electron/constants';
import { urlVariables } from 'src-electron/main/session';
import { captureElectronError, getIconPath } from 'src-electron/main/utils';
import { StatefulBrowserWindow } from 'src-electron/main/window/window-state';
import { join, resolve } from 'upath';

export function closeOtherWindows(source: BrowserWindow) {
  try {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (win !== source && !win.isDestroyed()) win.close();
    }
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { name: 'closeOtherWindows' } },
    });
  }
}

/**
 * Creates a new browser window
 * @param name The name of the window
 * @param options The options for the window
 * @param defaultHeight The default height of the window
 * @param defaultWidth The default width of the window
 * @returns The created window
 */
export function createWindow(
  name: 'main' | 'media' | 'website' = 'main',
  options?: BrowserWindowConstructorOptions,
  websiteParams?: JwSiteParams,
) {
  const defaultSize = { height: 600, width: 1000 };

  // Create the browser window
  const opts: BrowserWindowConstructorOptions = {
    acceptFirstMouse: true,
    autoHideMenuBar: true,
    backgroundColor: 'grey',
    height: defaultSize.height,
    icon: getIconPath(IS_BETA ? 'beta' : 'icon'),
    minHeight: 450,
    minWidth: 500,
    show: false,
    title: PRODUCT_NAME,
    width: defaultSize.width,
    ...(options ?? {}),
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      preload:
        name === 'website'
          ? undefined
          : resolve(
              fileURLToPath(new URL('.', import.meta.url)),
              join(
                process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
                'electron-preload' +
                  process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION,
              ),
            ),
      sandbox: name === 'website',
      webSecurity: !IS_DEV,
      ...(options?.webPreferences ?? {}),
    },
  };
  const win =
    name === 'website'
      ? new BrowserWindow(opts)
      : new StatefulBrowserWindow({
          configFileName: `${name}-window-state.json`,
          configFilePath: app.getPath('userData'),
          ...opts,
        }).win;

  // Show the window when it's ready
  win.on('ready-to-show', () => {
    if (name !== 'media') win.show();
  });

  // Hide the menu bar
  if (PLATFORM !== 'darwin' && (name !== 'main' || !process.env.DEBUGGING)) {
    win.setMenuBarVisibility(false);
  }

  // Load the app
  let page = 'initial-congregation-selector';
  switch (name) {
    case 'media':
      page = 'media-player';
      break;
    case 'website':
      if (websiteParams?.site) {
        page = `https://www.${websiteParams.site}.org/?lang=${websiteParams?.langSymbol || ''}`;
      } else {
        page = `https://www.${urlVariables?.base || 'jw.org'}/${websiteParams?.langSymbol || ''}`;
      }
      break;
  }
  if (page.startsWith('https://')) {
    win.loadURL(page);
  } else if (process.env.DEV) {
    win.loadURL(process.env.APP_URL + `?page=${page}`);
  } else {
    // Use absolute path for index.html in production builds
    const indexPath = resolve(app.getAppPath(), 'index.html');
    win.loadFile(indexPath, { query: { page } });
  }

  // Devtools
  let devToolsOpenedCount = 0; // Track the number of times the devtools-opened event is fired
  if (process.env.DEBUGGING) {
    win.webContents.openDevTools(); // I like having dev tools open for all windows in dev
  } else {
    // Prevent devtools from being opened in production unless it's attempted more than twice
    win.webContents.on('devtools-opened', () => {
      devToolsOpenedCount += 1; // Increment the counter
      if (devToolsOpenedCount <= 2) {
        win?.webContents.closeDevTools(); // Close devtools for the first two attempts
      } else {
        console.debug('DevTools opened after 2 attempts'); // Log for debugging
      }
    });
  }

  return win;
}

export function logToWindow(
  win: BrowserWindow | null,
  msg: string,
  ctx: boolean | number | Record<string, unknown> | string = {},
  level: 'debug' | 'error' | 'info' | 'warn' = 'info',
) {
  if (level === 'debug' && !process.env.DEBUGGING) return;
  sendToWindow(win, 'log', { ctx, level, msg });
}
export function sendToWindow(
  win: BrowserWindow | null,
  channel: ElectronIpcListenKey,
  ...args: unknown[]
) {
  win?.webContents.send(channel, ...args);
}
