import { utilityProcess, type UtilityProcess } from 'electron';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { captureElectronError } from 'src-electron/main/utils';

// image-size's ICNS/JXL/HEIF parsers have known, currently-unpatched DoS
// advisories (GHSA-w3rx-r6r6-pgpr, GHSA-5p2g-fcmc-qvqq): a crafted file with
// a zero-length entry/box field makes the parser loop forever. It sniffs the
// real format from file content, not the extension, so any file a user adds
// as an image (file picker, watched folder, "Additional Media") can reach a
// vulnerable parser regardless of its name. Reading dimensions therefore
// runs in a separate process, with a hard timeout, so a hung parse can only
// ever burn one disposable child process instead of freezing the main
// process's event loop (every window, every IPC reply) until the app is
// force-killed. This is the same isolation strategy as heic.ts's worker,
// including the throwaway-temp-script trick for the same reason (a
// `worker_threads` worker can't resolve an npm package from inside `app.asar`
// — see electron/electron#22446 — so this uses `utilityProcess.fork()`
// instead).

const IMAGE_SIZE_TIMEOUT_MS = 8000;

const imageSizeFromFilePath = createRequire(import.meta.url).resolve(
  'image-size/fromFile',
);

const workerSource = `'use strict';
const { imageSizeFromFile } = require(process.argv[2]);

process.parentPort.on('message', async (message) => {
  try {
    const result = await imageSizeFromFile(message.filePath);
    process.parentPort.postMessage({ id: message.id, result });
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

export interface ImageSizeResult {
  height?: number;
  orientation?: number;
  width?: number;
}

interface ImageSizeWorkerResponse {
  error?: { message: string; stack?: string };
  id: number;
  result?: ImageSizeResult;
}

let workerScriptDir: null | string = null;
let workerScriptPath: null | string = null;

const getWorkerScriptPath = () => {
  if (workerScriptPath) return workerScriptPath;
  workerScriptDir = mkdtempSync(join(tmpdir(), 'mmm-image-size-worker-'));
  workerScriptPath = join(workerScriptDir, 'image-size-worker.cjs');
  writeFileSync(workerScriptPath, workerSource, 'utf8');
  return workerScriptPath;
};

let child: null | UtilityProcess = null;
let nextRequestId = 1;
const pendingRequests = new Map<
  number,
  {
    reject: (error: Error) => void;
    resolve: (value: ImageSizeResult) => void;
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
    [imageSizeFromFilePath],
    {
      serviceName: 'M3 image size reader',
      stdio: 'ignore',
    },
  );

  newChild.on('message', (message: ImageSizeWorkerResponse) => {
    const pending = pendingRequests.get(message.id);
    if (!pending) return;
    pendingRequests.delete(message.id);

    if (message.error) {
      const error = new Error(message.error.message);
      error.stack = message.error.stack;
      pending.reject(error);
    } else {
      pending.resolve(message.result ?? {});
    }
  });

  newChild.on('exit', (code) => {
    if (code !== 0) {
      rejectAllPending(new Error(`Image size worker exited with code ${code}`));
    }
    child = null;
  });

  child = newChild;
  return child;
};

/**
 * A hung parse never posts a response, so a plain request/response promise
 * would wait forever. On timeout, the whole child is killed (not just this
 * request) since a worker stuck in the vulnerable parser's infinite loop
 * can't process any other pending message either; the next call spins up a
 * fresh child.
 */
const postToWorkerWithTimeout = (
  filePath: string,
): Promise<ImageSizeResult> => {
  const id = nextRequestId++;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      const timeoutError = new Error(
        `Timed out reading image dimensions after ${IMAGE_SIZE_TIMEOUT_MS}ms: ${filePath}`,
      );
      const hungChild = child;
      child = null;
      hungChild?.kill();
      rejectAllPending(timeoutError);
    }, IMAGE_SIZE_TIMEOUT_MS);

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

    getChild().postMessage({ filePath, id });
  });
};

/**
 * Reads an image's dimensions/orientation in an isolated, timed-out child
 * process. Throws (never hangs) on a parse failure, a worker crash, or a
 * timeout, mirroring the exception behavior callers already handle for the
 * un-isolated `imageSizeFromFile` call this replaces.
 * @param filePath The image file to read
 */
export const getImageDimensions = async (
  filePath: string,
): Promise<ImageSizeResult> => {
  try {
    return await postToWorkerWithTimeout(filePath);
  } catch (e) {
    captureElectronError(e, {
      contexts: { fn: { filePath, name: 'getImageDimensions' } },
    });
    throw e;
  }
};

/**
 * Tears down the worker child (if any) and removes the throwaway temp
 * directory (if one was created). Idempotent and safe to call when
 * `getImageDimensions` was never invoked this session.
 */
export const cleanupImageSizeWorker = () => {
  child?.kill();
  if (workerScriptDir) {
    rmSync(workerScriptDir, { force: true, recursive: true });
  }
  child = null;
  workerScriptDir = null;
  workerScriptPath = null;
};
