import type * as vanillaModule from 'src/shared/vanilla';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DOWNLOAD_PROGRESS_THROTTLE_MS } from '../downloads';

const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  captureElectronError: vi.fn(),
  download: vi.fn(),
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

interface ProgressCallbacks {
  onDownloadCancelled: () => Promise<void>;
  onDownloadCompleted: (args: {
    item: { getSavePath: () => string };
  }) => Promise<void>;
  onDownloadProgress: (args: {
    item: { getReceivedBytes: () => number };
    percentCompleted: number;
  }) => Promise<void>;
  onDownloadStarted: (args: {
    item: { getTotalBytes: () => number };
    resolvedFilename: string;
  }) => Promise<void>;
  onError: (error: Error, downloadData?: unknown) => Promise<void>;
}

const callbacksState = vi.hoisted(() => ({
  captured: [] as ProgressCallbacks[],
}));

vi.mock('node:fs/promises', () => ({
  mkdir: mocks.mkdir,
  stat: mocks.stat,
}));

vi.mock('electron-dl-manager', () => ({
  // A regular `function` (not an arrow) so the mock is constructable when
  // downloads.ts does `new ElectronDownloadManager()`.
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
  getLowDiskSpaceStatus: vi.fn(async () => false),
}));

// Avoid real network probes inside `isDownloadErrorExpected` (invoked from
// `onError`); MSW would intercept them and log noisy warnings.
vi.mock('is-online', () => ({
  default: vi.fn(() => Promise.resolve(false)),
}));

// Keep the real `throttleWithTrailing` (that is what is under test) but silence
// `log`, matching the other downloads tests.
vi.mock('src/shared/vanilla', async () => {
  const actual =
    await vi.importActual<typeof vanillaModule>('src/shared/vanilla');
  return { ...actual, log: vi.fn() };
});

const flushAsync = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

const makeMainWindow = () => {
  windowState.mainWindow = {
    id: 1,
    isDestroyed: () => false,
    webContents: { isDestroyed: () => false },
  };
};

const startDownloadViaQueue = async (url: string) => {
  const { downloadFile } = await import('../downloads');
  await downloadFile(url, '/tmp/media');
  await flushAsync();
  const callbacks = callbacksState.captured.at(-1);
  if (!callbacks) throw new Error('manager.download was never called');
  return callbacks;
};

describe('download progress IPC throttling', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.stat.mockResolvedValue({ isDirectory: () => true });
    mocks.download.mockImplementation(
      async ({ callbacks }: { callbacks: ProgressCallbacks }) => {
        callbacksState.captured.push(callbacks);
        return 'download-id';
      },
    );
    // Start from a non-zero clock: `throttleWithTrailing` seeds its last-exec
    // time at 0, so a fake clock starting at epoch 0 would wrongly treat the
    // very first call as inside the throttle window.
    vi.useFakeTimers({ now: new Date('2024-01-01T00:00:00Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
    callbacksState.captured = [];
  });

  it('throttles progress messages but delivers the latest value as a trailing update', async () => {
    makeMainWindow();
    const callbacks = await startDownloadViaQueue('https://example.test/a.mp4');

    let bytesReceived = 0;
    const item = { getReceivedBytes: () => bytesReceived };
    for (let i = 0; i < 12; i++) {
      bytesReceived += 512;
      await callbacks.onDownloadProgress({
        item,
        percentCompleted: i + 1,
      });
    }

    // Only the first burst tick went out immediately; the rest are collapsed
    // into a single pending trailing update.
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(1);
    expect(mocks.sendToWindow).toHaveBeenNthCalledWith(
      1,
      windowState.mainWindow,
      'downloadProgress',
      {
        bytesReceived: 512,
        id: 'https://example.test/a.mp4/tmp/media',
        percentCompleted: 1,
      },
    );

    // Once the throttle window elapses, the trailing update fires with the
    // most recent data, not the values from the start of the burst.
    vi.advanceTimersByTime(DOWNLOAD_PROGRESS_THROTTLE_MS);
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(2);
    expect(mocks.sendToWindow).toHaveBeenNthCalledWith(
      2,
      windowState.mainWindow,
      'downloadProgress',
      {
        bytesReceived: 12 * 512,
        id: 'https://example.test/a.mp4/tmp/media',
        percentCompleted: 12,
      },
    );

    // The trailing update is one-shot: no further sends after more time.
    vi.advanceTimersByTime(1000);
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(2);
  });

  it('keeps progress flowing when events keep arriving across windows', async () => {
    makeMainWindow();
    const callbacks = await startDownloadViaQueue('https://example.test/a.mp4');

    const item = { getReceivedBytes: () => 1024 };
    for (let i = 0; i < 5; i++) {
      await callbacks.onDownloadProgress({
        item,
        percentCompleted: i + 1,
      });
    }
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(DOWNLOAD_PROGRESS_THROTTLE_MS);
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(2);

    // A new burst after the window has passed sends immediately again.
    vi.advanceTimersByTime(250);
    await callbacks.onDownloadProgress({
      item,
      percentCompleted: 6,
    });
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(3);
  });

  it('sends one-shot events immediately, even while a progress update is pending', async () => {
    makeMainWindow();
    const callbacks = await startDownloadViaQueue('https://example.test/a.mp4');

    await callbacks.onDownloadStarted({
      item: { getTotalBytes: () => 999 },
      resolvedFilename: 'a.mp4',
    });
    expect(mocks.sendToWindow).toHaveBeenLastCalledWith(
      windowState.mainWindow,
      'downloadStarted',
      {
        filename: 'a.mp4',
        id: 'https://example.test/a.mp4/tmp/media',
        totalBytes: 999,
      },
    );

    // Leave a trailing progress update pending (the first call sends
    // immediately, the second schedules the trailing tick), then complete and
    // error out.
    const item = { getReceivedBytes: () => 100 };
    await callbacks.onDownloadProgress({
      item,
      percentCompleted: 10,
    });
    await callbacks.onDownloadProgress({
      item,
      percentCompleted: 20,
    });
    await callbacks.onDownloadCompleted({
      item: { getSavePath: () => '/tmp/media/a.mp4' },
    });
    await callbacks.onError(new Error('boom'), { failed: true });

    const channels = mocks.sendToWindow.mock.calls.map((call) => call[1]);
    expect(channels).toContain('downloadCompleted');
    expect(channels).toContain('downloadError');
    expect(channels.filter((c) => c === 'downloadProgress')).toHaveLength(1);

    // The pending trailing progress tick still fires later; the final state
    // is unaffected because completion set it, not the last progress tick.
    vi.advanceTimersByTime(DOWNLOAD_PROGRESS_THROTTLE_MS);
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(5);
  });

  it('throttles concurrent downloads independently', async () => {
    makeMainWindow();
    const callbacksA = await startDownloadViaQueue(
      'https://example.test/a.mp4',
    );
    const callbacksB = await startDownloadViaQueue(
      'https://example.test/b.mp4',
    );
    expect(callbacksA).not.toBe(callbacksB);

    const itemA = { getReceivedBytes: () => 100 };
    const itemB = { getReceivedBytes: () => 200 };
    for (let i = 0; i < 10; i++) {
      await callbacksA.onDownloadProgress({
        item: itemA,
        percentCompleted: i + 1,
      });
      await callbacksB.onDownloadProgress({
        item: itemB,
        percentCompleted: i + 1,
      });
    }

    // Each download's first tick was sent immediately - one shared throttle
    // would have suppressed B's leading tick.
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(DOWNLOAD_PROGRESS_THROTTLE_MS);
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(4);

    const progressPayloads = mocks.sendToWindow.mock.calls
      .filter((call) => call[1] === 'downloadProgress')
      .map((call) => call[2]);
    expect(progressPayloads).toEqual([
      {
        bytesReceived: 100,
        id: 'https://example.test/a.mp4/tmp/media',
        percentCompleted: 1,
      },
      {
        bytesReceived: 200,
        id: 'https://example.test/b.mp4/tmp/media',
        percentCompleted: 1,
      },
      {
        bytesReceived: 100,
        id: 'https://example.test/a.mp4/tmp/media',
        percentCompleted: 10,
      },
      {
        bytesReceived: 200,
        id: 'https://example.test/b.mp4/tmp/media',
        percentCompleted: 10,
      },
    ]);
  });
});
