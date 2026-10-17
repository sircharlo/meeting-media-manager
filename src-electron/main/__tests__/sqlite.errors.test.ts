import type { EventEmitter as EventEmitterType } from 'node:events';

import { beforeEach, describe, expect, it, vi } from 'vitest';

interface WorkerReply {
  cached?: boolean;
  error?: { errcode?: number; errstr?: string; message: string };
  result?: unknown[];
}

// A worker that answers every query with a node:sqlite "disk I/O error"
// (errcode 266 = SQLITE_IOERR_READ), the way a file locked by a cloud-sync
// client or another process fails to open - unless a test sets another reply.
const { IoErrorWorker, worker } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('node:events') as {
    EventEmitter: typeof EventEmitterType;
  };

  const ioError: WorkerReply = {
    error: {
      errcode: 266,
      errstr: 'disk I/O error',
      message: 'disk I/O error',
    },
  };
  const worker = { ioError, reply: ioError };

  class IoErrorWorker extends EventEmitter {
    terminate = vi.fn(async () => 1);

    unref = vi.fn();

    postMessage(message: { id: number }) {
      const reply = worker.reply;
      setTimeout(() => {
        this.emit('message', { ...reply, id: message.id });
      }, 0);
    }
  }

  return { IoErrorWorker, worker };
});

vi.mock('node:worker_threads', () => ({ Worker: IoErrorWorker }));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

import { captureElectronError } from 'src-electron/main/utils';
import { log } from 'src/shared/vanilla';

import { executeQuery, isDbCorrupt } from '../sqlite';

const sqliteError = (errcode: number, errstr: string): WorkerReply => ({
  error: { errcode, errstr, message: errstr },
});

// MMM-V2-3JJ: 72 "disk I/O error" events from 4 users, 8 per burst (one per
// query), with no errcode or path classification in the report.
describe('executeQuery I/O errors', () => {
  beforeEach(() => {
    vi.mocked(captureElectronError).mockClear();
    vi.mocked(log).mockClear();
    worker.reply = worker.ioError;
  });

  it('does not report an I/O error on a cloud-synced database', async () => {
    const dbPath = 'C:/Users/x/OneDrive/Pictures/Publications/wcg_T.db';

    await expect(executeQuery(dbPath, 'SELECT 1')).resolves.toEqual([]);

    expect(captureElectronError).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('SQLite I/O error', 'sqlite', 'warn', {
      cloudProvider: 'OneDrive',
      errcode: 266,
      path: dbPath,
    });
  });

  it('reports a local I/O error once per database, with its errcode', async () => {
    const dbPath = 'C:/M3/Publications/nwtsty_T_0/nwtsty_T.db';

    await Promise.all([
      executeQuery(dbPath, 'SELECT 1'),
      executeQuery(dbPath, 'SELECT 2'),
      executeQuery(dbPath, 'SELECT 3'),
    ]);

    expect(captureElectronError).toHaveBeenCalledTimes(1);
    expect(captureElectronError).toHaveBeenCalledWith(
      expect.objectContaining({ errcode: 266, message: 'disk I/O error' }),
      expect.objectContaining({
        contexts: {
          fn: expect.objectContaining({
            errcode: 266,
            errstr: 'disk I/O error',
            path: dbPath,
          }),
        },
      }),
    );
  });

  it('logs the repeats of a local I/O error it already reported', async () => {
    const dbPath = 'C:/M3/Publications/repeat_T_0/repeat_T.db';

    await executeQuery(dbPath, 'SELECT 1');
    expect(log).not.toHaveBeenCalledWith(
      'SQLite I/O error',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );

    await executeQuery(dbPath, 'SELECT 2');
    expect(captureElectronError).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith('SQLite I/O error', 'sqlite', 'warn', {
      cloudProvider: undefined,
      errcode: 266,
      path: dbPath,
    });
  });

  it('treats extended I/O result codes as I/O errors', async () => {
    // 522 = SQLITE_IOERR_SHORT_READ
    worker.reply = sqliteError(522, 'disk I/O error');
    const dbPath = 'C:/M3/Publications/short_T_0/short_T.db';

    await executeQuery(dbPath, 'SELECT 1');
    await executeQuery(dbPath, 'SELECT 2');

    expect(captureElectronError).toHaveBeenCalledTimes(1);
  });
});

describe('executeQuery other errors', () => {
  beforeEach(() => {
    vi.mocked(captureElectronError).mockClear();
    vi.mocked(log).mockClear();
  });

  it('reports every other failure, with what it knows about it', async () => {
    worker.reply = sqliteError(1, 'SQL logic error');
    const dbPath = 'C:/M3/Publications/logic_T_0/logic_T.db';

    await expect(executeQuery(dbPath, 'SELECT x', [1])).resolves.toEqual([]);
    await expect(executeQuery(dbPath, 'SELECT y')).resolves.toEqual([]);

    expect(captureElectronError).toHaveBeenCalledTimes(2);
    expect(captureElectronError).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ errcode: 1, message: 'SQL logic error' }),
      {
        contexts: {
          fn: {
            cloudProvider: undefined,
            errcode: 1,
            errstr: 'SQL logic error',
            name: 'executeQuery',
            outstandingRequests: undefined,
            path: dbPath,
            query: 'SELECT x',
          },
        },
      },
    );
    await expect(isDbCorrupt(dbPath)).resolves.toBe(false);
  });

  it('reports a failure without an errcode every time', async () => {
    worker.reply = { error: { message: 'something broke' } };
    const dbPath = 'C:/Users/x/OneDrive/Publications/plain_T.db';

    await executeQuery(dbPath, 'SELECT 1');
    await executeQuery(dbPath, 'SELECT 1');

    expect(captureElectronError).toHaveBeenCalledTimes(2);
    expect(captureElectronError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'something broke' }),
      expect.objectContaining({
        contexts: {
          fn: expect.objectContaining({
            cloudProvider: 'OneDrive',
            errcode: undefined,
          }),
        },
      }),
    );
  });

  it('marks a corrupt database, and only logs the repeats once it is reported', async () => {
    // 267 = SQLITE_CORRUPT_VTAB, an extended SQLITE_CORRUPT
    worker.reply = sqliteError(267, 'database disk image is malformed');
    const dbPath = 'C:/Users/x/OneDrive/Publications/corrupt_T.db';

    await executeQuery(dbPath, 'SELECT 1');
    expect(log).not.toHaveBeenCalledWith(
      'SQLite database is corrupt',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
    await executeQuery(dbPath, 'SELECT 2');

    expect(captureElectronError).toHaveBeenCalledTimes(1);
    expect(captureElectronError).toHaveBeenCalledWith(
      expect.objectContaining({ errcode: 267 }),
      expect.objectContaining({
        contexts: {
          fn: expect.objectContaining({ cloudProvider: 'OneDrive' }),
        },
      }),
    );
    expect(log).toHaveBeenCalledWith(
      'SQLite database is corrupt',
      'sqlite',
      'warn',
      { errcode: 267, path: dbPath },
    );
    await expect(isDbCorrupt(dbPath)).resolves.toBe(true);
  });
});

describe('executeQuery results', () => {
  beforeEach(() => {
    vi.mocked(log).mockClear();
  });

  it('logs a fresh result with its params, and a cached one without', async () => {
    const dbPath = 'C:/M3/Publications/ok_T_0/ok_T.db';

    worker.reply = { cached: false, result: [{ id: 1 }, { id: 2 }] };
    await expect(executeQuery(dbPath, 'SELECT id', [7])).resolves.toEqual([
      { id: 1 },
      { id: 2 },
    ]);
    expect(log).toHaveBeenLastCalledWith('executeQuery', 'sqlite', 'debug', {
      count: 2,
      db: 'ok_T.db',
      params: [7],
      query: 'SELECT id',
    });

    worker.reply = { cached: true, result: [{ id: 1 }] };
    await expect(executeQuery(dbPath, 'SELECT id', [7])).resolves.toEqual([
      { id: 1 },
    ]);
    expect(log).toHaveBeenLastCalledWith(
      'executeQuery (cached)',
      'sqlite',
      'debug',
      { count: 1, db: 'ok_T.db', query: 'SELECT id' },
    );
  });

  it('answers an empty list when the worker sends no result', async () => {
    worker.reply = {};

    await expect(executeQuery('C:/M3/none.db', 'SELECT 1')).resolves.toEqual(
      [],
    );
    expect(log).toHaveBeenLastCalledWith('executeQuery', 'sqlite', 'debug', {
      count: undefined,
      db: 'none.db',
      params: [],
      query: 'SELECT 1',
    });
  });
});
