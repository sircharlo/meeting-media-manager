import { getFilesystemErrorCode } from 'src/shared/filesystem-errors';

// Windows Defender/Search indexer, cloud-sync clients (Dropbox, OneDrive,
// ...) and similar can hold a transient lock on a file for a moment right
// after it's created/written/renamed. Retries clear it without needing to
// prove the exact external cause. Cloud-sync clients in particular (as
// opposed to Defender/indexer locks) have been observed to hold a lock well
// past a few hundred ms while actively syncing a folder, so this backs off
// exponentially instead of using a short fixed delay - these calls are
// background saves, so a couple of extra seconds of latency in the rare
// worst case is invisible to the user.
const WINDOWS_RETRYABLE_CODES = new Set(['EBUSY', 'EPERM']);
const RETRY_COUNT = 4;
const BASE_RETRY_DELAY_MS = 200;

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export const withLockRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  const { PLATFORM } = globalThis.electronApi;
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable =
        PLATFORM === 'win32' &&
        WINDOWS_RETRYABLE_CODES.has(getFilesystemErrorCode(error) ?? '');
      if (!retryable || attempt === RETRY_COUNT) {
        throw error;
      }
      await delay(BASE_RETRY_DELAY_MS * 2 ** attempt);
    }
  }
  throw lastError;
};
