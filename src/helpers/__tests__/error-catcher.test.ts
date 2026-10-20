import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    errorCatcher(undefined);
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('reports synchronously and returns nothing to await', async () => {
    const { errorCatcher } = await import('../error-catcher');
    const error = new Error('sync report');

    const result: unknown = errorCatcher(error);

    expect(result).toBeUndefined();
    expect(captureExceptionMock).toHaveBeenCalledWith(error, undefined);
  });

  it('drops raw DOM events instead of reporting them', async () => {
    const { errorCatcher } = await import('../error-catcher');
    errorCatcher(new Event('error'));
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('reports only the cause when an error wraps one, not the wrapper too', async () => {
    const { errorCatcher } = await import('../error-catcher');
    const cause = new Error('root cause');
    const wrapper = new Error('wrapper', { cause });

    errorCatcher(wrapper);

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(cause, undefined);
  });

  it('drops a raw DOM event cause instead of reporting it', async () => {
    const { errorCatcher } = await import('../error-catcher');
    const wrapper = new Error('wrapper', { cause: new Event('error') });

    errorCatcher(wrapper);

    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('reports the outer wrapper instead of a non-Error DOM cause like MediaError', async () => {
    const { errorCatcher } = await import('../error-catcher');
    // MediaError isn't defined in the test environment - approximate the
    // real shape (a plain object with code/message, not an Error/Event) that
    // <video>/<audio> 'error' events attach.
    const mediaError = { code: 4, message: '' };
    const wrapper = new Error('Unknown VideoRef Error', { cause: mediaError });

    errorCatcher(wrapper);

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(wrapper, undefined);
  });

  it('groups node fs errors by code/syscall/function instead of the dynamic path in the message', async () => {
    const { errorCatcher } = await import('../error-catcher');
    const error = Object.assign(
      new Error("ENOENT: no such file or directory, rename 'a' -> 'b'"),
      { code: 'ENOENT', syscall: 'rename' },
    );

    errorCatcher(error, {
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

    errorCatcher(error);

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

    errorCatcher(error);

    expect(captureExceptionMock).toHaveBeenCalledWith(error, undefined);
  });
});

// MMM-V2-3M7/3M9: a full disk is the user's to fix once they've been told.
describe('errorCatcher with a full disk', () => {
  const diskFullError = () =>
    new Error(
      "Error invoking remote method 'unzip': Error: ENOSPC: no space left on device, write",
    );
  const onDiskFull = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    globalThis.addEventListener('diskFullError', onDiskFull);
  });

  afterEach(() => {
    globalThis.removeEventListener('diskFullError', onDiskFull);
  });

  it('tells the user, and reports it while they have not been warned', async () => {
    const { errorCatcher } = await import('../error-catcher');
    const error = diskFullError();

    errorCatcher(error);

    expect(onDiskFull).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(error, undefined);
  });

  it('tells the user, but stops reporting it once they have been warned', async () => {
    const { errorCatcher, markUserWarnedAboutDiskSpace } =
      await import('../error-catcher');
    markUserWarnedAboutDiskSpace();

    errorCatcher(diskFullError());

    expect(onDiskFull).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('still reports the error that first warns the user', async () => {
    const { errorCatcher, markUserWarnedAboutDiskSpace } =
      await import('../error-catcher');
    // The main window's listener shows the warning, which marks the user
    // as warned, synchronously from within errorCatcher.
    onDiskFull.mockImplementationOnce(() => markUserWarnedAboutDiskSpace());

    errorCatcher(diskFullError());
    errorCatcher(diskFullError());

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
  });
});
