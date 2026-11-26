import { beforeEach, describe, expect, it, vi } from 'vitest';

type ExecFileCallback = (
  error: (Error & { code?: null | number | string; killed?: boolean }) | null,
  stdout: string,
  stderr: string,
) => void;

const mocks = vi.hoisted(() => ({
  captureElectronError: vi.fn(),
  constants: { APP_STORE: 'snap-store' as null | string },
  execFile: vi.fn(),
}));

vi.mock('node:child_process', () => ({ execFile: mocks.execFile }));
vi.mock('src-electron/constants', () => mocks.constants);
vi.mock('src-electron/main/utils', () => ({
  captureElectronError: mocks.captureElectronError,
}));

/** An error like execFile's when snapctl exits with `code`. */
const exitError = (code: null | number | string, killed = false) =>
  Object.assign(new Error(`Command failed: snapctl (${code})`), {
    code,
    killed,
  });

/**
 * Answers `snapctl is-connected <plug>` from `answers`: connected (true),
 * not connected (false), or an error with its stderr.
 */
const answerSnapctl = (
  answers: Record<string, boolean | { error: Error; stderr: string }>,
) => {
  mocks.execFile.mockImplementation(
    (
      _file: string,
      args: string[],
      _options: unknown,
      callback: ExecFileCallback,
    ) => {
      const answer = answers[args[1] ?? ''];
      if (answer === true) callback(null, '', '');
      else if (answer === false) callback(exitError(1), '', '');
      else if (answer) callback(answer.error, '', answer.stderr);
    },
  );
};

beforeEach(() => {
  vi.resetModules();
  mocks.captureElectronError.mockReset();
  mocks.execFile.mockReset();
  mocks.constants.APP_STORE = 'snap-store';
});

describe('isSnapPlugConnected', () => {
  it('asks snapctl whether the plug is connected', async () => {
    answerSnapctl({ 'removable-media': true });
    const { isSnapPlugConnected } = await import('../snap');

    expect(await isSnapPlugConnected('removable-media')).toBe(true);
    expect(mocks.execFile).toHaveBeenCalledWith(
      '/usr/bin/snapctl',
      ['is-connected', 'removable-media'],
      expect.objectContaining({ timeout: expect.any(Number) }),
      expect.any(Function),
    );
  });

  it('reads exit code 1 without an error message as not connected', async () => {
    answerSnapctl({ 'removable-media': false });
    const { isSnapPlugConnected } = await import('../snap');

    expect(await isSnapPlugConnected('removable-media')).toBe(false);
    expect(mocks.captureElectronError).not.toHaveBeenCalled();
  });

  it("reports what snapctl said when it fails, and can't tell", async () => {
    const stderr =
      'error: error running snapctl: snap "meeting-media-manager" has no plug or slot named "removable-media"';
    answerSnapctl({
      'removable-media': { error: exitError(1), stderr: `${stderr}\n` },
    });
    const { isSnapPlugConnected } = await import('../snap');

    expect(await isSnapPlugConnected('removable-media')).toBeNull();
    expect(mocks.captureElectronError).toHaveBeenCalledWith(expect.any(Error), {
      contexts: {
        fn: {
          code: 1,
          killed: false,
          name: 'isSnapPlugConnected',
          plug: 'removable-media',
          stderr,
        },
      },
    });
  });

  it("can't tell without snapctl, or when it times out", async () => {
    answerSnapctl({
      'password-manager-service': { error: exitError(null, true), stderr: '' },
      'removable-media': { error: exitError('ENOENT'), stderr: '' },
    });
    const { isSnapPlugConnected } = await import('../snap');

    expect(await isSnapPlugConnected('removable-media')).toBeNull();
    expect(await isSnapPlugConnected('password-manager-service')).toBeNull();
    expect(mocks.captureElectronError).toHaveBeenCalledTimes(2);
  });
});

describe('getSnapConnections', () => {
  it("gives each interface's state, leaving out those snapctl can't tell about", async () => {
    answerSnapctl({
      'password-manager-service': { error: exitError('ENOENT'), stderr: '' },
      'removable-media': false,
    });
    const { getSnapConnections } = await import('../snap');

    expect(await getSnapConnections()).toEqual({ 'removable-media': false });
  });

  it('tells both when snapctl answers for both', async () => {
    answerSnapctl({
      'password-manager-service': true,
      'removable-media': false,
    });
    const { getSnapConnections } = await import('../snap');

    expect(await getSnapConnections()).toEqual({
      'password-manager-service': true,
      'removable-media': false,
    });
  });

  it("is null outside M³'s snap, without running snapctl", async () => {
    mocks.constants.APP_STORE = null;
    const { getSnapConnections } = await import('../snap');

    expect(await getSnapConnections()).toBeNull();
    expect(mocks.execFile).not.toHaveBeenCalled();
  });
});
