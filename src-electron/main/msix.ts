import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { MSIX_IDENTITY_NAME, MSIX_PUBLISHER } from 'src-electron/constants';
import { join } from 'upath';

// The 32 characters a publisher ID is written with (Crockford's Base32, in
// lowercase).
const PUBLISHER_ID_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

/**
 * The publisher ID Windows derives from a package's publisher, the part of
 * its package family name after the "_": the first 8 bytes of the SHA-256 of
 * the publisher in UTF-16LE, read as 13 characters of 5 bits each (the last
 * one padded with a 0 bit).
 * @param publisher The package's publisher, e.g. "CN=Example".
 * @returns The publisher ID, e.g. "8wekyb3d8bbwe" for Microsoft's.
 */
export const getPublisherId = (publisher: string) => {
  const hash = createHash('sha256')
    .update(Buffer.from(publisher, 'utf16le'))
    .digest();
  const bits = [...hash.subarray(0, 8)]
    .map((byte) => byte.toString(2).padStart(8, '0'))
    .join('')
    .concat('0');
  let id = '';
  for (let i = 0; i < bits.length; i += 5) {
    id += PUBLISHER_ID_ALPHABET[Number.parseInt(bits.slice(i, i + 5), 2)];
  }
  return id;
};

/**
 * The Microsoft Store build's own data folder, %LOCALAPPDATA%\Packages\ and
 * its package family name. Unlike the AppData folder, which Windows
 * virtualizes for a packaged app, it's where it looks: File Explorer and
 * other apps see what M³ writes there. Windows deletes it with the app.
 * @returns The folder, or undefined without LOCALAPPDATA.
 */
export const getPackageDataDir = () => {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return undefined;
  return join(
    localAppData,
    'Packages',
    `${MSIX_IDENTITY_NAME}_${getPublisherId(MSIX_PUBLISHER)}`,
  );
};

/**
 * The startup task helper (src-electron/startup-task-helper), which
 * electron-builder puts inside the MSIX. The StartupTask API needs M³'s
 * package identity, and a child process only keeps it when its executable is
 * inside the package: Windows PowerShell, in System32, loses it, and the API
 * then answers "Element not found".
 * @returns The helper's path.
 */
const getStartupTaskHelperPath = () =>
  join(process.resourcesPath, 'startup-task-helper', 'StartupTaskHelper.exe');

/**
 * Turns the Microsoft Store build's startup task, its "Start at login", on or
 * off (TaskId "M3Startup" in build/appxmanifest.xml). Turning it on doesn't
 * undo the user turning it off in Windows' settings: only the user can, there.
 * @param enable Whether M³ should start at login.
 * @returns The task's state afterwards: Enabled, Disabled, DisabledByUser
 * (turned off in Windows' settings) or DisabledByPolicy.
 */
export const setStartupTaskEnabled = (enable: boolean) =>
  new Promise<string>((resolve, reject) => {
    execFile(
      getStartupTaskHelperPath(),
      [enable ? 'enable' : 'disable'],
      { timeout: 30_000, windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `Couldn't turn the startup task ${enable ? 'on' : 'off'}: ${String(stderr).trim() || error.message}`,
            ),
          );
        } else {
          resolve(String(stdout).trim());
        }
      },
    );
  });
