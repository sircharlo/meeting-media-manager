import { beforeEach, describe, expect, it, vi } from 'vitest';

const checkForUpdatesAndNotifyMock = vi.fn(async () => undefined);
const handlers = new Map<string, (...args: unknown[]) => void>();
const pathExistsMock = vi.fn(async () => false);
const quitAndInstallMock = vi.fn();

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
  });

  it('does not call quitAndInstall before an update is downloaded', async () => {
    const { quitAndInstallUpdate } = await import('../updater');

    quitAndInstallUpdate();

    expect(quitAndInstallMock).not.toHaveBeenCalled();
  });

  it('calls quitAndInstall only once for duplicate install requests', async () => {
    const { initUpdater, quitAndInstallUpdate } = await import('../updater');

    await initUpdater();
    handlers.get('update-downloaded')?.({ version: '26.6.2' });

    quitAndInstallUpdate();
    quitAndInstallUpdate();

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
