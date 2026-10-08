import { beforeEach, describe, expect, it, vi } from 'vitest';

const errorCatcherMock = vi.fn();
const readdirMock = vi.fn();
const removeMock = vi.fn();
const pathExistsMock = vi.fn(async () => true);
const closeSqliteConnectionsMock = vi.fn(async () => undefined);
const getAdditionalMediaPathMock = vi.fn(async () => '/additional-media');

const congregationSettingsStore = {
  congregations: {} as Record<string, unknown>,
};
const currentStateStore = {
  currentSettings: undefined as Record<string, unknown> | undefined,
  currentSongbook: { pub: 'sjj' } as { pub?: string },
};

vi.mock('src/helpers/date', () => ({
  updateLookupPeriod: vi.fn(),
}));

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: (...args: unknown[]) => errorCatcherMock(...args),
}));

vi.mock('src/helpers/usage', () => ({
  getLastUsedDate: vi.fn(async () => undefined),
  LAST_USED_FILENAME: '.last-used',
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

vi.mock('src/utils/fs', () => ({
  congPreferencesPath: vi.fn(async () => '/cong-preferences'),
  getAdditionalMediaPath: getAdditionalMediaPathMock,
  getParentDirectory: vi.fn(),
  getPublicationDirectory: vi.fn(),
  getPublicationsPath: vi.fn(async () => '/publications'),
  getTempPath: vi.fn(async () => '/temp'),
  removeEmptyDirs: vi.fn(),
}));

vi.mock('src/utils/jw', () => ({
  getPubId: vi.fn(),
}));

vi.mock('stores/congregation-settings', () => ({
  useCongregationSettingsStore: () => congregationSettingsStore,
}));

vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => currentStateStore,
}));

vi.mock('stores/jw', () => ({
  useJwStore: () => ({ lookupPeriod: {} }),
}));

// src/utils/date is intentionally left unmocked: the whole point of these
// tests is to exercise the real dateFromString/getSpecificWeekday/isInPast
// logic against the folder-name shapes the app actually creates on disk.

const pad = (n: number) => String(n).padStart(2, '0');

/** A date offset far enough from today that it's unambiguously in the
 * past/future regardless of which weekday the test happens to run on. */
const offsetDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const toYYYYMMDD = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

const toDashed = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const pastYYYYMMDD = toYYYYMMDD(offsetDate(-14));
const pastDashed = toDashed(offsetDate(-14));
const futureYYYYMMDD = toYYYYMMDD(offsetDate(14));

describe('cleanCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    congregationSettingsStore.congregations = { congA: {} };
    currentStateStore.currentSettings = {
      enableFolderWatcher: true,
      enableMediaAutoExport: true,
      folderToWatch: '/watch',
      mediaAutoExportFolder: '/export',
    };

    pathExistsMock.mockResolvedValue(true);
    removeMock.mockResolvedValue(undefined);
    getAdditionalMediaPathMock.mockResolvedValue('/additional-media');

    const dir = (name: string, isDirectory = true) => ({
      isDirectory,
      isFile: !isDirectory,
      name,
    });

    readdirMock.mockImplementation(async (root: string) => {
      switch (root) {
        // Additional Media dated folders use YYYYMMDD (no dashes)
        case '/additional-media/congA':
          return [dir(pastYYYYMMDD), dir(futureYYYYMMDD)];
        case '/export':
          return [dir(pastDashed)];
        // folderToWatch and mediaAutoExportFolder dated folders use
        // YYYY-MM-DD (with dashes) - see ensureWatchedMeetingDayFolders
        // and getDestinationFolder.
        case '/watch':
          return [
            dir(pastDashed),
            dir('Additional Media'),
            dir('readme.txt', false),
          ];
        default:
          return [];
      }
    });

    vi.stubGlobal('electronApi', {
      fs: {
        pathExists: pathExistsMock,
        remove: removeMock,
      },
      join: (...parts: string[]) => parts.join('/'),
      normalize: (p: string) => p,
      readdir: readdirMock,
    });
  });

  // cleanDateFolders() runs fire-and-forget inside cleanCache(), so give its
  // internal promise chain (readdir -> filter -> Promise.allSettled(remove))
  // a tick to settle before asserting.
  const flush = () =>
    new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

  it('deletes past-dated Additional Media folders (YYYYMMDD) but keeps future ones', async () => {
    const { cleanCache } = await import('../cleanup');
    await cleanCache();
    await flush();
    expect(removeMock).toHaveBeenCalledWith(
      `/additional-media/congA/${pastYYYYMMDD}`,
    );
    expect(removeMock).not.toHaveBeenCalledWith(
      `/additional-media/congA/${futureYYYYMMDD}`,
    );
  });

  it('deletes past-dated folderToWatch folders (YYYY-MM-DD)', async () => {
    const { cleanCache } = await import('../cleanup');
    await cleanCache();
    await flush();
    expect(removeMock).toHaveBeenCalledWith(`/watch/${pastDashed}`);
  });

  it('deletes past-dated mediaAutoExportFolder folders (YYYY-MM-DD)', async () => {
    const { cleanCache } = await import('../cleanup');
    await cleanCache();
    await flush();
    expect(removeMock).toHaveBeenCalledWith(`/export/${pastDashed}`);
  });

  it('skips non-date sibling entries in a watched folder without reporting errors', async () => {
    const { cleanCache } = await import('../cleanup');
    await cleanCache();
    await flush();
    expect(removeMock).not.toHaveBeenCalledWith('/watch/Additional Media');
    expect(removeMock).not.toHaveBeenCalledWith('/watch/readme.txt');
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('still cleans folderToWatch/mediaAutoExportFolder when Additional Media path resolution fails', async () => {
    getAdditionalMediaPathMock.mockRejectedValue(new Error('IPC not ready'));
    const { cleanCache } = await import('../cleanup');

    await expect(cleanCache()).resolves.toBe(false);
    await flush();

    expect(removeMock).toHaveBeenCalledWith(`/watch/${pastDashed}`);
    expect(removeMock).toHaveBeenCalledWith(`/export/${pastDashed}`);
    expect(errorCatcherMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: expect.objectContaining({
          fn: expect.objectContaining({
            name: 'cleanCache (additional media)',
          }),
        }),
      }),
    );
  });
});

describe('deleteCacheFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    congregationSettingsStore.congregations = { congA: {} };
    currentStateStore.currentSettings = {};
    currentStateStore.currentSongbook = { pub: 'sjj' };

    pathExistsMock.mockResolvedValue(true);
    removeMock.mockResolvedValue(undefined);
    getAdditionalMediaPathMock.mockResolvedValue('/additional-media');
    readdirMock.mockResolvedValue([]);

    vi.stubGlobal('electronApi', {
      closeSqliteConnections: closeSqliteConnectionsMock,
      fs: {
        pathExists: pathExistsMock,
        remove: removeMock,
      },
      join: (...parts: string[]) => parts.join('/'),
      normalize: (p: string) => p,
      readdir: readdirMock,
    });
  });

  it('closes sqlite connections before deleting cache files', async () => {
    const { deleteCacheFiles } = await import('../cleanup');

    await deleteCacheFiles('all');

    expect(closeSqliteConnectionsMock).toHaveBeenCalledOnce();
  });
});
