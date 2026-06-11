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

const windowState = vi.hoisted(
  (): TestWindowState => ({
    mainWindow: null,
  }),
);

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
    ).resolves.toBe('https://example.test/file.mp4/tmp/media');
    await Promise.resolve();

    expect(mocks.download).not.toHaveBeenCalled();
    expect(mocks.captureElectronError).not.toHaveBeenCalled();
  });
});
