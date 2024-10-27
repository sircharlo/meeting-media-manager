import { initialize as initElectronRemote } from '@electron/remote/main';
import { init as initSentry } from '@sentry/electron/main';
import { bugs, homepage, repository, version } from 'app/package.json';
import {
  app,
  Menu,
  type MenuItem,
  type MenuItemConstructorOptions,
  shell,
} from 'electron';

import './ipc';
import './session';
import { PLATFORM } from './constants';
import { initUpdater } from './updater';
import { errorCatcher } from './utils';
import { createMainWindow } from './window-main';

initSentry({
  dsn: 'https://0f2ab1c7ddfb118d25704c85957b8188@o1401005.ingest.us.sentry.io/4507449197920256',
  release: version,
});

initElectronRemote();
initUpdater();
createApplicationMenu();

// MacOS default behavior is to keep the app running even after all windows are closed
app.on('window-all-closed', () => {
  if (PLATFORM !== 'darwin') app.quit();
});

app.on('activate', createMainWindow);

app
  .whenReady()
  .then(createMainWindow)
  .catch((err) => errorCatcher(err));

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
