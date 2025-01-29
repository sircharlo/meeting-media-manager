import { init as initSentry } from '@sentry/electron/main';
import { bugs, homepage, name, repository, version } from 'app/package.json';
import {
  app,
  Menu,
  type MenuItem,
  type MenuItemConstructorOptions,
  shell,
} from 'electron';
import upath from 'upath';
const { join } = upath;

import {
  APP_ID,
  IS_TEST,
  PLATFORM,
  PRODUCT_NAME,
} from 'src-electron/constants';
import { initScreenListeners } from 'src-electron/main/screen';
import { initSessionListeners, setShouldQuit } from 'src-electron/main/session';
import { initUpdater } from 'src-electron/main/updater';
import { captureElectronError } from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import {
  authorizedClose,
  createMainWindow,
  mainWindow,
} from 'src-electron/main/window/window-main';
import 'src-electron/main/ipc';
import 'src-electron/main/security';

if (PLATFORM === 'win32') {
  app.setAppUserModelId(`${APP_ID}`);
}

if (process.env.PORTABLE_EXECUTABLE_DIR) {
  app.setPath('appData', process.env.PORTABLE_EXECUTABLE_DIR);
  app.setPath(
    'userData',
    join(process.env.PORTABLE_EXECUTABLE_DIR, `${PRODUCT_NAME} - User Data`),
  );
  app.setPath(
    'temp',
    join(
      process.env.PORTABLE_EXECUTABLE_DIR,
      `${PRODUCT_NAME} - Temporary Files`,
    ),
  );
}

initSentry({
  dsn: 'https://0f2ab1c7ddfb118d25704c85957b8188@o1401005.ingest.us.sentry.io/4507449197920256',
  environment: IS_TEST ? 'test' : process.env.NODE_ENV,
  release: `${name}@${version}`,
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
  if (PLATFORM !== 'darwin') return;
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (authorizedClose) {
    mainWindow.close();
  } else {
    e.preventDefault();
    setShouldQuit(true);
    sendToWindow(mainWindow, 'attemptedClose');
  }
});

app.on('activate', () => {
  app.whenReady().then(createMainWindow).catch(captureElectronError);
});

app.whenReady().then(createMainWindow).catch(captureElectronError);

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
