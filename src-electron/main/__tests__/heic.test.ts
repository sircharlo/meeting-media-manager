import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const childState = vi.hoisted(() => ({
  handlers: new Map<string, (value: unknown) => void>(),
  lastMessage: undefined as undefined | { id: number; image: unknown },
}));

const killMock = vi.fn();
const mkdtempSyncMock = vi.fn(() => '/mock/tmp/mmm-heic-worker-test');
const rmSyncMock = vi.fn();
const writeFileSyncMock = vi.fn();

// `heic.ts` runs its decode in a `utilityProcess` child and writes a small
// throwaway worker script to the OS temp dir. Both are mocked so the test can
// drive the decode response and cleanup without Electron, real HEIC/WASM
// fixtures (none exist in the repo), or touching the real filesystem.
vi.mock('electron', () => ({
  utilityProcess: {
    fork: () => ({
      kill: killMock,
      on(event: string, handler: (value: unknown) => void) {
        childState.handlers.set(event, handler);
        return this;
      },
      postMessage(value: { id: number; image: unknown }) {
        childState.lastMessage = value;
      },
    }),
  },
}));

vi.mock('node:fs', () => ({
  mkdtempSync: mkdtempSyncMock,
  rmSync: rmSyncMock,
  writeFileSync: writeFileSyncMock,
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
}));

import { captureElectronError } from 'src-electron/main/utils';

describe('convertHeic', () => {
  beforeEach(() => {
    // `heic.ts` caches its child process and temp-dir path at module scope, so
    // reset modules between tests to get a fresh child (and fresh message/exit
    // handlers) without leaking call-count state across tests.
    vi.resetModules();
    vi.clearAllMocks();
    childState.handlers.clear();
    childState.lastMessage = undefined;
  });

  it('returns the decoded buffer on success', async () => {
    const { convertHeic } = await import('../heic');
    const buffer = new Uint8Array([0xff, 0xd8, 0xff]).buffer;

    const promise = convertHeic({
      buffer: new Uint8Array([1, 2, 3]),
      format: 'JPEG',
    });

    expect(childState.lastMessage).toBeDefined();
    childState.handlers.get('message')?.({
      buffer,
      id: childState.lastMessage?.id,
    });

    await expect(promise).resolves.toBe(buffer);
  });

  it('returns an empty ArrayBuffer when the worker reports an error', async () => {
    const { convertHeic } = await import('../heic');

    const promise = convertHeic({
      buffer: new Uint8Array([1, 2, 3]),
      format: 'JPEG',
    });

    expect(childState.lastMessage).toBeDefined();
    childState.handlers.get('message')?.({
      error: { message: 'decode failed' },
      id: childState.lastMessage?.id,
    });

    await expect(promise).resolves.toEqual(new ArrayBuffer(0));
    expect(captureElectronError).toHaveBeenCalled();
  });

  // BE-14 (full-audit-2026-09-05.md): the worker previously had no timeout
  // at all, unlike image-size.ts's near-identical isolation - a hung decode
  // (a crafted/corrupted .heic file) would wedge the single cached child
  // forever, silently stalling every subsequent conversion that session.
  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('kills the hung child and returns an empty buffer on timeout instead of hanging forever', async () => {
      const { convertHeic } = await import('../heic');

      const promise = convertHeic({
        buffer: new Uint8Array([1, 2, 3]),
        format: 'JPEG',
      });

      await Promise.all([
        expect(promise).resolves.toEqual(new ArrayBuffer(0)),
        vi.advanceTimersByTimeAsync(8000),
      ]);

      expect(killMock).toHaveBeenCalledOnce();
      expect(captureElectronError).toHaveBeenCalled();
    });

    it('spins up a fresh child for the next call after a timeout', async () => {
      const { convertHeic } = await import('../heic');

      const first = convertHeic({
        buffer: new Uint8Array([1, 2, 3]),
        format: 'JPEG',
      });
      await Promise.all([
        expect(first).resolves.toEqual(new ArrayBuffer(0)),
        vi.advanceTimersByTimeAsync(8000),
      ]);

      const second = convertHeic({
        buffer: new Uint8Array([4, 5, 6]),
        format: 'JPEG',
      });
      const secondBuffer = new Uint8Array([0xff]).buffer;
      const secondMessage = childState.lastMessage;
      expect(secondMessage).toBeDefined();
      childState.handlers.get('message')?.({
        buffer: secondBuffer,
        id: secondMessage?.id,
      });

      await expect(second).resolves.toBe(secondBuffer);
    });
  });
});

describe('cleanupHeicWorker', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    childState.handlers.clear();
    childState.lastMessage = undefined;
  });

  it('kills the child and removes the temp directory after a conversion', async () => {
    const { cleanupHeicWorker, convertHeic } = await import('../heic');

    const promise = convertHeic({
      buffer: new Uint8Array([1, 2, 3]),
      format: 'JPEG',
    });
    childState.handlers.get('message')?.({
      buffer: new Uint8Array([0xff]).buffer,
      id: childState.lastMessage?.id,
    });
    await promise;

    cleanupHeicWorker();

    expect(killMock).toHaveBeenCalledOnce();
    expect(rmSyncMock).toHaveBeenCalledWith('/mock/tmp/mmm-heic-worker-test', {
      force: true,
      recursive: true,
    });
  });

  it('is a no-op when no conversion was ever run', async () => {
    const { cleanupHeicWorker } = await import('../heic');

    expect(() => cleanupHeicWorker()).not.toThrow();

    expect(killMock).not.toHaveBeenCalled();
    expect(rmSyncMock).not.toHaveBeenCalled();
  });

  it('only cleans up once when called twice in a row', async () => {
    const { cleanupHeicWorker, convertHeic } = await import('../heic');

    const promise = convertHeic({
      buffer: new Uint8Array([1, 2, 3]),
      format: 'JPEG',
    });
    childState.handlers.get('message')?.({
      buffer: new Uint8Array([0xff]).buffer,
      id: childState.lastMessage?.id,
    });
    await promise;

    cleanupHeicWorker();
    cleanupHeicWorker();

    expect(killMock).toHaveBeenCalledTimes(1);
    expect(rmSyncMock).toHaveBeenCalledTimes(1);
  });
});
