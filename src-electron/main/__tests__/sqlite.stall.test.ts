import type { EventEmitter as EventEmitterType } from 'node:events';

import { afterEach, describe, expect, it, vi } from 'vitest';

// A worker that accepts requests but never answers, so the stall watchdog is
// the only thing that can settle them.
const { StuckWorker } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('node:events') as {
    EventEmitter: typeof EventEmitterType;
  };

  class StuckWorker extends EventEmitter {
    static instances: StuckWorker[] = [];
    postMessage = vi.fn();

    terminate = vi.fn(async () => {
      this.emit('exit', 1);
      return 1;
    });

    unref = vi.fn();

    constructor() {
      super();
      StuckWorker.instances.push(this);
    }
  }

  return { StuckWorker };
});

vi.mock('node:worker_threads', () => ({ Worker: StuckWorker }));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

import { captureElectronError } from 'src-electron/main/utils';

import {
  closeAllConnections,
  executeQuery,
  SQLITE_TIMEOUT_MS,
  SqliteWorkerStallError,
} from '../sqlite';

describe('SQLite worker stall', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves a pending close once the stalled worker is terminated, and reports the stalled query', async () => {
    vi.useFakeTimers();

    const query = executeQuery('/tmp/pub.db', 'SELECT 1');
    // MMM-V2-3K9: callers close connections right before deleting/overwriting
    // .db files - terminating the stalled worker releases every handle, so
    // the close must count as done rather than reject into corrupt-file
    // cleanup.
    const close = closeAllConnections();

    await vi.advanceTimersByTimeAsync(SQLITE_TIMEOUT_MS);

    await expect(close).resolves.toBeUndefined();
    await expect(query).resolves.toEqual([]);
    expect(StuckWorker.instances[0]?.terminate).toHaveBeenCalledTimes(1);
    expect(captureElectronError).toHaveBeenCalledWith(
      expect.any(SqliteWorkerStallError),
      expect.objectContaining({
        contexts: {
          fn: expect.objectContaining({
            name: 'executeQuery',
            outstandingRequests: 2,
          }),
        },
      }),
    );
  });

  // MMM-V2-3KT: on old hardware during startup, a cheap query was still
  // unanswered after 8s - slow, not hung.
  it('still resolves a query the worker answers after 10 seconds', async () => {
    vi.useFakeTimers();
    vi.mocked(captureElectronError).mockClear();

    const query = executeQuery('/tmp/pub.db', 'SELECT 1');
    const slowWorker = StuckWorker.instances.at(-1);
    const request = slowWorker?.postMessage.mock.calls.at(-1)?.[0] as {
      id: number;
    };

    await vi.advanceTimersByTimeAsync(10_000);
    slowWorker?.emit('message', { id: request.id, result: [{ value: 1 }] });

    await expect(query).resolves.toEqual([{ value: 1 }]);
    expect(slowWorker?.terminate).not.toHaveBeenCalled();
    expect(captureElectronError).not.toHaveBeenCalled();
  });
});
