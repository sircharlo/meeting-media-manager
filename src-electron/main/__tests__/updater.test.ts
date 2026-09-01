import type { OsSupportWarning } from 'src/types';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const checkForUpdatesAndNotifyMock = vi.fn(async () => undefined);
const handlers = new Map<string, (...args: unknown[]) => void>();
const pathExistsMock = vi.fn(async () => false);
const quitAndInstallMock = vi.fn();
const getOsSupportWarningMock = vi.fn<() => null | OsSupportWarning>(() => null);

vi.mock('electron-updater', () => ({
  default: {
    autoUpdater: {
      allowDowngrade: false,
      allowPrerelease: false,
      autoDownload: false,
      autoInstallOnAppQuit: false,
      checkForUpdatesAndNotify: checkForUpdatesAndNotifyMock,
      logger: null,
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        handlers.set(event, handler);
      }),
      quitAndInstall: quitAndInstallMock,
    },
  },
}));

vi.mock('fs-extra/esm', () => ({
  pathExists: pathExistsMock,
}));

vi.mock('is-online', () => ({
  default: vi.fn(async () => true),
}));

vi.mock('src-electron/main/downloads', () => ({
  isDownloadErrorExpected: vi.fn(async () => false),
}));

vi.mock('src-electron/main/fs', () => ({
  getAppDataPath: vi.fn(async () => '/app-data'),
}));

vi.mock('src-electron/main/os-support', () => ({
  getOsSupportWarning: getOsSupportWarningMock,
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
  isIgnoredUpdateError: vi.fn(() => false),
  isUpdaterFullDownloadFallbackError: vi.fn(() => false),
  markUpdaterFullDownloadFallback: vi.fn(),
}));

vi.mock('src-electron/main/window/window-base', () => ({
  sendToWindow: vi.fn(),
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: { mainWindow: null },
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

describe('updater install flow', () => {
  beforeEach(() => {
    handlers.clear();
    vi.resetModules();
    vi.clearAllMocks();
    pathExistsMock.mockResolvedValue(false);
    getOsSupportWarningMock.mockReturnValue(null);
  });

  it('checks for updates on supported platforms', async () => {
    const { initUpdater } = await import('../updater');

    await initUpdater();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(checkForUpdatesAndNotifyMock).toHaveBeenCalledTimes(1);
  });

  it('skips the update check on platforms future releases will not support', async () => {
    const { log } = await import('src/shared/vanilla');
    getOsSupportWarningMock.mockReturnValue('win32-ia32');
    const { initUpdater } = await import('../updater');

    await initUpdater();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(checkForUpdatesAndNotifyMock).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      'Skipping update check: this platform is no longer supported by future releases.',
      'electronUpdater',
      'info',
    );
  });

  it('does not call quitAndInstall before an update is downloaded', async () => {
    const { quitAndInstallUpdate } = await import('../updater');

    quitAndInstallUpdate();

    expect(quitAndInstallMock).not.toHaveBeenCalled();
  });

  it('calls quitAndInstall only once for duplicate install requests', async () => {
    const { initUpdater, isUpdateInstallInProgress, quitAndInstallUpdate } =
      await import('../updater');

    await initUpdater();
    handlers.get('update-downloaded')?.({ version: '26.6.2' });

    expect(isUpdateInstallInProgress()).toBe(false);

    quitAndInstallUpdate();
    quitAndInstallUpdate();

    expect(isUpdateInstallInProgress()).toBe(true);
    expect(quitAndInstallMock).toHaveBeenCalledTimes(1);
    expect(quitAndInstallMock).toHaveBeenCalledWith(false, true);
  });

  it('resets install state when a new update becomes available', async () => {
    const { initUpdater, quitAndInstallUpdate } = await import('../updater');

    await initUpdater();
    handlers.get('update-downloaded')?.({ version: '26.6.2' });
    quitAndInstallUpdate();
    handlers.get('update-available')?.({ version: '26.6.3' });
    handlers.get('update-downloaded')?.({ version: '26.6.3' });
    quitAndInstallUpdate();

    expect(quitAndInstallMock).toHaveBeenCalledTimes(2);
  });

  it('tracks updater lifecycle state for renderer catch-up', async () => {
    const { getUpdaterState, initUpdater } = await import('../updater');

    expect(getUpdaterState()).toEqual({ phase: null, progress: null });

    await initUpdater();
    handlers.get('update-available')?.({ version: '26.6.2' });
    expect(getUpdaterState()).toEqual({
      phase: 'downloading',
      progress: null,
    });

    const progress = {
      bytesPerSecond: 1000,
      delta: 5,
      percent: 50,
      total: 100,
      transferred: 50,
    };
    handlers.get('download-progress')?.(progress);
    expect(getUpdaterState()).toEqual({ phase: 'downloading', progress });

    handlers.get('update-downloaded')?.({ version: '26.6.2' });
    expect(getUpdaterState()).toEqual({ phase: 'downloaded', progress });
  });

  it('resets tracked updater state when the updater errors', async () => {
    const { getUpdaterState, initUpdater } = await import('../updater');

    await initUpdater();
    handlers.get('update-available')?.({ version: '26.6.2' });
    expect(getUpdaterState()).toEqual({
      phase: 'downloading',
      progress: null,
    });

    handlers.get('error')?.(new Error('network error'), 'network error');

    // A future renderer mount's catch-up must not see a stale 'downloading'
    // phase for an update that actually failed.
    expect(getUpdaterState()).toEqual({ phase: null, progress: null });
  });

  it('logs update download progress as readable text', async () => {
    const { sendToWindow } =
      await import('src-electron/main/window/window-base');
    const { log } = await import('src/shared/vanilla');
    const { initUpdater } = await import('../updater');
    const progress = {
      bytesPerSecond: 224980,
      delta: 260723,
      percent: 13.749029536464944,
      total: 126027404,
      transferred: 17327545,
    };

    await initUpdater();
    handlers.get('download-progress')?.(progress);

    expect(log).toHaveBeenCalledWith(
      'Update download progress: 13.75%, 17327545/126027404 bytes, 224980 B/s, delta 260723 bytes',
      'electronUpdater',
      'log',
    );
    expect(log).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      progress,
    );
    expect(sendToWindow).toHaveBeenCalledWith(
      null,
      'update-download-progress',
      progress,
    );
  });
});
