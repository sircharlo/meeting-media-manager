import { getFilesystemErrorCode } from 'src/shared/filesystem-errors';

// Windows Defender/Search indexer, cloud-sync clients (Dropbox, OneDrive,
// ...) and similar can hold a transient lock on a file for a moment right
// after it's created/written/renamed. A couple of short retries clears it
// without needing to prove the exact external cause.
const WINDOWS_RETRYABLE_CODES = new Set(['EBUSY', 'EPERM']);
const RETRY_COUNT = 2;
const RETRY_DELAY_MS = 200;

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
      await delay(RETRY_DELAY_MS);
    }
  }
  throw lastError;
};
