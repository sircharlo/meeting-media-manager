import type { ElectronApi } from 'src/types';

import { electronApi } from 'app/test/vitest/mocks/electronApi';
import { errorCatcher } from 'src/helpers/error-catcher';
import { describe, expect, it, vi } from 'vitest';

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

const makeParseErrorMock = (parseError: Error | { message: string }) => {
  const overrides = {
    fileUrlToPath: (fileurl: string) => fileurl,
    fs: { ...electronApi.fs, pathExists: vi.fn(async () => true) },
    parseMediaFile: vi.fn(async () => {
      throw parseError;
    }),
    pathToFileURL: (path: string) => path,
  };
  vi.stubGlobal('electronApi', {
    ...electronApi,
    ...overrides,
  } as unknown as ElectronApi);
};

describe('getMetadataFromMediaPath', () => {
  it('silently returns default metadata on a partial-file End-Of-Stream parse failure', async () => {
    makeParseErrorMock({ message: 'End-Of-Stream' });
    vi.resetModules();
    const { getMetadataFromMediaPath } = await import('../media');

    const metadata = await getMetadataFromMediaPath(
      'C:/Users/test/Additional Media/sjjm_S_140_r720P.mp4',
    );

    expect(metadata.format.duration).toBe(0);
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('still reports genuine metadata-parse failures', async () => {
    makeParseErrorMock(new Error('boom'));
    vi.resetModules();
    const { getMetadataFromMediaPath } = await import('../media');

    const metadata = await getMetadataFromMediaPath(
      'C:/Users/test/Additional Media/sjjm_S_140_r720P.mp4',
    );

    expect(metadata.format.duration).toBe(0);
    expect(errorCatcher).toHaveBeenCalledTimes(1);
  });
});
