import type { QueryResponseItem } from 'src/types';

import BetterSqlite3 from 'better-sqlite3';

import { errorCatcher } from '../utils';

export const executeQuery = <T = QueryResponseItem>(
  dbPath: string,
  query: string,
) => {
  try {
    // let attempts = 0;
    // const maxAttempts = 10;
    // const delay = 250;

    // while (attempts < maxAttempts) {
    //   if (isWritable(dbPath)) {
    const db: BetterSqlite3.Database = new BetterSqlite3(dbPath, {
      fileMustExist: true,
      readonly: true,
    });
    return db.prepare(query).all() as T[];
    //   }
    //   attempts++;
    //   sleepSync(delay);
    // }
    // throw new Error(
    //   fs.existsSync(dbPath)
    //     ? 'could not connect to database'
    //     : 'database file not found',
    // );
  } catch (e) {
    errorCatcher(e);
    errorCatcher(query + '\n' + dbPath);
    return [];
  }
};
