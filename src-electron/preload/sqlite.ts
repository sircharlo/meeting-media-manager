import type { QueryResponseItem } from 'src/types';

import BetterSqlite3 from 'better-sqlite3';

import { errorCatcher } from '../utils';

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
    console.debug('executeQuery', { dbPath, query, result });
    return result;
  } catch (e) {
    errorCatcher(e, {
      contexts: { fn: { name: 'executeQuery', path: dbPath, query } },
    });
    return [];
  }
};
