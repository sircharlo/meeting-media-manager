import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mkdirMock = vi.fn();
const rmMock = vi.fn();
const writeFileMock = vi.fn();
const delayMock = vi.fn(() => Promise.resolve());
const captureElectronErrorMock = vi.fn();
const addElectronBreadcrumbMock = vi.fn();
const uuidMock = vi.fn(() => 'test-uuid');
const watchMock = vi.fn();

vi.mock('chokidar', () => ({
  watch: watchMock,
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
}));

vi.mock('fs-extra', () => ({
  ensureDir: vi.fn(),
}));

vi.mock('node:fs', () => ({
  createWriteStream: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  mkdir: mkdirMock,
  rm: rmMock,
  stat: vi.fn(),
  writeFile: writeFileMock,
}));

vi.mock('node:stream/promises', () => ({
  pipeline: vi.fn(),
}));

vi.mock('node:timers/promises', () => ({
  setTimeout: delayMock,
}));

vi.mock('src-electron/main/utils', () => ({
  addElectronBreadcrumb: addElectronBreadcrumbMock,
  captureElectronError: captureElectronErrorMock,
  getSharedDataPath: vi.fn(),
}));

vi.mock('src-electron/main/window/window-base', () => ({
  sendToWindow: vi.fn(),
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: {},
}));

vi.mock('src/constants/media', () => ({
  IMG_EXTENSIONS: [],
  JWPUB_EXTENSIONS: [],
  PDF_EXTENSIONS: [],
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
  uuid: uuidMock,
}));

vi.mock('upath', () => ({
  default: {
    basename: vi.fn(),
    dirname: vi.fn(),
    join: (...parts: string[]) => parts.join('/'),
    resolve: (value: string) => value,
    toUnix: (value: string) => value,
  },
}));

vi.mock('yauzl', () => ({
  default: {},
}));

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');

const setPlatform = (value: NodeJS.Platform) => {
  Object.defineProperty(process, 'platform', {
    configurable: true,
    value,
  });
};

describe('isUsablePath', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
    rmMock.mockResolvedValue(undefined);
    delayMock.mockResolvedValue(undefined);
    setPlatform('linux');
  });

  afterAll(() => {
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
  });

  it('returns true when the probe file can be created and cleaned up', async () => {
    const { isUsablePath } = await import('../fs');

    await expect(isUsablePath('/tmp/cache')).resolves.toBe(true);

    expect(mkdirMock).toHaveBeenCalledWith('/tmp/cache/.cache-test-test-uuid', {
      recursive: true,
    });
    expect(writeFileMock).toHaveBeenCalledWith(
      '/tmp/cache/.cache-test-test-uuid/test.txt',
      'ok',
    );
    expect(delayMock).toHaveBeenCalledWith(50);
    expect(rmMock).toHaveBeenNthCalledWith(
      1,
      '/tmp/cache/.cache-test-test-uuid/test.txt',
      {
        force: true,
      },
    );
    expect(rmMock).toHaveBeenNthCalledWith(
      2,
      '/tmp/cache/.cache-test-test-uuid',
      {
        force: true,
        recursive: true,
      },
    );
    expect(addElectronBreadcrumbMock).not.toHaveBeenCalled();
    expect(captureElectronErrorMock).not.toHaveBeenCalled();
  });

  it('retries transient Windows cleanup locks and downgrades them to a warning', async () => {
    setPlatform('win32');
    rmMock.mockImplementation(async (target: string) => {
      if (target.endsWith('test.txt')) {
        const error = new Error('busy');
        (error as Error & { code?: string }).code = 'EBUSY';
        throw error;
      }
    });

    const { isUsablePath } = await import('../fs');

    await expect(isUsablePath('C:/cache')).resolves.toBe(true);

    expect(rmMock).toHaveBeenCalledTimes(6);
    expect(delayMock).toHaveBeenCalledTimes(5);
    expect(addElectronBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'filesystem',
        level: 'warning',
      }),
    );
    expect(captureElectronErrorMock).not.toHaveBeenCalled();
  });

  it('keeps cleanup best-effort but reports unexpected cleanup failures', async () => {
    rmMock.mockImplementation(async (target: string) => {
      if (target.endsWith('.cache-test-test-uuid')) {
        const error = new Error('io failure');
        (error as Error & { code?: string }).code = 'EIO';
        throw error;
      }
    });

    const { isUsablePath } = await import('../fs');

    await expect(isUsablePath('/tmp/cache')).resolves.toBe(true);

    expect(captureElectronErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'io failure' }),
      expect.objectContaining({
        contexts: {
          fn: {
            args: {
              basePath: '/tmp/cache',
              stage: 'directory',
              targetPath: '/tmp/cache/.cache-test-test-uuid',
            },
            name: 'isUsablePath.cleanupProbePath',
          },
        },
      }),
    );
  });
});

describe('watchFolder', () => {
  const webDavPath = String.raw`\\server@SSL@2078\DavWWWRoot\Media`;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  const mockWatcherRegistration = () => {
    const handlers = new Map<string, (...args: unknown[]) => void>();
    const watcherMock = {
      close: vi.fn(),
      closed: false,
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        handlers.set(event, cb);
        return watcherMock;
      }),
    };
    watchMock.mockImplementation(() => watcherMock);
    return handlers;
  };

  it('uses polling for network folders to avoid unstable fs.watch behavior', async () => {
    mockWatcherRegistration();
    const { watchFolder } = await import('../fs');

    await watchFolder(webDavPath);

    expect(watchMock).toHaveBeenCalledWith(
      webDavPath,
      expect.objectContaining({
        interval: 1000,
        usePolling: true,
      }),
    );
  });

  it('ignores known network watch/stat errors instead of reporting them to Sentry', async () => {
    const handlers = mockWatcherRegistration();
    const { watchFolder } = await import('../fs');
    await watchFolder(webDavPath);

    handlers.get('error')?.({ code: 'EISDIR', syscall: 'watch' });
    handlers.get('error')?.({ code: 'UNKNOWN', syscall: 'stat' });

    expect(captureElectronErrorMock).not.toHaveBeenCalled();
  });

  it('still reports unexpected watch errors', async () => {
    const handlers = mockWatcherRegistration();
    const { watchFolder } = await import('../fs');
    await watchFolder('/tmp/media');

    handlers.get('error')?.({ code: 'EACCES', syscall: 'watch' });

    expect(captureElectronErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'EACCES', syscall: 'watch' }),
      expect.objectContaining({
        contexts: {
          fn: { folderPath: '/tmp/media', name: 'watchFolder.error' },
        },
      }),
    );
  });
});
