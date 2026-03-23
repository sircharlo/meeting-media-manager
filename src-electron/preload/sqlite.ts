import type { QueryResponseItem } from 'src/types';

import BetterSqlite3 from 'better-sqlite3';
import { capturePreloadError } from 'src-electron/preload/log';
import { log } from 'src/shared/vanilla';

const queryCache = new Map();

export const executeQuery = <T extends object = QueryResponseItem>(
  dbPath: string,
  query: string,
  params: (null | number | string)[] = [],
): T[] => {
  const cacheKey = `${dbPath}:${query}:${JSON.stringify(params)}`;
  if (queryCache.has(cacheKey)) {
    const cachedResult = queryCache.get(cacheKey) as T[];
    log('executeQuery (cached)', 'sqlite', 'debug', {
      count: cachedResult.length,
      db: dbPath.split('/').pop(),
      query,
    });
    return cachedResult;
  }

  try {
    const db = new BetterSqlite3(dbPath, {
      fileMustExist: true,
      readonly: true,
    });

    const result = db.prepare<unknown[], T>(query).all(...params);

    // Remove unused and heavy Content property only if it exists in any row
    for (const item of result) {
      if ('Content' in item) delete item.Content;
    }

    log('executeQuery', 'sqlite', 'debug', {
      count: result.length,
      db: dbPath.split('/').pop(),
      params,
      query,
    });

    db.close(); // Explicitly close DB to free file handles

    queryCache.set(cacheKey, result);
    return result;
  } catch (e) {
    capturePreloadError(e, {
      contexts: { fn: { name: 'executeQuery', path: dbPath, query } },
    });
    return [];
  }
};
