import { beforeEach, describe, expect, it, vi } from 'vitest';

// test/vitest/setup/setup.quasar.ts globally stubs this module out for
// every quasar-project test; undo that here to exercise the real thing.
vi.unmock('src/helpers/error-catcher');

const captureExceptionMock = vi.fn();

vi.mock('@sentry/vue', () => ({
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

describe('errorCatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('does nothing for a falsy error', async () => {
    const { errorCatcher } = await import('../error-catcher');
    await errorCatcher(undefined);
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('drops raw DOM events instead of reporting them', async () => {
    const { errorCatcher } = await import('../error-catcher');
    await errorCatcher(new Event('error'));
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('reports only the cause when an error wraps one, not the wrapper too', async () => {
    const { errorCatcher } = await import('../error-catcher');
    const cause = new Error('root cause');
    const wrapper = new Error('wrapper', { cause });

    await errorCatcher(wrapper);

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(cause, undefined);
  });

  it('drops a raw DOM event cause instead of reporting it', async () => {
    const { errorCatcher } = await import('../error-catcher');
    const wrapper = new Error('wrapper', { cause: new Event('error') });

    await errorCatcher(wrapper);

    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('groups node fs errors by code/syscall/function instead of the dynamic path in the message', async () => {
    const { errorCatcher } = await import('../error-catcher');
    const error = Object.assign(
      new Error("ENOENT: no such file or directory, rename 'a' -> 'b'"),
      { code: 'ENOENT', syscall: 'rename' },
    );

    await errorCatcher(error, {
      contexts: { fn: { name: 'getMediaFromJwPlaylist rename thumbnail' } },
    });

    expect(captureExceptionMock).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        fingerprint: [
          'node-fs-error',
          'ENOENT',
          'rename',
          'getMediaFromJwPlaylist rename thumbnail',
        ],
      }),
    );
  });

  it('falls back to "unknown" in the fingerprint when no function name is given', async () => {
    const { errorCatcher } = await import('../error-catcher');
    const error = Object.assign(new Error('EPERM: operation not permitted'), {
      code: 'EPERM',
      syscall: 'open',
    });

    await errorCatcher(error);

    expect(captureExceptionMock).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        fingerprint: ['node-fs-error', 'EPERM', 'open', 'unknown'],
      }),
    );
  });

  it('leaves non-fs errors ungrouped (default Sentry grouping)', async () => {
    const { errorCatcher } = await import('../error-catcher');
    const error = new Error('Something else went wrong');

    await errorCatcher(error);

    expect(captureExceptionMock).toHaveBeenCalledWith(error, undefined);
  });
});
