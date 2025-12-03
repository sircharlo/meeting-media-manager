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
import { cancelAllDownloads } from 'src-electron/main/downloads';
import { initScreenListeners } from 'src-electron/main/screen';
import {
  initSessionListeners,
  isAppQuitting,
  setAppQuitting,
  setShouldQuit,
} from 'src-electron/main/session';
import { initUpdater } from 'src-electron/main/updater';
import { captureElectronError } from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import 'src-electron/main/ipc';
import 'src-electron/main/security';
import {
  authorizedClose,
  createMainWindow,
  mainWindow,
} from 'src-electron/main/window/window-main';
import { join, resolve } from 'upath';

initSentry({
  beforeSend(event) {
    try {
      const crashpad = event.contexts?.crashpad ?? event.contexts?.electron;
      const dumpFile = crashpad?.['DumpWithoutCrashing-file'];
      // Ignore known non-fatal native crash reports
      if (typeof dumpFile === 'string' && dumpFile.includes('site_info.cc')) {
        return null;
      }

      if (isAppQuitting) {
        const error = event.exception?.values?.[0];
        if (error?.value?.includes('Object has been destroyed')) {
          // Ignore electron-dl-manager errors that occur after app quit
          return null;
        }
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
  // Check for crash loop on startup
  const crashCount = incrementCrashCount();
  console.log(`Startup crash count: ${crashCount}`);

  if (crashCount >= 3) {
    if (!isHwAccelDisabled()) {
      console.error(
        'Detected crash loop (3+ crashes). Disabling hardware acceleration.',
      );
      setHwAccelDisabled(true, true);
    }
  }

  // If we survive for 10 seconds, reset the crash count
  setTimeout(() => {
    resetCrashCount();
  }, 10000);

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

  initUpdater();

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
        // Persist to user prefs for next run and notify user
        setHwAccelDisabled(true, true);
      }
    }
  });

  // macOS default behavior is to keep the app running even after all windows are closed
  app.on('window-all-closed', () => {
    setAppQuitting(true);
    try {
      cancelAllDownloads();
    } catch (error) {
      console.error('Failed to cancel downloads:', error);
    }
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

function getCrashCount() {
  try {
    const filePath = getCrashCountFilePath();
    if (pathExistsSync(filePath)) {
      const data = readJsonSync(filePath);
      return typeof data.count === 'number' ? data.count : 0;
    }
  } catch (error) {
    console.warn('Failed to read crash count:', error);
  }
  return 0;
}

function getCrashCountFilePath() {
  return join(app.getPath('userData'), 'crash-count.json');
}

function getHwAccelFilePath() {
  return join(app.getPath('userData'), 'hw-accel-disabled.json');
}

function incrementCrashCount() {
  try {
    const count = getCrashCount() + 1;
    writeJsonSync(getCrashCountFilePath(), { count });
    return count;
  } catch (error) {
    console.warn('Failed to write crash count:', error);
    return 0;
  }
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

function resetCrashCount() {
  try {
    writeJsonSync(getCrashCountFilePath(), { count: 0 });
    console.log('Crash count reset to 0');
  } catch (error) {
    console.warn('Failed to reset crash count:', error);
  }
}

function setHwAccelDisabled(disabled: boolean, temporary = false) {
  try {
    const filePath = getHwAccelFilePath();
    writeJsonSync(filePath, { disabled, temporary });
    if (disabled) {
      // Notify user that a restart is recommended
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('gpu-crash-detected');
      }
    }
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
