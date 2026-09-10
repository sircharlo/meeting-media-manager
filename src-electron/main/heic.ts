import type { ConversionOptions } from 'src/types';

import { utilityProcess, type UtilityProcess } from 'electron';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { captureElectronError } from 'src-electron/main/utils';

// HEIC decoding is CPU-bound (parsing HEIF/HEVC image data), so it runs in a
// separate process rather than on the main-process event loop, where a slow
// decode would freeze IPC replies to every window at once. This is the same
// class of fix as sqlite.ts's worker.
//
// Unlike sqlite.ts (which only needs Node builtins and can therefore run in a
// `worker_threads` `eval: true` worker), `heic-convert` is an npm package. A
// `worker_threads` worker cannot `require()` modules from inside `app.asar`
// (see electron/electron#22446), and it has no reliable node_modules
// resolution of its own. `utilityProcess.fork()` launches a full Electron Node
// child process instead, which keeps asar + node_modules resolution working in
// both `yarn dev` and the packaged app.
//
// The child script is written to a throwaway temp file because
// `utilityProcess.fork()` needs a real module path (no `eval`), and the bundled
// main process has no second entry point we can point it at. The script is
// tiny and self-contained: it just loads `heic-convert` from the absolute path
// we resolve here and answers decode requests.

// HEIC/HEIF is exactly the kind of complex binary-format decode that
// image-size.ts was isolated for (see that file's own comment) - a
// crafted/corrupted .heic file can hang heic-convert's decode forever, and
// since getChild() below reuses the same child process across calls, one hung
// file would wedge every subsequent HEIC conversion for the rest of the
// session behind it. Timeout-and-kill the same way image-size.ts does.
const HEIC_TIMEOUT_MS = 8000;

const heicConvertPath = createRequire(import.meta.url).resolve('heic-convert');

const workerSource = `'use strict';
const convert = require(process.argv[2]);

process.parentPort.on('message', async (message) => {
  try {
    const output = await convert(message.image);
    process.parentPort.postMessage({ buffer: output.buffer, id: message.id });
  } catch (error) {
    process.parentPort.postMessage({
      error: {
        message: error && error.message ? error.message : String(error),
        stack: error && error.stack ? error.stack : undefined,
      },
      id: message.id,
    });
  }
});
`;

interface HeicWorkerRequest {
  id: number;
  image: ConversionOptions;
}

interface HeicWorkerResponse {
  buffer?: ArrayBuffer;
  error?: { message: string; stack?: string };
  id: number;
}

let workerScriptDir: null | string = null;
let workerScriptPath: null | string = null;

const getWorkerScriptPath = () => {
  if (workerScriptPath) return workerScriptPath;
  workerScriptDir = mkdtempSync(join(tmpdir(), 'mmm-heic-worker-'));
  workerScriptPath = join(workerScriptDir, 'heic-worker.cjs');
  writeFileSync(workerScriptPath, workerSource, 'utf8');
  return workerScriptPath;
};

let child: null | UtilityProcess = null;
let nextRequestId = 1;
const pendingRequests = new Map<
  number,
  {
    reject: (error: Error) => void;
    resolve: (value: HeicWorkerResponse) => void;
  }
>();

const rejectAllPending = (error: Error) => {
  for (const { reject } of pendingRequests.values()) reject(error);
  pendingRequests.clear();
};

const getChild = () => {
  if (child) return child;

  const newChild = utilityProcess.fork(
    getWorkerScriptPath(),
    [heicConvertPath],
    {
      serviceName: 'M3 HEIC decoder',
      stdio: 'ignore',
    },
  );

  newChild.on('message', (message: HeicWorkerResponse) => {
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

  newChild.on('exit', (code) => {
    if (code !== 0) {
      rejectAllPending(new Error(`HEIC worker exited with code ${code}`));
    }
    child = null;
  });

  child = newChild;
  return child;
};

/**
 * A hung decode never posts a response, so a plain request/response promise
 * would wait forever. On timeout, the whole child is killed (not just this
 * request) since a worker stuck decoding a malformed file can't process any
 * other pending message either; the next call spins up a fresh child.
 */
const postToWorkerWithTimeout = (
  request: Omit<HeicWorkerRequest, 'id'>,
): Promise<HeicWorkerResponse> => {
  const id = nextRequestId++;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      const timeoutError = new Error(
        `Timed out decoding HEIC image after ${HEIC_TIMEOUT_MS}ms`,
      );
      const hungChild = child;
      child = null;
      hungChild?.kill();
      rejectAllPending(timeoutError);
    }, HEIC_TIMEOUT_MS);

    pendingRequests.set(id, {
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      },
      resolve: (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
    });

    getChild().postMessage({ ...request, id });
  });
};

export const convertHeic = async (
  image: ConversionOptions,
): Promise<ArrayBuffer> => {
  try {
    const response = await postToWorkerWithTimeout({ image });
    return response.buffer ?? new ArrayBuffer(0);
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { format: image.format, name: 'convertHeic' } },
    });
    return new ArrayBuffer(0);
  }
};

/**
 * Tears down the worker child (if any) and removes the throwaway temp
 * directory (if one was created). Idempotent and safe to call when
 * `convertHeic` was never invoked this session.
 */
export const cleanupHeicWorker = () => {
  child?.kill();
  if (workerScriptDir) {
    rmSync(workerScriptDir, { force: true, recursive: true });
  }
  child = null;
  workerScriptDir = null;
  workerScriptPath = null;
};
