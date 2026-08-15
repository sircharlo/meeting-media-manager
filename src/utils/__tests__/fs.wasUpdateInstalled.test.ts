import { basePath } from 'app/test/vitest/mocks/electronApi';
import { join } from 'upath';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

// A cong preferences folder living under a cloud-synced path (OneDrive here,
// matching MMM-V2-3AK) - isPossiblyNetworkFolderPath matches on an
// 'onedrive' path segment. isUsablePath is stubbed to always succeed in this
// mock (see test/vitest/mocks/electronApi.ts), so this doesn't need to be a
// real writable custom-path probe target.
const oneDrivePath = join(basePath, 'OneDrive', 'wasUpdateInstalled-test');

describe('wasUpdateInstalled - cloud-synced cong preferences path', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not report a transient UNKNOWN read error from a cloud-synced path', async () => {
    const { fs } = globalThis.electronApi;
    vi.spyOn(fs, 'pathExists').mockImplementation(async () => true);
    vi.spyOn(fs, 'readFile').mockRejectedValue(
      Object.assign(new Error('UNKNOWN: unknown error, read'), {
        code: 'UNKNOWN',
      }),
    );

    const { registerCachePathProvider, wasUpdateInstalled } =
      await import('../fs');
    registerCachePathProvider(() => oneDrivePath);
    const { errorCatcher } = await import('src/helpers/error-catcher');

    const result = await wasUpdateInstalled('cong-1');

    expect(result).toBe(false);
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('still reports a genuine (non-network-flake) error from the same path', async () => {
    const { fs } = globalThis.electronApi;
    vi.spyOn(fs, 'pathExists').mockImplementation(async () => true);
    vi.spyOn(fs, 'readFile').mockRejectedValue(
      Object.assign(new Error('EACCES: permission denied, read'), {
        code: 'EACCES',
      }),
    );

    const { registerCachePathProvider, wasUpdateInstalled } =
      await import('../fs');
    registerCachePathProvider(() => oneDrivePath);
    const { errorCatcher } = await import('src/helpers/error-catcher');

    const result = await wasUpdateInstalled('cong-2');

    expect(result).toBe(false);
    expect(errorCatcher).toHaveBeenCalledTimes(1);
  });
});
