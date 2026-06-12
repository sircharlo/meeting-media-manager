import type { QueryResponseItem } from 'src/types';

import { DatabaseSync } from 'node:sqlite';
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

  let db: DatabaseSync | undefined;

  try {
    db = new DatabaseSync(dbPath, {
      readOnly: true,
    });

    const result = db.prepare(query).all(...params) as T[];

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

    queryCache.set(cacheKey, result);
    return result;
  } catch (e) {
    capturePreloadError(e, {
      contexts: { fn: { name: 'executeQuery', path: dbPath, query } },
    });
    return [];
  } finally {
    db?.close();
  }
};
