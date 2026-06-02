import { captureException, init as initSentry } from '@sentry/electron/main';
import { bugs, homepage, name, repository, version } from 'app/package.json';
import {
  app,
  ipcMain,
  Menu,
  type MenuItem,
  type MenuItemConstructorOptions,
  protocol,
  screen,
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
  quitStatus,
  setAppQuitting,
  setShouldQuit,
} from 'src-electron/main/session';
import { initUpdater } from 'src-electron/main/updater';
import {
  captureElectronError,
  isIgnoredUpdateError,
} from 'src-electron/main/utils';
import { sendToWindow } from 'src-electron/main/window/window-base';
import 'src-electron/main/ipc';
import 'src-electron/main/security';
import {
  authorizedClose,
  createMainWindow,
  focusMainWindow,
  mainWindowInfo,
} from 'src-electron/main/window/window-main';
import { log } from 'src/shared/vanilla';
import { join, resolve } from 'upath';

protocol.registerSchemesAsPrivileged([
  {
    privileges: {
      allowServiceWorkers: true,
      corsEnabled: true,
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
    scheme: 'app',
  },
]);

initSentry({
  beforeSend(event) {
    try {
      if (quitStatus.isAppQuitting) {
        return null;
      }

      const crashpad = event.contexts?.crashpad ?? event.contexts?.electron;
      const dumpFile = crashpad?.['DumpWithoutCrashing-file'];

      // Ignore known non-fatal native crash reports
      if (typeof dumpFile === 'string') {
        // Filter site_info.cc crashes
        if (dumpFile.includes('site_info.cc')) {
          return null;
        }

        // Filter GPU/graphics diagnostic crashes
        if (dumpFile.includes('dcomp_presenter.cc')) {
          return null;
        }
      }

      const logFatal = event.contexts?.electron?.LOG_FATAL;
      if (
        typeof logFatal === 'string' &&
        logFatal.includes("GPU process isn't usable")
      ) {
        event.contexts = {
          ...event.contexts,
          gpuDiagnostic: getGpuDiagnosticSnapshot('sentry-before-send'),
        };
        event.tags = { ...event.tags, gpuFatal: 'unusable-gpu-process' };
      }

      const error = event.exception?.values?.[0];
      if (
        error?.value &&
        (isIgnoredUpdateError(error.value) || error.value.includes('EPIPE'))
      ) {
        return null;
      }
    } catch (err) {
      log(err, 'electron', 'error');
    }
    return event;
  },
  dsn: 'https://40b7d92d692d42814570d217655198db@o1401005.ingest.us.sentry.io/4507449197920256',
  environment: IS_TEST ? 'test' : process.env.NODE_ENV,
  release: `${name}@${version}`,
  tracesSampleRate: 1,
});

const gotTheLock = app.requestSingleInstanceLock();

async function captureGpuCrash(
  type: string,
  details: Electron.Details | Electron.RenderProcessGoneDetails,
) {
  const snapshot = getGpuDiagnosticSnapshot(`${type} process gone`, details);
  writeGpuDiagnosticSnapshot(snapshot);

  const basicGpuInfo = await getBasicGpuInfo();

  captureException(new Error(`${type} process crashed: ${details.reason}`), {
    contexts: {
      gpuDiagnostic: snapshot,
    },
    extra: { ...details, gpuInfo: basicGpuInfo },
    tags: { reason: details.reason, type },
  });
}

function configureAppDataPaths() {
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
  } else if (IS_TEST && PRODUCT_NAME) {
    app.setPath('userData', join(app.getPath('appData'), PRODUCT_NAME));
  }
}

function configureChromiumGpuDiagnostics() {
  if (!isTruthyEnvironmentValue(process.env.M3_ENABLE_GPU_DIAGNOSTICS)) return;

  const logFile = join(app.getPath('userData'), 'chromium-gpu.log');
  app.commandLine.appendSwitch('enable-logging', 'file');
  app.commandLine.appendSwitch('log-file', logFile);
  app.commandLine.appendSwitch('log-level', '0');
  app.commandLine.appendSwitch(
    'vmodule',
    'gpu*=2,viz*=2,gl*=2,ui/gl*=2,media/gpu*=2',
  );
  log(`Chromium GPU diagnostics enabled at ${logFile}`, 'electron', 'log');

  if (isTruthyEnvironmentValue(process.env.M3_DISABLE_GPU_SANDBOX)) {
    app.commandLine.appendSwitch('disable-gpu-sandbox');
    log('GPU sandbox disabled by diagnostics environment', 'electron', 'log');
  }

  if (isTruthyEnvironmentValue(process.env.M3_IN_PROCESS_GPU)) {
    app.commandLine.appendSwitch('in-process-gpu');
    log('In-process GPU enabled by diagnostics environment', 'electron', 'log');
  }
}

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
          click: () => {
            shell.openExternal(repository.url.replace('.git', ''));
          },
          label: 'Learn More',
        },
        {
          click: () => {
            shell.openExternal(homepage);
          },
          label: 'Documentation',
        },
        {
          click: () => {
            shell.openExternal(repository.url.replace('.git', '/discussions'));
          },
          label: 'Community Discussions',
        },
        {
          click: () => {
            shell.openExternal(bugs);
          },
          label: 'Search Issues',
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function getBasicGpuInfo() {
  try {
    return await app.getGPUInfo('basic');
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getGpuDiagnosticSnapshot(reason: string, details?: unknown) {
  return {
    app: {
      hardwareAccelerationEnabled: getHardwareAccelerationEnabled(),
      isReady: app.isReady(),
      name,
      version,
    },
    details,
    environment: {
      desktopSession: process.env.DESKTOP_SESSION,
      display: process.env.DISPLAY,
      nodeEnvironment: process.env.NODE_ENV,
      originalXdgCurrentDesktop: process.env.ORIGINAL_XDG_CURRENT_DESKTOP,
      waylandDisplay: process.env.WAYLAND_DISPLAY,
      xdgCurrentDesktop: process.env.XDG_CURRENT_DESKTOP,
      xdgSessionType: process.env.XDG_SESSION_TYPE,
    },
    gpuFeatureStatus: getGpuFeatureStatus(),
    platform: {
      arch: process.arch,
      platform: process.platform,
      release: process.getSystemVersion(),
      versions: process.versions,
    },
    reason,
    screens: getScreenDiagnostics(),
    switches: {
      disableGpu: app.commandLine.hasSwitch('disable-gpu'),
      disableGpuSandbox: app.commandLine.hasSwitch('disable-gpu-sandbox'),
      disableSoftwareRasterizer: app.commandLine.hasSwitch(
        'disable-software-rasterizer',
      ),
      enableLogging: app.commandLine.hasSwitch('enable-logging'),
      gtkVersion: app.commandLine.getSwitchValue('gtk-version'),
      inProcessGpu: app.commandLine.hasSwitch('in-process-gpu'),
      logFile: app.commandLine.getSwitchValue('log-file'),
      logLevel: app.commandLine.getSwitchValue('log-level'),
      ozonePlatform: app.commandLine.getSwitchValue('ozone-platform'),
      useGl: app.commandLine.getSwitchValue('use-gl'),
      vmodule: app.commandLine.getSwitchValue('vmodule'),
    },
    time: new Date().toISOString(),
  };
}

function getGpuFeatureStatus() {
  try {
    return app.getGPUFeatureStatus();
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

function getHardwareAccelerationEnabled() {
  try {
    return app.isHardwareAccelerationEnabled();
  } catch {
    return null;
  }
}

function getScreenDiagnostics() {
  try {
    if (!app.isReady()) return [];

    return screen.getAllDisplays().map((display) => ({
      bounds: display.bounds,
      id: display.id,
      internal: display.internal,
      label: display.label,
      scaleFactor: display.scaleFactor,
      size: display.size,
      workArea: display.workArea,
    }));
  } catch (error) {
    return [{ error: getErrorMessage(error) }];
  }
}

function isTruthyEnvironmentValue(value: string | undefined) {
  return value === '1' || value?.toLowerCase() === 'true';
}

function readGpuDiagnosticSnapshots() {
  try {
    const filePath = getGpuDiagnosticsFilePath();
    if (!pathExistsSync(filePath)) return [];

    const data = readJsonSync(filePath);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    log('Failed to read GPU diagnostics:', 'electron', 'warn', error);
    return [];
  }
}

function writeGpuDiagnosticSnapshot(
  snapshot: ReturnType<typeof getGpuDiagnosticSnapshot>,
) {
  try {
    const filePath = getGpuDiagnosticsFilePath();
    const existing = readGpuDiagnosticSnapshots();
    writeJsonSync(filePath, [...existing.slice(-19), snapshot], { spaces: 2 });
  } catch (error) {
    log('Failed to write GPU diagnostics:', 'electron', 'warn', error);
  }
}

if (gotTheLock) {
  configureAppDataPaths();

  // Check for crash loop on startup
  const crashCount = incrementCrashCount();
  log(`Startup crash count: ${crashCount}`, 'electron', 'log');

  if (crashCount >= 3) {
    if (!isHwAccelDisabled()) {
      captureElectronError(
        new Error(
          'Detected crash loop (3+ crashes). Disabling hardware acceleration.',
        ),
        {
          contexts: { fn: { name: 'initCrashListeners' } },
        },
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
    log('Hardware acceleration disabled', 'electron', 'log');

    if (PLATFORM === 'linux') {
      app.commandLine.appendSwitch('disable-gpu-sandbox');
      log(
        'GPU sandbox disabled while using hardware-acceleration crash fallback',
        'electron',
        'log',
      );
    }
  } else {
    log('Hardware acceleration enabled', 'electron', 'log');
  }

  configureChromiumGpuDiagnostics();

  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our globalThis.
    app.focus({ steal: true });
    if (!focusMainWindow()) createWindowAndCaptureErrors();
  });

  if (PLATFORM === 'win32') {
    app.setAppUserModelId(`${APP_ID}`);
  } else if (PLATFORM === 'linux') {
    app.commandLine.appendSwitch('gtk-version', '3'); // Force GTK 3 on Linux (Workaround for https://github.com/electron/electron/issues/46538)
  }

  initUpdater();

  initScreenListeners();
  createApplicationMenu();
  initSessionListeners();

  let videoCaptureCrashCount = 0;

  function handleProcessCrash(
    type: string,
    details: Electron.Details | Electron.RenderProcessGoneDetails,
  ) {
    const isFatalRendererCrash =
      type === 'Renderer' &&
      'reason' in details &&
      details.reason === 'crashed';

    const isGpuCrash =
      type === 'GPU' &&
      details.reason !== 'killed' &&
      details.reason !== 'clean-exit';

    if (isGpuCrash || isFatalRendererCrash) {
      // Send to telemetry and save local diagnostics before Chromium can abort.
      void captureGpuCrash(type, details);

      if (!isHwAccelDisabled()) {
        log(
          `Detected ${type} crash (${details.reason}). Disabling hardware acceleration for next run.`,
          'electron',
          'log',
        );
        // Persist to user prefs for next run and notify user
        setHwAccelDisabled(true, true);
      }
    }

    if (type === 'Video Capture' && details.reason === 'crashed') {
      videoCaptureCrashCount++;
      log(
        `Video Capture crash count: ${videoCaptureCrashCount}`,
        'electron',
        'log',
      );

      if (videoCaptureCrashCount >= 2) {
        captureElectronError(
          new Error('Video Capture process crashed multiple times.'),
          {
            contexts: {
              fn: {
                crashCount: videoCaptureCrashCount,
                details,
                name: 'handleProcessCrash',
              },
            },
          },
        );

        if (
          mainWindowInfo.mainWindow &&
          !mainWindowInfo.mainWindow.isDestroyed()
        ) {
          mainWindowInfo.mainWindow.webContents.send(
            'video-capture-crash-detected',
          );
        }
      }
    }
  }

  // Listen for child process crashes, especially GPU
  app.on('child-process-gone', (_, details) => {
    handleProcessCrash(details.type, details);
  });

  app.on('gpu-info-update', () => {
    writeGpuDiagnosticSnapshot(getGpuDiagnosticSnapshot('gpu-info-update'));
  });

  // Listen for renderer crashes
  app.on('render-process-gone', (_, __, details) => {
    handleProcessCrash('Renderer', details);
  });

  // macOS default behavior is to keep the app running even after all windows are closed
  app.on('window-all-closed', async () => {
    // Set app quitting state
    setAppQuitting(true);
    try {
      await cancelAllDownloads();
    } catch (error) {
      captureElectronError(error, {
        contexts: { fn: { name: 'app.on(window-all-closed)' } },
      });
    }
    if (PLATFORM !== 'darwin') app.quit();
  });

  app.on('before-quit', (e) => {
    setAppQuitting(true);
    if (PLATFORM !== 'darwin') return;
    if (!mainWindowInfo.mainWindow || mainWindowInfo.mainWindow.isDestroyed())
      return;
    if (authorizedClose.authorized) {
      mainWindowInfo.mainWindow.close();
    } else {
      e.preventDefault();
      setShouldQuit(true);
      sendToWindow(mainWindowInfo.mainWindow, 'attemptedClose');
    }
  });

  app.on('activate', () => {
    if (!focusMainWindow()) createWindowAndCaptureErrors();
  });

  createWindowAndCaptureErrors();
} else {
  log('Another instance is running. Exiting...', 'electron', 'log');
  app.exit(2);
}

// Silence EPIPE errors on stdout/stderr (common on Linux when quitting)
process.stdout.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') return;
  captureElectronError(err, {
    contexts: { fn: { name: 'process.stdout.on(error)' } },
  });
});
process.stderr.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') return;
  captureElectronError(err, {
    contexts: { fn: { name: 'process.stderr.on(error)' } },
  });
});

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
    log('Failed to read crash count:', 'electron', 'warn', error);
  }
  return 0;
}

function getCrashCountFilePath() {
  return join(app.getPath('userData'), 'crash-count.json');
}

function getGpuDiagnosticsFilePath() {
  return join(app.getPath('userData'), 'gpu-diagnostics.json');
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
    log('Failed to write crash count:', 'electron', 'warn', error);
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
    log('Failed to read hw accel setting:', 'electron', 'warn', error);
  }
  return false;
}

function resetCrashCount() {
  try {
    writeJsonSync(getCrashCountFilePath(), { count: 0 });
    log('Crash count reset to 0', 'electron', 'log');
  } catch (error) {
    log('Failed to reset crash count:', 'electron', 'warn', error);
  }
}

function setHwAccelDisabled(disabled: boolean, temporary = false) {
  try {
    const filePath = getHwAccelFilePath();
    writeJsonSync(filePath, { disabled, temporary });
    if (disabled) {
      // Notify user that a restart is recommended
      if (
        mainWindowInfo.mainWindow &&
        !mainWindowInfo.mainWindow.isDestroyed()
      ) {
        mainWindowInfo.mainWindow.webContents.send('gpu-crash-detected');
      }
    }
  } catch (error) {
    log('Failed to write hw accel setting:', 'electron', 'warn', error);
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
    log('Failed to read hw accel setting:', 'electron', 'warn', error);
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
