import { beforeEach, describe, expect, it, vi } from 'vitest';

// BE-5 (full-audit-2026-09-04.md): writes previously went straight to the
// final path, so a crash mid-write could leave truncated/invalid JSON there.
// These tests confirm writes go through a temp-file-then-rename sequence
// (atomic on the same filesystem), that a failed write/rename doesn't leave
// a lingering temp file, and that a file which exists but fails to parse is
// distinguished (via a breadcrumb) from a genuinely absent file.
const mocks = vi.hoisted(() => ({
  addElectronBreadcrumb: vi.fn(),
  ensureDir: vi.fn().mockResolvedValue(undefined),
  ensureDirSync: vi.fn(),
  pathExists: vi.fn(),
  pathExistsSync: vi.fn(),
  readdir: vi.fn(),
  readJson: vi.fn(),
  readJsonSync: vi.fn(),
  remove: vi.fn().mockResolvedValue(undefined),
  removeSync: vi.fn(),
  rename: vi.fn().mockResolvedValue(undefined),
  renameSync: vi.fn(),
  stat: vi.fn(),
  writeJson: vi.fn().mockResolvedValue(undefined),
  writeJsonSync: vi.fn(),
}));

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/tmp/electron-userdata') },
}));

vi.mock('fs-extra/esm', () => ({
  ensureDir: mocks.ensureDir,
  ensureDirSync: mocks.ensureDirSync,
  pathExists: mocks.pathExists,
  pathExistsSync: mocks.pathExistsSync,
  readJson: mocks.readJson,
  readJsonSync: mocks.readJsonSync,
  remove: mocks.remove,
  removeSync: mocks.removeSync,
  writeJson: mocks.writeJson,
  writeJsonSync: mocks.writeJsonSync,
}));

vi.mock('node:fs', () => ({
  renameSync: mocks.renameSync,
}));

vi.mock('node:fs/promises', () => ({
  readdir: mocks.readdir,
  rename: mocks.rename,
  stat: mocks.stat,
}));

vi.mock('src-electron/main/utils', () => ({
  addElectronBreadcrumb: mocks.addElectronBreadcrumb,
}));

describe('writeJsonResilient (atomic writes)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.ensureDir.mockResolvedValue(undefined);
    mocks.writeJson.mockResolvedValue(undefined);
    mocks.rename.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
  });

  it('writes to a temp path and renames it over the destination, not writing the destination directly', async () => {
    const { writeJsonResilient } = await import('../resilient-storage');

    await writeJsonResilient('/data', 'crash-count.json', { count: 1 });

    expect(mocks.writeJson).toHaveBeenCalledTimes(1);
    const writtenPath = mocks.writeJson.mock.calls[0]?.[0] as string;
    expect(writtenPath).not.toBe('/data/crash-count.json');
    expect(writtenPath).toContain('crash-count.json');
    expect(writtenPath).toContain('.tmp');

    expect(mocks.rename).toHaveBeenCalledWith(
      writtenPath,
      '/data/crash-count.json',
    );
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('cleans up the temp file when the rename fails, then falls back to the fallback directory', async () => {
    mocks.rename.mockRejectedValueOnce(new Error('rename failed'));
    const { writeJsonResilient } = await import('../resilient-storage');

    await writeJsonResilient('/data', 'crash-count.json', { count: 1 });

    // First attempt (primary dir): temp file removed after the failed rename.
    expect(mocks.remove).toHaveBeenCalledWith(expect.stringContaining('.tmp'));
    // Fell through to the fallback directory and succeeded there.
    expect(mocks.writeJson).toHaveBeenCalledTimes(2);
    expect(mocks.rename).toHaveBeenCalledTimes(2);
  });

  it('throws the original primary-directory error when the fallback also fails', async () => {
    mocks.writeJson
      .mockRejectedValueOnce(new Error('primary disk full'))
      .mockRejectedValueOnce(new Error('fallback disk full too'));
    const { writeJsonResilient } = await import('../resilient-storage');

    await expect(
      writeJsonResilient('/data', 'crash-count.json', { count: 1 }),
    ).rejects.toThrow('primary disk full');
  });
});

describe('writeJsonResilientSync (atomic writes)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('writes to a temp path and renames it over the destination', async () => {
    const { writeJsonResilientSync } = await import('../resilient-storage');

    writeJsonResilientSync('/data', 'hw-accel-disabled.json', {
      disabled: true,
    });

    const writtenPath = mocks.writeJsonSync.mock.calls[0]?.[0] as string;
    expect(writtenPath).not.toBe('/data/hw-accel-disabled.json');
    expect(writtenPath).toContain('.tmp');
    expect(mocks.renameSync).toHaveBeenCalledWith(
      writtenPath,
      '/data/hw-accel-disabled.json',
    );
  });

  it('removes the temp file if the sync rename throws', async () => {
    mocks.renameSync.mockImplementationOnce(() => {
      throw new Error('rename failed');
    });
    const { writeJsonResilientSync } = await import('../resilient-storage');

    writeJsonResilientSync('/data', 'hw-accel-disabled.json', {
      disabled: true,
    });

    expect(mocks.removeSync).toHaveBeenCalledWith(
      expect.stringContaining('.tmp'),
    );
  });
});

describe('readJsonResilient / readJsonResilientSync (corruption detection)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('breadcrumbs and falls back when the primary file exists but fails to parse', async () => {
    mocks.pathExists.mockResolvedValueOnce(true); // primary exists
    mocks.readJson.mockResolvedValueOnce(null); // ...but fails to parse
    mocks.pathExists.mockResolvedValueOnce(false); // no fallback file either
    const { readJsonResilient } = await import('../resilient-storage');

    const result = await readJsonResilient('/data', 'crash-count.json');

    expect(result).toBeNull();
    expect(mocks.addElectronBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'resilient-storage',
        level: 'warning',
      }),
    );
  });

  it('does not breadcrumb when the primary file simply does not exist', async () => {
    mocks.pathExists.mockResolvedValueOnce(false);
    mocks.pathExists.mockResolvedValueOnce(false);
    const { readJsonResilient } = await import('../resilient-storage');

    await readJsonResilient('/data', 'crash-count.json');

    expect(mocks.addElectronBreadcrumb).not.toHaveBeenCalled();
  });

  it('sync variant also breadcrumbs on a parse failure, not on a missing file', () => {
    mocks.pathExistsSync.mockReturnValueOnce(true);
    mocks.readJsonSync.mockReturnValueOnce(null);
    mocks.pathExistsSync.mockReturnValueOnce(false);

    // resilient-storage caches by (dir, fileName) at module scope - use a
    // fresh module instance so this doesn't hit the previous test's cache.
    return import('../resilient-storage').then(({ readJsonResilientSync }) => {
      const result = readJsonResilientSync('/data', 'crash-count.json');

      expect(result).toBeNull();
      expect(mocks.addElectronBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'resilient-storage' }),
      );
    });
  });
});
