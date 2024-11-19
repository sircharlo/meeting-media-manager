import type { ElectronIpcListenKey } from 'src/types';

import { CURRENT_DIR, IS_DEV, PLATFORM } from 'app/src-electron/constants';
import { errorCatcher } from 'app/src-electron/utils';
import {
  app,
  BrowserWindow,
  type BrowserWindowConstructorOptions,
} from 'electron';
import { join, resolve } from 'path';

import { urlVariables } from '../session';
import { StatefulBrowserWindow } from './window-state';

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
        CURRENT_DIR,
        'icons',
        `icon.${PLATFORM === 'win32' ? 'ico' : 'png'}`,
      ),
    ),
    minHeight: 400,
    minWidth: 500,
    show: false,
    title: 'Meeting Media Manager',
    width: defaultSize.width,
    ...(options ?? {}),
    webPreferences: {
      backgroundThrottling: false,
      preload:
        name === 'website'
          ? undefined
          : resolve(
              CURRENT_DIR,
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
  if (process.env.DEBUGGING) {
    win.webContents.openDevTools(); // I like having dev tools open for all windows in dev
  } else {
    // Prevent devtools from being opened in production
    win.webContents.on('devtools-opened', () => {
      win?.webContents.closeDevTools();
    });
  }

  return win;
}

export function sendToWindow(
  win: BrowserWindow | null,
  channel: ElectronIpcListenKey,
  ...args: unknown[]
) {
  win?.webContents.send(channel, ...args);
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
export function closeOtherWindows(source: BrowserWindow) {
  try {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (win !== source) win.close();
    }
  } catch (e) {
    errorCatcher(e);
  }
}
