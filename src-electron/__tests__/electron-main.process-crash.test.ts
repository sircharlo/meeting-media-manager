import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

// How the app reacts to its own child processes crashing (electron-main.ts's
// 'child-process-gone' / 'render-process-gone' handling): everything the
// entry module touches is faked, and the test fires those app events.

interface FakeWindow {
  isDestroyed: () => boolean;
  webContents: { send: ReturnType<typeof vi.fn> };
}

type Handler = (...args: unknown[]) => void;

const mocks = vi.hoisted(() => ({
  app: {
    commandLine: {
      appendSwitch: vi.fn(),
      getSwitchValue: vi.fn(() => ''),
      hasSwitch: vi.fn(() => false),
    },
    disableHardwareAcceleration: vi.fn(),
    exit: vi.fn(),
    focus: vi.fn(),
    getGPUFeatureStatus: vi.fn(() => ({})),
    getGPUInfo: vi.fn(async () => ({})),
    getPath: vi.fn(() => '/user-data'),
    isHardwareAccelerationEnabled: vi.fn(() => true),
    isReady: vi.fn(() => false),
    on: vi.fn(),
    quit: vi.fn(),
    relaunch: vi.fn(),
    requestSingleInstanceLock: vi.fn(() => true),
    setAppUserModelId: vi.fn(),
    setPath: vi.fn(),
    // Never ready: no window is created.
    whenReady: vi.fn(
      () =>
        new Promise<void>(() => {
          // Never settles.
        }),
    ),
  },
  captureElectronError: vi.fn(),
  captureException: vi.fn(),
  handlers: new Map<string, Handler>(),
  // The hw-accel-disabled.json file.
  hwAccelFile: { value: null as unknown },
  log: vi.fn(),
  window: { mainWindow: null as FakeWindow | null },
  writeJsonResilientSync: vi.fn(),
}));

vi.mock('@sentry/electron/main', () => ({
  captureException: mocks.captureException,
  init: vi.fn(),
}));

vi.mock('electron', () => ({
  app: mocks.app,
  ipcMain: { handle: vi.fn() },
  Menu: { buildFromTemplate: vi.fn(), setApplicationMenu: vi.fn() },
  powerMonitor: { on: vi.fn() },
  protocol: { registerSchemesAsPrivileged: vi.fn() },
  screen: { getAllDisplays: vi.fn(() => []) },
  shell: { openExternal: vi.fn() },
}));

vi.mock('src-electron/constants', () => ({
  APP_ID: 'test.app',
  IS_DEMO_MODE: true,
  IS_DEV: false,
  IS_TEST: false,
  PLATFORM: 'darwin',
  PRODUCT_NAME: 'Test',
  SENTRY_DSN: undefined,
  SENTRY_ENVIRONMENT: 'test',
}));

vi.mock('src-electron/main/crash-loop', () => ({
  markCleanExit: vi.fn(),
  recordStartupCrashCount: vi.fn(() => 0),
}));
vi.mock('src-electron/main/dev-menu', () => ({ createDevMenu: vi.fn() }));
vi.mock('src-electron/main/downloads', () => ({
  cancelAllDownloads: vi.fn(),
  resumeAllDownloads: vi.fn(),
}));
vi.mock('src-electron/main/ffmpeg', () => ({
  cleanupFfmpegConversions: vi.fn(),
}));
vi.mock('src-electron/main/heic', () => ({ cleanupHeicWorker: vi.fn() }));
vi.mock('src-electron/main/resilient-storage', () => ({
  pruneStaleFallbackEntries: vi.fn(),
  readJsonResilient: vi.fn(async () => []),
  readJsonResilientSync: vi.fn(() => mocks.hwAccelFile.value),
  writeJsonResilient: vi.fn(async () => undefined),
  writeJsonResilientSync: mocks.writeJsonResilientSync,
}));
vi.mock('src-electron/main/screen', () => ({ initScreenListeners: vi.fn() }));
vi.mock('src-electron/main/session', () => ({
  initSessionListeners: vi.fn(),
  setAppQuitting: vi.fn(),
  setShouldQuit: vi.fn(),
}));
vi.mock('src-electron/main/updater', () => ({
  initUpdater: vi.fn(),
  isUpdateInstallInProgress: vi.fn(() => false),
}));
vi.mock('src-electron/main/utils', () => ({
  captureElectronError: mocks.captureElectronError,
  isIgnoredUnhandledNetworkEvent: vi.fn(() => false),
  isSelf: vi.fn(() => true),
}));
vi.mock('src-electron/main/window/window-base', () => ({
  sendToWindow: vi.fn(),
}));
vi.mock('src-electron/main/window/window-main', () => ({
  authorizedClose: { authorized: false },
  createMainWindow: vi.fn(),
  focusMainWindow: vi.fn(() => true),
  mainWindowInfo: mocks.window,
}));
vi.mock('src-electron/main/ipc', () => ({}));
vi.mock('src-electron/main/security', () => ({}));
vi.mock('src/shared/vanilla', () => ({
  log: mocks.log,
  scrubUserPathsDeep: vi.fn((value: unknown) => value),
}));
vi.mock('#q-app/electron/main', () => ({ registerQuasarRuntime: vi.fn() }));

const flush = async () => {
  for (let i = 0; i < 10; i++) {
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  }
};

/** Imports electron-main.ts fresh, without it hooking the test's own process. */
const loadMain = async () => {
  const processHooks = new Set(['uncaughtException', 'unhandledRejection']);
  const originalOn = process.on.bind(process);
  const processOn = vi
    .spyOn(process, 'on')
    .mockImplementation((event, listener) =>
      processHooks.has(event as string)
        ? process
        : originalOn(event as 'exit', listener),
    );
  const stdoutOn = vi
    .spyOn(process.stdout, 'on')
    .mockReturnValue(process.stdout);
  const stderrOn = vi
    .spyOn(process.stderr, 'on')
    .mockReturnValue(process.stderr);
  try {
    await import('../electron-main');
  } finally {
    processOn.mockRestore();
    stdoutOn.mockRestore();
    stderrOn.mockRestore();
  }
};

const childProcessGone = (type: string, reason: string) => {
  const details = { exitCode: 1, reason, type };
  mocks.handlers.get('child-process-gone')?.({}, details);
  return details;
};

const rendererGone = (reason: string) => {
  mocks.handlers.get('render-process-gone')?.({}, {}, { exitCode: 1, reason });
};

const loggedMessages = () => mocks.log.mock.calls.map(([message]) => message);

/** The per-session crash counts logged, e.g. "GPU crash count this session: 1". */
const crashCountsLogged = () =>
  loggedMessages().filter(
    (message) =>
      typeof message === 'string' &&
      /^(GPU crash count this session|Video Capture crash count):/.test(
        message,
      ),
  );

const hwAccelDisabledForCrash = () =>
  expect(mocks.writeJsonResilientSync).toHaveBeenCalledWith(
    '/user-data',
    'hw-accel-disabled.json',
    { disabled: true, temporary: true },
  );

describe('electron-main process crash handling', () => {
  const originalGetSystemVersion = (
    process as { getSystemVersion?: () => string }
  ).getSystemVersion;

  beforeAll(() => {
    // Electron-only, read by the GPU diagnostics snapshot.
    Object.defineProperty(process, 'getSystemVersion', {
      configurable: true,
      value: () => 'test',
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(process, 'getSystemVersion', {
      configurable: true,
      value: originalGetSystemVersion,
      writable: true,
    });
  });

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.handlers.clear();
    mocks.app.on.mockImplementation((event: string, handler: Handler) => {
      mocks.handlers.set(event, handler);
    });
    mocks.hwAccelFile.value = null;
    mocks.writeJsonResilientSync.mockImplementation(
      (_dir: string, _file: string, data: unknown) => {
        mocks.hwAccelFile.value = data;
      },
    );
    mocks.window.mainWindow = {
      isDestroyed: () => false,
      webContents: { send: vi.fn() },
    };
  });

  it.each(['crashed', 'oom', 'abnormal-exit', 'launch-failed'])(
    'disables hardware acceleration for the next run after a GPU crash (%s), and reports it',
    async (reason) => {
      await loadMain();

      childProcessGone('GPU', reason);

      hwAccelDisabledForCrash();
      expect(mocks.window.mainWindow?.webContents.send).toHaveBeenCalledWith(
        'gpu-crash-detected',
      );
      expect(mocks.log).toHaveBeenCalledWith(
        `Detected GPU crash (${reason}). Disabling hardware acceleration for next run.`,
        'electron',
        'log',
      );
      expect(mocks.log).toHaveBeenCalledWith(
        'GPU crash count this session: 1',
        'electron',
        'log',
      );
      await vi.waitFor(() => {
        expect(mocks.captureException).toHaveBeenCalledWith(
          expect.objectContaining({
            message: `GPU process crashed: ${reason}`,
          }),
          expect.objectContaining({ tags: { reason, type: 'GPU' } }),
        );
      });
      expect(mocks.app.relaunch).not.toHaveBeenCalled();
      expect(mocks.app.exit).not.toHaveBeenCalled();
    },
  );

  it('relaunches once, on the second GPU crash in a session', async () => {
    await loadMain();

    childProcessGone('GPU', 'crashed');
    expect(mocks.app.relaunch).not.toHaveBeenCalled();

    childProcessGone('GPU', 'crashed');
    expect(mocks.log).toHaveBeenCalledWith(
      'Repeated GPU crashes this session. Relaunching with hardware acceleration disabled.',
      'electron',
      'warn',
    );
    expect(mocks.app.relaunch).toHaveBeenCalledTimes(1);
    expect(mocks.app.exit).toHaveBeenCalledWith(0);
    // Already disabled by the first crash.
    expect(mocks.writeJsonResilientSync).toHaveBeenCalledTimes(1);

    childProcessGone('GPU', 'crashed');
    expect(mocks.log).toHaveBeenCalledWith(
      'GPU crash count this session: 3',
      'electron',
      'log',
    );
    expect(mocks.app.relaunch).toHaveBeenCalledTimes(1);
    expect(mocks.app.exit).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(mocks.captureException).toHaveBeenCalledTimes(3);
    });
  });

  it('leaves hardware acceleration settings alone when it is already disabled', async () => {
    mocks.hwAccelFile.value = { disabled: true, temporary: false };
    await loadMain();

    childProcessGone('GPU', 'crashed');

    expect(mocks.writeJsonResilientSync).not.toHaveBeenCalled();
    expect(loggedMessages()).not.toContainEqual(
      expect.stringContaining('Disabling hardware acceleration'),
    );
    expect(mocks.log).toHaveBeenCalledWith(
      'GPU crash count this session: 1',
      'electron',
      'log',
    );
    await vi.waitFor(() => {
      expect(mocks.captureException).toHaveBeenCalledTimes(1);
    });
  });

  it.each(['killed', 'clean-exit'])(
    'ignores a GPU process that ended normally (%s)',
    async (reason) => {
      await loadMain();

      childProcessGone('GPU', reason);
      childProcessGone('GPU', reason);
      await flush();

      expect(mocks.writeJsonResilientSync).not.toHaveBeenCalled();
      expect(mocks.captureException).not.toHaveBeenCalled();
      expect(mocks.app.relaunch).not.toHaveBeenCalled();
      expect(crashCountsLogged()).toEqual([]);
    },
  );

  it('treats a crashed renderer like a GPU crash, without counting it towards a relaunch', async () => {
    await loadMain();

    rendererGone('crashed');
    hwAccelDisabledForCrash();
    expect(mocks.log).toHaveBeenCalledWith(
      'Detected Renderer crash (crashed). Disabling hardware acceleration for next run.',
      'electron',
      'log',
    );

    rendererGone('crashed');
    await vi.waitFor(() => {
      expect(mocks.captureException).toHaveBeenCalledTimes(2);
    });
    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Renderer process crashed: crashed' }),
      expect.objectContaining({
        tags: { reason: 'crashed', type: 'Renderer' },
      }),
    );
    expect(mocks.app.relaunch).not.toHaveBeenCalled();
    expect(crashCountsLogged()).toEqual([]);
  });

  it.each(['oom', 'killed', 'clean-exit', 'abnormal-exit'])(
    'ignores a renderer that went away without crashing (%s)',
    async (reason) => {
      await loadMain();

      rendererGone(reason);
      await flush();

      expect(mocks.writeJsonResilientSync).not.toHaveBeenCalled();
      expect(mocks.captureException).not.toHaveBeenCalled();
    },
  );

  it('reports Video Capture crashes from the second one on, and tells the main window', async () => {
    await loadMain();

    childProcessGone('Video Capture', 'crashed');
    expect(mocks.log).toHaveBeenCalledWith(
      'Video Capture crash count: 1',
      'electron',
      'log',
    );
    expect(mocks.captureElectronError).not.toHaveBeenCalled();
    expect(mocks.window.mainWindow?.webContents.send).not.toHaveBeenCalled();

    const details = childProcessGone('Video Capture', 'crashed');
    expect(mocks.log).toHaveBeenCalledWith(
      'Video Capture crash count: 2',
      'electron',
      'log',
    );
    expect(mocks.captureElectronError).toHaveBeenCalledWith(
      new Error('Video Capture process crashed multiple times.'),
      {
        contexts: {
          fn: { crashCount: 2, details, name: 'handleProcessCrash' },
        },
      },
    );
    expect(mocks.window.mainWindow?.webContents.send).toHaveBeenCalledWith(
      'video-capture-crash-detected',
    );

    childProcessGone('Video Capture', 'crashed');
    expect(mocks.captureElectronError).toHaveBeenCalledTimes(2);
    expect(mocks.captureElectronError).toHaveBeenLastCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: { fn: expect.objectContaining({ crashCount: 3 }) },
      }),
    );
    expect(mocks.window.mainWindow?.webContents.send).toHaveBeenCalledTimes(2);

    // Not a GPU problem.
    await flush();
    expect(mocks.writeJsonResilientSync).not.toHaveBeenCalled();
    expect(mocks.captureException).not.toHaveBeenCalled();
  });

  it('still reports repeated Video Capture crashes without a main window to tell', async () => {
    const destroyedWindow: FakeWindow = {
      isDestroyed: () => true,
      webContents: { send: vi.fn() },
    };
    mocks.window.mainWindow = destroyedWindow;
    await loadMain();

    childProcessGone('Video Capture', 'crashed');
    childProcessGone('Video Capture', 'crashed');
    mocks.window.mainWindow = null;
    childProcessGone('Video Capture', 'crashed');

    expect(mocks.captureElectronError).toHaveBeenCalledTimes(2);
    expect(destroyedWindow.webContents.send).not.toHaveBeenCalled();
  });

  it('ignores Video Capture exits that are not crashes, and other kinds of processes', async () => {
    await loadMain();

    for (let i = 0; i < 2; i++) {
      childProcessGone('Video Capture', 'killed');
      childProcessGone('Utility', 'crashed');
      childProcessGone('Pepper Plugin', 'oom');
    }
    await flush();

    expect(mocks.captureElectronError).not.toHaveBeenCalled();
    expect(mocks.captureException).not.toHaveBeenCalled();
    expect(mocks.writeJsonResilientSync).not.toHaveBeenCalled();
    expect(mocks.window.mainWindow?.webContents.send).not.toHaveBeenCalled();
    expect(crashCountsLogged()).toEqual([]);
  });
});
