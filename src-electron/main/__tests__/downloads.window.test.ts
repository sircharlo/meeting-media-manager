import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  captureElectronError: vi.fn(),
  download: vi.fn(async () => 'download-id'),
  mkdir: vi.fn(),
  sendToWindow: vi.fn(),
  stat: vi.fn(),
}));

interface TestWindowState {
  mainWindow: null | {
    id: number;
    isDestroyed: () => boolean;
    webContents: { isDestroyed: () => boolean };
  };
}

const windowState = vi.hoisted((): TestWindowState => ({
  mainWindow: null,
}));

vi.mock('node:fs/promises', () => ({
  mkdir: mocks.mkdir,
  stat: mocks.stat,
}));

vi.mock('electron-dl-manager', () => ({
  ElectronDownloadManager: vi.fn(() => ({
    cancelDownload: vi.fn(),
    download: mocks.download,
    getDownloadData: vi.fn(),
    pauseDownload: vi.fn(),
    resumeDownload: vi.fn(),
  })),
}));

vi.mock('src-electron/main/session', () => ({
  quitStatus: { isAppQuitting: false },
}));

vi.mock('src-electron/main/utils', () => ({
  addElectronBreadcrumb: mocks.addElectronBreadcrumb,
  captureElectronError: mocks.captureElectronError,
  fetchJsonFromMainProcess: vi.fn(),
}));

vi.mock('src-electron/main/window/window-base', () => ({
  sendToWindow: mocks.sendToWindow,
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: windowState,
}));

vi.mock('countries-and-timezones', () => ({
  getCountriesForTimezone: vi.fn(() => []),
}));

vi.mock('electron', () => ({
  app: { getLocaleCountryCode: vi.fn(() => 'US') },
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

describe('downloads window lifetime', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.stat.mockResolvedValue({ isDirectory: () => true });
  });

  it('does not start a download when the window webContents is destroyed before queue processing', async () => {
    let webContentsDestroyed = false;
    windowState.mainWindow = {
      id: 1,
      isDestroyed: () => false,
      webContents: {
        isDestroyed: () => webContentsDestroyed,
      },
    };

    const { ElectronDownloadManager } = await import('electron-dl-manager');
    vi.mocked(ElectronDownloadManager).mockImplementationOnce(function () {
      webContentsDestroyed = true;

      return {
        cancelDownload: vi.fn(),
        download: mocks.download,
        getDownloadData: vi.fn(),
        pauseDownload: vi.fn(),
        resumeDownload: vi.fn(),
      } as unknown as InstanceType<typeof ElectronDownloadManager>;
    });

    const { downloadFile } = await import('../downloads');
    await expect(
      downloadFile('https://example.test/file.mp4', '/tmp/media'),
    ).resolves.toEqual({
      key: 'https://example.test/file.mp4/tmp/media',
      saveDir: '/tmp/media',
    });
    await Promise.resolve();

    expect(mocks.download).not.toHaveBeenCalled();
    expect(mocks.captureElectronError).not.toHaveBeenCalled();
  });

  it('caps concurrent mkdir calls across different directories', async () => {
    let activeMkdirCount = 0;
    let maxObservedConcurrency = 0;
    const pendingMkdirs: (() => void)[] = [];

    mocks.mkdir.mockImplementation(() => {
      activeMkdirCount += 1;
      maxObservedConcurrency = Math.max(
        maxObservedConcurrency,
        activeMkdirCount,
      );
      return new Promise<void>((resolve) => {
        pendingMkdirs.push(() => {
          activeMkdirCount -= 1;
          resolve();
        });
      });
    });

    const { ensureDirWithRetry } = await import('../downloads');
    const dirs = ['/tmp/a', '/tmp/b', '/tmp/c', '/tmp/d', '/tmp/e'];
    const resultsPromise = Promise.all(
      dirs.map((dir) => ensureDirWithRetry(dir)),
    );

    // Let every call that's going to start this "wave" actually start.
    await Promise.resolve();
    await Promise.resolve();

    expect(maxObservedConcurrency).toBeLessThanOrEqual(3);
    expect(mocks.mkdir).toHaveBeenCalledTimes(3);

    // Release one at a time so queued directories can take the freed slot.
    while (pendingMkdirs.length) {
      pendingMkdirs.shift()?.();
      await Promise.resolve();
      await Promise.resolve();
    }

    await expect(resultsPromise).resolves.toEqual(dirs);
    expect(maxObservedConcurrency).toBeLessThanOrEqual(3);
  });
});
