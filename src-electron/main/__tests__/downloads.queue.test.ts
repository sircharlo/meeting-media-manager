import type {
  ResumeInfo,
  TransferFailure,
  TransferOptions,
  TransferResult,
} from 'src-electron/main/download-transfer';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The download queue (downloads.ts) on top of a fake transfer layer: each
// runTransfer() call is recorded and settled by the test, except that -
// like the real thing - aborting its signal ends it as paused or cancelled.

interface FakeTransfer {
  /** Don't settle on abort yet, as if the transfer were still winding down. */
  holdAbort?: boolean;
  options: TransferOptions;
  resolve: (result: TransferResult) => void;
  settled: boolean;
}

const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  captureElectronError: vi.fn(),
  delay: vi.fn(),
  discardPartialDownload: vi.fn(),
  getLowDiskSpaceStatus: vi.fn<(minFreeGB?: number) => Promise<boolean>>(),
  mkdir: vi.fn(),
  pausedResume: { totalBytes: 100, validator: '"paused"' } as ResumeInfo,
  quitStatus: { isAppQuitting: false },
  sendToWindow: vi.fn(),
  stat: vi.fn(),
  transfers: [] as FakeTransfer[],
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

vi.mock('src-electron/main/download-transfer', () => ({
  discardPartialDownload: mocks.discardPartialDownload,
  runTransfer: (options: TransferOptions) =>
    new Promise<TransferResult>((resolve) => {
      const transfer: FakeTransfer = {
        options,
        resolve: (result) => {
          transfer.settled = true;
          resolve(result);
        },
        settled: false,
      };
      mocks.transfers.push(transfer);
      options.signal.addEventListener('abort', () => {
        if (transfer.holdAbort) return;
        transfer.resolve(
          options.signal.reason === 'cancel'
            ? { kind: 'cancelled' }
            : { kind: 'paused', resume: mocks.pausedResume },
        );
      });
    }),
}));

vi.mock('node:fs/promises', () => ({
  mkdir: mocks.mkdir,
  stat: mocks.stat,
}));

vi.mock('node:timers/promises', () => ({
  setTimeout: mocks.delay,
}));

vi.mock('electron', () => ({
  app: {
    getLocaleCountryCode: vi.fn(() => 'US'),
    getPath: vi.fn(() => '/tmp'),
  },
}));

vi.mock('src-electron/main/session', () => ({
  quitStatus: mocks.quitStatus,
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

vi.mock('src-electron/main/disk-space', () => ({
  getLowDiskSpaceStatus: mocks.getLowDiskSpaceStatus,
}));

vi.mock('countries-and-timezones', () => ({
  getCountriesForTimezone: vi.fn(() => []),
}));

vi.mock('is-online', () => ({
  default: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
  throttleWithTrailing: (fn: (...args: unknown[]) => unknown) => fn,
}));

// setImmediate, so this keeps working while setTimeout is faked.
const nextTick = () =>
  new Promise<void>((resolve) => {
    setImmediate(resolve);
  });

const waitUntil = async (condition: () => boolean, maxAttempts = 100) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (condition()) return;
    await nextTick();
  }
  throw new Error('waitUntil: condition was never met');
};

/** For asserting something does NOT happen: give it every chance to. */
const flush = async () => {
  for (let i = 0; i < 10; i++) await nextTick();
};

const DIR = '/tmp/media';
const url = (name: string) => `https://example.test/${name}`;
const keyFor = (name: string) => url(name) + DIR;
const destPathFor = (name: string) => `${DIR}/${name}`;

const transfersFor = (name: string) =>
  mocks.transfers.filter((transfer) => transfer.options.url === url(name));
const latestTransfer = (name: string) => {
  const transfer = transfersFor(name).at(-1);
  if (!transfer) throw new Error(`no transfer started for ${name}`);
  return transfer;
};
const partialPathFor = (name: string) =>
  latestTransfer(name).options.partialPath;
const runningTransfers = () =>
  mocks.transfers.filter((transfer) => !transfer.settled);

const complete = (name: string) => {
  const transfer = latestTransfer(name);
  transfer.resolve({ filePath: transfer.options.destPath, kind: 'completed' });
};

const fail = (name: string, overrides: Partial<TransferFailure> = {}) => {
  latestTransfer(name).resolve({
    error: new Error('net::ERR_CONNECTION_RESET'),
    kind: 'failed',
    reachedBytes: 0,
    reason: 'network',
    resume: null,
    retryable: true,
    ...overrides,
  });
};

const sentTo = (channel: string) =>
  mocks.sendToWindow.mock.calls
    .filter(([, sentChannel]) => sentChannel === channel)
    .map(([, , payload]) => payload);

const loadDownloads = () => import('src-electron/main/downloads');

const startDownloads = async (names: string[], lowPriority = false) => {
  const { downloadFile } = await loadDownloads();
  for (const name of names) {
    await downloadFile(url(name), DIR, undefined, lowPriority);
  }
};

describe('download queue', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.transfers.length = 0;
    mocks.delay.mockReset().mockResolvedValue(undefined);
    mocks.discardPartialDownload.mockResolvedValue(undefined);
    mocks.getLowDiskSpaceStatus.mockResolvedValue(false);
    mocks.mkdir.mockReset().mockResolvedValue(undefined);
    mocks.quitStatus.isAppQuitting = false;
    mocks.sendToWindow.mockReset();
    mocks.stat.mockResolvedValue({ isDirectory: () => true });
    windowState.mainWindow = {
      id: 1,
      isDestroyed: () => false,
      webContents: { isDestroyed: () => false },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs at most three downloads at once, starting queued ones as slots free up', async () => {
    await startDownloads(['a', 'b', 'c', 'd']);
    await waitUntil(() => runningTransfers().length === 3);
    await flush();
    expect(transfersFor('d')).toHaveLength(0);

    complete('a');
    await waitUntil(() => transfersFor('d').length === 1);

    expect(sentTo('downloadCompleted')).toEqual([
      { filePath: destPathFor('a'), id: keyFor('a') },
    ]);
  });

  it('forwards transfer start and progress to the renderer', async () => {
    await startDownloads(['a']);
    await waitUntil(() => transfersFor('a').length === 1);

    const { options } = latestTransfer('a');
    options.onStarted(200);
    options.onProgress(50, 200);

    expect(sentTo('downloadStarted')).toEqual([
      { filename: 'a', id: keyFor('a'), totalBytes: 200 },
    ]);
    expect(sentTo('downloadProgress')).toEqual([
      { bytesReceived: 50, id: keyFor('a'), percentCompleted: 25 },
    ]);
  });

  // BE-4 (full-audit-2026-09-04.md)
  it('does not queue the same URL/directory twice while it waits for a slot', async () => {
    await startDownloads(['a', 'b', 'c']);
    await waitUntil(() => runningTransfers().length === 3);

    const { downloadFile } = await loadDownloads();
    await Promise.all([
      downloadFile(url('d'), DIR),
      downloadFile(url('d'), DIR),
    ]);
    complete('a');
    complete('b');
    await waitUntil(() => transfersFor('d').length === 1);
    await flush();

    expect(transfersFor('d')).toHaveLength(1);
  });

  // SEC-7 (full-audit-2026-09-04.md)
  it('only ever writes inside the download directory, whatever the requested filename', async () => {
    const { downloadFile } = await loadDownloads();
    await downloadFile(url('one'), DIR, '../../etc/passwd');
    await downloadFile(
      url('two'),
      DIR,
      String.raw`C:\Windows\System32\evil.dll`,
    );
    await downloadFile(url('three'), DIR, 'song.mp3');
    await waitUntil(() => mocks.transfers.length === 3);

    expect(mocks.transfers.map((t) => t.options.destPath)).toEqual([
      destPathFor('passwd'),
      destPathFor('evil.dll'),
      destPathFor('song.mp3'),
    ]);
  });

  it('pauses low-priority downloads for a normal-priority one, then resumes them where they stopped', async () => {
    await startDownloads(['low'], true);
    await waitUntil(() => transfersFor('low').length === 1);

    await startDownloads(['normal']);
    await waitUntil(() => transfersFor('normal').length === 1);
    expect(latestTransfer('low').options.signal.reason).toBe('pause');
    await flush();
    expect(transfersFor('low')).toHaveLength(1);

    complete('normal');
    await waitUntil(() => transfersFor('low').length === 2);
    expect(latestTransfer('low').options.resume).toEqual(mocks.pausedResume);
  });

  it('resumes a paused low-priority download straight away once it is requested at normal priority', async () => {
    await startDownloads(['low'], true);
    await waitUntil(() => transfersFor('low').length === 1);
    await startDownloads(['normal']);
    await waitUntil(() => latestTransfer('low').settled);

    await startDownloads(['low']);

    await waitUntil(() => transfersFor('low').length === 2);
    expect(latestTransfer('normal').settled).toBe(false);
  });

  it('does not resume a paused download until its transfer has finished stopping', async () => {
    await startDownloads(['low'], true);
    await waitUntil(() => transfersFor('low').length === 1);
    latestTransfer('low').holdAbort = true;
    await startDownloads(['normal']);
    await waitUntil(() => transfersFor('normal').length === 1);

    complete('normal');
    await flush();
    // Still winding down, maybe still writing its `.part` file.
    expect(transfersFor('low')).toHaveLength(1);

    latestTransfer('low').resolve({ kind: 'paused', resume: null });
    await waitUntil(() => transfersFor('low').length === 2);
  });

  // BE-9 (full-audit-2026-09-04.md)
  it('retries a failed download from where it stopped, then reports it failed and frees its slot', async () => {
    await startDownloads(['a', 'b', 'c', 'd']);
    await waitUntil(() => runningTransfers().length === 3);
    const resume = { totalBytes: 100, validator: '"a"' };

    fail('a', { resume });
    await waitUntil(() => transfersFor('a').length === 2);
    expect(latestTransfer('a').options.resume).toEqual(resume);
    // The slot stays taken while retrying.
    expect(transfersFor('d')).toHaveLength(0);

    fail('a');
    await waitUntil(() => transfersFor('a').length === 3);
    fail('a');
    await waitUntil(() => transfersFor('d').length === 1);

    expect(transfersFor('a')).toHaveLength(3);
    expect(sentTo('downloadError')).toEqual([{ id: keyFor('a') }]);
    expect(mocks.discardPartialDownload).toHaveBeenCalledWith(
      partialPathFor('a'),
    );
    // A dropped connection is not a bug.
    expect(mocks.captureElectronError).not.toHaveBeenCalled();
  });

  it('never gives up on a download that gets further on every attempt', async () => {
    await startDownloads(['a']);
    for (let attempt = 1; attempt <= 5; attempt++) {
      await waitUntil(() => transfersFor('a').length === attempt);
      fail('a', { reachedBytes: attempt * 100 });
    }

    await waitUntil(() => transfersFor('a').length === 6);
    expect(sentTo('downloadError')).toEqual([]);
  });

  it('still gives up on a download whose attempts never get further, e.g. one that keeps starting over', async () => {
    await startDownloads(['a']);
    for (let attempt = 1; attempt <= 3; attempt++) {
      await waitUntil(() => transfersFor('a').length === attempt);
      // Receives bytes every time, but never more than the first attempt.
      fail('a', { reachedBytes: 100 });
    }

    await waitUntil(() => sentTo('downloadError').length === 1);
    expect(transfersFor('a')).toHaveLength(3);
  });

  it('gives every download its own unfinished file, even when two are saved under the same name', async () => {
    const { downloadFile } = await loadDownloads();
    await downloadFile(url('one/thumb.jpg'), DIR, 'video.jpg');
    await downloadFile(url('two/thumb.jpg'), DIR, 'video.jpg');
    await waitUntil(() => mocks.transfers.length === 2);

    const [first, second] = mocks.transfers.map((t) => t.options);
    expect(first?.destPath).toBe(second?.destPath);
    expect(first?.partialPath).not.toBe(second?.partialPath);
  });

  it('keeps downloading after a quit is started but then not confirmed (macOS)', async () => {
    // Set by `before-quit`, which then waits for the user to confirm - and
    // stays set if they don't.
    mocks.quitStatus.isAppQuitting = true;

    await startDownloads(['a', 'b']);
    await waitUntil(() => transfersFor('a').length === 1);
    fail('a');

    await waitUntil(() => transfersFor('a').length === 2);
    expect(transfersFor('b')).toHaveLength(1);
  });

  it('reports a failure that is most likely a bug to Sentry once retries run out', async () => {
    await startDownloads(['a']);
    const bug = new TypeError(
      "Cannot read properties of undefined (reading 'x')",
    );
    for (let attempt = 1; attempt <= 3; attempt++) {
      await waitUntil(() => transfersFor('a').length === attempt);
      fail('a', { error: bug, reason: 'unexpected' });
    }

    await waitUntil(() => sentTo('downloadError').length === 1);
    expect(mocks.captureElectronError).toHaveBeenCalledWith(
      bug,
      expect.objectContaining({
        fingerprint: ['download-unexpected-error', 'TypeError'],
      }),
    );
  });

  it('gives up straight away when retrying cannot help, e.g. a missing file', async () => {
    await startDownloads(['a']);
    await waitUntil(() => transfersFor('a').length === 1);

    fail('a', { reason: 'http', retryable: false, status: 404 });

    await waitUntil(() => sentTo('downloadError').length === 1);
    expect(transfersFor('a')).toHaveLength(1);
    expect(mocks.captureElectronError).not.toHaveBeenCalled();
  });

  it('reports unexpected filesystem failures to Sentry, grouped by code and syscall, but not a full disk', async () => {
    await startDownloads(['a', 'b']);
    await waitUntil(() => mocks.transfers.length === 2);

    const accessDenied = Object.assign(new Error('EACCES: denied, open'), {
      code: 'EACCES',
      syscall: 'open',
    });
    fail('a', { error: accessDenied, reason: 'filesystem', retryable: false });
    const diskFull = Object.assign(new Error('ENOSPC: no space, write'), {
      code: 'ENOSPC',
      syscall: 'write',
    });
    fail('b', { error: diskFull, reason: 'filesystem', retryable: false });
    await waitUntil(() => sentTo('downloadError').length === 2);

    expect(mocks.captureElectronError).toHaveBeenCalledTimes(1);
    expect(mocks.captureElectronError).toHaveBeenCalledWith(
      accessDenied,
      expect.objectContaining({
        fingerprint: ['download-filesystem-error', 'EACCES', 'open'],
      }),
    );
  });

  // BE-13 (full-audit-2026-09-05.md)
  it('retries in a re-resolved directory if the original one disappeared, starting that file over', async () => {
    let originalDirIsGone = false;
    mocks.mkdir.mockImplementation(async (dir: string) => {
      if (dir === DIR && originalDirIsGone) {
        throw Object.assign(new Error('ENOENT: no such directory'), {
          code: 'ENOENT',
        });
      }
    });
    await startDownloads(['a']);
    await waitUntil(() => transfersFor('a').length === 1);

    originalDirIsGone = true;
    fail('a', { resume: { totalBytes: 100, validator: '"a"' } });
    await waitUntil(() => transfersFor('a').length === 2);

    const { options } = latestTransfer('a');
    expect(options.destPath).not.toBe(destPathFor('a'));
    expect(options.destPath).toContain('Downloads');
    expect(options.resume).toBeNull();
  });

  // BE-2 (full-audit-2026-09-04.md)
  it('cancel all stops running transfers, discards paused ones, and starts nothing else', async () => {
    await startDownloads(['low'], true);
    await waitUntil(() => transfersFor('low').length === 1);
    await startDownloads(['n1', 'n2', 'n3', 'n4']);
    await waitUntil(() => runningTransfers().length === 3);

    const { cancelAllDownloads } = await loadDownloads();
    await cancelAllDownloads();
    await waitUntil(() => sentTo('downloadCancelled').length === 4);
    await flush();

    expect(sentTo('downloadCancelled')).toEqual(
      expect.arrayContaining(
        ['low', 'n1', 'n2', 'n3'].map((name) => ({ id: keyFor(name) })),
      ),
    );
    expect(mocks.discardPartialDownload).toHaveBeenCalledWith(
      partialPathFor('low'),
    );
    expect(runningTransfers()).toHaveLength(0);
    expect(transfersFor('n4')).toHaveLength(0);
  });

  it('does not retry a download cancelled while it waited to retry', async () => {
    let finishWaiting: () => void = () => undefined;
    mocks.delay.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishWaiting = resolve;
        }),
    );
    await startDownloads(['a']);
    await waitUntil(() => transfersFor('a').length === 1);
    fail('a');
    await waitUntil(() => mocks.delay.mock.calls.length > 0);

    const { cancelAllDownloads } = await loadDownloads();
    await cancelAllDownloads();
    finishWaiting();
    await flush();

    expect(transfersFor('a')).toHaveLength(1);
    expect(sentTo('downloadCancelled')).toEqual([{ id: keyFor('a') }]);
    expect(mocks.discardPartialDownload).toHaveBeenCalledWith(
      partialPathFor('a'),
    );
  });

  it('cleans up a download cancelled while its transfer was still stopping for a pause', async () => {
    await startDownloads(['low'], true);
    await waitUntil(() => transfersFor('low').length === 1);
    latestTransfer('low').holdAbort = true;
    await startDownloads(['normal']);
    await waitUntil(() => transfersFor('normal').length === 1);

    const { cancelAllDownloads } = await loadDownloads();
    await cancelAllDownloads();
    latestTransfer('low').resolve({ kind: 'paused', resume: null });

    await waitUntil(() =>
      sentTo('downloadCancelled').some(
        (payload) => (payload as { id: string }).id === keyFor('low'),
      ),
    );
    expect(mocks.discardPartialDownload).toHaveBeenCalledWith(
      partialPathFor('low'),
    );
  });

  // BE-8 (full-audit-2026-09-04.md), BE-12 (full-audit-2026-09-05.md)
  it('holds downloads back only once disk space is critically low, and resumes them on its own once it frees up', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    await startDownloads(['a']);
    await waitUntil(() => transfersFor('a').length === 1);
    expect(mocks.getLowDiskSpaceStatus).toHaveBeenCalledWith(1);

    // Space runs out: once the check's throttle window has passed, the next
    // run pauses what's running instead of starting more.
    mocks.getLowDiskSpaceStatus.mockResolvedValue(true);
    vi.advanceTimersByTime(2 * 60 * 1000);
    await startDownloads(['b']);
    await waitUntil(() => latestTransfer('a').settled);
    expect(latestTransfer('a').options.signal.reason).toBe('pause');
    await flush();
    expect(transfersFor('b')).toHaveLength(0);

    // Space frees up: both go ahead, with no new download request needed.
    mocks.getLowDiskSpaceStatus.mockResolvedValue(false);
    vi.advanceTimersByTime(2 * 60 * 1000);
    await waitUntil(
      () => transfersFor('a').length === 2 && transfersFor('b').length === 1,
    );
  });

  it('holds the queue between pauseAllDownloads() and resumeAllDownloads()', async () => {
    await startDownloads(['a', 'b']);
    await waitUntil(() => runningTransfers().length === 2);

    const { pauseAllDownloads, resumeAllDownloads } = await loadDownloads();
    await pauseAllDownloads('test');
    await waitUntil(() => runningTransfers().length === 0);
    await startDownloads(['c']);
    await flush();
    expect(mocks.transfers).toHaveLength(2);

    await resumeAllDownloads('test');
    await waitUntil(() => runningTransfers().length === 3);
    expect(transfersFor('a')).toHaveLength(2);
    expect(transfersFor('c')).toHaveLength(1);
  });

  it('reports whether a download has finished', async () => {
    await startDownloads(['a', 'b', 'c', 'd']);
    await waitUntil(() => runningTransfers().length === 3);
    const { isDownloadComplete } = await loadDownloads();

    expect(await isDownloadComplete(keyFor('a'))).toBe(false);
    expect(await isDownloadComplete(keyFor('d'))).toBe(false);

    complete('a');
    await waitUntil(() => transfersFor('d').length === 1);
    expect(await isDownloadComplete(keyFor('a'))).toBe(true);
  });

  // BE-1 (full-audit-2026-09-04.md)
  it('reports a failure while handling a finished transfer, and still frees its slot', async () => {
    mocks.sendToWindow.mockImplementation((_window, channel: string) => {
      if (channel === 'downloadCompleted') throw new Error('boom');
    });
    await startDownloads(['a', 'b', 'c', 'd']);
    await waitUntil(() => runningTransfers().length === 3);

    complete('a');

    await waitUntil(() => transfersFor('d').length === 1);
    expect(mocks.captureElectronError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: {
          fn: expect.objectContaining({ name: 'downloads.ts startTransfer' }),
        },
      }),
    );
  });
});
