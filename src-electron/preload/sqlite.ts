import type { QueryResponseItem } from 'src/types';

import BetterSqlite3 from 'better-sqlite3';

import { capturePreloadError } from './log';

export const executeQuery = <T = QueryResponseItem>(
  dbPath: string,
  query: string,
): T[] => {
  try {
    const db: BetterSqlite3.Database = new BetterSqlite3(dbPath, {
      fileMustExist: true,
      readonly: true,
    });
    const result = db.prepare<unknown[], T>(query).all();
    console.debug('executeQuery', {
      db: dbPath.split('/').pop(),
      query,
      result,
    });
    return result;
  } catch (e) {
    capturePreloadError(e, {
      contexts: { fn: { name: 'executeQuery', path: dbPath, query } },
    });
    return [];
  }
};
