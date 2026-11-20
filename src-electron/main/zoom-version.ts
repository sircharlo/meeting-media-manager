import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { PLATFORM } from 'src-electron/constants';

// The installed Zoom's version, read from its own files, so M³ can tell
// without the Zoom helper (which only the Zoom Meeting Manager runs, on
// Windows): for OBS Studio and the Zoom shortcuts integration too.

const execFileAsync = promisify(execFile);

// A Windows executable's version resource holds a VS_FIXEDFILEINFO: this
// signature, the structure's version (1.0), then the file version as two
// 32-bit words, major.minor and build.revision.
const FIXED_FILE_INFO_SIGNATURE = Buffer.from([0xbd, 0x04, 0xef, 0xfe]);
const FIXED_FILE_INFO_VERSION = 0x00_01_00_00;

/**
 * The file version stamped in a Windows executable ("7.2.1.48556"), from
 * its version resource. Null without one.
 */
export const exeFileVersion = (exe: Buffer): null | string => {
  let at = exe.indexOf(FIXED_FILE_INFO_SIGNATURE);
  while (at >= 0 && at + 16 <= exe.length) {
    // The same four bytes elsewhere in the file are no version resource.
    if (exe.readUInt32LE(at + 4) === FIXED_FILE_INFO_VERSION) {
      const high = exe.readUInt32LE(at + 8);
      const low = exe.readUInt32LE(at + 12);
      return [high >>> 16, high & 0xff_ff, low >>> 16, low & 0xff_ff].join('.');
    }
    at = exe.indexOf(FIXED_FILE_INFO_SIGNATURE, at + 1);
  }
  return null;
};

const PLIST_SHORT_VERSION =
  /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/;

/** An XML Info.plist's CFBundleShortVersionString ("6.5.12 (63187)"). */
export const plistShortVersion = (plist: string): null | string =>
  PLIST_SHORT_VERSION.exec(plist)?.[1]?.trim() || null;

/**
 * Where Zoom installs Zoom.exe: for the user (its usual installer, which
 * keeps itself up to date), then for the whole computer (its MSI).
 */
const windowsZoomExecutables = () =>
  [
    process.env.APPDATA,
    process.env.ProgramFiles,
    process.env['ProgramFiles(x86)'],
  ]
    .filter((root): root is string => !!root)
    .map((root) => join(root, 'Zoom', 'bin', 'Zoom.exe'));

const macZoomInfoPlists = () => [
  '/Applications/zoom.us.app/Contents/Info.plist',
  join(homedir(), 'Applications', 'zoom.us.app', 'Contents', 'Info.plist'),
];

const windowsZoomVersion = async () => {
  for (const exe of windowsZoomExecutables()) {
    try {
      const version = exeFileVersion(await readFile(exe));
      if (version) return version;
    } catch {
      // Not installed there.
    }
  }
  return null;
};

const macZoomVersion = async () => {
  for (const plist of macZoomInfoPlists()) {
    try {
      const data = await readFile(plist);
      if (data.subarray(0, 6).toString('latin1') !== 'bplist') {
        const version = plistShortVersion(data.toString('utf8'));
        if (version) return version;
        continue;
      }
      // A binary plist: macOS's own tool reads it.
      const { stdout } = await execFileAsync(
        '/usr/bin/plutil',
        ['-extract', 'CFBundleShortVersionString', 'raw', '-o', '-', plist],
        { timeout: 5000 },
      );
      if (stdout.trim()) return stdout.trim();
    } catch {
      // Not installed there.
    }
  }
  return null;
};

/**
 * The installed Zoom's version: on Windows from Zoom.exe ("7.2.1.48556"),
 * on macOS from zoom.us.app ("6.5.12 (63187)"). Null where Zoom isn't
 * installed in its usual places, on Linux, or if it can't be read.
 */
export const getInstalledZoomVersion = async (): Promise<null | string> => {
  try {
    if (PLATFORM === 'win32') return await windowsZoomVersion();
    if (PLATFORM === 'darwin') return await macZoomVersion();
  } catch {
    // Silent: this only feeds a recommendation.
  }
  return null;
};
