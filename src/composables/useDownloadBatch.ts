import type { DownloadProgressItem } from 'src/types';

import { useTimeoutFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import {
  downloadsPercent,
  isPendingDownload,
} from 'src/utils/download-progress';
import { LIQUID_DONE_HOLD_MS } from 'src/utils/liquid-motion';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, shallowRef, watch } from 'vue';

/**
 * The downloads running right now, as one batch: a file that starts while
 * others are still going joins it, so the batch only ever moves forward. It
 * finishes, and stays finished for a moment, once its last file is in.
 */
export const useDownloadBatch = () => {
  const { downloadProgress } = storeToRefs(useCurrentStateStore());

  const batchIds = shallowRef<string[]>([]);
  // A new number for each batch, to start its liquid afresh.
  const batchNumber = ref(0);
  const isFinished = ref(false);

  const clear = () => {
    batchIds.value = [];
    isFinished.value = false;
  };

  const { start: holdFinishedBatch, stop: stopHolding } = useTimeoutFn(
    clear,
    LIQUID_DONE_HOLD_MS,
    { immediate: false },
  );

  const pendingIds = computed(() =>
    Object.entries(downloadProgress.value)
      .filter(([, item]) => isPendingDownload(item))
      .map(([id]) => id),
  );

  const batchItems = computed(() =>
    batchIds.value
      .map((id) => downloadProgress.value[id])
      .filter((item): item is DownloadProgressItem => !!item),
  );

  const percent = computed(() => downloadsPercent(batchItems.value));
  const isActive = computed(() => batchIds.value.length > 0);

  const join = (ids: string[]) => {
    if (isFinished.value) {
      stopHolding();
      clear();
      batchNumber.value++;
    }
    const known = new Set(batchIds.value);
    const added = ids.filter((id) => !known.has(id));
    if (added.length) batchIds.value = [...batchIds.value, ...added];
  };

  const end = () => {
    if (!batchIds.value.length || isFinished.value) return;
    // A batch whose files failed, or were cleared away (switching
    // congregation, say), didn't finish: it just stops.
    const everyFileArrived =
      batchItems.value.length === batchIds.value.length &&
      batchItems.value.every((item) => item.complete);
    if (!everyFileArrived) {
      clear();
      batchNumber.value++;
      return;
    }
    isFinished.value = true;
    holdFinishedBatch();
  };

  watch(
    pendingIds,
    (ids) => {
      if (ids.length) join(ids);
      else end();
    },
    { immediate: true },
  );

  return { batchNumber, isActive, isFinished, percent };
};
