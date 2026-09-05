import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  captureElectronError: vi.fn(),
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

// Simulates loadElectronDownloadManager's dynamic import() failing (e.g. a
// corrupted install / AV-quarantined module file).
vi.mock('electron-dl-manager', () => {
  throw new Error('module load failed');
});

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
  throttleWithTrailing: (fn: (...args: unknown[]) => unknown) => fn,
}));

describe('processQueue error handling (BE-1)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.stat.mockResolvedValue({ isDirectory: () => true });
    windowState.mainWindow = {
      id: 1,
      isDestroyed: () => false,
      webContents: { isDestroyed: () => false },
    };
  });

  it('reports a failure inside the fire-and-forget processQueue() call instead of rejecting unobserved', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    // downloadFile awaits directory setup then calls processQueue()
    // fire-and-forget; the download manager's dynamic import is mocked to
    // throw, which processQueue must catch internally.
    const result = await downloadFile(
      'https://example.com/file.mp4',
      '/tmp/does-not-matter',
      'file.mp4',
    );

    expect(result).not.toBeNull();

    // Let the un-awaited processQueue() promise chain settle.
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(mocks.captureElectronError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: { fn: { name: 'processQueue' } },
      }),
    );
  });
});
