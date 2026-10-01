import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Downloads could end up paused (or never started) forever, until the app was
// restarted:
// - An interrupted download was never noticed: electron-dl-manager reports
//   interruptions only via onDownloadInterrupted, which wasn't registered
//   (onError only fires when one of our own callbacks throws). The download
//   stayed tracked as active, keeping its slot - and while a normal-priority
//   download is active, no low-priority one may run or resume.
// - The queue only ever re-ran on download events, so once nothing was
//   progressing (e.g. everything held back for low disk space), nothing
//   re-ran it.
// - resumeAllDownloads() left a still-initializing paused download PAUSED,
//   so processQueue()'s stalled-queue check re-entered it in a microtask loop.
const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  cancelDownload: vi.fn(),
  captureElectronError: vi.fn(),
  download: vi.fn(),
  getLowDiskSpaceStatus: vi.fn<(minFreeGB?: number) => Promise<boolean>>(
    async () => false,
  ),
  log: vi.fn(),
  mkdir: vi.fn(),
  pauseDownload: vi.fn(),
  resumeDownload: vi.fn(),
  sendToWindow: vi.fn(),
  stat: vi.fn(),
}));

interface DownloadCallbacks {
  onDownloadInterrupted: (data: {
    interruptedVia?: 'completed' | 'in-progress';
  }) => Promise<void>;
  onDownloadProgress: (data: {
    item: { getReceivedBytes: () => number };
    percentCompleted: number;
  }) => Promise<void>;
}

const state = vi.hoisted(() => ({
  callbacksByUrl: new Map<string, DownloadCallbacks>(),
  // When true, manager.download() stays pending (no uuid yet) until the
  // test resolves it via pendingUuids.
  deferUuids: false,
  pendingUuids: new Map<string, () => void>(),
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

// Resolve retry backoff delays instantly (fake timers don't intercept
// node:timers/promises), as in downloads.error-retry.test.ts.
vi.mock('node:timers/promises', () => ({
  setTimeout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('electron-dl-manager', () => ({
  // A real `function` so `new ElectronDownloadManager()` works.
  ElectronDownloadManager: vi.fn(function () {
    return {
      cancelDownload: mocks.cancelDownload,
      download: (options: { callbacks: DownloadCallbacks; url: string }) => {
        state.callbacksByUrl.set(options.url, options.callbacks);
        mocks.download(options.url);
        const uuid = `uuid:${options.url}:${mocks.download.mock.calls.length}`;
        if (!state.deferUuids) return Promise.resolve(uuid);
        return new Promise<string>((resolve) => {
          state.pendingUuids.set(options.url, () => resolve(uuid));
        });
      },
      getDownloadData: vi.fn(),
      pauseDownload: mocks.pauseDownload,
      resumeDownload: mocks.resumeDownload,
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
  app: {
    getLocaleCountryCode: vi.fn(() => 'US'),
    getPath: vi.fn(() => '/tmp'),
  },
}));

vi.mock('src-electron/main/disk-space', () => ({
  getLowDiskSpaceStatus: mocks.getLowDiskSpaceStatus,
}));

vi.mock('is-online', () => ({
  default: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('src/shared/vanilla', () => ({
  log: mocks.log,
  throttleWithTrailing: (fn: (...args: unknown[]) => unknown) => fn,
}));

// Real setTimeout, so this still works while setInterval/Date are faked.
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

const flush = () => waitUntil(() => false, 10).catch(() => undefined);

const downloadCallsFor = (url: string) =>
  mocks.download.mock.calls.filter(([calledUrl]) => calledUrl === url).length;

const callbacksFor = (url: string) => {
  const callbacks = state.callbacksByUrl.get(url);
  if (!callbacks) throw new Error(`manager.download never called for ${url}`);
  return callbacks;
};

const keyFor = (url: string) => `${url}/tmp/media`;

const LOW = 'https://example.test/low.mp4';
const NORMAL = 'https://example.test/normal.jwpub';

// Matches QUEUE_WATCHDOG_INTERVAL_MS / DOWNLOAD_STALL_TIMEOUT_MS /
// DOWNLOAD_INTERRUPTED_GRACE_MS in downloads.ts.
const WATCHDOG_INTERVAL_MS = 15000;
const STALL_TIMEOUT_MS = 45000;
const INTERRUPTED_GRACE_MS = 10000;

describe('download queue stall recovery', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    state.callbacksByUrl.clear();
    state.pendingUuids.clear();
    state.deferUuids = false;
    mocks.log.mockImplementation(() => undefined);
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.stat.mockResolvedValue({ isDirectory: () => true });
    mocks.getLowDiskSpaceStatus.mockResolvedValue(false);
    windowState.mainWindow = {
      id: 1,
      isDestroyed: () => false,
      webContents: { isDestroyed: () => false },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('frees the slot of a download interrupted for good, so the low-priority download it paused resumes', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    await downloadFile(LOW, '/tmp/media', undefined, true);
    await waitUntil(() => downloadCallsFor(LOW) === 1);
    await flush();
    const lowUuid = 'uuid:' + LOW + ':1';

    // A normal-priority download pauses the running low-priority one.
    await downloadFile(NORMAL, '/tmp/media');
    expect(mocks.pauseDownload).toHaveBeenCalledWith(lowUuid);
    await waitUntil(() => downloadCallsFor(NORMAL) === 1);
    await flush();

    // Chromium gives up on it for good, every attempt.
    for (let attempt = 1; attempt <= 3; attempt++) {
      await callbacksFor(NORMAL).onDownloadInterrupted({
        interruptedVia: 'completed',
      });
      if (attempt < 3) {
        await waitUntil(() => downloadCallsFor(NORMAL) === attempt + 1);
        await flush();
      }
    }

    // Retries exhausted: reported to the renderer, slot freed, and the paused
    // low-priority download resumes instead of staying paused forever.
    expect(downloadCallsFor(NORMAL)).toBe(3);
    expect(mocks.sendToWindow).toHaveBeenCalledWith(
      windowState.mainWindow,
      'downloadError',
      { id: keyFor(NORMAL) },
    );
    await waitUntil(() => mocks.resumeDownload.mock.calls.length > 0);
    expect(mocks.resumeDownload).toHaveBeenCalledWith(lowUuid);
    // Network failures are expected for many users; they aren't Sentry bugs.
    expect(mocks.captureElectronError).not.toHaveBeenCalled();
  });

  it('cancels each abandoned attempt before retrying, so it never keeps downloading untracked', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    await downloadFile(NORMAL, '/tmp/media');
    await waitUntil(() => downloadCallsFor(NORMAL) === 1);
    await flush();

    await callbacksFor(NORMAL).onDownloadInterrupted({
      interruptedVia: 'completed',
    });
    await waitUntil(() => downloadCallsFor(NORMAL) === 2);

    expect(mocks.cancelDownload).toHaveBeenCalledWith('uuid:' + NORMAL + ':1');
    // A retry is not a failure: the renderer keeps waiting for it.
    expect(mocks.sendToWindow).not.toHaveBeenCalledWith(
      expect.anything(),
      'downloadError',
      expect.anything(),
    );
  });

  it('restarts a download that Chromium leaves interrupted after the grace period', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    await downloadFile(NORMAL, '/tmp/media');
    await waitUntil(() => downloadCallsFor(NORMAL) === 1);
    await flush();

    await callbacksFor(NORMAL).onDownloadInterrupted({
      interruptedVia: 'in-progress',
    });
    // Resumable: not restarted straight away, Chromium may resume it itself.
    await flush();
    expect(mocks.cancelDownload).not.toHaveBeenCalled();

    vi.advanceTimersByTime(INTERRUPTED_GRACE_MS + WATCHDOG_INTERVAL_MS);
    await waitUntil(() => downloadCallsFor(NORMAL) === 2);

    expect(mocks.cancelDownload).toHaveBeenCalledWith('uuid:' + NORMAL + ':1');
  });

  it('leaves an interrupted download alone once Chromium resumes it', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    await downloadFile(NORMAL, '/tmp/media');
    await waitUntil(() => downloadCallsFor(NORMAL) === 1);
    await flush();

    const callbacks = callbacksFor(NORMAL);
    await callbacks.onDownloadInterrupted({ interruptedVia: 'in-progress' });
    await callbacks.onDownloadProgress({
      item: { getReceivedBytes: () => 1024 },
      percentCompleted: 5,
    });

    vi.advanceTimersByTime(WATCHDOG_INTERVAL_MS * 2);
    await flush();

    expect(mocks.cancelDownload).not.toHaveBeenCalled();
    expect(downloadCallsFor(NORMAL)).toBe(1);
  });

  it('restarts a running download that has stopped receiving bytes', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    await downloadFile(NORMAL, '/tmp/media');
    await waitUntil(() => downloadCallsFor(NORMAL) === 1);
    await flush();

    // Slow is fine: still making progress within the stall window.
    vi.advanceTimersByTime(STALL_TIMEOUT_MS - WATCHDOG_INTERVAL_MS);
    await flush();
    expect(downloadCallsFor(NORMAL)).toBe(1);

    // No bytes at all for the whole stall window.
    vi.advanceTimersByTime(WATCHDOG_INTERVAL_MS);
    await waitUntil(() => downloadCallsFor(NORMAL) === 2);

    expect(mocks.cancelDownload).toHaveBeenCalledWith('uuid:' + NORMAL + ':1');
  });

  it('only holds downloads back for critically low disk space, not the 10 GB warning threshold', async () => {
    const { downloadFile } = await import('src-electron/main/downloads');

    await downloadFile(NORMAL, '/tmp/media');
    await waitUntil(() => downloadCallsFor(NORMAL) === 1);

    expect(mocks.getLowDiskSpaceStatus).toHaveBeenCalledWith(1);
  });

  it('starts downloads held back for low disk space once space frees up, without a new download request', async () => {
    mocks.getLowDiskSpaceStatus.mockResolvedValue(true);
    const { downloadFile } = await import('src-electron/main/downloads');

    await downloadFile(NORMAL, '/tmp/media');
    await waitUntil(() => mocks.getLowDiskSpaceStatus.mock.calls.length > 0);
    await flush();
    expect(downloadCallsFor(NORMAL)).toBe(0);

    // Space frees up; once the disk-space check's 2-minute throttle window
    // passes, the watchdog re-runs the queue on its own.
    mocks.getLowDiskSpaceStatus.mockResolvedValue(false);
    vi.advanceTimersByTime(2 * 60 * 1000);
    await waitUntil(() => downloadCallsFor(NORMAL) === 1);
  });

  it('does not loop when resuming a paused download that is still initializing', async () => {
    // With the bug, processQueue() and resumeAllDownloads() re-entered each
    // other forever in microtasks, which would hang the test worker; failing
    // the stalled-queue log after a few rounds breaks the loop instead (via
    // processQueue's own try/catch) so the assertion below can report it.
    let stalledLogs = 0;
    mocks.log.mockImplementation((message: unknown) => {
      if (String(message).startsWith('Queue is stalled')) {
        stalledLogs++;
        if (stalledLogs > 3) throw new Error('stalled-queue loop');
      }
    });
    state.deferUuids = true;
    const { downloadFile, pauseAllDownloads, resumeAllDownloads } =
      await import('src-electron/main/downloads');

    await downloadFile(NORMAL, '/tmp/media');
    await waitUntil(() => state.pendingUuids.has(NORMAL));

    await pauseAllDownloads('test');
    await resumeAllDownloads('test');
    await flush();

    expect(stalledLogs).toBe(0);

    // Once it has a uuid, it just runs: no leftover deferred pause.
    state.pendingUuids.get(NORMAL)?.();
    await flush();
    expect(mocks.pauseDownload).not.toHaveBeenCalled();
  });
});
