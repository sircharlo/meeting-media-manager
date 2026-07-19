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
});
