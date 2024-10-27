import { enable as enableElectronRemote } from '@electron/remote/main';
import { BrowserWindow, type BrowserWindowConstructorOptions } from 'electron';
import windowStateKeeper from 'electron-window-state';
import path from 'path';

import { PLATFORM } from './constants';

export function createWindow(
  name: 'main' | 'media' | 'website' = 'main',
  options?: BrowserWindowConstructorOptions,
  defaultHeight = 600,
  defaultWidth = 1000,
) {
  // Load the previous state with fallback to defaults
  const windowState = windowStateKeeper({
    defaultHeight,
    defaultWidth,
    file: `${name}-window-state.json`,
  });

  // Create the browser window
  const win = new BrowserWindow({
    backgroundColor: 'grey',
    height: windowState.height,
    icon: path.resolve(
      path.join(
        __dirname,
        `icons/icon.${PLATFORM === 'win32' ? 'ico' : 'png'}`,
      ),
    ),
    minHeight: 400,
    minWidth: 500,
    title: 'Meeting Media Manager',
    width: windowState.width,
    x: windowState.x,
    y: windowState.y,
    ...(options ?? {}),
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
      sandbox: false,
      webSecurity: false,
      ...(options?.webPreferences ?? {}),
    },
  });

  // Save the window state
  windowState.manage(win);

  // Enable Electron remote
  enableElectronRemote(win.webContents);

  // Hide the menu bar
  if (PLATFORM !== 'darwin' && (name === 'media' || !process.env.DEBUGGING)) {
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

export function closeAllWindows() {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.close();
  });
}
