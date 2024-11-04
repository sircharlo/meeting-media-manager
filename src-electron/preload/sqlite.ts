import type { QueryResponseItem } from 'src/types';

import BetterSqlite3 from 'better-sqlite3';

import { errorCatcher } from '../utils';

export const executeQuery = <T = QueryResponseItem>(
  dbPath: string,
  query: string,
) => {
  try {
    const db: BetterSqlite3.Database = new BetterSqlite3(dbPath, {
      fileMustExist: true,
      readonly: true,
    });
    return db.prepare(query).all() as T[];
  } catch (e) {
    errorCatcher(e);
    errorCatcher(query + '\n' + dbPath);
    return [];
  }
};
