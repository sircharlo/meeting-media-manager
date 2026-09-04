import { beforeEach, describe, expect, it, vi } from 'vitest';

// BE-8 (full-audit-2026-09-04.md): the only prior low-disk-space check fired
// once, at congregation-switch time, and never gated downloads themselves.
// processQueue() now re-checks disk space (throttled) before starting the
// next queued item, and pauses instead of starting when critically low.
const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  captureElectronError: vi.fn(),
  download: vi.fn(async () => 'download-id'),
  getLowDiskSpaceStatus: vi.fn(async () => false),
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
  // A real `function` (not an arrow function) is required: downloads.ts
  // calls `new ElectronDownloadManager()`, and an arrow-function mock
  // implementation throws "is not a constructor" if actually invoked via
  // `new` (see downloads.cancel-race.test.ts, which hit this).
  ElectronDownloadManager: vi.fn(function () {
    return {
      cancelDownload: vi.fn(),
      download: mocks.download,
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

vi.mock('src-electron/main/disk-space', () => ({
  getLowDiskSpaceStatus: mocks.getLowDiskSpaceStatus,
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
  throttleWithTrailing: (fn: (...args: unknown[]) => unknown) => fn,
}));

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

describe('processQueue low-disk-space gate', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.stat.mockResolvedValue({ isDirectory: () => true });
    mocks.getLowDiskSpaceStatus.mockResolvedValue(false);
    windowState.mainWindow = {
      id: 1,
      isDestroyed: () => false,
      webContents: { isDestroyed: () => false },
    };
  });

  it('does not start a queued download when disk space is critically low', async () => {
    mocks.getLowDiskSpaceStatus.mockResolvedValue(true);

    const { downloadFile } = await import('src-electron/main/downloads');
    await downloadFile('https://example.test/file.mp4', '/tmp/media');

    await waitUntil(() => mocks.getLowDiskSpaceStatus.mock.calls.length > 0);
    // Give any (incorrect) continuation into processQueueItem a chance to run.
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(mocks.download).not.toHaveBeenCalled();
  });

  it('starts a queued download normally when disk space is fine', async () => {
    mocks.getLowDiskSpaceStatus.mockResolvedValue(false);

    const { downloadFile } = await import('src-electron/main/downloads');
    await downloadFile('https://example.test/file.mp4', '/tmp/media');

    await waitUntil(() => mocks.download.mock.calls.length > 0);

    expect(mocks.getLowDiskSpaceStatus).toHaveBeenCalled();
  });

  it('throttles repeat disk-space checks instead of checking on every processQueue call', async () => {
    mocks.getLowDiskSpaceStatus.mockResolvedValue(false);

    const { downloadFile } = await import('src-electron/main/downloads');
    await downloadFile('https://example.test/file-1.mp4', '/tmp/media');
    await waitUntil(() => mocks.getLowDiskSpaceStatus.mock.calls.length > 0);

    const callsAfterFirst = mocks.getLowDiskSpaceStatus.mock.calls.length;

    await downloadFile('https://example.test/file-2.mp4', '/tmp/media');
    await waitUntil(() => mocks.download.mock.calls.length > 1);

    // The second processQueue() run happens well within the throttle
    // window, so it must not have re-invoked the (real-disk-I/O-backed)
    // check.
    expect(mocks.getLowDiskSpaceStatus.mock.calls.length).toBe(callsAfterFirst);
  });
});
