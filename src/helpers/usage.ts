import { errorCatcher } from 'src/helpers/error-catcher';
import { formatDate } from 'src/utils/date';

const { fs, path } = globalThis.electronApi;
const { ensureFile, readFile, writeFile } = fs;
const { join } = path;

export const LAST_USED_FILENAME = '.last-used';

export const updateLastUsedDate = async (
  folderPath: string,
  date: Date | string,
) => {
  try {
    if (!folderPath) return;

    const dateStr =
      typeof date === 'string' ? date : formatDate(date, 'YYYY-MM-DD');
    const filePath = join(folderPath, LAST_USED_FILENAME);

    await ensureFile(filePath);

    let existingDateStr = '';
    try {
      existingDateStr = await readFile(filePath, 'utf-8');
    } catch {
      // ignore read error
    }

    // Always update if new date is newer or if file is empty
    // Compare as strings YYYY-MM-DD works
    if (!existingDateStr || dateStr > existingDateStr) {
      await writeFile(filePath, dateStr, 'utf-8');
    }
  } catch (error) {
    errorCatcher(error);
  }
};

export const getLastUsedDate = async (
  folderPath: string,
): Promise<null | string> => {
  try {
    const filePath = join(folderPath, LAST_USED_FILENAME);
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
};
