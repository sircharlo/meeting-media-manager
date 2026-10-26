import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkDiskSpace: vi.fn(),
  statfs: vi.fn(),
}));

vi.mock('check-disk-space', () => ({
  checkDiskSpace: mocks.checkDiskSpace,
}));

vi.mock('node:fs/promises', () => ({
  statfs: mocks.statfs,
}));

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/user-data') },
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

const GB = 1024n * 1024n * 1024n;

const mockFreeSpace = (freeBytes: bigint) => {
  mocks.statfs.mockResolvedValue({ bavail: freeBytes, bsize: 1n });
};

const mockStatfsFailure = (code: string) => {
  mocks.statfs.mockRejectedValue(
    Object.assign(new Error('statfs failed'), { code }),
  );
};

describe('getLowDiskSpaceStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports low disk space below the 10 GB warning threshold by default', async () => {
    const { getLowDiskSpaceStatus } = await import('../disk-space');
    mockFreeSpace(5n * GB);

    expect(await getLowDiskSpaceStatus()).toBe(true);
  });

  it('does not report low disk space at or above the warning threshold', async () => {
    const { getLowDiskSpaceStatus } = await import('../disk-space');
    mockFreeSpace(10n * GB);

    expect(await getLowDiskSpaceStatus()).toBe(false);
  });

  it('uses the given threshold instead, e.g. for a critical-space check', async () => {
    const { getLowDiskSpaceStatus } = await import('../disk-space');
    mockFreeSpace(5n * GB);

    expect(await getLowDiskSpaceStatus(1)).toBe(false);

    mockFreeSpace(GB / 2n);
    expect(await getLowDiskSpaceStatus(1)).toBe(true);
  });

  it.each([
    { code: 'EPERM', expected: true, freeGB: 5 },
    { code: 'ENOSYS', expected: false, freeGB: 50 },
  ])(
    'falls back to check-disk-space when statfs() fails with $code',
    async ({ code, expected, freeGB }) => {
      const { getLowDiskSpaceStatus } = await import('../disk-space');
      mockStatfsFailure(code);
      mocks.checkDiskSpace.mockResolvedValue({
        diskPath: '/',
        free: freeGB * Number(GB),
        size: 100 * Number(GB),
      });

      expect(await getLowDiskSpaceStatus()).toBe(expected);
      expect(mocks.checkDiskSpace).toHaveBeenCalledWith('/user-data');
    },
  );

  it('does not report low disk space when neither check works', async () => {
    const { getLowDiskSpaceStatus } = await import('../disk-space');
    mockStatfsFailure('EPERM');
    mocks.checkDiskSpace.mockRejectedValue(new Error('powershell not found'));

    expect(await getLowDiskSpaceStatus()).toBe(false);
  });
});
