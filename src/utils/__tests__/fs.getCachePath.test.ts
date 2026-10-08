import { installPinia } from 'app/test/vitest/mocks/pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

installPinia();

const errorCatcherMock = vi.fn();

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: (...args: unknown[]) => errorCatcherMock(...args),
}));

describe('getCachePath falsy base path guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('reports a self-describing error and still falls back when the base path resolver returns null', async () => {
    const realElectronApi = globalThis.electronApi;
    vi.stubGlobal('electronApi', {
      ...realElectronApi,
      getAppDataPath: vi
        .fn()
        // First call (inside getCachedUserDataPath) returns falsy...
        .mockResolvedValueOnce(null)
        // ...second call (the catch-block fallback) returns a real path.
        .mockResolvedValueOnce(realElectronApi.getAppDataPath()),
    });

    const { getFontsPath } = await import('../fs');
    const fontsPath = await getFontsPath();

    expect(fontsPath).toContain('app');
    expect(errorCatcherMock).toHaveBeenCalledTimes(1);
    const [error] = errorCatcherMock.mock.calls[0] ?? [];
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      'getCachePath: base path resolver returned a falsy value',
    );

    vi.stubGlobal('electronApi', realElectronApi);
  });

  it('invalidates the custom cache folder instead of reporting the raw error when ensureDir fails with a permission error on it', async () => {
    const realElectronApi = globalThis.electronApi;
    const customPath = 'C:/custom-cache';

    const ensureDirMock = vi.fn(async (dir: string) => {
      if (dir.startsWith(customPath)) {
        // Simulate an fs error that crossed the context bridge: only the
        // message survives, no `code`/`syscall` properties.
        throw new Error(`EACCES: permission denied, mkdir '${customPath}'`);
      }
    });

    vi.stubGlobal('electronApi', {
      ...realElectronApi,
      fs: { ...realElectronApi.fs, ensureDir: ensureDirMock },
      isUsablePath: vi.fn(async () => true),
    });

    const { getPublicationDirectory, registerCachePathProvider } =
      await import('../fs');
    registerCachePathProvider(() => customPath);

    const result = await getPublicationDirectory({
      langwritten: 'E',
      pub: 'w',
    });

    expect(result).toContain('app'); // fell back to the default app data path
    expect(ensureDirMock).toHaveBeenCalled();
    expect(errorCatcherMock).toHaveBeenCalledTimes(1);
    const [reportedError] = errorCatcherMock.mock.calls[0] ?? [];
    expect(reportedError).toBeInstanceOf(Error);
    expect((reportedError as Error).message).toContain(
      'Custom cache folder became inaccessible',
    );

    vi.stubGlobal('electronApi', realElectronApi);
  });
});
