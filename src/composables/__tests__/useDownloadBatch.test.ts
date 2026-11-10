import { installPinia } from 'app/test/vitest/mocks/pinia';
import { useDownloadBatch } from 'src/composables/useDownloadBatch';
import { LIQUID_DONE_HOLD_MS } from 'src/utils/liquid-motion';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick } from 'vue';

installPinia();

const startBatch = () => {
  const scope = effectScope();
  const batch = scope.run(() => useDownloadBatch());
  if (!batch) throw new Error('useDownloadBatch returned nothing');
  return { batch, scope };
};

describe('useDownloadBatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useCurrentStateStore().downloadProgress = {};
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gathers the downloads running together into one batch', async () => {
    const currentState = useCurrentStateStore();
    const { batch, scope } = startBatch();

    currentState.downloadProgress = {
      a: { filename: 'a.mp4', loaded: 50, total: 100 },
    };
    await nextTick();
    currentState.downloadProgress.b = {
      filename: 'b.mp4',
      loaded: 0,
      total: 100,
    };
    await nextTick();

    expect(batch.isActive.value).toBe(true);
    expect(batch.percent.value).toBe(25);
    scope.stop();
  });

  it('finishes, then clears, once every file has arrived', async () => {
    const currentState = useCurrentStateStore();
    const { batch, scope } = startBatch();

    currentState.downloadProgress = {
      a: { filename: 'a.mp4', loaded: 50, total: 100 },
    };
    await nextTick();
    currentState.downloadProgress.a = {
      complete: true,
      filename: 'a.mp4',
      total: 100,
    };
    await nextTick();

    expect(batch.isFinished.value).toBe(true);
    expect(batch.percent.value).toBe(100);

    vi.advanceTimersByTime(LIQUID_DONE_HOLD_MS);

    expect(batch.isActive.value).toBe(false);
    expect(batch.isFinished.value).toBe(false);
    scope.stop();
  });

  it("doesn't celebrate a batch whose files failed or went away", async () => {
    const currentState = useCurrentStateStore();
    const { batch, scope } = startBatch();

    currentState.downloadProgress = {
      a: { filename: 'a.mp4', loaded: 50, total: 100 },
    };
    await nextTick();
    const firstBatch = batch.batchNumber.value;
    currentState.downloadProgress = {};
    await nextTick();

    expect(batch.isFinished.value).toBe(false);
    expect(batch.isActive.value).toBe(false);
    expect(batch.batchNumber.value).toBe(firstBatch + 1);
    scope.stop();
  });

  it('starts a new batch when a download begins during the finish', async () => {
    const currentState = useCurrentStateStore();
    const { batch, scope } = startBatch();

    currentState.downloadProgress = {
      a: { complete: true, filename: 'a.mp4', total: 100 },
      b: { filename: 'b.mp4', loaded: 90, total: 100 },
    };
    await nextTick();
    currentState.downloadProgress.b = {
      complete: true,
      filename: 'b.mp4',
      total: 100,
    };
    await nextTick();
    expect(batch.isFinished.value).toBe(true);
    const finishedBatch = batch.batchNumber.value;

    currentState.downloadProgress.c = {
      filename: 'c.mp4',
      loaded: 0,
      total: 100,
    };
    await nextTick();

    expect(batch.isFinished.value).toBe(false);
    expect(batch.batchNumber.value).toBe(finishedBatch + 1);
    expect(batch.percent.value).toBe(0);
    scope.stop();
  });
});
