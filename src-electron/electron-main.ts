import { captureMessage } from '@sentry/browser';
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

import { PLATFORM } from './constants';
import { initScreenListeners } from './main/screen';
import { initSessionListeners } from './main/session';
import { initUpdater } from './main/updater';
import { createMainWindow } from './main/window/window-main';
import { errorCatcher } from './utils';

initSentry({
  dsn: 'https://0f2ab1c7ddfb118d25704c85957b8188@o1401005.ingest.us.sentry.io/4507449197920256',
  release: version,
});

initUpdater();
initScreenListeners();
createApplicationMenu();
initSessionListeners();

// MacOS default behavior is to keep the app running even after all windows are closed
app.on('window-all-closed', () => {
  if (PLATFORM !== 'darwin') app.quit();
});

app.on('activate', () => {
  captureMessage('App activated');
  app
    .whenReady()
    .then(createMainWindow)
    .catch((e) => errorCatcher(e));
});

app
  .whenReady()
  .then(createMainWindow)
  .catch((e) => errorCatcher(e));

function createApplicationMenu() {
  const appMenu: MenuItem | MenuItemConstructorOptions = { role: 'appMenu' };

  const template: (MenuItem | MenuItemConstructorOptions)[] = [
    ...(PLATFORM === 'darwin' ? [appMenu] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
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

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
