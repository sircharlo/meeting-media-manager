import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  captureElectronError: vi.fn(),
  lstat: vi.fn(),
  mainWindowInfo: { mainWindow: null as unknown },
  mkdir: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  lstat: mocks.lstat,
  mkdir: mocks.mkdir,
  stat: mocks.stat,
}));

// Resolve retry delays instantly so tests aren't slowed down by the
// exponential backoff used for real ENOENT/EBUSY contention.
vi.mock('node:timers/promises', () => ({
  setTimeout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('src-electron/main/utils', () => ({
  addElectronBreadcrumb: mocks.addElectronBreadcrumb,
  captureElectronError: mocks.captureElectronError,
  fetchJsonFromMainProcess: vi.fn(),
}));

vi.mock('src-electron/main/session', () => ({
  quitStatus: { isAppQuitting: false },
}));

vi.mock('src-electron/main/window/window-base', () => ({
  sendToWindow: vi.fn(),
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: mocks.mainWindowInfo,
}));

vi.mock('countries-and-timezones', () => ({
  getCountriesForTimezone: vi.fn(() => []),
}));

vi.mock('electron', () => ({
  app: {
    getLocaleCountryCode: vi.fn(() => 'US'),
    getPath: vi.fn(() => '/tmp'),
  },
}));

vi.mock('src-electron/main/disk-space', () => ({
  getLowDiskSpaceStatus: vi.fn(async () => false),
}));

interface ErrorWithDirectoryDiagnostics extends Error {
  code: string;
  downloadDirDiagnostics?: unknown[];
  downloadDirFallbackError?: unknown;
}

const directoryStats = { isDirectory: () => true };

import { downloadFile, ensureDirWithRetry } from '../downloads';

describe('downloads.ensureDirWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mainWindowInfo.mainWindow = null;
  });

  it('creates the download destination recursively and verifies it is a directory', async () => {
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.stat.mockResolvedValue(directoryStats);

    await expect(
      ensureDirWithRetry('/tmp/Publications/w_X_20260400'),
    ).resolves.toBe('/tmp/Publications/w_X_20260400');

    expect(mocks.mkdir).toHaveBeenCalledWith('/tmp/Publications/w_X_20260400', {
      recursive: true,
    });
    expect(mocks.stat).toHaveBeenCalledWith('/tmp/Publications/w_X_20260400');
  });

  it('adds diagnostics to failed directory creation errors', async () => {
    const error: ErrorWithDirectoryDiagnostics = Object.assign(
      new Error('missing parent'),
      { code: 'ENOENT' },
    );
    mocks.mkdir.mockRejectedValue(error);
    mocks.lstat.mockRejectedValue(
      Object.assign(new Error('dir missing'), { code: 'ENOENT' }),
    );
    mocks.stat.mockRejectedValue(
      Object.assign(new Error('parent missing'), {
        code: 'ENOENT',
      }),
    );

    await expect(
      ensureDirWithRetry('/tmp/Publications/w_X_20260400'),
    ).rejects.toThrow('missing parent');

    expect(error.downloadDirDiagnostics).toEqual(
      Array.from({ length: 7 }, (_, attempt) => ({
        attempt,
        code: 'ENOENT',
        dir: '/tmp/Publications/w_X_20260400',
        dirLstatCode: 'ENOENT',
        message: 'missing parent',
        parentCode: 'ENOENT',
        parentExists: false,
        parentIsDirectory: false,
        parentMessage: 'parent missing',
        parentPath: '/tmp/Publications',
      })),
    );
    expect(mocks.addElectronBreadcrumb).toHaveBeenCalledWith({
      category: 'downloads.filesystem',
      data: error.downloadDirDiagnostics?.[0],
      level: 'warning',
      message: 'download-directory-create-failed',
    });
    expect(mocks.addElectronBreadcrumb).toHaveBeenCalledTimes(7);
    // MMM-V2-3KM: the temp-folder fallback's own failure used to be dropped.
    expect(error.downloadDirFallbackError).toEqual({
      code: 'ENOENT',
      dir: expect.stringMatching(/Downloads\/w_X_20260400$/),
      message: 'missing parent',
    });
  });

  // MMM-V2-3KM: a folder that "exists" yet can't be created or opened -
  // record whether it's a symlink/junction.
  it('records whether the failing directory is a symlink', async () => {
    const error: ErrorWithDirectoryDiagnostics = Object.assign(
      new Error('no such file'),
      { code: 'ENOENT' },
    );
    mocks.mkdir.mockRejectedValue(error);
    mocks.lstat.mockResolvedValue({ isSymbolicLink: () => true });
    mocks.stat.mockResolvedValue(directoryStats);

    await expect(
      ensureDirWithRetry('/tmp/Publications/jwb-107_X_0'),
    ).rejects.toThrow('no such file');

    expect(error.downloadDirDiagnostics?.[0]).toEqual(
      expect.objectContaining({ dirIsSymlink: true }),
    );
  });

  // MMM-V2-3KM: nested per-attempt objects reached Sentry as "[Object]".
  it('reports directory diagnostics as strings Sentry keeps', async () => {
    mocks.mainWindowInfo.mainWindow = {
      isDestroyed: () => false,
      webContents: { isDestroyed: () => false },
    };
    mocks.mkdir.mockRejectedValue(
      Object.assign(new Error('no such file'), { code: 'ENOENT' }),
    );
    mocks.lstat.mockResolvedValue({ isSymbolicLink: () => false });
    mocks.stat.mockResolvedValue(directoryStats);

    await expect(
      downloadFile('https://example.test/a.mp4', '/tmp/Publications/x_0'),
    ).resolves.toBeNull();

    const fn = mocks.captureElectronError.mock.calls[0]?.[1]?.contexts?.fn;
    expect(fn.directoryDiagnostics).toHaveLength(7);
    expect(fn.directoryDiagnostics[0]).toEqual(expect.any(String));
    expect(JSON.parse(fn.directoryDiagnostics[0])).toEqual(
      expect.objectContaining({ attempt: 0, dirIsSymlink: false }),
    );
    expect(JSON.parse(fn.fallbackDirError)).toEqual(
      expect.objectContaining({ code: 'ENOENT' }),
    );
  });

  it('coalesces concurrent requests for the same directory into a single attempt', async () => {
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.stat.mockResolvedValue(directoryStats);

    await Promise.all([
      ensureDirWithRetry('/tmp/Publications/w_X_20260400'),
      ensureDirWithRetry('/tmp/Publications/w_X_20260400'),
      ensureDirWithRetry('/tmp/Publications/w_X_20260400'),
    ]);

    expect(mocks.mkdir).toHaveBeenCalledTimes(1);

    // A later call (after the previous one has settled) starts a fresh attempt
    await ensureDirWithRetry('/tmp/Publications/w_X_20260400');
    expect(mocks.mkdir).toHaveBeenCalledTimes(2);
  });
});
