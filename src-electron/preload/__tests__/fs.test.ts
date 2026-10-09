import { beforeEach, describe, expect, it, vi } from 'vitest';

const execFileMock = vi.fn(
  (
    _file: string,
    _args: string[],
    callback: (error: Error | null, stdout: string, stderr: string) => void,
  ) => callback(null, '', ''),
);

vi.mock('node:child_process', () => ({ execFile: execFileMock }));
vi.mock('src-electron/constants', () => ({ PLATFORM: 'win32' }));
vi.mock('src-electron/preload/log', () => ({ capturePreloadError: vi.fn() }));

const { showFileOnWindows } = await import('../fs');

describe('showFileOnWindows', () => {
  beforeEach(() => {
    execFileMock.mockClear();
  });

  // MMM-V2-3KQ: `attrib -h` alone leaves a System file hidden (exiting 0
  // regardless), and Windows refuses to overwrite a Hidden, System or
  // Read-only file in place - the caller's next write failed with EPERM.
  it('clears the hidden, system and read-only attributes', async () => {
    await showFileOnWindows('C:/cache/Publications/lmd_T_0/.last-used');

    expect(execFileMock).toHaveBeenCalledExactlyOnceWith(
      'attrib',
      ['-h', '-s', '-r', 'C:/cache/Publications/lmd_T_0/.last-used'],
      expect.any(Function),
    );
  });

  it('does nothing without a path', async () => {
    await showFileOnWindows('');

    expect(execFileMock).not.toHaveBeenCalled();
  });
});
