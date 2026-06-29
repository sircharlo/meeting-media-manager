import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mkdirMock = vi.fn();
const readFileMock = vi.fn();
const rmMock = vi.fn();
const statMock = vi.fn();
const writeFileMock = vi.fn();
const delayMock = vi.fn(() => Promise.resolve());
const captureElectronErrorMock = vi.fn();
const addElectronBreadcrumbMock = vi.fn();
const getSharedDataPathMock = vi.fn();
const setTagMock = vi.fn();
const uuidMock = vi.fn(() => 'test-uuid');
const watchMock = vi.fn();
const sendToWindowMock = vi.fn();
const yauzlOpenMock = vi.fn();
const yauzlFromBufferPromiseMock = vi.fn();

vi.mock('chokidar', () => ({
  watch: watchMock,
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(),
    startAccessingSecurityScopedResource: vi.fn(() => vi.fn()),
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
  readFile: readFileMock,
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
  getSharedDataPath: getSharedDataPathMock,
}));

vi.mock('@sentry/electron/main', () => ({
  setTag: setTagMock,
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
    fromBufferPromise: yauzlFromBufferPromiseMock,
    openPromise: yauzlOpenMock,
  },
  fromBufferPromise: yauzlFromBufferPromiseMock,
  openPromise: yauzlOpenMock,
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

describe('getAppDataPath', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const { app } = await import('electron');
    vi.mocked(app.getPath).mockReturnValue('/user-data');
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
    rmMock.mockResolvedValue(undefined);
    getSharedDataPathMock.mockResolvedValue('/shared-data');
    setPlatform('linux');
  });

  afterAll(() => {
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
  });

  it('falls back when shared subfolders cannot create nested download directories', async () => {
    const error = new Error('nested directory unavailable');
    (error as Error & { code?: string }).code = 'ENOENT';
    mkdirMock.mockImplementation(async (target: string) => {
      if (target === '/shared-data/Publications/.health-check-test-uuid') {
        throw error;
      }
    });

    const { getAppDataPath } = await import('../fs');

    await expect(getAppDataPath()).resolves.toBe('/user-data');

    expect(mkdirMock).toHaveBeenCalledWith(
      '/shared-data/Publications/.health-check-test-uuid',
      { recursive: true },
    );
    expect(captureElectronErrorMock).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        contexts: {
          fn: {
            name: 'getAppDataPath.probeSharedSubfolders',
            sharedPath: '/shared-data',
          },
        },
        tags: {
          path_mode: 'shared',
          path_probe_result: 'failed',
        },
      }),
    );
    expect(setTagMock).toHaveBeenCalledWith('path_mode', 'user');
    expect(setTagMock).toHaveBeenCalledWith('path_probe_result', 'failed');
  });
});

describe('macOS folder permissions', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const { app } = await import('electron');
    const { mainWindowInfo } =
      await import('src-electron/main/window/window-main');
    vi.mocked(app.getPath).mockReturnValue('/user-data');
    (
      mainWindowInfo as typeof mainWindowInfo & {
        mainWindow: Electron.BrowserWindow;
      }
    ).mainWindow = {} as Electron.BrowserWindow;
    readFileMock.mockRejectedValue(new Error('no stored bookmarks'));
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
    rmMock.mockResolvedValue(undefined);
    setPlatform('darwin');
  });

  afterAll(() => {
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
  });

  it('stores security scoped bookmarks returned by the folder dialog', async () => {
    const { dialog } = await import('electron');
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      bookmarks: ['bookmark-data'],
      canceled: false,
      filePaths: ['/Users/test/Documents'],
    });

    const { openFolderDialog } = await import('../fs');

    await expect(openFolderDialog()).resolves.toMatchObject({
      canceled: false,
      filePaths: ['/Users/test/Documents'],
    });

    expect(dialog.showOpenDialog).toHaveBeenCalledWith(expect.any(Object), {
      properties: ['openDirectory'],
      securityScopedBookmarks: true,
    });
    expect(writeFileMock).toHaveBeenCalledWith(
      '/user-data/security-scoped-bookmarks.json',
      JSON.stringify({ '/Users/test/Documents': 'bookmark-data' }, null, 2),
      'utf8',
    );
  });

  it('opens a folder picker when a macOS permission probe fails', async () => {
    const { dialog } = await import('electron');
    const permissionError = new Error('operation not permitted');
    (permissionError as Error & { code?: string }).code = 'EPERM';
    mkdirMock
      .mockRejectedValueOnce(permissionError)
      .mockResolvedValue(undefined);
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: ['/Users/test/Documents/El Arroyo'],
    });

    const { ensureMacosFolderPermission } = await import('../fs');

    await expect(
      ensureMacosFolderPermission('/Users/test/Documents/El Arroyo'),
    ).resolves.toEqual({
      path: '/Users/test/Documents/El Arroyo',
      selectedPath: '/Users/test/Documents/El Arroyo',
      status: 'granted',
    });

    expect(dialog.showOpenDialog).toHaveBeenCalledWith(expect.any(Object), {
      defaultPath: '/Users/test/Documents/El Arroyo',
      properties: ['openDirectory'],
      securityScopedBookmarks: true,
    });
  });

  it('can probe macOS folder permissions without opening the picker', async () => {
    const { dialog } = await import('electron');
    const permissionError = new Error('operation not permitted');
    (permissionError as Error & { code?: string }).code = 'EPERM';
    mkdirMock.mockRejectedValue(permissionError);

    const { ensureMacosFolderPermission } = await import('../fs');

    await expect(
      ensureMacosFolderPermission('/Users/test/Documents/El Arroyo', false),
    ).resolves.toEqual({
      path: '/Users/test/Documents/El Arroyo',
      status: 'failed',
    });

    expect(dialog.showOpenDialog).not.toHaveBeenCalled();
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
        contexts: expect.objectContaining({
          fn: {
            args: { zipPath: '/tmp/locked.jwpub' },
            name: 'getZipEntries stat',
          },
        }),
      }),
    );
  });

  it('adds diagnostics but does not report zip files deleted after stat', async () => {
    const error = new Error('missing after stat');
    (error as Error & { code?: string }).code = 'ENOENT';
    yauzlOpenMock.mockRejectedValue(error);

    const { getZipEntries } = await import('../fs');

    await expect(getZipEntries('/tmp/raced.jwpub')).rejects.toMatchObject({
      code: 'ENOENT',
    });

    expect(yauzlOpenMock).toHaveBeenCalledWith('/tmp/raced.jwpub');
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

  it('adds entry samples and contents size to zip entry diagnostics', async () => {
    const entries = [
      { compressedSize: 50, fileName: 'contents', uncompressedSize: 100 },
      { compressedSize: 25, fileName: 'manifest.json', uncompressedSize: 75 },
    ];
    const zipfile = {
      close: vi.fn(),
      eachEntry: async function* () {
        yield* entries;
      },
    };
    yauzlOpenMock.mockResolvedValue(zipfile);

    const { getZipEntries } = await import('../fs');

    await expect(getZipEntries('/tmp/parent.jwpub')).resolves.toEqual({
      contents: 100,
      'manifest.json': 75,
    });
    expect(addElectronBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'zip',
        data: expect.objectContaining({
          contentsSize: 100,
          entryCount: 2,
          entryNamesSample: ['contents', 'manifest.json'],
          fileSize: 1024,
          totalUncompressedSize: 175,
          zipPath: '/tmp/parent.jwpub',
        }),
        message: 'Finished reading zip entries',
      }),
    );
  });

  it('retries timed out cloud zip reads before reporting an error', async () => {
    const timeoutError = new Error('ETIMEDOUT: connection timed out, read');
    (timeoutError as Error & { code?: string }).code = 'ETIMEDOUT';
    const zipfileMock = {
      close: vi.fn(),
      eachEntry: async function* () {
        yield* [];
      },
    };

    yauzlOpenMock
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValueOnce(zipfileMock);

    const { getZipEntries } = await import('../fs');

    await expect(
      getZipEntries(
        '/Users/test/Library/Mobile Documents/com~apple~CloudDocs/Downloads/S-34_GA.jwpub',
      ),
    ).resolves.toEqual({});

    expect(yauzlOpenMock).toHaveBeenCalledTimes(2);
    expect(delayMock).toHaveBeenCalledWith(1000);
    expect(addElectronBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'zip',
        data: expect.objectContaining({
          cloudProvider: 'iCloud',
          errorCode: 'ETIMEDOUT',
          isCloudStoragePath: true,
          retrying: true,
        }),
        message: 'Error opening zip entries',
      }),
    );
    expect(captureElectronErrorMock).not.toHaveBeenCalled();
  });

  it('retries truncated zip reads before reporting an error', async () => {
    const truncatedError = new Error(
      'End of central directory record signature not found. Either not a zip file, or file is truncated.',
    );
    const zipfileMock = {
      close: vi.fn(),
      eachEntry: async function* () {
        yield* [];
      },
    };

    yauzlOpenMock
      .mockRejectedValueOnce(truncatedError)
      .mockResolvedValueOnce(zipfileMock);

    const { getZipEntries } = await import('../fs');

    await expect(getZipEntries('/tmp/raced.jwpub')).resolves.toEqual({});

    expect(yauzlOpenMock).toHaveBeenCalledTimes(2);
    expect(delayMock).toHaveBeenCalledWith(1000);
    expect(addElectronBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'zip',
        data: expect.objectContaining({
          errorCode: undefined,
          retrying: true,
          zipPath: '/tmp/raced.jwpub',
        }),
        message: 'Error opening zip entries',
      }),
    );
    expect(captureElectronErrorMock).not.toHaveBeenCalled();
  });

  it('retries zip files that disappear before opening during unzip', async () => {
    const error = new Error('missing during unzip');
    (error as Error & { code?: string }).code = 'ENOENT';
    const zipfile = {
      close: vi.fn(),
      eachEntry: async function* () {
        yield* [];
      },
    };

    yauzlOpenMock.mockRejectedValueOnce(error).mockResolvedValueOnce(zipfile);

    const { unzipFile } = await import('../fs');

    await expect(unzipFile('/tmp/raced.jwpub', '/tmp/out')).resolves.toEqual(
      [],
    );

    expect(yauzlOpenMock).toHaveBeenCalledTimes(2);
    expect(delayMock).toHaveBeenCalledWith(1000);
    expect(addElectronBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'unzip',
        data: expect.objectContaining({
          errorCode: 'ENOENT',
          input: '/tmp/raced.jwpub',
          retrying: true,
        }),
        level: 'info',
        message: 'Error opening zipfile',
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
