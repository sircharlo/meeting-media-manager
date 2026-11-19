import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

type ExecFileCallback = (
  error: (Error & { code?: number | string }) | null,
  stdout: string,
  stderr: string,
) => void;

const execFileMock = vi.fn(
  (_file: string, _args: string[], callback: ExecFileCallback) =>
    callback(null, '', ''),
);
const capturePreloadErrorMock = vi.fn();
const logMock = vi.fn();

vi.mock('node:child_process', () => ({ execFile: execFileMock }));
vi.mock('src-electron/constants', () => ({ PLATFORM: 'win32' }));
vi.mock('src-electron/preload/log', () => ({
  capturePreloadError: capturePreloadErrorMock,
}));
vi.mock('src/shared/vanilla', () => ({ log: logMock }));

const originalSystemRoot = process.env.SystemRoot;
const originalWindir = process.env.windir;

const loadFs = () => import('../fs');

beforeEach(() => {
  vi.resetModules();
  execFileMock.mockReset();
  execFileMock.mockImplementation((_file, _args, callback) =>
    callback(null, '', ''),
  );
  capturePreloadErrorMock.mockReset();
  logMock.mockReset();
  process.env.SystemRoot = String.raw`C:\Windows`;
  delete process.env.windir;
});

afterAll(() => {
  if (originalSystemRoot === undefined) {
    delete process.env.SystemRoot;
  } else {
    process.env.SystemRoot = originalSystemRoot;
  }
  if (originalWindir === undefined) {
    delete process.env.windir;
  } else {
    process.env.windir = originalWindir;
  }
});

describe('showFileOnWindows', () => {
  // MMM-V2-3KQ: `attrib -h` alone leaves a System file hidden (exiting 0
  // regardless), and Windows refuses to overwrite a Hidden, System or
  // Read-only file in place - the caller's next write failed with EPERM.
  it('clears the hidden, system and read-only attributes', async () => {
    const { showFileOnWindows } = await loadFs();

    await showFileOnWindows('C:/cache/Publications/lmd_T_0/.last-used');

    expect(execFileMock).toHaveBeenCalledExactlyOnceWith(
      'C:/Windows/System32/attrib.exe',
      ['-h', '-s', '-r', 'C:/cache/Publications/lmd_T_0/.last-used'],
      expect.any(Function),
    );
  });

  it('does nothing without a path', async () => {
    const { showFileOnWindows } = await loadFs();

    await showFileOnWindows('');

    expect(execFileMock).not.toHaveBeenCalled();
  });
});

describe('hideFileOnWindows', () => {
  it('hides the file through the Windows attrib command', async () => {
    const { hideFileOnWindows } = await loadFs();

    await hideFileOnWindows('C:/cache/Publications/lmd_T_0/.last-used');

    expect(execFileMock).toHaveBeenCalledExactlyOnceWith(
      'C:/Windows/System32/attrib.exe',
      ['+h', 'C:/cache/Publications/lmd_T_0/.last-used'],
      expect.any(Function),
    );
  });

  it('builds the attrib path from a Windows folder ending in a separator', async () => {
    process.env.SystemRoot = 'C:\\Windows\\';

    const { hideFileOnWindows } = await loadFs();

    await hideFileOnWindows('C:/cache/.last-used');

    expect(execFileMock).toHaveBeenCalledExactlyOnceWith(
      'C:/Windows/System32/attrib.exe',
      ['+h', 'C:/cache/.last-used'],
      expect.any(Function),
    );
  });

  it('falls back to the bare command when the Windows folder is unknown', async () => {
    delete process.env.SystemRoot;

    const { hideFileOnWindows } = await loadFs();

    await hideFileOnWindows('C:/cache/.last-used');

    expect(execFileMock).toHaveBeenCalledExactlyOnceWith(
      'attrib',
      ['+h', 'C:/cache/.last-used'],
      expect.any(Function),
    );
  });
});

// MMM-V2-3N0/3N1: a machine where attrib could not be spawned reported one
// error per marker file (40 events in under a minute on each launch).
describe('when attrib cannot run', () => {
  it('stops trying and reports nothing once it cannot be spawned at all', async () => {
    const enoent = Object.assign(new Error('spawn attrib ENOENT'), {
      code: 'ENOENT',
    });
    execFileMock.mockImplementation((_file, _args, callback) =>
      callback(enoent, '', ''),
    );

    const { hideFileOnWindows, showFileOnWindows } = await loadFs();

    await showFileOnWindows('C:/cache/a/.last-used');
    await showFileOnWindows('C:/cache/b/.last-used');
    await hideFileOnWindows('C:/cache/a/.last-used');

    expect(execFileMock).toHaveBeenCalledTimes(1);
    expect(capturePreloadErrorMock).not.toHaveBeenCalled();
    expect(logMock).toHaveBeenCalledExactlyOnceWith(
      'attrib is unavailable; skipping marker file attributes',
      'errorHandling',
      'warn',
    );
  });

  it('reports any other failure once per operation, not once per file', async () => {
    const eperm = Object.assign(new Error('EPERM: operation not permitted'), {
      code: 'EPERM',
    });
    execFileMock.mockImplementation((_file, _args, callback) =>
      callback(eperm, '', ''),
    );

    const { hideFileOnWindows, showFileOnWindows } = await loadFs();

    await showFileOnWindows('C:/cache/a/.last-used');
    await showFileOnWindows('C:/cache/b/.last-used');
    await hideFileOnWindows('C:/cache/a/.last-used');

    expect(capturePreloadErrorMock).toHaveBeenCalledTimes(2);
    expect(capturePreloadErrorMock).toHaveBeenCalledWith(eperm, {
      contexts: {
        fn: {
          name: 'showFileOnWindows',
          path: 'C:/cache/a/.last-used',
        },
      },
    });
    expect(capturePreloadErrorMock).toHaveBeenCalledWith(eperm, {
      contexts: {
        fn: {
          name: 'hideFileOnWindows',
          path: 'C:/cache/a/.last-used',
        },
      },
    });
  });

  // MMM-V2-3P6: attrib exited with an error and printed nothing, and the
  // report only said "Command failed": its numeric exit code was dropped.
  it('reports what the failed run left: exit code, signal and output', async () => {
    const failed = Object.assign(
      new Error('Command failed: attrib +h C:/cache/a/.last-used\n'),
      {
        code: 3_221_225_794,
        killed: false,
        signal: null,
        stderr: '',
        stdout: '  \r\n',
      },
    );
    execFileMock.mockImplementation((_file, _args, callback) =>
      callback(failed, '', ''),
    );

    const { hideFileOnWindows } = await loadFs();

    await hideFileOnWindows('C:/cache/a/.last-used');

    expect(capturePreloadErrorMock).toHaveBeenCalledExactlyOnceWith(failed, {
      contexts: {
        fn: {
          exitCode: 3_221_225_794,
          exitCodeHex: '0xC0000142',
          killed: false,
          name: 'hideFileOnWindows',
          path: 'C:/cache/a/.last-used',
          signal: null,
          stderr: '',
          stdout: '',
        },
      },
    });
  });
});
