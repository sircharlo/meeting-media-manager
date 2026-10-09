import type { TransferOptions } from 'src-electron/main/download-transfer';

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'upath';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
}));

vi.mock('electron', () => ({
  net: { fetch: mocks.fetch },
}));

const waitUntil = async (
  condition: () => boolean,
  maxAttempts = 100,
): Promise<void> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (condition()) return;
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 5);
    });
  }
  throw new Error('waitUntil: condition was never met');
};

/** A response body the test feeds chunk by chunk. */
const createControlledBody = () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController;
    },
  });
  return {
    close: () => controller.close(),
    fail: (error: Error) => controller.error(error),
    push: (text: string) => controller.enqueue(new TextEncoder().encode(text)),
    stream,
  };
};

const respond = (
  body: null | ReadableStream<Uint8Array> | string,
  init: { headers?: Record<string, string>; status?: number } = {},
) => new Response(body, { headers: init.headers, status: init.status ?? 200 });

const requestHeaders = (call = 0) =>
  (mocks.fetch.mock.calls[call]?.[1] as { headers: Record<string, string> })
    .headers;

let dir = '';
let destPath = '';
let partialPath = '';

const transfer = async (overrides: Partial<TransferOptions> = {}) => {
  const { runTransfer } = await import('../download-transfer');
  return runTransfer({
    destPath,
    onProgress: vi.fn(),
    onStarted: vi.fn(),
    partialPath,
    resume: null,
    signal: new AbortController().signal,
    url: 'https://example.test/video.mp4',
    ...overrides,
  });
};

describe('runTransfer', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    dir = await mkdtemp(join(tmpdir(), 'm3-transfer-'));
    destPath = join(dir, 'video.mp4');
    partialPath = `${destPath}.part`;
  });

  afterEach(async () => {
    await rm(dir, { force: true, recursive: true });
  });

  it('downloads into a .part file and renames it into place once complete', async () => {
    mocks.fetch.mockResolvedValue(
      respond('hello world', {
        headers: { 'content-length': '11', etag: '"v1"' },
      }),
    );
    const onStarted = vi.fn();
    const onProgress = vi.fn();

    const result = await transfer({ onProgress, onStarted });

    expect(result).toEqual({ filePath: destPath, kind: 'completed' });
    expect(await readFile(destPath, 'utf8')).toBe('hello world');
    await expect(readFile(partialPath)).rejects.toThrow();
    expect(onStarted).toHaveBeenCalledWith(11);
    expect(onProgress).toHaveBeenLastCalledWith(11, 11);
    expect(requestHeaders()).toEqual({});
  });

  it('keeps the .part file when paused, then resumes it with a range request', async () => {
    const body = createControlledBody();
    mocks.fetch.mockResolvedValueOnce(
      respond(body.stream, {
        headers: { 'content-length': '11', etag: '"v1"' },
      }),
    );
    const controller = new AbortController();
    const onProgress = vi.fn();

    const pending = transfer({ onProgress, signal: controller.signal });
    await waitUntil(() => mocks.fetch.mock.calls.length > 0);
    body.push('hello');
    await waitUntil(() => onProgress.mock.calls.length > 0);
    controller.abort('pause');

    const paused = await pending;
    expect(paused).toEqual({
      kind: 'paused',
      resume: { totalBytes: 11, validator: '"v1"' },
    });
    expect(await readFile(partialPath, 'utf8')).toBe('hello');

    mocks.fetch.mockResolvedValueOnce(
      respond(' world', {
        headers: {
          'content-length': '6',
          'content-range': 'bytes 5-10/11',
          etag: '"v1"',
        },
        status: 206,
      }),
    );
    const resumed = await transfer({
      resume: paused.kind === 'paused' ? paused.resume : null,
    });

    expect(requestHeaders(1)).toEqual({
      'If-Range': '"v1"',
      Range: 'bytes=5-',
    });
    expect(resumed).toEqual({ filePath: destPath, kind: 'completed' });
    expect(await readFile(destPath, 'utf8')).toBe('hello world');
  });

  it('starts over when the server answers a range request with the whole file', async () => {
    await writeFile(partialPath, 'stale');
    mocks.fetch.mockResolvedValue(
      respond('hello world', {
        headers: { 'content-length': '11', etag: '"v2"' },
      }),
    );

    const result = await transfer({
      resume: { totalBytes: 11, validator: '"v1"' },
    });

    expect(result.kind).toBe('completed');
    expect(await readFile(destPath, 'utf8')).toBe('hello world');
  });

  it('overwrites a .part file it has no resume info for, e.g. from an earlier session', async () => {
    await writeFile(partialPath, 'left over from last time');
    mocks.fetch.mockResolvedValue(
      respond('fresh', { headers: { 'content-length': '5' } }),
    );

    const result = await transfer();

    expect(requestHeaders()).toEqual({});
    expect(result.kind).toBe('completed');
    expect(await readFile(destPath, 'utf8')).toBe('fresh');
  });

  it('removes the .part file when cancelled', async () => {
    const body = createControlledBody();
    mocks.fetch.mockResolvedValue(
      respond(body.stream, { headers: { 'content-length': '11' } }),
    );
    const controller = new AbortController();
    const onProgress = vi.fn();

    const pending = transfer({ onProgress, signal: controller.signal });
    await waitUntil(() => mocks.fetch.mock.calls.length > 0);
    body.push('hello');
    await waitUntil(() => onProgress.mock.calls.length > 0);
    controller.abort('cancel');

    expect(await pending).toEqual({ kind: 'cancelled' });
    await expect(readFile(partialPath)).rejects.toThrow();
    await expect(readFile(destPath)).rejects.toThrow();
  });

  it('fails without retrying on a missing file, but retries on a server error', async () => {
    mocks.fetch.mockResolvedValueOnce(respond('not found', { status: 404 }));
    expect(await transfer()).toMatchObject({
      kind: 'failed',
      reason: 'http',
      retryable: false,
      status: 404,
    });

    mocks.fetch.mockResolvedValueOnce(respond('unavailable', { status: 503 }));
    expect(await transfer()).toMatchObject({
      kind: 'failed',
      reason: 'http',
      retryable: true,
      status: 503,
    });
    await expect(readFile(destPath)).rejects.toThrow();
  });

  it('leaves an unfinished .part file untouched when resuming fails with an HTTP error', async () => {
    await writeFile(partialPath, 'hello');
    mocks.fetch.mockResolvedValue(respond('busy', { status: 503 }));
    const resume = { totalBytes: 11, validator: '"v1"' };

    const result = await transfer({ resume });

    expect(result).toMatchObject({ kind: 'failed', resume, retryable: true });
    expect(await readFile(partialPath, 'utf8')).toBe('hello');
  });

  it('keeps what it received when the connection drops, so the next attempt can resume', async () => {
    const body = createControlledBody();
    mocks.fetch.mockResolvedValue(
      respond(body.stream, {
        headers: { 'content-length': '11', etag: '"v1"' },
      }),
    );
    const onProgress = vi.fn();

    const pending = transfer({ onProgress });
    await waitUntil(() => mocks.fetch.mock.calls.length > 0);
    body.push('hello');
    await waitUntil(() => onProgress.mock.calls.length > 0);
    body.fail(new Error('net::ERR_CONNECTION_RESET'));

    expect(await pending).toMatchObject({
      kind: 'failed',
      reachedBytes: 5,
      reason: 'network',
      resume: { totalBytes: 11, validator: '"v1"' },
      retryable: true,
    });
    expect(await readFile(partialPath, 'utf8')).toBe('hello');
  });

  it('fails as stalled when no data arrives for too long', async () => {
    const body = createControlledBody();
    mocks.fetch.mockResolvedValue(
      respond(body.stream, { headers: { 'content-length': '11' } }),
    );

    const result = await transfer({ stallTimeoutMs: 50 });

    expect(result).toMatchObject({
      kind: 'failed',
      reachedBytes: 0,
      reason: 'stalled',
      retryable: true,
    });
  });

  it('fails as stalled when the server never responds at all', async () => {
    mocks.fetch.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    );

    const result = await transfer({ stallTimeoutMs: 50 });

    expect(result).toMatchObject({ kind: 'failed', reason: 'stalled' });
  });

  it('fails (resumably) when the body ends before the promised size', async () => {
    mocks.fetch.mockResolvedValue(
      respond('hello', { headers: { 'content-length': '11', etag: '"v1"' } }),
    );

    const result = await transfer();

    expect(result).toMatchObject({
      kind: 'failed',
      reason: 'network',
      resume: { totalBytes: 11, validator: '"v1"' },
      retryable: true,
    });
    expect(await readFile(partialPath, 'utf8')).toBe('hello');
    await expect(readFile(destPath)).rejects.toThrow();
  });

  it('discards the .part file when the server says its range no longer exists, so a retry starts over', async () => {
    await writeFile(partialPath, 'hello');
    mocks.fetch.mockResolvedValue(respond(null, { status: 416 }));

    const result = await transfer({
      resume: { totalBytes: 11, validator: '"v1"' },
    });

    expect(result).toMatchObject({
      kind: 'failed',
      resume: null,
      retryable: true,
      status: 416,
    });
    await expect(readFile(partialPath)).rejects.toThrow();
  });

  it('only renames a .part file that was already complete, without downloading again', async () => {
    await writeFile(partialPath, 'hello world');

    const result = await transfer({
      resume: { totalBytes: 11, validator: '"v1"' },
    });

    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({ filePath: destPath, kind: 'completed' });
    expect(await readFile(destPath, 'utf8')).toBe('hello world');
  });

  it('gives no resume info without a validator to resume against safely', async () => {
    const body = createControlledBody();
    mocks.fetch.mockResolvedValue(
      respond(body.stream, {
        headers: { 'content-length': '11', etag: 'W/"weak"' },
      }),
    );
    const controller = new AbortController();
    const onProgress = vi.fn();

    const pending = transfer({ onProgress, signal: controller.signal });
    await waitUntil(() => mocks.fetch.mock.calls.length > 0);
    body.push('hello');
    await waitUntil(() => onProgress.mock.calls.length > 0);
    controller.abort('pause');

    expect(await pending).toEqual({ kind: 'paused', resume: null });
  });

  it('reports a filesystem failure when the file cannot be written', async () => {
    destPath = join(dir, 'missing-folder', 'video.mp4');
    partialPath = `${destPath}.part`;
    mocks.fetch.mockResolvedValue(
      respond('hello', { headers: { 'content-length': '5' } }),
    );

    const result = await transfer();

    expect(result).toMatchObject({
      kind: 'failed',
      reason: 'filesystem',
      retryable: true,
    });
  });

  it('flags a failure that is neither a network nor a filesystem problem as unexpected', async () => {
    mocks.fetch.mockRejectedValue(
      new TypeError("Cannot read properties of undefined (reading 'x')"),
    );

    expect(await transfer()).toMatchObject({
      kind: 'failed',
      reason: 'unexpected',
      retryable: true,
    });
  });

  it('treats Chromium network errors as network failures', async () => {
    mocks.fetch.mockRejectedValue(new Error('net::ERR_INTERNET_DISCONNECTED'));

    expect(await transfer()).toMatchObject({
      kind: 'failed',
      reason: 'network',
    });
  });
});
