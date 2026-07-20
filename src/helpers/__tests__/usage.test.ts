import { beforeEach, describe, expect, it, vi } from 'vitest';

const errorCatcherMock = vi.fn();

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: (...args: unknown[]) => errorCatcherMock(...args),
}));

const ensureFileMock = vi.fn();
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
    showFileOnWindowsMock.mockResolvedValue(undefined);

    vi.stubGlobal('electronApi', {
      fs: {
        ensureFile: ensureFileMock,
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
    it('retries an EPERM on ensureFile and succeeds on Windows', async () => {
      ensureFileMock
        .mockRejectedValueOnce(lockError('EPERM'))
        .mockResolvedValueOnce(undefined);
      readFileMock.mockResolvedValue('');
      writeFileMock.mockResolvedValue(undefined);

      const { updateLastUsedDate } = await import('../usage');
      await updateLastUsedDate('/cache/pub', '2026-07-20');

      expect(ensureFileMock).toHaveBeenCalledTimes(2);
      expect(writeFileMock).toHaveBeenCalledWith(
        '/cache/pub/.last-used',
        '2026-07-20',
        'utf-8',
      );
      expect(errorCatcherMock).not.toHaveBeenCalled();
    });

    it('gives up after exhausting retries and reports the error', async () => {
      ensureFileMock.mockRejectedValue(lockError('EPERM'));

      const { updateLastUsedDate } = await import('../usage');
      await updateLastUsedDate('/cache/pub', '2026-07-20');

      // Initial attempt + 2 retries = 3 calls
      expect(ensureFileMock).toHaveBeenCalledTimes(3);
      expect(writeFileMock).not.toHaveBeenCalled();
      expect(errorCatcherMock).toHaveBeenCalledTimes(1);
    });

    it('does not retry a non-lock error', async () => {
      ensureFileMock.mockRejectedValue(lockError('ENOSPC'));

      const { updateLastUsedDate } = await import('../usage');
      await updateLastUsedDate('/cache/pub', '2026-07-20');

      expect(ensureFileMock).toHaveBeenCalledTimes(1);
      expect(errorCatcherMock).toHaveBeenCalledTimes(1);
    });

    it('does not retry EPERM on non-Windows platforms', async () => {
      vi.stubGlobal('electronApi', {
        fs: {
          ensureFile: ensureFileMock,
          readFile: readFileMock,
          writeFile: writeFileMock,
        },
        hideFileOnWindows: hideFileOnWindowsMock,
        join: (...parts: string[]) => parts.join('/'),
        PLATFORM: 'darwin',
        showFileOnWindows: showFileOnWindowsMock,
      });
      ensureFileMock.mockRejectedValue(lockError('EPERM'));

      const { updateLastUsedDate } = await import('../usage');
      await updateLastUsedDate('/cache/pub', '2026-07-20');

      expect(ensureFileMock).toHaveBeenCalledTimes(1);
      expect(errorCatcherMock).toHaveBeenCalledTimes(1);
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
  });
});
