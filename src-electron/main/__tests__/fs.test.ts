import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mkdirMock = vi.fn();
const rmMock = vi.fn();
const statMock = vi.fn();
const writeFileMock = vi.fn();
const delayMock = vi.fn(() => Promise.resolve());
const captureElectronErrorMock = vi.fn();
const addElectronBreadcrumbMock = vi.fn();
const uuidMock = vi.fn(() => 'test-uuid');
const watchMock = vi.fn();
const sendToWindowMock = vi.fn();
const yauzlOpenMock = vi.fn();

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
  stat: statMock,
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
  sendToWindow: sendToWindowMock,
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

vi.mock('upath', () => {
  const join = vi.fn((...parts: string[]) => parts.join('/'));
  const resolve = vi.fn((value: string) => value);
  const toUnix = vi.fn((value: string) => value.replaceAll('\\', '/'));
  const basename = vi.fn();
  const dirname = vi.fn();

  return {
    basename,
    default: {
      basename,
      dirname,
      join,
      resolve,
      toUnix,
    },
    dirname,
    join,
    resolve,
    toUnix,
  };
});

vi.mock('yauzl', () => ({
  default: {
    open: yauzlOpenMock,
  },
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
    statMock.mockResolvedValue({ size: 1024 });
    delayMock.mockResolvedValue(undefined);
    sendToWindowMock.mockClear();
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

  it('treats transient UNKNOWN mkdir failures on network paths as unusable without reporting', async () => {
    setPlatform('win32');
    const error = new Error('unknown error');
    (error as Error & { code?: string }).code = 'UNKNOWN';
    mkdirMock.mockRejectedValue(error);

    const { isUsablePath } = await import('../fs');

    await expect(isUsablePath(String.raw`\\192.168.4.38\Test`)).resolves.toBe(
      false,
    );
    expect(addElectronBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'filesystem',
        data: expect.objectContaining({
          code: 'UNKNOWN',
          likelyNetworkPath: true,
          resolvedBase: String.raw`\\192.168.4.38\Test`,
          testDir: String.raw`\\192.168.4.38\Test/.cache-test-test-uuid`,
        }),
        level: 'warning',
        message: '[isUsablePath] Probe failed',
      }),
    );
    expect(captureElectronErrorMock).not.toHaveBeenCalled();
  });

  it('treats ENOENT on likely network paths as unusable without reporting', async () => {
    setPlatform('win32');
    const error = new Error(
      String.raw`ENOENT: no such file or directory, mkdir '\?'`,
    );
    (error as Error & { code?: string }).code = 'ENOENT';
    mkdirMock.mockRejectedValue(error);

    const { isUsablePath } = await import('../fs');

    await expect(isUsablePath('G:/My Drive/Meeting Media')).resolves.toBe(
      false,
    );

    expect(addElectronBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'filesystem',
        data: expect.objectContaining({
          basePath: 'G:/My Drive/Meeting Media',
          code: 'ENOENT',
          likelyNetworkPath: true,
          resolvedBase: 'G:/My Drive/Meeting Media',
          testDir: 'G:/My Drive/Meeting Media/.cache-test-test-uuid',
        }),
        level: 'warning',
      }),
    );
    expect(captureElectronErrorMock).not.toHaveBeenCalled();
  });

  it('does not attempt a probe when a Windows path resolves to the extended-path marker', async () => {
    setPlatform('win32');

    const { isUsablePath } = await import('../fs');

    await expect(isUsablePath(String.raw`\?`)).resolves.toBe(false);

    expect(mkdirMock).not.toHaveBeenCalled();
    expect(addElectronBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'filesystem',
        data: expect.objectContaining({
          basePath: String.raw`\?`,
          resolvedBase: String.raw`\?`,
          testDir: String.raw`\?/.cache-test-test-uuid`,
        }),
        level: 'error',
      }),
    );
    expect(captureElectronErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid Windows path resolved for filesystem probe',
      }),
      expect.anything(),
    );
  });

  it('notifies renderer on probe errors when one configured folder is likely network-based', async () => {
    setPlatform('win32');
    const error = new Error('unknown error');
    (error as Error & { code?: string }).code = 'UNKNOWN';
    mkdirMock.mockRejectedValue(error);

    const { isUsablePath, setPathProbeNotificationPaths } =
      await import('../fs');
    setPathProbeNotificationPaths([
      String.raw`\\192.168.4.38\Test`,
      'C:/Users/test/cache',
    ]);

    await expect(isUsablePath('C:/Users/test/cache')).resolves.toBe(false);

    expect(sendToWindowMock).toHaveBeenCalledWith(
      undefined,
      'pathProbeNetworkWarning',
    );
  });
});

describe('getZipEntries', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    statMock.mockResolvedValue({ size: 1024 });
  });

  it('does not report missing zip files as Electron errors', async () => {
    const error = new Error('missing zip');
    (error as Error & { code?: string }).code = 'ENOENT';
    statMock.mockRejectedValue(error);

    const { getZipEntries } = await import('../fs');

    await expect(getZipEntries('/tmp/missing.jwpub')).rejects.toMatchObject({
      code: 'ENOENT',
    });

    expect(yauzlOpenMock).not.toHaveBeenCalled();
    expect(addElectronBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'zip',
        data: expect.objectContaining({
          errorCode: 'ENOENT',
          zipPath: '/tmp/missing.jwpub',
        }),
        level: 'info',
        message: 'Zip file unavailable before listing entries',
      }),
    );
    expect(captureElectronErrorMock).not.toHaveBeenCalled();
  });

  it('reports unexpected stat errors before opening zip files', async () => {
    const error = new Error('permission denied');
    (error as Error & { code?: string }).code = 'EACCES';
    statMock.mockRejectedValue(error);

    const { getZipEntries } = await import('../fs');

    await expect(getZipEntries('/tmp/locked.jwpub')).rejects.toMatchObject({
      code: 'EACCES',
    });

    expect(yauzlOpenMock).not.toHaveBeenCalled();
    expect(captureElectronErrorMock).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        contexts: {
          fn: {
            args: { zipPath: '/tmp/locked.jwpub' },
            name: 'getZipEntries stat',
          },
        },
      }),
    );
  });

  it('adds diagnostics but does not report zip files deleted after stat', async () => {
    const error = new Error('missing after stat');
    (error as Error & { code?: string }).code = 'ENOENT';
    yauzlOpenMock.mockImplementation((_path, _options, callback) => {
      callback(error);
    });

    const { getZipEntries } = await import('../fs');

    await expect(getZipEntries('/tmp/raced.jwpub')).rejects.toMatchObject({
      code: 'ENOENT',
    });

    expect(yauzlOpenMock).toHaveBeenCalledWith(
      '/tmp/raced.jwpub',
      { lazyEntries: true },
      expect.any(Function),
    );
    expect(addElectronBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'zip',
        data: expect.objectContaining({
          errorCode: 'ENOENT',
          fileSize: 1024,
          zipPath: '/tmp/raced.jwpub',
        }),
        level: 'info',
        message: 'Error opening zip entries',
      }),
    );
    expect(captureElectronErrorMock).not.toHaveBeenCalled();
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
