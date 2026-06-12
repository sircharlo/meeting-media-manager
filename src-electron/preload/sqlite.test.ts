import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';

import { executeQuery } from './sqlite';

const tempDirs: string[] = [];

const createTestDb = () => {
  const dbPath = join(tempDirs.at(-1) ?? tmpdir(), 'readonly.sqlite');
  const db = new DatabaseSync(dbPath);

  try {
    db.exec(`
      CREATE TABLE media (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        Content BLOB
      );
      INSERT INTO media (title, Content)
      VALUES ('Opening Song', x'010203');
    `);
  } finally {
    db.close();
  }

  return dbPath;
};

describe('executeQuery', () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) =>
        rm(dir, {
          force: true,
          recursive: true,
        }),
      ),
    );
  });

  it('reads from SQLite databases through the read-only node:sqlite API', async () => {
    tempDirs.push(await mkdtemp(join(tmpdir(), 'mmm-sqlite-')));
    const dbPath = createTestDb();

    const result = executeQuery<{ Content?: Uint8Array; title: string }>(
      dbPath,
      'SELECT title, Content FROM media WHERE id = ?',
      [1],
    );

    expect(result).toEqual([{ title: 'Opening Song' }]);
  });

  it('does not allow writes through the read-only connection', async () => {
    tempDirs.push(await mkdtemp(join(tmpdir(), 'mmm-sqlite-')));
    const dbPath = createTestDb();

    const writeResult = executeQuery<{ id: number }>(
      dbPath,
      "INSERT INTO media (title) VALUES ('Closing Song') RETURNING id",
    );

    const rows = executeQuery<{ count: number }>(
      dbPath,
      'SELECT COUNT(*) AS count FROM media',
    );

    expect(writeResult).toEqual([]);
    expect(rows).toEqual([{ count: 1 }]);
  });
});
