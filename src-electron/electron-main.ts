import { captureException, init as initSentry } from '@sentry/electron/main';
import { bugs, homepage, name, repository, version } from 'app/package.json';
import {
  app,
  ipcMain,
  Menu,
  type MenuItem,
  type MenuItemConstructorOptions,
  shell,
} from 'electron';
import { pathExistsSync, readJsonSync, writeJsonSync } from 'fs-extra/esm';
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
import upath from 'upath';
import 'src-electron/main/ipc';
import 'src-electron/main/security';

initSentry({
  beforeSend(event) {
    try {
      const crashpad = event.contexts?.crashpad ?? event.contexts?.electron;
      const dumpFile = crashpad?.['DumpWithoutCrashing-file'];
      // Ignore known non-fatal native crash reports
      if (typeof dumpFile === 'string' && dumpFile.includes('site_info.cc')) {
        return null;
      }
    } catch (err) {
      console.error(err);
    }
    return event;
  },
  dsn: 'https://40b7d92d692d42814570d217655198db@o1401005.ingest.us.sentry.io/4507449197920256',
  environment: IS_TEST ? 'test' : process.env.NODE_ENV,
  release: `${name}@${version}`,
  tracesSampleRate: 1.0,
});

const { join, resolve } = upath;

const gotTheLock = app.requestSingleInstanceLock();

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

if (!gotTheLock) {
  app.exit(2);
} else {
  // Check if hardware acceleration should be disabled
  if (isHwAccelDisabled()) {
    app.disableHardwareAcceleration();
    console.log('Hardware acceleration disabled');
  } else {
    console.log('Hardware acceleration enabled');
  }

  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
    }
  });

  if (PLATFORM === 'win32') {
    app.setAppUserModelId(`${APP_ID}`);
  } else if (PLATFORM === 'linux') {
    app.commandLine.appendSwitch('gtk-version', '3'); // Force GTK 3 on Linux (Workaround for https://github.com/electron/electron/issues/46538)
  }

  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    const portableExecutableDir = resolve(process.env.PORTABLE_EXECUTABLE_DIR);
    app.setPath('appData', portableExecutableDir);
    app.setPath(
      'userData',
      join(portableExecutableDir, `${PRODUCT_NAME} - User Data`),
    );
    app.setPath(
      'temp',
      join(portableExecutableDir, `${PRODUCT_NAME} - Temporary Files`),
    );
  } else if (IS_TEST) {
    app.setPath('userData', join(app.getPath('appData'), PRODUCT_NAME));
  }

  if (!process.env.PORTABLE_EXECUTABLE_DIR) {
    initUpdater();
  }

  initScreenListeners();
  createApplicationMenu();
  initSessionListeners();

  // Listen for child process crashes, especially GPU
  app.on('child-process-gone', (_, details) => {
    if (details.type === 'GPU') {
      // Send to telemetry
      captureException(new Error(`GPU process crashed: ${details.reason}`), {
        extra: { ...details },
        tags: { reason: details.reason, type: details.type },
      });
      if (!isHwAccelDisabled()) {
        // Persist to user prefs for next run
        setHwAccelDisabled(true, true);
        // Note: app.disableHardwareAcceleration() can only be called before app is ready.
        // The setting is persisted above and will take effect on next app launch.
      }
      // Notify user that a restart is recommended
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('gpu-crash-detected');
      }
    }
  });

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
    createWindowAndCaptureErrors();
  });

  createWindowAndCaptureErrors();
}

function createWindowAndCaptureErrors() {
  app.whenReady().then(createMainWindow).catch(captureElectronError);
}

function getHwAccelFilePath() {
  return join(app.getPath('userData'), 'hw-accel-disabled.json');
}

function isHwAccelDisabled() {
  try {
    const filePath = getHwAccelFilePath();
    if (pathExistsSync(filePath)) {
      const data = readJsonSync(filePath);
      return data.disabled === true;
    }
  } catch (error) {
    console.warn('Failed to read hw accel setting:', error);
  }
  return false;
}

function setHwAccelDisabled(disabled: boolean, temporary = false) {
  try {
    const filePath = getHwAccelFilePath();
    writeJsonSync(filePath, { disabled, temporary });
  } catch (error) {
    console.warn('Failed to write hw accel setting:', error);
  }
}

// IPC handler to update hardware acceleration setting from renderer
ipcMain.handle('set-hardware-acceleration', (_, disabled: boolean) => {
  setHwAccelDisabled(disabled, false);
});

// Check if hardware acceleration was temporarily disabled due to a crash
function wasHwAccelTemporarilyDisabled() {
  try {
    const filePath = getHwAccelFilePath();
    if (pathExistsSync(filePath)) {
      const data = readJsonSync(filePath);
      return data.disabled === true && data.temporary === true;
    }
  } catch (error) {
    console.warn('Failed to read hw accel setting:', error);
  }
  return false;
}

if (wasHwAccelTemporarilyDisabled()) {
  setHwAccelDisabled(false);
  app.on('browser-window-created', (_, window) => {
    window.webContents.on('did-finish-load', () => {
      window.webContents.send('hardware-acceleration-temporary-disabled');
    });
  });
}
