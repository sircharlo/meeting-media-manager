import type { StorageLike } from 'pinia-plugin-persistedstate';

export interface DebouncedStorage extends StorageLike {
  flush: () => void;
}

/**
 * Wraps a synchronous storage (e.g. `window.localStorage`) so that rapid
 * `setItem` calls are collapsed into a single trailing write. The expensive
 * `storage.setItem` call (a synchronous disk write for `localStorage`) is
 * what a Pinia persistence plugin runs on every store mutation; deferring it
 * means a burst of mutations produces one write instead of one per mutation.
 *
 * `getItem` stays synchronous so hydration still works exactly as before, and
 * `flush` force-writes any pending value (e.g. on window close) so a clean
 * shutdown never loses the final mutation.
 */
export const createDebouncedStorage = (
  storage: StorageLike,
  delayMs: number,
): DebouncedStorage => {
  let pendingWrite: null | { key: string; value: string } = null;
  let timer: null | ReturnType<typeof setTimeout> = null;

  const flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    const pending = pendingWrite;
    if (!pending) return;
    pendingWrite = null;
    storage.setItem(pending.key, pending.value);
  };

  return {
    flush,
    getItem: (key: string) => storage.getItem(key),
    setItem: (key: string, value: string) => {
      pendingWrite = { key, value };
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
  };
};
