import type * as vanillaModule from 'src/shared/vanilla';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DOWNLOAD_PROGRESS_THROTTLE_MS } from '../downloads';

interface CapturedTransfer {
  options: {
    onProgress: (receivedBytes: number, totalBytes: number) => void;
    onStarted: (totalBytes: number) => void;
  };
  resolve: (result: { filePath: string; kind: 'completed' }) => void;
}

const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  captureElectronError: vi.fn(),
  mkdir: vi.fn(),
  sendToWindow: vi.fn(),
  stat: vi.fn(),
  transfers: [] as CapturedTransfer[],
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

vi.mock('src-electron/main/download-transfer', () => ({
  discardPartialDownload: vi.fn(async () => undefined),
  runTransfer: (options: CapturedTransfer['options']) =>
    new Promise((resolve) => {
      mocks.transfers.push({ options, resolve });
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
  const transfer = mocks.transfers.at(-1);
  if (!transfer) throw new Error('runTransfer was never called');
  return transfer;
};

describe('download progress IPC throttling', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.transfers.length = 0;
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.stat.mockResolvedValue({ isDirectory: () => true });
    // Start from a non-zero clock: `throttleWithTrailing` seeds its last-exec
    // time at 0, so a fake clock starting at epoch 0 would wrongly treat the
    // very first call as inside the throttle window.
    vi.useFakeTimers({ now: new Date('2024-01-01T00:00:00Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throttles progress messages but delivers the latest value as a trailing update', async () => {
    makeMainWindow();
    const { options } = await startDownloadViaQueue(
      'https://example.test/a.mp4',
    );

    for (let i = 1; i <= 12; i++) {
      options.onProgress(i * 512, 100 * 512);
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
    const { options } = await startDownloadViaQueue(
      'https://example.test/a.mp4',
    );

    for (let i = 1; i <= 5; i++) {
      options.onProgress(i * 1024, 0);
    }
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(DOWNLOAD_PROGRESS_THROTTLE_MS);
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(2);

    // A new burst after the window has passed sends immediately again.
    vi.advanceTimersByTime(250);
    options.onProgress(6 * 1024, 0);
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(3);
  });

  it('sends one-shot events immediately, even while a progress update is pending', async () => {
    makeMainWindow();
    const { options, resolve } = await startDownloadViaQueue(
      'https://example.test/a.mp4',
    );

    options.onStarted(999);
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
    // immediately, the second schedules the trailing tick), then complete.
    options.onProgress(100, 999);
    options.onProgress(200, 999);
    resolve({ filePath: '/tmp/media/a.mp4', kind: 'completed' });
    await flushAsync();

    const channels = mocks.sendToWindow.mock.calls.map((call) => call[1]);
    expect(channels).toContain('downloadCompleted');
    expect(channels.filter((c) => c === 'downloadProgress')).toHaveLength(1);

    // The pending trailing progress tick still fires later; the final state
    // is unaffected because completion set it, not the last progress tick.
    vi.advanceTimersByTime(DOWNLOAD_PROGRESS_THROTTLE_MS);
    expect(mocks.sendToWindow).toHaveBeenCalledTimes(4);
  });

  it('throttles concurrent downloads independently', async () => {
    makeMainWindow();
    const transferA = await startDownloadViaQueue('https://example.test/a.mp4');
    const transferB = await startDownloadViaQueue('https://example.test/b.mp4');
    expect(transferA).not.toBe(transferB);

    for (let i = 1; i <= 10; i++) {
      transferA.options.onProgress(i * 100, 100 * 100);
      transferB.options.onProgress(i * 200, 100 * 200);
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
        bytesReceived: 1000,
        id: 'https://example.test/a.mp4/tmp/media',
        percentCompleted: 10,
      },
      {
        bytesReceived: 2000,
        id: 'https://example.test/b.mp4/tmp/media',
        percentCompleted: 10,
      },
    ]);
  });
});
