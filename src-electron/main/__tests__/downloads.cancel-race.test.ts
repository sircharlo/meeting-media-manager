import { beforeEach, describe, expect, it, vi } from 'vitest';

// BE-2 (full-audit-2026-09-04.md): cancelAllDownloads() previously only
// cancelled entries that already had a uuid. A download whose
// manager.download() call hadn't resolved yet at the moment "cancel all" was
// invoked kept running in the background, untracked, and still reported
// completion/error to the renderer afterwards.
const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  cancelDownload: vi.fn(),
  captureElectronError: vi.fn(),
  sendToWindow: vi.fn(),
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

let resolveDownload: ((uuid: string) => void) | null = null;

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
}));

vi.mock('electron-dl-manager', () => ({
  // A real `function` (not an arrow function) is required here: downloads.ts
  // calls `new ElectronDownloadManager()`, and an arrow-function mock
  // implementation throws "is not a constructor" - silently swallowed by
  // processQueue's own try/catch (BE-1), which made this look like the
  // download simply never started until traced with a debug stack print.
  ElectronDownloadManager: vi.fn(function () {
    return {
      cancelDownload: mocks.cancelDownload,
      download: vi.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveDownload = resolve;
          }),
      ),
      getDownloadData: vi.fn(),
      pauseDownload: vi.fn(),
      resumeDownload: vi.fn(),
    };
  }),
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
  throttleWithTrailing: (fn: (...args: unknown[]) => unknown) => fn,
}));

// Reaching manager.download() goes through several chained awaits
// (downloadFile -> processQueue -> processQueueItem -> startDownload),
// including a real dynamic import() of the (mocked) 'electron-dl-manager'
// module, which under Vitest's module loader can take more than one
// macrotask tick to settle. Poll instead of assuming a fixed number of ticks.
const waitUntil = async (
  condition: () => boolean,
  maxAttempts = 50,
): Promise<void> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (condition()) return;
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  }
  throw new Error('waitUntil: condition was never met');
};

describe('cancelAllDownloads race with an initializing download', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    resolveDownload = null;
    windowState.mainWindow = {
      id: 1,
      isDestroyed: () => false,
      webContents: { isDestroyed: () => false },
    };
  });

  it('cancels a download once it finishes initializing, if cancelAllDownloads ran while it was still starting', async () => {
    const { cancelAllDownloads, downloadFile } =
      await import('src-electron/main/downloads');

    // Kicks off startDownload(); manager.download() will not resolve until
    // resolveDownload() is called below, simulating "still initializing".
    const downloadPromise = downloadFile(
      'https://example.test/file.mp4',
      '/tmp/media',
    );
    await waitUntil(() => resolveDownload !== null);

    // "Cancel all" runs while the download above has no uuid yet.
    await cancelAllDownloads();

    // manager.cancelDownload can't have been called yet - there's still no
    // uuid to give it.
    expect(mocks.cancelDownload).not.toHaveBeenCalled();

    // The download now finishes initializing and reports its uuid.
    resolveDownload?.('download-id-1');
    await downloadPromise;
    await waitUntil(() => mocks.cancelDownload.mock.calls.length > 0);

    expect(mocks.cancelDownload).toHaveBeenCalledWith('download-id-1');
  });
});
