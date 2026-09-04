import { beforeEach, describe, expect, it, vi } from 'vitest';

// BE-4 (full-audit-2026-09-04.md): downloadFile() only deduped against
// ongoingDownloads, which only gains an entry once startDownload actually
// runs - not while an item merely sits in downloadQueue/lowPriorityQueue
// waiting for a free slot. Two rapid calls for the same URL/directory while
// maxActiveDownloads (3) is already saturated could both miss each other and
// get pushed to the queue twice, then race to write the same file once both
// are eventually dequeued.
interface DownloadCallbacks {
  onDownloadCompleted: (args: { item: { getSavePath: () => string } }) => void;
}

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

// Never resolves on its own - a slot is occupied the moment startDownload
// registers the ongoingDownloads entry (state: ACTIVE), before this promise
// settles, so tests free a slot by invoking the captured onDownloadCompleted
// callback directly instead of waiting on this promise.
// Must be vi.hoisted: vi.mock's factory below is hoisted above regular
// top-level declarations, so a plain `const` here would be referenced before
// initialization inside it (silently falling through to the real,
// un-mocked 'electron-dl-manager' module instead of erroring loudly).
const { downloadMock, pendingCallbacksByUrl } = vi.hoisted(() => {
  const byUrl = new Map<string, DownloadCallbacks>();
  return {
    downloadMock: vi.fn(
      (options: { callbacks: DownloadCallbacks; url: string }) => {
        byUrl.set(options.url, options.callbacks);
        // Deliberately never resolves/rejects: this test frees a slot via
        // the captured onDownloadCompleted callback above, not via this
        // promise settling.
        return new Promise<string>(() => {
          // noop
        });
      },
    ),
    pendingCallbacksByUrl: byUrl,
  };
});

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
}));

vi.mock('electron-dl-manager', () => ({
  ElectronDownloadManager: vi.fn(function () {
    return {
      cancelDownload: mocks.cancelDownload,
      download: downloadMock,
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

describe('downloadFile queue-level dedup', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    pendingCallbacksByUrl.clear();
    windowState.mainWindow = {
      id: 1,
      isDestroyed: () => false,
      webContents: { isDestroyed: () => false },
    };
  });

  it('does not enqueue the same URL/directory twice while it is still waiting in the queue (not yet active)', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    // maxActiveDownloads is 3: fill all 3 slots with downloads that never
    // resolve, so a 4th request has to sit in the queue rather than start.
    // The very first downloadFile() call triggers loadElectronDownloadManager's
    // one-time dynamic import() of 'electron-dl-manager', caching the result
    // at module scope; every later call just reuses that cache synchronously.
    // Firing all three concurrently before that first import settles hits an
    // unrelated Vitest race (multiple concurrent first-time dynamic imports
    // of the same not-yet-resolved mocked module can resolve to the real,
    // un-mocked module) - awaiting the first one avoids it without touching
    // the thing this test is actually about.
    downloadFile('https://example.test/a.mp4', '/tmp/media');
    await waitUntil(() => downloadMock.mock.calls.length === 1);

    downloadFile('https://example.test/b.mp4', '/tmp/media');
    downloadFile('https://example.test/c.mp4', '/tmp/media');
    await waitUntil(() => downloadMock.mock.calls.length === 3);

    // Two rapid requests for the same 4th URL while all 3 slots are full -
    // this is the exact race the fix addresses. If it enqueued twice, two
    // separate entries would each eventually call manager.download once a
    // slot frees.
    await Promise.all([
      downloadFile('https://example.test/d.mp4', '/tmp/media'),
      downloadFile('https://example.test/d.mp4', '/tmp/media'),
    ]);

    // Still queued, not started - only the 3 initial calls so far.
    expect(downloadMock).toHaveBeenCalledTimes(3);

    // Free two of the three occupied slots (enough room for every queued
    // entry to start if - and only if - there's really just one of them).
    pendingCallbacksByUrl
      .get('https://example.test/a.mp4')
      ?.onDownloadCompleted({
        item: { getSavePath: () => '/tmp/media/a.mp4' },
      });
    pendingCallbacksByUrl
      .get('https://example.test/b.mp4')
      ?.onDownloadCompleted({
        item: { getSavePath: () => '/tmp/media/b.mp4' },
      });

    await waitUntil(() => downloadMock.mock.calls.length === 4);
    // Give the queue processor a further chance to start a second (bug-only)
    // d.mp4 entry before asserting it never happened - a fixed number of
    // yields, since "it never happens" has no condition to poll for.
    for (let i = 0; i < 5; i++) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    }

    expect(downloadMock).toHaveBeenCalledTimes(4);
    expect(
      downloadMock.mock.calls.filter(
        (call) => call[0].url === 'https://example.test/d.mp4',
      ),
    ).toHaveLength(1);
  });
});
