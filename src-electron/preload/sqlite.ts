import type { QueryResponseItem } from 'src/types';

import BetterSqlite3 from 'better-sqlite3';
import { capturePreloadError } from 'preload/log';

export const executeQuery = <T extends object = QueryResponseItem>(
  dbPath: string,
  query: string,
): T[] => {
  try {
    const db = new BetterSqlite3(dbPath, {
      fileMustExist: true,
      readonly: true,
    });

    const result = db.prepare<[], T>(query).all();

    // Remove unused and heavy Content property only if it exists in any row
    for (const item of result) {
      if ('Content' in item) delete item.Content;
    }

    console.debug('executeQuery', {
      count: result.length,
      db: dbPath.split('/').pop(),
      query,
    });

    db.close(); // Explicitly close DB to free file handles
    return result;
  } catch (e) {
    capturePreloadError(e, {
      contexts: { fn: { name: 'executeQuery', path: dbPath, query } },
    });
    return [];
  }
};
