import type { OsSupportWarning } from 'src/types';

import { arch, platform } from 'node:os';

/**
 * Returns which soon-to-be-unsupported platform this build is running on, if
 * any. Electron 44 will require macOS 13 (Ventura) or later and will no longer
 * ship prebuilt Windows 32-bit (ia32) binaries, so builds running on those
 * platforms will not be able to update to any release past the current line.
 */
export function getOsSupportWarning(): null | OsSupportWarning {
  if (platform() === 'darwin') {
    const majorVersion = Number.parseInt(
      process.getSystemVersion().split('.')[0] ?? '',
      10,
    );
    // Electron 44 will require macOS 13 (Ventura) or later
    if (majorVersion && majorVersion < 13) return 'mac-legacy';
  } else if (platform() === 'win32' && arch() === 'ia32') {
    // Electron 44 will drop prebuilt Windows 32-bit (ia32) binaries
    return 'win32-ia32';
  }
  return null;
}
