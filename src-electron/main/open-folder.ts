import { shell } from 'electron';
import { realpath, stat } from 'node:fs/promises';
import { PLATFORM } from 'src-electron/constants';
import { captureElectronError } from 'src-electron/main/utils';
import { log } from 'src/shared/vanilla';
import { normalize } from 'upath';

// The folders the renderer opens (the recording folder, OBS's recording
// folder) are always absolute paths picked in a folder dialog or reported by
// OBS, so anything else is refused before it reaches shell.openPath, which
// opens files and app bundles too, not just folders.

// `\\?\` and `\\.\` device paths: neither the folder dialog nor OBS produces
// them, and they bypass the path normalization the shell applies.
const WINDOWS_DEVICE_PATH = /^[\\/]{2}[.?][\\/]/;
const WINDOWS_DRIVE_ROOT = /^[a-z]:[\\/]/i;
const WINDOWS_UNC_ROOT = /^[\\/]{2}[^\\/]+[\\/]+[^\\/]+/;
const WINDOWS_SEPARATOR = /[\\/]/;

// Node checks a Windows path through the `\\?\` namespace, so it can see a
// folder literally named `name.exe.` - but the shell strips trailing dots and
// spaces from each segment and would open the file `name.exe` next to it.
// Neither the dialog nor Explorer can create such names, so refusing them
// keeps the folder that was checked the one that gets opened.
const isShellTrimmedSegment = (segment: string) =>
  segment !== '.' &&
  segment !== '..' &&
  (segment.endsWith('.') || segment.endsWith(' '));

// macOS launches or installs these bundles instead of showing them in Finder,
// even though they are folders.
const MACOS_LAUNCHABLE_BUNDLE =
  /\.(?:app|mpkg|pkg|prefpane|saver|workflow)\/?$/i;

const getUnsafeWindowsFolderPathReason = (path: string) => {
  if (WINDOWS_DEVICE_PATH.test(path)) return 'Unsupported path form';

  const root =
    WINDOWS_DRIVE_ROOT.exec(path)?.[0] ?? WINDOWS_UNC_ROOT.exec(path)?.[0];
  if (!root) return 'Path is not absolute';

  const rest = path.slice(root.length);
  // A colon past the root names an alternate data stream.
  if (rest.includes(':')) return 'Unsupported path form';
  if (rest.split(WINDOWS_SEPARATOR).some(isShellTrimmedSegment)) {
    return 'Unsupported path form';
  }
  return undefined;
};

/**
 * Why a folder path must not be opened with shell.openPath, or undefined
 * when it may be (it still has to exist and be a directory).
 * @param path The folder path the renderer asked to open.
 * @param platform The platform whose path rules apply.
 * @returns The reason the path is refused, or undefined.
 */
export const getUnsafeFolderPathReason = (
  path: string,
  platform: NodeJS.Platform = PLATFORM,
): string | undefined => {
  if (!path.trim()) return 'Invalid path';
  if (platform === 'win32') return getUnsafeWindowsFolderPathReason(path);
  if (!path.startsWith('/')) return 'Path is not absolute';
  if (platform === 'darwin' && MACOS_LAUNCHABLE_BUNDLE.test(normalize(path))) {
    return 'Path is an application bundle';
  }
  return undefined;
};

/**
 * Opens a folder in the system file manager.
 * @param path The folder to open, as sent by the renderer.
 * @returns An empty string on success, otherwise why it wasn't opened.
 */
export async function openFolder(path: unknown): Promise<string> {
  if (typeof path !== 'string') return 'Invalid path';

  const unsafeReason = getUnsafeFolderPathReason(path);
  if (unsafeReason) {
    log(
      `Refused to open folder: ${unsafeReason}`,
      'electronFilesystem',
      'warn',
      path,
    );
    return unsafeReason;
  }

  // shell.openPath executes files (not just directories), so refuse to open
  // anything that isn't an actual directory rather than trusting the
  // caller's assumption that `path` points at a folder.
  try {
    const stats = await stat(path); // NOSONAR: read-only stat of an absolute path that passed getUnsafeFolderPathReason
    if (!stats.isDirectory()) return 'Path is not a directory';

    // stat follows symlinks, and so does Finder: a symlinked folder is
    // checked where it really points, or a link to an app bundle would
    // launch it.
    if (PLATFORM === 'darwin') {
      const realPathReason = getUnsafeFolderPathReason(
        await realpath(path), // NOSONAR: read-only realpath of an existing directory that passed getUnsafeFolderPathReason
        'darwin',
      );
      if (realPathReason) {
        log(
          `Refused to open folder: ${realPathReason}`,
          'electronFilesystem',
          'warn',
          path,
        );
        return realPathReason;
      }
    }
  } catch (error) {
    captureElectronError(error, {
      contexts: { fn: { name: 'openFolder', path } },
    });
    return 'Path does not exist';
  }

  return shell.openPath(path); // NOSONAR: only an existing directory that passed getUnsafeFolderPathReason, never a file or app bundle; the IPC sender is checked by handleIpcInvoke
}
