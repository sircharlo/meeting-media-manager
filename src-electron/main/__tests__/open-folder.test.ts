import { beforeEach, describe, expect, it, vi } from 'vitest';

const openPathMock = vi.fn();
const statMock = vi.fn();
const captureElectronErrorMock = vi.fn();

vi.mock('electron', () => ({
  shell: { openPath: openPathMock },
}));

vi.mock('node:fs/promises', () => ({
  stat: statMock,
}));

vi.mock('src-electron/constants', () => ({
  PLATFORM: 'linux',
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: captureElectronErrorMock,
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

describe('getUnsafeFolderPathReason', () => {
  it.each([
    String.raw`C:\Users\me\Videos\Recordings`,
    'C:/Users/me/Videos/Recordings',
    'D:\\',
    String.raw`\\server\share\Recordings`,
    String.raw`C:\Users\me\Videos\..\Recordings`,
    String.raw`C:\Users\me\Videos\Recordings.2026`,
  ])('allows the Windows folder %s', async (path) => {
    const { getUnsafeFolderPathReason } = await import('../open-folder');
    expect(getUnsafeFolderPathReason(path, 'win32')).toBeUndefined();
  });

  it.each([
    ['Recordings', 'Path is not absolute'],
    ['C:Recordings', 'Path is not absolute'],
    [String.raw`\Recordings`, 'Path is not absolute'],
    [String.raw`\\?\C:\Recordings`, 'Unsupported path form'],
    [String.raw`\\.\C:`, 'Unsupported path form'],
    // Node sees these as folders, the shell as the file without the
    // trailing dot/space (e.g. `evil.exe`).
    [String.raw`C:\Users\me\evil.exe.`, 'Unsupported path form'],
    [String.raw`C:\Users\me\evil.exe `, 'Unsupported path form'],
    ['C:\\Users\\me\\evil.exe.\\', 'Unsupported path form'],
    [
      String.raw`C:\Users\me\folder::$INDEX_ALLOCATION`,
      'Unsupported path form',
    ],
    ['   ', 'Invalid path'],
  ])('refuses the Windows path %s', async (path, reason) => {
    const { getUnsafeFolderPathReason } = await import('../open-folder');
    expect(getUnsafeFolderPathReason(path, 'win32')).toBe(reason);
  });

  it.each(['/Users/me/Movies', '/Volumes/Share/Recordings.2026'])(
    'allows the macOS folder %s',
    async (path) => {
      const { getUnsafeFolderPathReason } = await import('../open-folder');
      expect(getUnsafeFolderPathReason(path, 'darwin')).toBeUndefined();
    },
  );

  it.each([
    ['Movies', 'Path is not absolute'],
    ['/Users/me/Evil.app', 'Path is an application bundle'],
    ['/Users/me/Evil.APP/', 'Path is an application bundle'],
    ['/Users/me/Evil.app/Contents/..', 'Path is an application bundle'],
    ['/Users/me/Installer.pkg', 'Path is an application bundle'],
  ])('refuses the macOS path %s', async (path, reason) => {
    const { getUnsafeFolderPathReason } = await import('../open-folder');
    expect(getUnsafeFolderPathReason(path, 'darwin')).toBe(reason);
  });

  it('only applies the bundle rule on macOS', async () => {
    const { getUnsafeFolderPathReason } = await import('../open-folder');
    expect(
      getUnsafeFolderPathReason('/home/me/Evil.app', 'linux'),
    ).toBeUndefined();
    expect(getUnsafeFolderPathReason('home/me', 'linux')).toBe(
      'Path is not absolute',
    );
  });
});

describe('openFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens an existing directory', async () => {
    statMock.mockResolvedValue({ isDirectory: () => true });
    openPathMock.mockResolvedValue('');
    const { openFolder } = await import('../open-folder');

    await expect(openFolder('/home/me/Recordings')).resolves.toBe('');
    expect(openPathMock).toHaveBeenCalledWith('/home/me/Recordings');
  });

  it('refuses a file', async () => {
    statMock.mockResolvedValue({ isDirectory: () => false });
    const { openFolder } = await import('../open-folder');

    await expect(openFolder('/home/me/run.sh')).resolves.toBe(
      'Path is not a directory',
    );
    expect(openPathMock).not.toHaveBeenCalled();
  });

  it('reports a path that cannot be read', async () => {
    const error = Object.assign(new Error('missing'), { code: 'ENOENT' });
    statMock.mockRejectedValue(error);
    const { openFolder } = await import('../open-folder');

    await expect(openFolder('/home/me/Gone')).resolves.toBe(
      'Path does not exist',
    );
    expect(captureElectronErrorMock).toHaveBeenCalledWith(
      error,
      expect.anything(),
    );
    expect(openPathMock).not.toHaveBeenCalled();
  });

  it.each([undefined, 42, { path: '/home/me' }])(
    'refuses a non-string path (%s)',
    async (path) => {
      const { openFolder } = await import('../open-folder');

      await expect(openFolder(path)).resolves.toBe('Invalid path');
      expect(statMock).not.toHaveBeenCalled();
      expect(openPathMock).not.toHaveBeenCalled();
    },
  );

  it('refuses an unsafe path without touching the filesystem', async () => {
    const { openFolder } = await import('../open-folder');

    await expect(openFolder('Recordings')).resolves.toBe(
      'Path is not absolute',
    );
    expect(statMock).not.toHaveBeenCalled();
    expect(openPathMock).not.toHaveBeenCalled();
  });
});
