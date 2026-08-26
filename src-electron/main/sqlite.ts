import type { QueryResponseItem } from 'src/types';

import { Worker } from 'node:worker_threads';
import { captureElectronError } from 'src-electron/main/utils';
import { log } from 'src/shared/vanilla';

// These lookups run in the main process (via the `executeQuery` IPC handler in
// ipc.ts), but the actual `node:sqlite` work is dispatched to a worker thread
// so a slow query can't block the main-process event loop and freeze IPC
// replies to every window at once. Two caches in the worker keep the path
// cheap:
//   1. Results are memoized by (path, query, params), so repeated reads while
//      scanning a publication's many media tables don't re-query.
//   2. A read-only connection is reused per database path instead of being
//      opened and closed on every query - opening the SQLite file is the
//      expensive part.
//
// Both caches are invalidated by `closeAllConnections`, which must be called
// before any cache cleanup / publication re-extraction that deletes or
// overwrites a `.db` file: a live read handle can make the delete fail with
// EBUSY/EPERM on Windows, and a result cached against the old file would
// otherwise be served after the file is replaced with new content.

type QueryParams = (null | number | string)[];

interface SqliteWorkerRequest {
  dbPath?: string;
  id: number;
  params?: QueryParams;
  query?: string;
  type: 'closeAll' | 'closeOne' | 'query';
}

interface SqliteWorkerResponse {
  cached?: boolean;
  error?: { message: string; stack?: string };
  id: number;
  result?: unknown[];
}

// Inlined (rather than a separate module) so the worker needs no additional
// bundler entry point: the worker thread is created with `eval: true` and
// only relies on Node builtins. Avoid template literals/`${}` here.
const workerSource = `
'use strict';
const { parentPort } = require('node:worker_threads');
const { DatabaseSync } = require('node:sqlite');

const connections = new Map();
const queryCache = new Map();

const closeAll = () => {
  for (const db of connections.values()) db.close();
  connections.clear();
  queryCache.clear();
};

const closeOne = (dbPath) => {
  const db = connections.get(dbPath);
  if (db) {
    db.close();
    connections.delete(dbPath);
  }

  // Cache keys are dbPath + ':' + query + ':' + JSON.stringify(params),
  // so a prefix match on dbPath + ':' evicts only this path's entries.
  const prefix = dbPath + ':';
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) queryCache.delete(key);
  }
};

const runQuery = (dbPath, query, params) => {
  const cacheKey = dbPath + ':' + query + ':' + JSON.stringify(params);
  const cached = queryCache.get(cacheKey);
  if (cached) return { cached: true, result: cached };

  let db = connections.get(dbPath);
  if (!db) {
    db = new DatabaseSync(dbPath, { readOnly: true });
    connections.set(dbPath, db);
  }

  try {
    const stmt = db.prepare(query);

    // The heavy Content BLOB column (raw media payloads) must not cross
    // IPC. Its presence is fixed by the query's result schema, so check the
    // prepared statement's columns once instead of probing every row -
    // most queries (PRAGMA, sqlite_master, targeted column lists) never
    // select it, and the schema check works even for empty result sets.
    const hasContent = stmt.columns().some((c) => c.name === 'Content');
    const result = stmt.all(...params);

    if (hasContent) {
      for (const item of result) delete item.Content;
    }

    queryCache.set(cacheKey, result);
    return { cached: false, result };
  } catch (error) {
    // Drop the connection so a later query reopens it fresh (e.g. the file was
    // replaced or deleted by a cache cleanup while we held it open).
    connections.delete(dbPath);
    try {
      db.close();
    } catch (_) {}
    throw error;
  }
};

parentPort.on('message', (message) => {
  try {
    if (message.type === 'closeAll') {
      closeAll();
      parentPort.postMessage({ id: message.id });
    } else if (message.type === 'closeOne') {
      closeOne(message.dbPath);
      parentPort.postMessage({ id: message.id });
    } else {
      const { cached, result } = runQuery(
        message.dbPath,
        message.query,
        message.params || [],
      );
      parentPort.postMessage({ cached, id: message.id, result });
    }
  } catch (error) {
    parentPort.postMessage({
      error: {
        message: error && error.message ? error.message : String(error),
        stack: error && error.stack ? error.stack : undefined,
      },
      id: message.id,
    });
  }
});
`;

let worker: undefined | Worker;
let nextRequestId = 1;
const pendingRequests = new Map<
  number,
  {
    reject: (error: Error) => void;
    resolve: (value: SqliteWorkerResponse) => void;
  }
>();

const rejectAllPending = (error: Error) => {
  for (const { reject } of pendingRequests.values()) reject(error);
  pendingRequests.clear();
};

const getWorker = () => {
  if (worker) return worker;

  const newWorker = new Worker(workerSource, { eval: true });
  // The worker must not keep the process alive on its own.
  newWorker.unref();

  newWorker.on('message', (message: SqliteWorkerResponse) => {
    const pending = pendingRequests.get(message.id);
    if (!pending) return;
    pendingRequests.delete(message.id);

    if (message.error) {
      const error = new Error(message.error.message);
      error.stack = message.error.stack;
      pending.reject(error);
    } else {
      pending.resolve(message);
    }
  });

  newWorker.on('error', (error) => {
    rejectAllPending(error instanceof Error ? error : new Error(String(error)));
    worker = undefined;
  });

  newWorker.on('exit', (code) => {
    if (code !== 0) {
      rejectAllPending(new Error(`SQLite worker exited with code ${code}`));
    }
    worker = undefined;
  });

  worker = newWorker;
  return worker;
};

const postToWorker = (
  request: Omit<SqliteWorkerRequest, 'id'>,
): Promise<SqliteWorkerResponse> =>
  new Promise((resolve, reject) => {
    const id = nextRequestId++;
    pendingRequests.set(id, { reject, resolve });
    getWorker().postMessage({ ...request, id });
  });

export const executeQuery = async <T extends object = QueryResponseItem>(
  dbPath: string,
  query: string,
  params: QueryParams = [],
): Promise<T[]> => {
  try {
    const response = await postToWorker({
      dbPath,
      params,
      query,
      type: 'query',
    });

    const db = dbPath.split('/').pop();
    if (response.cached) {
      log('executeQuery (cached)', 'sqlite', 'debug', {
        count: response.result?.length,
        db,
        query,
      });
    } else {
      log('executeQuery', 'sqlite', 'debug', {
        count: response.result?.length,
        db,
        params,
        query,
      });
    }

    return (response.result ?? []) as T[];
  } catch (e) {
    // The worker dropped the connection it used when a query fails, so a
    // later query reopens it fresh.
    captureElectronError(e, {
      contexts: { fn: { name: 'executeQuery', path: dbPath, query } },
    });
    return [];
  }
};

/**
 * Closes every cached read-only connection and drops the result cache.
 *
 * Must be called before any cache cleanup or publication re-extraction that
 * deletes or overwrites a `.db` file: a live read handle can make the delete
 * fail with EBUSY/EPERM on Windows, and a result cached against the old file
 * would otherwise be served after the file is replaced with new content.
 */
export const closeAllConnections = async () => {
  if (!worker) return;
  await postToWorker({ type: 'closeAll' });
};

/**
 * Closes the cached read-only connection (and any cached results) for a single
 * database path.
 *
 * Use this for throwaway per-call databases (e.g. identifyJwpub's temp
 * identification db) so their handles and cache entries don't accumulate for
 * the rest of the session - without tearing down the connections other flows
 * are actively reusing, which is what {@link closeAllConnections} is for.
 */
export const closeConnection = async (dbPath: string) => {
  if (!worker) return;
  await postToWorker({ dbPath, type: 'closeOne' });
};
