import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  constants: { PLATFORM: 'win32' as string },
  execFile: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock('src-electron/constants', () => mocks.constants);
vi.mock('node:fs/promises', () => ({ readFile: mocks.readFile }));
vi.mock('node:child_process', () => ({ execFile: mocks.execFile }));
vi.mock('node:os', () => ({ homedir: () => '/Users/someone' }));

/** An executable's bytes with a version resource for `version` among them. */
const exeWithVersion = (
  [major, minor, build, revision]: number[],
  { padding = 64, structVersion = 0x00_01_00_00 } = {},
) => {
  const info = Buffer.alloc(16);
  info.writeUInt32LE(0xfe_ef_04_bd, 0);
  info.writeUInt32LE(structVersion, 4);
  info.writeUInt32LE(((major ?? 0) << 16) | (minor ?? 0), 8);
  info.writeUInt32LE(((build ?? 0) << 16) | (revision ?? 0), 12);
  return Buffer.concat([Buffer.alloc(padding, 0x4d), info, Buffer.alloc(32)]);
};

const notFound = () =>
  Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });

beforeEach(() => {
  vi.resetModules();
  mocks.readFile.mockReset();
  mocks.execFile.mockReset();
  mocks.constants.PLATFORM = 'win32';
  vi.stubEnv('APPDATA', String.raw`C:\Users\someone\AppData\Roaming`);
  vi.stubEnv('ProgramFiles', String.raw`C:\Program Files`);
  vi.stubEnv('ProgramFiles(x86)', String.raw`C:\Program Files (x86)`);
});

describe('exeFileVersion', () => {
  it("reads the file version from an executable's version resource", async () => {
    const { exeFileVersion } = await import('../zoom-version');

    expect(exeFileVersion(exeWithVersion([7, 2, 1, 48_556]))).toBe(
      '7.2.1.48556',
    );
    expect(exeFileVersion(exeWithVersion([6, 5, 12, 14_128]))).toBe(
      '6.5.12.14128',
    );
  });

  it('skips the same bytes where they are no version resource', async () => {
    const { exeFileVersion } = await import('../zoom-version');
    const decoy = exeWithVersion([9, 9, 9, 9], { structVersion: 0x12_34 });

    expect(
      exeFileVersion(Buffer.concat([decoy, exeWithVersion([7, 1, 9, 48_550])])),
    ).toBe('7.1.9.48550');
  });

  it('gives null without a version resource', async () => {
    const { exeFileVersion } = await import('../zoom-version');

    expect(exeFileVersion(Buffer.alloc(256, 0x4d))).toBeNull();
    // Cut short right after the signature.
    const cutShort = exeWithVersion([7, 2, 1, 1]).subarray(0, 70);
    expect(exeFileVersion(cutShort)).toBeNull();
  });
});

describe('plistShortVersion', () => {
  it("reads an XML Info.plist's short version", async () => {
    const { plistShortVersion } = await import('../zoom-version');

    expect(
      plistShortVersion(
        '<dict>\n\t<key>CFBundleShortVersionString</key>\n\t<string>6.5.12 (63187)</string>\n</dict>',
      ),
    ).toBe('6.5.12 (63187)');
    expect(plistShortVersion('<dict></dict>')).toBeNull();
  });
});

describe('getInstalledZoomVersion', () => {
  it("reads Windows' per-user Zoom first", async () => {
    mocks.readFile.mockImplementation(async (path: string) => {
      if (path.includes('Roaming')) return exeWithVersion([6, 5, 12, 14_128]);
      return exeWithVersion([7, 2, 1, 48_556]);
    });
    const { getInstalledZoomVersion } = await import('../zoom-version');

    expect(await getInstalledZoomVersion()).toBe('6.5.12.14128');
    expect(mocks.readFile).toHaveBeenCalledWith(
      join(
        String.raw`C:\Users\someone\AppData\Roaming`,
        'Zoom',
        'bin',
        'Zoom.exe',
      ),
    );
  });

  it("falls back to the computer-wide install (Zoom's MSI)", async () => {
    mocks.readFile.mockImplementation(async (path: string) => {
      if (path.includes('Roaming')) throw notFound();
      return exeWithVersion([7, 2, 1, 48_556]);
    });
    const { getInstalledZoomVersion } = await import('../zoom-version');

    expect(await getInstalledZoomVersion()).toBe('7.2.1.48556');
  });

  it('gives null on Windows without Zoom', async () => {
    mocks.readFile.mockRejectedValue(notFound());
    const { getInstalledZoomVersion } = await import('../zoom-version');

    expect(await getInstalledZoomVersion()).toBeNull();
  });

  it("reads macOS' zoom.us.app Info.plist", async () => {
    mocks.constants.PLATFORM = 'darwin';
    mocks.readFile.mockImplementation(async (path: string) => {
      if (path !== '/Applications/zoom.us.app/Contents/Info.plist') {
        throw notFound();
      }
      return Buffer.from(
        '<?xml version="1.0"?><plist><dict><key>CFBundleShortVersionString</key><string>6.5.12 (63187)</string></dict></plist>',
      );
    });
    const { getInstalledZoomVersion } = await import('../zoom-version');

    expect(await getInstalledZoomVersion()).toBe('6.5.12 (63187)');
    expect(mocks.execFile).not.toHaveBeenCalled();
  });

  it("has macOS read a binary Info.plist, in the user's Applications too", async () => {
    mocks.constants.PLATFORM = 'darwin';
    mocks.readFile.mockImplementation(async (path: string) => {
      if (path.startsWith('/Applications/')) throw notFound();
      return Buffer.from('bplist00 binary');
    });
    mocks.execFile.mockImplementation(
      (
        _file: string,
        _args: string[],
        _options: object,
        callback: (error: Error | null, result: { stdout: string }) => void,
      ) => callback(null, { stdout: '7.2.1 (68000)\n' }),
    );
    const { getInstalledZoomVersion } = await import('../zoom-version');

    expect(await getInstalledZoomVersion()).toBe('7.2.1 (68000)');
    expect(mocks.execFile).toHaveBeenCalledWith(
      '/usr/bin/plutil',
      [
        '-extract',
        'CFBundleShortVersionString',
        'raw',
        '-o',
        '-',
        join(
          '/Users/someone',
          'Applications',
          'zoom.us.app',
          'Contents',
          'Info.plist',
        ),
      ],
      { timeout: 5000 },
      expect.any(Function),
    );
  });

  it("doesn't look on Linux", async () => {
    mocks.constants.PLATFORM = 'linux';
    const { getInstalledZoomVersion } = await import('../zoom-version');

    expect(await getInstalledZoomVersion()).toBeNull();
    expect(mocks.readFile).not.toHaveBeenCalled();
  });
});
