import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

import { log } from 'src/shared/vanilla';

import { closeAllConnections, closeConnection, executeQuery } from '../sqlite';

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
    await closeAllConnections();
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

    const result = await executeQuery<{ Content?: Uint8Array; title: string }>(
      dbPath,
      'SELECT title, Content FROM media WHERE id = ?',
      [1],
    );

    expect(result).toEqual([{ title: 'Opening Song' }]);
  });

  it('does not allow writes through the read-only connection', async () => {
    tempDirs.push(await mkdtemp(join(tmpdir(), 'mmm-sqlite-')));
    const dbPath = createTestDb();

    const writeResult = await executeQuery<{ id: number }>(
      dbPath,
      "INSERT INTO media (title) VALUES ('Closing Song') RETURNING id",
    );

    const rows = await executeQuery<{ count: number }>(
      dbPath,
      'SELECT COUNT(*) AS count FROM media',
    );

    expect(writeResult).toEqual([]);
    expect(rows).toEqual([{ count: 1 }]);
  });

  it('closeConnection evicts only the given path connection and cache', async () => {
    const logMock = vi.mocked(log);

    const dirA = await mkdtemp(join(tmpdir(), 'mmm-sqlite-a-'));
    const dirB = await mkdtemp(join(tmpdir(), 'mmm-sqlite-b-'));
    tempDirs.push(dirA, dirB);

    const dbA = join(dirA, 'a.sqlite');
    const dbB = join(dirB, 'b.sqlite');

    const writeDb = (dbPath: string, title: string) => {
      const db = new DatabaseSync(dbPath);
      try {
        db.exec(`
          CREATE TABLE media (id INTEGER PRIMARY KEY, title TEXT NOT NULL);
          INSERT INTO media (title) VALUES ('${title}');
        `);
      } finally {
        db.close();
      }
    };

    const query = 'SELECT title FROM media WHERE id = ?';

    writeDb(dbA, 'A First');
    writeDb(dbB, 'B First');

    await executeQuery<{ title: string }>(dbA, query, [1]);
    await executeQuery<{ title: string }>(dbB, query, [1]);

    await closeConnection(dbA);

    // The other path's connection/cache is untouched: re-querying it is still
    // served from the cache rather than re-reading the file.
    logMock.mockClear();
    expect(await executeQuery<{ title: string }>(dbB, query, [1])).toEqual([
      { title: 'B First' },
    ]);
    expect(logMock).toHaveBeenCalledWith(
      'executeQuery (cached)',
      'sqlite',
      'debug',
      expect.anything(),
    );

    // The closed path was evicted: replacing its file and re-querying reads
    // the new content instead of the stale cached result.
    await rm(dbA);
    writeDb(dbA, 'A Second');
    expect(await executeQuery<{ title: string }>(dbA, query, [1])).toEqual([
      { title: 'A Second' },
    ]);
  });

  it('closeAllConnections releases the handle and cache so a replaced db is re-read', async () => {
    tempDirs.push(await mkdtemp(join(tmpdir(), 'mmm-sqlite-')));
    const dbPath = join(tempDirs.at(-1) ?? tmpdir(), 'readonly.sqlite');

    const writeDb = (title: string) => {
      const db = new DatabaseSync(dbPath);
      try {
        db.exec(`
          CREATE TABLE media (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL
          );
          INSERT INTO media (title) VALUES ('${title}');
        `);
      } finally {
        db.close();
      }
    };

    writeDb('First Song');
    expect(
      await executeQuery<{ title: string }>(
        dbPath,
        'SELECT title FROM media WHERE id = ?',
        [1],
      ),
    ).toEqual([{ title: 'First Song' }]);

    await closeAllConnections();

    await rm(dbPath);
    writeDb('Second Song');

    expect(
      await executeQuery<{ title: string }>(
        dbPath,
        'SELECT title FROM media WHERE id = ?',
        [1],
      ),
    ).toEqual([{ title: 'Second Song' }]);
  });
});
