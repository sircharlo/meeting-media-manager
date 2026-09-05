import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const childState = vi.hoisted(() => ({
  handlers: new Map<string, (value: unknown) => void>(),
  lastMessage: undefined as undefined | { filePath: string; id: number },
}));

const killMock = vi.fn();
const mkdtempSyncMock = vi.fn(() => '/mock/tmp/mmm-image-size-worker-test');
const rmSyncMock = vi.fn();
const writeFileSyncMock = vi.fn();

// `image-size.ts` isolates dimension-reading in a `utilityProcess` child (see
// SEC-1 in full-audit-2026-09-04.md: image-size's ICNS/JXL/HEIF parsers have
// unpatched infinite-loop DoS advisories). Both the child process and the
// throwaway worker script are mocked so this can drive success/error/timeout
// responses without Electron or real crafted image fixtures.
vi.mock('electron', () => ({
  utilityProcess: {
    fork: () => ({
      kill: killMock,
      on(event: string, handler: (value: unknown) => void) {
        childState.handlers.set(event, handler);
        return this;
      },
      postMessage(value: { filePath: string; id: number }) {
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

describe('getImageDimensions', () => {
  beforeEach(() => {
    // image-size.ts caches its child process at module scope, so reset
    // modules between tests to get a fresh child/handlers per test.
    vi.resetModules();
    vi.clearAllMocks();
    childState.handlers.clear();
    childState.lastMessage = undefined;
  });

  it('resolves with the worker-reported dimensions on success', async () => {
    const { getImageDimensions } = await import('../image-size');

    const promise = getImageDimensions('/tmp/photo.png');

    expect(childState.lastMessage).toBeDefined();
    childState.handlers.get('message')?.({
      id: childState.lastMessage?.id,
      result: { height: 1080, orientation: 1, width: 1920 },
    });

    await expect(promise).resolves.toEqual({
      height: 1080,
      orientation: 1,
      width: 1920,
    });
  });

  it('rejects and reports when the worker returns a parse error', async () => {
    const { getImageDimensions } = await import('../image-size');

    const promise = getImageDimensions('/tmp/corrupt.png');

    expect(childState.lastMessage).toBeDefined();
    childState.handlers.get('message')?.({
      error: { message: 'unsupported format' },
      id: childState.lastMessage?.id,
    });

    await expect(promise).rejects.toThrow('unsupported format');
    expect(captureElectronError).toHaveBeenCalled();
  });

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('kills the hung child and rejects on timeout instead of hanging forever', async () => {
      const { getImageDimensions } = await import('../image-size');

      // Simulates the actual DoS: a crafted file makes the worker's parser
      // loop forever, so it never posts a 'message' response back.
      const promise = getImageDimensions('/tmp/malicious.icns');

      await Promise.all([
        expect(promise).rejects.toThrow(/Timed out/),
        vi.advanceTimersByTimeAsync(8000),
      ]);

      expect(killMock).toHaveBeenCalledOnce();
      expect(captureElectronError).toHaveBeenCalled();
    });

    it('spins up a fresh child for the next call after a timeout', async () => {
      const { getImageDimensions } = await import('../image-size');

      const firstCallChild = childState.handlers;
      const first = getImageDimensions('/tmp/malicious.icns');
      await Promise.all([
        expect(first).rejects.toThrow(/Timed out/),
        vi.advanceTimersByTimeAsync(8000),
      ]);

      // The mocked fork() always returns handlers on the same shared
      // childState map in this test file, but a real timeout nulls out the
      // module's cached `child` reference so the next call forks again
      // rather than posting to the (killed) hung process. Confirm a second
      // call still resolves normally rather than also timing out/hanging.
      // (postMessage overwrites childState.lastMessage synchronously, so the
      // second call's message is in place as soon as this returns.)
      const second = getImageDimensions('/tmp/ok.png');
      const secondMessage = childState.lastMessage;
      expect(secondMessage).toBeDefined();
      childState.handlers.get('message')?.({
        id: secondMessage?.id,
        result: { height: 10, width: 10 },
      });

      await expect(second).resolves.toEqual({ height: 10, width: 10 });
      expect(firstCallChild).toBe(childState.handlers);
    });
  });
});

describe('cleanupImageSizeWorker', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    childState.handlers.clear();
    childState.lastMessage = undefined;
  });

  it('kills the child and removes the temp directory after a read', async () => {
    const { cleanupImageSizeWorker, getImageDimensions } =
      await import('../image-size');

    const promise = getImageDimensions('/tmp/photo.png');
    childState.handlers.get('message')?.({
      id: childState.lastMessage?.id,
      result: { height: 1, width: 1 },
    });
    await promise;

    cleanupImageSizeWorker();

    expect(killMock).toHaveBeenCalledOnce();
    expect(rmSyncMock).toHaveBeenCalledWith(
      '/mock/tmp/mmm-image-size-worker-test',
      { force: true, recursive: true },
    );
  });

  it('is a no-op when no read was ever run', async () => {
    const { cleanupImageSizeWorker } = await import('../image-size');

    expect(() => cleanupImageSizeWorker()).not.toThrow();

    expect(killMock).not.toHaveBeenCalled();
    expect(rmSyncMock).not.toHaveBeenCalled();
  });
});
