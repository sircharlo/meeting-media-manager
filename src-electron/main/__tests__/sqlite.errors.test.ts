import type { EventEmitter as EventEmitterType } from 'node:events';

import { beforeEach, describe, expect, it, vi } from 'vitest';

// A worker that answers every query with a node:sqlite "disk I/O error"
// (errcode 266 = SQLITE_IOERR_READ), the way a file locked by a cloud-sync
// client or another process fails to open.
const { IoErrorWorker } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('node:events') as {
    EventEmitter: typeof EventEmitterType;
  };

  class IoErrorWorker extends EventEmitter {
    terminate = vi.fn(async () => 1);

    unref = vi.fn();

    postMessage(message: { id: number }) {
      setTimeout(() => {
        this.emit('message', {
          error: {
            errcode: 266,
            errstr: 'disk I/O error',
            message: 'disk I/O error',
          },
          id: message.id,
        });
      }, 0);
    }
  }

  return { IoErrorWorker };
});

vi.mock('node:worker_threads', () => ({ Worker: IoErrorWorker }));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

import { captureElectronError } from 'src-electron/main/utils';

import { executeQuery } from '../sqlite';

// MMM-V2-3JJ: 72 "disk I/O error" events from 4 users, 8 per burst (one per
// query), with no errcode or path classification in the report.
describe('executeQuery I/O errors', () => {
  beforeEach(() => {
    vi.mocked(captureElectronError).mockClear();
  });

  it('does not report an I/O error on a cloud-synced database', async () => {
    await expect(
      executeQuery(
        'C:/Users/x/OneDrive/Pictures/Publications/wcg_T.db',
        'SELECT 1',
      ),
    ).resolves.toEqual([]);

    expect(captureElectronError).not.toHaveBeenCalled();
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
});
