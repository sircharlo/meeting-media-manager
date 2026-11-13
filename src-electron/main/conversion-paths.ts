import { app } from 'electron';
import { getAppDataPath } from 'src-electron/main/fs';
import { isAbsolute, join, normalize, normalizeTrim } from 'upath';

/**
 * Checks on the paths a conversion request brings over IPC, before ffmpeg
 * gets them: ffmpeg overwrites its output, and a failed run deletes it, so
 * a conversion writes nowhere but the app's Temp folder. Used for playback
 * (see playback-conversion.ts) and export (see createVideoFromNonVideo).
 */

// Where the renderer has conversions written (its getTempPath).
const TEMP_FOLDER = 'Temp';

/**
 * Whether two paths are the same file's, compared the way the file system
 * does: without case on Windows and macOS.
 */
export const isSamePath = (a: string, b: string) => {
  const [first, second] = [normalize(a), normalize(b)];
  return process.platform === 'linux'
    ? first === second
    : first.toLowerCase() === second.toLowerCase();
};

/**
 * Refuses, saying what it got, anything but an absolute path.
 * @param role What the path is for, named in the error.
 * @param path The path given.
 */
export function assertAbsolutePath(
  role: string,
  path: unknown,
): asserts path is string {
  if (typeof path !== 'string' || !isAbsolute(path)) {
    throw new Error(
      `Refusing to convert: ${role} isn't an absolute path: ${JSON.stringify(path)}`,
    );
  }
}

/**
 * Refuses, saying where it is and where it may be, a folder that isn't the
 * app's Temp folder: the shared one, or the per-user one getAppDataPath
 * falls back to. Its subfolders aren't it either.
 * @param folder The folder a conversion would write in.
 */
export const assertAppTempFolder = async (folder: string) => {
  const tempFolders = [
    ...new Set([app.getPath('userData'), await getAppDataPath()]),
  ].map((base) => join(base, TEMP_FOLDER));
  // A trailing slash doesn't make it another folder.
  const normalized = normalizeTrim(folder);
  if (!tempFolders.some((temp) => isSamePath(temp, normalized))) {
    throw new Error(
      `Refusing to convert into ${normalized}, not the app's temp folder (${tempFolders.join(', ')})`,
    );
  }
};
