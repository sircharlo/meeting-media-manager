import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

import { net } from 'electron';
import { createWriteStream, type WriteStream } from 'node:fs';
import { rename, rm, stat } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { setTimeout as delay } from 'node:timers/promises';
import {
  getFilesystemErrorCode,
  getFilesystemErrorSyscall,
} from 'src/shared/filesystem-errors';
import { isFetchNetworkError } from 'src/shared/network-errors';

/**
 * Transfers one file over HTTP(S) with Electron's `net.fetch` - Chromium's
 * network stack on the default session, so proxies, system certificates,
 * the app's user agent and its trusted-domain request headers (session.ts)
 * all apply, same as they did for Chromium-managed downloads.
 *
 * The file is written to a `.part` file next to its destination and only
 * renamed into place once complete, so a half-downloaded file never appears
 * under its real name. An unfinished `.part` file can be resumed with an
 * HTTP range request, both after a pause and after a dropped connection.
 */

// Zero bytes received for this long is a stuck transfer, not a slow one -
// the same judgment as the renderer's own DOWNLOAD_STALL_TIMEOUT_MS
// (src/helpers/jw-media.ts), since many users have slow connections.
export const TRANSFER_STALL_TIMEOUT_MS = 45000;

// Renaming the finished `.part` file over an existing file fails on Windows
// while that file is open elsewhere (e.g. being played, or scanned by an
// antivirus); that is usually brief.
const FINALIZE_RETRYABLE_CODES = new Set(['EACCES', 'EBUSY', 'EPERM']);
const FINALIZE_RETRY_COUNT = 5;
const FINALIZE_RETRY_DELAY_MS = 200;

// Retrying can't help when the disk is full or read-only.
const NON_RETRYABLE_FILESYSTEM_CODES = new Set(['EDQUOT', 'ENOSPC', 'EROFS']);

// A failed write destroys the whole pipeline with its error, and so does a
// failed download - so where an error surfaced says nothing about where it
// came from. Node's filesystem errors always name the syscall that failed;
// Chromium's network errors never do.
const FILESYSTEM_SYSCALLS = new Set([
  'close',
  'fstat',
  'fsync',
  'ftruncate',
  'open',
  'rename',
  'write',
]);

/**
 * What it takes to resume an unfinished `.part` file. Only valid for the
 * session that wrote it: a `.part` file left behind by an earlier session is
 * always downloaded again from scratch.
 */
export interface ResumeInfo {
  /** Size of the whole file, or 0 if the server didn't say. */
  totalBytes: number;
  /**
   * The ETag or Last-Modified date of the response the `.part` file came
   * from, sent as If-Range so a file that changed on the server since is
   * downloaded again in full instead of being spliced together.
   */
  validator: string;
}

export interface TransferFailure {
  error: Error;
  kind: 'failed';
  /**
   * How far into the file this attempt got, in bytes - so a caller can tell
   * whether it got further than earlier attempts did.
   */
  reachedBytes: number;
  reason: TransferFailureReason;
  /** How to resume the `.part` file left behind, if it can be. */
  resume: null | ResumeInfo;
  retryable: boolean;
  /** The HTTP status, for `reason: 'http'`. */
  status?: number;
}

/**
 * `unexpected` is anything that is neither a network, HTTP nor filesystem
 * problem - most likely a bug.
 */
export type TransferFailureReason =
  'filesystem' | 'http' | 'network' | 'stalled' | 'unexpected';

export interface TransferOptions {
  destPath: string;
  onProgress: (receivedBytes: number, totalBytes: number) => void;
  /** Called once the server has responded, with the file's total size (0 if unknown). */
  onStarted: (totalBytes: number) => void;
  /**
   * The unfinished file to download into, renamed to `destPath` once
   * complete. It must belong to this download alone: two downloads that end
   * up at the same `destPath` must never write into the same `.part` file.
   */
  partialPath: string;
  /** Resume info from an earlier, unfinished attempt in this session. */
  resume: null | ResumeInfo;
  /** Aborting it with a {@link TransferStopReason} pauses or cancels the transfer. */
  signal: AbortSignal;
  stallTimeoutMs?: number;
  url: string;
}

export type TransferResult =
  | TransferFailure
  | { filePath: string; kind: 'completed' }
  | { kind: 'cancelled' }
  | { kind: 'paused'; resume: null | ResumeInfo };

/** What a transfer can be stopped for from outside, via its abort signal. */
export type TransferStopReason = 'cancel' | 'pause';

/** Removes the `.part` file of an unfinished download, if there is one. */
export const discardPartialDownload = (partialPath: string) =>
  rm(partialPath, { force: true });

const getFileSize = async (path: string) => {
  try {
    return (await stat(path)).size;
  } catch {
    return 0;
  }
};

const isRetryableStatus = (status: number) =>
  status === 408 || status === 425 || status === 429 || status >= 500;

const isContentEncoded = (response: Response) => {
  const encoding = response.headers.get('content-encoding');
  return !!encoding && encoding !== 'identity';
};

/**
 * The validator to resume against later. A weak ETag can't be used in
 * If-Range, so Last-Modified is used instead when that's all there is.
 */
const getValidator = (response: Response) => {
  const etag = response.headers.get('etag');
  if (etag && !etag.startsWith('W/')) return etag;
  return response.headers.get('last-modified') ?? '';
};

const CONTENT_RANGE_PATTERN = /^bytes (\d+)-\d+\/(\d+|\*)$/;

const parseContentRange = (response: Response) => {
  const match = CONTENT_RANGE_PATTERN.exec(
    response.headers.get('content-range') ?? '',
  );
  if (!match) return null;
  const total = match[2] === '*' ? 0 : Number(match[2]);
  return { start: Number(match[1]), total };
};

const getContentLength = (response: Response) => {
  const length = Number(response.headers.get('content-length'));
  return Number.isFinite(length) && length > 0 ? length : 0;
};

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

// Chromium reports network failures as "net::ERR_..." errors; the rest are
// the generic shapes a failed fetch takes (src/shared/network-errors.ts),
// and a body stream that ended without finishing.
const isNetworkError = (error: unknown) =>
  isFetchNetworkError(error) ||
  toError(error).message.startsWith('net::') ||
  (error as { code?: unknown })?.code === 'ERR_STREAM_PREMATURE_CLOSE';

const removePartial = (partialPath: string) =>
  rm(partialPath, { force: true }).catch(() => undefined);

/** A listener failing must not fail the download itself. */
const notifyListener = (listener: () => void) => {
  try {
    listener();
  } catch {
    // Ignored on purpose; see above.
  }
};

const waitForClose = (stream: WriteStream) =>
  stream.closed
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        stream.once('close', () => resolve());
      });

async function finalizeDownload(partialPath: string, destPath: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= FINALIZE_RETRY_COUNT; attempt++) {
    if (attempt > 0) await delay(FINALIZE_RETRY_DELAY_MS * attempt);
    try {
      await rename(partialPath, destPath);
      return;
    } catch (error) {
      lastError = error;
      const code = getFilesystemErrorCode(error) ?? '';
      if (!FINALIZE_RETRYABLE_CODES.has(code)) break;
    }
  }
  throw lastError;
}

const filesystemFailure = (
  error: unknown,
  reachedBytes: number,
  resume: null | ResumeInfo,
): TransferFailure => ({
  error: toError(error),
  kind: 'failed',
  reachedBytes,
  reason: 'filesystem',
  resume,
  retryable: !NON_RETRYABLE_FILESYSTEM_CODES.has(
    getFilesystemErrorCode(error) ?? '',
  ),
});

const httpFailure = (
  status: number,
  reachedBytes: number,
  resume: null | ResumeInfo,
): TransferFailure => ({
  error: new Error(`Download failed with HTTP status ${status}`),
  kind: 'failed',
  reachedBytes,
  reason: 'http',
  resume,
  retryable: isRetryableStatus(status),
  status,
});

/**
 * Downloads `url` to `destPath`, resuming the `.part` file from an earlier
 * attempt when `resume` allows it. Never throws: every outcome, including
 * failure, is a {@link TransferResult}.
 */
export async function runTransfer(
  options: TransferOptions,
): Promise<TransferResult> {
  const { destPath, partialPath, signal, url } = options;
  const stallTimeoutMs = options.stallTimeoutMs ?? TRANSFER_STALL_TIMEOUT_MS;

  const stall = new AbortController();
  const requestSignal = AbortSignal.any([signal, stall.signal]);
  let stallTimer: ReturnType<typeof setTimeout> | undefined;
  const resetStallTimer = () => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => stall.abort(), stallTimeoutMs);
  };

  let resume = options.resume;
  const offset = resume ? await getFileSize(partialPath) : 0;
  // How far into the file this attempt has got.
  let receivedBytes = offset;
  let writeStream: undefined | WriteStream;

  // Only the final rename failed last time: nothing left to download.
  if (resume && resume.totalBytes > 0 && offset === resume.totalBytes) {
    try {
      await finalizeDownload(partialPath, destPath);
      return { filePath: destPath, kind: 'completed' };
    } catch (error) {
      return filesystemFailure(error, receivedBytes, resume);
    }
  }

  try {
    const isRangeRequest = !!resume && offset > 0;
    const headers: Record<string, string> =
      resume && isRangeRequest
        ? { 'If-Range': resume.validator, Range: `bytes=${offset}-` }
        : {};

    resetStallTimer();
    const response = await net.fetch(url, {
      cache: 'no-store',
      headers,
      signal: requestSignal,
    });
    resetStallTimer();

    if (response.status === 416 && isRangeRequest) {
      // The `.part` file doesn't match the file on the server any more:
      // discard it, and the next attempt downloads the file from scratch.
      await response.body?.cancel().catch(() => undefined);
      await removePartial(partialPath);
      return { ...httpFailure(416, 0, null), retryable: true };
    }
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      return httpFailure(response.status, receivedBytes, resume);
    }

    // A 200 to a range request means the server is sending the whole file
    // (it changed, or the server doesn't do ranges): start over.
    const contentRange = parseContentRange(response);
    const isAppending =
      isRangeRequest &&
      response.status === 206 &&
      contentRange?.start === offset;
    const startOffset = isAppending ? offset : 0;

    let totalBytes = 0;
    if (!isContentEncoded(response)) {
      totalBytes =
        isAppending && contentRange?.total
          ? contentRange.total
          : startOffset + getContentLength(response);
    }

    const validator = getValidator(response);
    resume =
      validator && !isContentEncoded(response)
        ? { totalBytes, validator }
        : null;

    notifyListener(() => options.onStarted(totalBytes));

    receivedBytes = startOffset;
    const progress = new Transform({
      transform(chunk: Uint8Array, _encoding, callback) {
        receivedBytes += chunk.length;
        resetStallTimer();
        notifyListener(() => options.onProgress(receivedBytes, totalBytes));
        callback(null, chunk);
      },
    });

    writeStream = createWriteStream(partialPath, {
      flags: isAppending ? 'a' : 'w',
    });

    const body = response.body
      ? Readable.fromWeb(
          response.body as unknown as NodeReadableStream<Uint8Array>,
        )
      : Readable.from([]);
    await pipeline(body, progress, writeStream, { signal: requestSignal });
    clearTimeout(stallTimer);

    if (totalBytes > 0 && receivedBytes !== totalBytes) {
      // Fewer bytes than promised: the connection ended early, and the
      // `.part` file can be resumed. More than promised: it's corrupt.
      if (receivedBytes > totalBytes) {
        await removePartial(partialPath);
        resume = null;
      }
      return {
        error: new Error(
          `Download ended after ${receivedBytes} of ${totalBytes} bytes`,
        ),
        kind: 'failed',
        reachedBytes: receivedBytes,
        reason: 'network',
        resume,
        retryable: true,
      };
    }

    try {
      await finalizeDownload(partialPath, destPath);
    } catch (error) {
      return filesystemFailure(error, receivedBytes, resume);
    }
    return { filePath: destPath, kind: 'completed' };
  } catch (error) {
    clearTimeout(stallTimer);
    // Let in-flight writes land before anything touches the `.part` file
    // again, so a resumed attempt appends after all of them.
    if (writeStream) await waitForClose(writeStream);

    if (signal.aborted) {
      if (signal.reason === 'cancel') {
        await removePartial(partialPath);
        return { kind: 'cancelled' };
      }
      return { kind: 'paused', resume };
    }

    if (stall.signal.aborted) {
      return {
        error: new Error(`Download stalled: no data for ${stallTimeoutMs} ms`),
        kind: 'failed',
        reachedBytes: receivedBytes,
        reason: 'stalled',
        resume,
        retryable: true,
      };
    }
    if (FILESYSTEM_SYSCALLS.has(getFilesystemErrorSyscall(error) ?? '')) {
      return filesystemFailure(error, receivedBytes, resume);
    }
    // Still retried - it may well be transient - but flagged as unexpected
    // rather than passed off as a network problem, since it's likely a bug.
    return {
      error: toError(error),
      kind: 'failed',
      reachedBytes: receivedBytes,
      reason: isNetworkError(error) ? 'network' : 'unexpected',
      resume,
      retryable: true,
    };
  } finally {
    clearTimeout(stallTimer);
  }
}
