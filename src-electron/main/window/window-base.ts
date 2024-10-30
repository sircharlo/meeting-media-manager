import type { ElectronIpcListenKey } from 'src/types';

import { enable as enableElectronRemote } from '@electron/remote/main';
import pkg from 'app/package.json';
import {
  app,
  BrowserWindow,
  type BrowserWindowConstructorOptions,
} from 'electron';
import path from 'path';

import { PLATFORM } from './../../constants';
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
) {
  // Create the browser window
  const opts: BrowserWindowConstructorOptions = {
    backgroundColor: 'grey',
    height: 600,
    icon: path.resolve(
      path.join(
        __dirname,
        'icons',
        `icon.${PLATFORM === 'win32' ? 'ico' : 'png'}`,
      ),
    ),
    minHeight: 400,
    minWidth: 500,
    show: false,
    title: 'Meeting Media Manager',
    width: 1000,
    ...(options ?? {}),
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
      sandbox: false,
      webSecurity: false,
      ...(options?.webPreferences ?? {}),
    },
  };
  const win =
    name !== 'website'
      ? new StatefulBrowserWindow({
          configFileName: `${name}-window-state.json`,
          configFilePath: path.join(app.getPath('appData'), pkg.productName),
          ...opts,
        }).win
      : new BrowserWindow(opts);

  // Show the window when it's ready
  win.on('ready-to-show', () => {
    if (name !== 'media') win.show();
  });

  // Enable Electron remote
  enableElectronRemote(win.webContents);

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
      page = 'https://www.jw.org';
      break;
  }
  win.loadURL(
    page.startsWith('https') ? page : process.env.APP_URL + `?page=${page}`,
  );

  // Devtools
  if (process.env.DEBUGGING) {
    win.webContents.openDevTools();
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
  ctx: Record<string, unknown> | string = {},
  level: 'debug' | 'error' | 'info' | 'warn' = 'info',
) {
  if (level === 'debug' && !process.env.DEBUGGING) return;
  sendToWindow(win, 'log', { ctx, level, msg });
}
export function closeOtherWindows(source: BrowserWindow) {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win !== source) win.close();
  });
}
