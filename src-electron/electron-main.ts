import { init as initSentry } from '@sentry/electron/main';
import { bugs, homepage, repository, version } from 'app/package.json';

import './main/ipc';
import './main/security';

import {
  app,
  Menu,
  type MenuItem,
  type MenuItemConstructorOptions,
  shell,
} from 'electron';
import { join } from 'upath';

import { PLATFORM } from './constants';
import { cancelAllDownloads } from './main/downloads';
import { initScreenListeners } from './main/screen';
import { initSessionListeners } from './main/session';
import { initUpdater } from './main/updater';
import { closeOtherWindows, sendToWindow } from './main/window/window-base';
import {
  authorizedClose,
  createMainWindow,
  mainWindow,
} from './main/window/window-main';
import { captureError } from './utils';

if (process.env.PORTABLE_EXECUTABLE_DIR) {
  app.setPath('appData', process.env.PORTABLE_EXECUTABLE_DIR);
  app.setPath(
    'userData',
    join(
      process.env.PORTABLE_EXECUTABLE_DIR,
      'Meeting Media Manager - User Data',
    ),
  );
  app.setPath(
    'temp',
    join(
      process.env.PORTABLE_EXECUTABLE_DIR,
      'Meeting Media Manager - Temporary Files',
    ),
  );
}

initSentry({
  debug: true,
  dsn: 'https://0f2ab1c7ddfb118d25704c85957b8188@o1401005.ingest.us.sentry.io/4507449197920256',
  environment: process.env.NODE_ENV,
  release: version,
  tracesSampleRate: 1.0,
});

initUpdater();
initScreenListeners();
createApplicationMenu();
initSessionListeners();

// macOS default behavior is to keep the app running even after all windows are closed
app.on('window-all-closed', () => {
  if (PLATFORM !== 'darwin') app.quit();
});

app.on('before-quit', (e) => {
  if (PLATFORM === 'darwin' && mainWindow) {
    if (authorizedClose) {
      cancelAllDownloads();
      closeOtherWindows(mainWindow);
      mainWindow?.close();
    } else {
      e.preventDefault();
      sendToWindow(mainWindow, 'attemptedClose');
    }
  }
});

app.on('activate', () => {
  app
    .whenReady()
    .then(createMainWindow)
    .catch((e) => captureError(e));
});

app
  .whenReady()
  .then(createMainWindow)
  .catch((e) => captureError(e));

function createApplicationMenu() {
  const appMenu: MenuItem | MenuItemConstructorOptions = { role: 'appMenu' };

  const template: (MenuItem | MenuItemConstructorOptions)[] = [
    ...(PLATFORM === 'darwin' ? [appMenu] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        {
          click: async () => {
            await shell.openExternal(repository.url.replace('.git', ''));
          },
          label: 'Learn More',
        },
        {
          click: async () => {
            await shell.openExternal(homepage);
          },
          label: 'Documentation',
        },
        {
          click: async () => {
            await shell.openExternal(
              repository.url.replace('.git', '/discussions'),
            );
          },
          label: 'Community Discussions',
        },
        {
          click: async () => {
            await shell.openExternal(bugs);
          },
          label: 'Search Issues',
        },
      ],
    },
  ];
  template.find((item) => item.role === 'viewMenu');
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
