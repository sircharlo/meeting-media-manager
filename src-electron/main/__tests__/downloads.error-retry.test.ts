import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  captureElectronError: vi.fn(),
  download: vi.fn(async () => 'download-id'),
  mkdir: vi.fn(),
  sendToWindow: vi.fn(),
  stat: vi.fn(),
}));

interface DownloadCallbacks {
  onError: (error: Error, downloadData?: { failed: boolean }) => Promise<void>;
}

const capturedCallbacksByUrl = vi.hoisted(
  () => new Map<string, DownloadCallbacks>(),
);

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

// Resolve retry delays instantly, matching downloads.ensure-dir.test.ts's
// established pattern for testing retry-with-backoff logic - fake timers
// (vi.useFakeTimers) don't intercept node:timers/promises's setTimeout.
vi.mock('node:timers/promises', () => ({
  setTimeout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('electron-dl-manager', () => ({
  // A real `function` (not an arrow function) is required: downloads.ts
  // calls `new ElectronDownloadManager()`, and an arrow-function mock
  // implementation throws "is not a constructor" if actually invoked via
  // `new` (see downloads.cancel-race.test.ts, which hit this).
  ElectronDownloadManager: vi.fn(function () {
    return {
      cancelDownload: vi.fn(),
      download: vi.fn(
        (options: { callbacks: DownloadCallbacks; url: string }) => {
          capturedCallbacksByUrl.set(options.url, options.callbacks);
          return mocks.download();
        },
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

vi.mock('src-electron/main/disk-space', () => ({
  getLowDiskSpaceStatus: vi.fn(async () => false),
}));

vi.mock('is-online', () => ({
  default: vi.fn(() => Promise.resolve(false)),
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

const URL = 'https://example.test/retry-me.mp4';

// BE-9 (full-audit-2026-09-04.md): a download that failed at the
// network/HTTP level was previously removed from tracking and reported
// immediately, with no automatic retry - every transient blip required the
// user to manually resubmit.
describe('downloadFile onError retry (BE-9)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    capturedCallbacksByUrl.clear();
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.stat.mockResolvedValue({ isDirectory: () => true });
    windowState.mainWindow = {
      id: 1,
      isDestroyed: () => false,
      webContents: { isDestroyed: () => false },
    };
  });

  it('retries a failed download up to the bound, then reports it', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    await downloadFile(URL, '/tmp/media');
    await waitUntil(() => mocks.download.mock.calls.length === 1);

    // First failure: retried instead of reported.
    await capturedCallbacksByUrl
      .get(URL)
      ?.onError(new Error('ECONNRESET'), { failed: true });
    await waitUntil(() => mocks.download.mock.calls.length === 2);
    expect(mocks.sendToWindow).not.toHaveBeenCalledWith(
      expect.anything(),
      'downloadError',
      expect.anything(),
    );
    expect(mocks.captureElectronError).not.toHaveBeenCalled();

    // Second failure: retried again (bound is 2).
    await capturedCallbacksByUrl
      .get(URL)
      ?.onError(new Error('ECONNRESET'), { failed: true });
    await waitUntil(() => mocks.download.mock.calls.length === 3);
    expect(mocks.captureElectronError).not.toHaveBeenCalled();

    // Third failure: retries exhausted - reported like before.
    await capturedCallbacksByUrl
      .get(URL)
      ?.onError(new Error('ECONNRESET'), { failed: true });

    expect(mocks.download).toHaveBeenCalledTimes(3);
    expect(mocks.captureElectronError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: expect.objectContaining({
          fn: expect.objectContaining({
            params: expect.objectContaining({ retryAttempts: 2 }),
          }),
        }),
      }),
    );
    expect(mocks.sendToWindow).toHaveBeenCalledWith(
      windowState.mainWindow,
      'downloadError',
      expect.objectContaining({}),
    );
  });

  it('does not retry once already removed from tracking (e.g. completed first)', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    await downloadFile(URL, '/tmp/media');
    await waitUntil(() => mocks.download.mock.calls.length === 1);

    const callbacks = capturedCallbacksByUrl.get(URL);
    // Simulate completion racing ahead of the error (as in
    // downloads.progress-throttling.test.ts's one-shot-event-ordering
    // test) - onDownloadCompleted already deleted the tracking entry.
    await (
      callbacks as unknown as {
        onDownloadCompleted: (args: {
          item: { getSavePath: () => string };
        }) => Promise<void>;
      }
    ).onDownloadCompleted({ item: { getSavePath: () => '/tmp/media/x.mp4' } });

    await callbacks?.onError(new Error('boom'));

    // No retry attempted - reported immediately, same as before BE-9.
    expect(mocks.download).toHaveBeenCalledTimes(1);
    expect(mocks.captureElectronError).toHaveBeenCalled();
  });
});
