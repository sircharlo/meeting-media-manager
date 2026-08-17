import { isFetchNetworkError } from 'src/shared/network-errors';

// A momentary connectivity blip (wifi drop, DNS hiccup, a timeout from
// fetchJson's own AbortSignal, ...) during a metadata/schedule fetch
// shouldn't immediately fail what a retry moments later would have
// succeeded at - same idea as withLockRetry in fs-retry.ts for filesystem
// locks, just classified via isFetchNetworkError instead of Windows lock
// codes.
const RETRY_COUNT = 2; // 3 total attempts
const BASE_RETRY_DELAY_MS = 300; // 300ms, 600ms backoff

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export const withFetchRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isFetchNetworkError(error) || attempt === RETRY_COUNT) throw error;
      await delay(BASE_RETRY_DELAY_MS * 2 ** attempt);
    }
  }
  throw lastError;
};
