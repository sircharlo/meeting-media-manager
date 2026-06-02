import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  mkdir: mocks.mkdir,
  stat: mocks.stat,
}));

vi.mock('src-electron/main/utils', () => ({
  addElectronBreadcrumb: mocks.addElectronBreadcrumb,
  captureElectronError: vi.fn(),
  fetchJsonFromMainProcess: vi.fn(),
}));

vi.mock('src-electron/main/session', () => ({
  quitStatus: { isAppQuitting: false },
}));

vi.mock('src-electron/main/window/window-base', () => ({
  sendToWindow: vi.fn(),
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: { mainWindow: null },
}));

vi.mock('countries-and-timezones', () => ({
  getCountriesForTimezone: vi.fn(() => []),
}));

vi.mock('electron', () => ({
  app: { getLocaleCountryCode: vi.fn(() => 'US') },
}));

interface ErrorWithDirectoryDiagnostics extends Error {
  code: string;
  downloadDirDiagnostics?: unknown[];
}

const directoryStats = { isDirectory: () => true };

import { ensureDirWithRetry } from '../downloads';

describe('downloads.ensureDirWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates the download destination recursively and verifies it is a directory', async () => {
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.stat.mockResolvedValue(directoryStats);

    await expect(
      ensureDirWithRetry('/tmp/Publications/w_X_20260400'),
    ).resolves.toBeUndefined();

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
    mocks.stat.mockRejectedValue(
      Object.assign(new Error('parent missing'), {
        code: 'ENOENT',
      }),
    );

    await expect(
      ensureDirWithRetry('/tmp/Publications/w_X_20260400'),
    ).rejects.toThrow('missing parent');

    expect(error.downloadDirDiagnostics).toEqual([
      {
        attempt: 0,
        code: 'ENOENT',
        dir: '/tmp/Publications/w_X_20260400',
        message: 'missing parent',
        parentCode: 'ENOENT',
        parentExists: false,
        parentIsDirectory: false,
        parentMessage: 'parent missing',
        parentPath: '/tmp/Publications',
      },
    ]);
    expect(mocks.addElectronBreadcrumb).toHaveBeenCalledWith({
      category: 'downloads.filesystem',
      data: error.downloadDirDiagnostics?.[0],
      level: 'warning',
      message: 'download-directory-create-failed',
    });
  });
});
