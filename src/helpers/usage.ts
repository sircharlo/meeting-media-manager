import { errorCatcher } from 'src/helpers/error-catcher';
import { getFilesystemErrorCode } from 'src/shared/filesystem-errors';
import { formatDate } from 'src/utils/date';

const { fs, join, PLATFORM } = globalThis.electronApi;
const { ensureFile, readFile, writeFile } = fs;

export const LAST_USED_FILENAME = '.last-used';

// Windows Defender/Search indexer (or similar) can hold a transient lock on
// a just-created/just-written file for a moment - same class of flakiness
// already retried around probe cleanup in the main process. A couple of
// short retries clears it without needing to prove the exact external cause.
const WINDOWS_RETRYABLE_CODES = new Set(['EBUSY', 'EPERM']);
const RETRY_COUNT = 2;
const RETRY_DELAY_MS = 200;

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const withLockRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
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

export const updateLastUsedDate = async (
  folderPath: string,
  date: Date | string,
) => {
  try {
    if (!folderPath) return;

    const { hideFileOnWindows, showFileOnWindows } = globalThis.electronApi;

    const dateStr =
      typeof date === 'string' ? date : formatDate(date, 'YYYY-MM-DD');
    const filePath = join(folderPath, LAST_USED_FILENAME);

    await withLockRetry(() => ensureFile(filePath));
    await showFileOnWindows(filePath);

    let existingDateStr = '';
    try {
      existingDateStr = await withLockRetry(() => readFile(filePath, 'utf-8'));
    } catch {
      // ignore read error
    }

    // Always update if new date is newer or if file is empty
    // Compare as strings YYYY-MM-DD works
    if (!existingDateStr || dateStr > existingDateStr) {
      await withLockRetry(() => writeFile(filePath, dateStr, 'utf-8'));
    }
    await hideFileOnWindows(filePath);
  } catch (error) {
    errorCatcher(error);
  }
};

// A handful of corrupted markers have shown up in the wild as a valid date
// with a couple of extra trailing digits (e.g. "2026021717") - consistent
// with a torn/partial write on a synced or removable drive rather than
// anything this app wrote. Validate before handing it to dateFromString so
// corrupted content is treated as "no data" instead of silently making the
// folder look used-today (dateFromString's fallback on parse failure).
const LAST_USED_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$|^\d{8}$/;

export const getLastUsedDate = async (
  folderPath: string,
): Promise<null | string> => {
  try {
    const filePath = join(folderPath, LAST_USED_FILENAME);
    const dateStr = await withLockRetry(() => readFile(filePath, 'utf-8'));
    return LAST_USED_DATE_FORMAT.test(dateStr) ? dateStr : null;
  } catch {
    return null;
  }
};
