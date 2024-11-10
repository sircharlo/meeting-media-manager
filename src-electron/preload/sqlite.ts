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
    return db.prepare<unknown[], T>(query).all();
  } catch (e) {
    errorCatcher(e, { contexts: { db: { path: dbPath, query } } });
    return [];
  }
};
