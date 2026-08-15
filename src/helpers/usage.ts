import { errorCatcher } from 'src/helpers/error-catcher';
import { withLockRetry } from 'src/helpers/fs-retry';
import { formatDate } from 'src/utils/date';

const { fs, join } = globalThis.electronApi;
const { ensureFile, readFile, writeFile } = fs;

export const LAST_USED_FILENAME = '.last-used';

// A bulk prefetch (e.g. several upcoming weeks) can call this many times in
// quick succession for the same shared publication folder (background music
// reused across every week, for instance). Coalescing concurrent calls per
// folder avoids hammering - and, when the write genuinely can't succeed
// (e.g. a persistently locked/inaccessible drive), over-reporting - the same
// failure many times over for what's ultimately one "was this folder used"
// signal.
const inFlightUpdates = new Map<string, Promise<void>>();

export const updateLastUsedDate = async (
  folderPath: string,
  date: Date | string,
): Promise<void> => {
  if (!folderPath) return;

  const existing = inFlightUpdates.get(folderPath);
  if (existing) return existing;

  const attempt = performLastUsedUpdate(folderPath, date).finally(() => {
    inFlightUpdates.delete(folderPath);
  });
  inFlightUpdates.set(folderPath, attempt);
  return attempt;
};

const performLastUsedUpdate = async (
  folderPath: string,
  date: Date | string,
) => {
  try {
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
