import type { ElectronIpcListenKey } from 'src/types';

import { IS_DEV, PLATFORM } from 'app/src-electron/constants';
import {
  app,
  BrowserWindow,
  type BrowserWindowConstructorOptions,
} from 'electron';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

import { captureElectronError } from './../log';
import { urlVariables } from './../session';
import { StatefulBrowserWindow } from './window-state';

export function closeOtherWindows(source: BrowserWindow) {
  try {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (win !== source) win.close();
    }
  } catch (e) {
    captureElectronError(e);
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
  lang = '',
) {
  const defaultSize = { height: 600, width: 1000 };
  // Create the browser window
  const opts: BrowserWindowConstructorOptions = {
    autoHideMenuBar: true,
    backgroundColor: 'grey',
    height: defaultSize.height,
    icon: resolve(
      join(
        fileURLToPath(new URL('.', import.meta.url)),
        'icons',
        `icon.${PLATFORM === 'win32' ? 'ico' : PLATFORM === 'darwin' ? 'icns' : 'png'}`,
      ),
    ),
    minHeight: 450,
    minWidth: 500,
    show: false,
    title: 'Meeting Media Manager',
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
      page = `https://www.${urlVariables?.base || 'jw.org'}/${lang}`;
      break;
  }
  if (page.startsWith('https://')) {
    win.loadURL(page);
  } else if (process.env.DEV) {
    win.loadURL(process.env.APP_URL + `?page=${page}`);
  } else {
    win.loadFile('index.html', { query: { page } });
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
