import { captureException } from '@sentry/electron/main';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as UtilsModule from '../utils';

vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn(() => '/mock/app'),
    getPath: vi.fn(),
    getVersion: vi.fn(),
    once: vi.fn(),
  },
}));

vi.mock('#q-app/electron/main', () => ({
  resolveElectronAssetsPath: vi.fn(),
}));

vi.mock('@sentry/electron/main', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock('src-electron/main/session', () => ({
  urlVariables: {},
}));

vi.mock('src-electron/constants', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  IS_DEV: false,
}));

vi.mock('app/package.json', () => ({
  version: '1.0.0',
}));

// test/vitest/setup/setup.electron.ts replaces captureElectronError with a
// stub for every electron test - this file tests the real one.
const { captureElectronError } =
  await vi.importActual<typeof UtilsModule>('../utils');

// Main-process fs errors used to group by their full message - one Sentry
// issue per file path (e.g. MMM-V2-3KB..3KF) - unlike the renderer's
// errorCatcher, which already fingerprinted them.
describe('captureElectronError', () => {
  beforeEach(() => {
    vi.mocked(captureException).mockClear();
  });

  it('fingerprints fs errors by code, syscall and function name, not path', () => {
    const error = Object.assign(
      new Error("EPERM: operation not permitted, open 'E:/a/b.jwpub'"),
      { code: 'EPERM', syscall: 'open' },
    );

    captureElectronError(error, {
      contexts: { fn: { name: 'unzipFile pipeline' } },
    });

    expect(captureException).toHaveBeenCalledWith(error, {
      contexts: { fn: { name: 'unzipFile pipeline' } },
      fingerprint: ['node-fs-error', 'EPERM', 'open', 'unzipFile pipeline'],
    });
  });

  it('leaves non-fs errors to the default grouping', () => {
    const error = new Error('Something else');
    const context = { contexts: { fn: { name: 'x' } } };

    captureElectronError(error, context);

    expect(captureException).toHaveBeenCalledWith(error, context);
  });
});
