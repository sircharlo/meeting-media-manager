import { beforeEach, describe, expect, it, vi } from 'vitest';

const errorCatcherMock = vi.fn();

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: (...args: unknown[]) => errorCatcherMock(...args),
}));

const pathExistsMock = vi.fn();
const readFileMock = vi.fn();
const writeFileMock = vi.fn();
const hideFileOnWindowsMock = vi.fn();
const showFileOnWindowsMock = vi.fn();

const lockError = (code: string) => Object.assign(new Error(code), { code });

describe('usage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    hideFileOnWindowsMock.mockResolvedValue(undefined);
    pathExistsMock.mockResolvedValue(true);
    showFileOnWindowsMock.mockResolvedValue(undefined);

    vi.stubGlobal('electronApi', {
      fs: {
        pathExists: pathExistsMock,
        readFile: readFileMock,
        writeFile: writeFileMock,
      },
      hideFileOnWindows: hideFileOnWindowsMock,
      join: (...parts: string[]) => parts.join('/'),
      PLATFORM: 'win32',
      showFileOnWindows: showFileOnWindowsMock,
    });
  });

  describe('updateLastUsedDate', () => {
    it('retries an EPERM on writeFile and succeeds on Windows', async () => {
      readFileMock.mockResolvedValue('');
      writeFileMock
        .mockRejectedValueOnce(lockError('EPERM'))
        .mockResolvedValueOnce(undefined);

      const { updateLastUsedDate } = await import('../usage');
      await updateLastUsedDate('/cache/pub', '2026-07-20');

      expect(writeFileMock).toHaveBeenCalledTimes(2);
      expect(writeFileMock).toHaveBeenCalledWith(
        '/cache/pub/.last-used',
        '2026-07-20',
        'utf-8',
      );
      expect(errorCatcherMock).not.toHaveBeenCalled();
    });

    it('gives up after exhausting retries and reports the error', async () => {
      writeFileMock.mockRejectedValue(lockError('EPERM'));

      const { updateLastUsedDate } = await import('../usage');
      await updateLastUsedDate('/cache/pub', '2026-07-20');

      // Initial attempt + 4 retries = 5 calls
      expect(writeFileMock).toHaveBeenCalledTimes(5);
      expect(hideFileOnWindowsMock).not.toHaveBeenCalled();
      expect(errorCatcherMock).toHaveBeenCalledTimes(1);
    });

    it('does not retry a non-lock error', async () => {
      writeFileMock.mockRejectedValue(lockError('ENOSPC'));

      const { updateLastUsedDate } = await import('../usage');
      await updateLastUsedDate('/cache/pub', '2026-07-20');

      expect(writeFileMock).toHaveBeenCalledTimes(1);
      expect(errorCatcherMock).toHaveBeenCalledTimes(1);
    });

    it('does not retry EPERM on non-Windows platforms', async () => {
      vi.stubGlobal('electronApi', {
        fs: {
          pathExists: pathExistsMock,
          readFile: readFileMock,
          writeFile: writeFileMock,
        },
        hideFileOnWindows: hideFileOnWindowsMock,
        join: (...parts: string[]) => parts.join('/'),
        PLATFORM: 'darwin',
        showFileOnWindows: showFileOnWindowsMock,
      });
      writeFileMock.mockRejectedValue(lockError('EPERM'));

      const { updateLastUsedDate } = await import('../usage');
      await updateLastUsedDate('/cache/pub', '2026-07-20');

      expect(writeFileMock).toHaveBeenCalledTimes(1);
      expect(errorCatcherMock).toHaveBeenCalledTimes(1);
    });

    // MMM-V2-3GD: persisted media can point at a folder on a drive that no
    // longer exists; marking it must not try to recreate it.
    it('does nothing for a folder that does not exist', async () => {
      pathExistsMock.mockResolvedValue(false);

      const { updateLastUsedDate } = await import('../usage');
      await updateLastUsedDate('E:/M3/Publications/pub', '2026-07-20');

      expect(writeFileMock).not.toHaveBeenCalled();
      expect(errorCatcherMock).not.toHaveBeenCalled();
    });

    it('creates a missing marker without un-hiding or reading it first', async () => {
      pathExistsMock.mockImplementation(
        async (path: string) => !path.endsWith('.last-used'),
      );
      writeFileMock.mockResolvedValue(undefined);

      const { updateLastUsedDate } = await import('../usage');
      await updateLastUsedDate('/cache/pub', '2026-07-20');

      expect(showFileOnWindowsMock).not.toHaveBeenCalled();
      expect(readFileMock).not.toHaveBeenCalled();
      expect(writeFileMock).toHaveBeenCalledWith(
        '/cache/pub/.last-used',
        '2026-07-20',
        'utf-8',
      );
      expect(hideFileOnWindowsMock).toHaveBeenCalledWith(
        '/cache/pub/.last-used',
      );
    });

    // MMM-V2-3KK: the folder existed when checked, then vanished; marking
    // it used to try to recreate it and reported the failed mkdir.
    it('treats a folder that vanishes mid-update as nothing to mark', async () => {
      readFileMock.mockResolvedValue('');
      writeFileMock.mockRejectedValue(lockError('ENOENT'));

      const { updateLastUsedDate } = await import('../usage');
      await updateLastUsedDate('/cache/pub', '2026-07-20');

      expect(writeFileMock).toHaveBeenCalledTimes(1);
      expect(errorCatcherMock).not.toHaveBeenCalled();
    });

    it('coalesces concurrent calls for the same folder into a single attempt', async () => {
      // Matches MMM-V2-3EX: a bulk prefetch calling this once per date for a
      // shared publication folder (e.g. background music) produced dozens of
      // duplicate reports for what was really one persistently locked drive.
      writeFileMock.mockRejectedValue(lockError('EPERM'));

      const { updateLastUsedDate } = await import('../usage');
      await Promise.all([
        updateLastUsedDate('/cache/pub', '2026-07-20'),
        updateLastUsedDate('/cache/pub', '2026-07-20'),
        updateLastUsedDate('/cache/pub', '2026-07-20'),
      ]);

      // Initial attempt + 4 retries = 5 calls, once, not once per caller.
      expect(writeFileMock).toHaveBeenCalledTimes(5);
      expect(errorCatcherMock).toHaveBeenCalledTimes(1);
    });

    it('does not coalesce calls for different folders', async () => {
      writeFileMock.mockRejectedValue(lockError('EPERM'));

      const { updateLastUsedDate } = await import('../usage');
      await Promise.all([
        updateLastUsedDate('/cache/pub-a', '2026-07-20'),
        updateLastUsedDate('/cache/pub-b', '2026-07-20'),
      ]);

      expect(writeFileMock).toHaveBeenCalledTimes(10);
      expect(errorCatcherMock).toHaveBeenCalledTimes(2);
    });

    it('runs a later call again once the in-flight one for the same folder has settled', async () => {
      writeFileMock.mockRejectedValue(lockError('EPERM'));

      const { updateLastUsedDate } = await import('../usage');
      await updateLastUsedDate('/cache/pub', '2026-07-20');
      await updateLastUsedDate('/cache/pub', '2026-07-21');

      expect(writeFileMock).toHaveBeenCalledTimes(10);
      expect(errorCatcherMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('getLastUsedDate', () => {
    it('retries a locked read and returns the eventual result', async () => {
      readFileMock
        .mockRejectedValueOnce(lockError('EBUSY'))
        .mockResolvedValueOnce('2026-07-19');

      const { getLastUsedDate } = await import('../usage');
      const result = await getLastUsedDate('/cache/pub');

      expect(readFileMock).toHaveBeenCalledTimes(2);
      expect(result).toBe('2026-07-19');
    });

    it('returns null when the file genuinely does not exist', async () => {
      readFileMock.mockRejectedValue(lockError('ENOENT'));

      const { getLastUsedDate } = await import('../usage');
      const result = await getLastUsedDate('/cache/pub');

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('accepts a YYYYMMDD date with no separators', async () => {
      readFileMock.mockResolvedValue('20260719');

      const { getLastUsedDate } = await import('../usage');
      const result = await getLastUsedDate('/cache/pub');

      expect(result).toBe('20260719');
    });

    it('returns null for a corrupted date string (partial-write leftovers)', async () => {
      readFileMock.mockResolvedValue('2026021717');

      const { getLastUsedDate } = await import('../usage');
      const result = await getLastUsedDate('/cache/pub');

      expect(result).toBeNull();
    });
  });
});
