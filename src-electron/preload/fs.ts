// eslint-env node

import type { IOptions } from 'music-metadata';
import type { ElectronFsApi, FileItem, VideoDuration } from 'src/types';

import {
  copy,
  copyFile,
  type Dirent,
  emptyDir,
  ensureDir,
  ensureFile,
  move,
  pathExists,
  readdir,
  readFile,
  readJSON,
  remove,
  rename,
  stat,
  writeFile,
} from 'fs-extra';
import url from 'node:url';
import { PLATFORM } from 'src-electron/constants';
import { capturePreloadError } from 'src-electron/preload/log';
import { getFilesystemErrorCode } from 'src/shared/filesystem-errors';
import { log } from 'src/shared/vanilla';
import { join, normalize } from 'upath';

// Short-circuits before the IPC round-trip on non-macOS - this runs ahead
// of every fs call below, so skipping it there (not just in the main-
// process handler, which would still no-op but only after the hop) matters
// for every Windows/Linux user, not just the macOS ones that need it.
//
// Lazily imported (like the media-parsing libraries below) rather than at
// module scope - a test mock re-exports pure path helpers from this file
// without going through Electron, and a static import of the ipcRenderer
// wrapper would drag in an unresolvable 'electron/renderer' for it.
const startSecurityScopedAccess = async (filePath: string) => {
  if (PLATFORM !== 'darwin') return;
  const { invoke } = await import('src-electron/preload/ipc');
  await invoke('startSecurityScopedAccess', filePath);
};

const activatePaths = async (...paths: (string | undefined)[]) => {
  if (PLATFORM !== 'darwin') return;
  for (const path of paths) {
    if (path) await startSecurityScopedAccess(path); // NOSONAR: sequential - avoid racing the bookmark load in main
  }
};

// All of these read/write arbitrary user-chosen paths (cache folder,
// watched folder, additional media, ...) directly in the preload/renderer
// process - see the getVideoDuration/parseMediaFile comment below for why
// that means a macOS security-scoped bookmark activated in the main
// process doesn't cover them on its own. Confirmed to matter for more than
// just media reads: MMM-V2-3FN (open) and MMM-V2-3FS (unlink) hit the same
// gap on two different operations for the same user/folder.
export const fs: ElectronFsApi = {
  copy: async (src, dest, options) => {
    await activatePaths(src, dest);
    return copy(src, dest, options as never);
  },
  copyFile: async (src, dest, mode) => {
    await activatePaths(src, dest);
    return copyFile(src, dest, mode);
  },
  emptyDir: async (dir) => {
    await activatePaths(dir);
    return emptyDir(dir);
  },
  ensureDir: async (dir, options) => {
    await activatePaths(dir);
    return ensureDir(dir, options as never);
  },
  ensureFile: async (file) => {
    await activatePaths(file);
    return ensureFile(file);
  },
  move: async (src, dest, options) => {
    await activatePaths(src, dest);
    return move(src, dest, options as never);
  },
  pathExists: async (path) => {
    await activatePaths(path);
    return pathExists(path);
  },
  readFile: (async (path: string, options?: unknown) => {
    await activatePaths(path);
    return readFile(path, options as never);
  }) as ElectronFsApi['readFile'],
  readJSON: async (file, options) => {
    await activatePaths(file);
    return readJSON(file, options);
  },
  remove: async (path) => {
    await activatePaths(path);
    return remove(path);
  },
  rename: async (oldPath, newPath) => {
    await activatePaths(oldPath, newPath);
    return rename(oldPath, newPath);
  },
  stat: async (path) => {
    await activatePaths(path);
    return stat(path);
  },
  writeFile: async (path, data, options) => {
    await activatePaths(path);
    return writeFile(path, data, options);
  },
};

// Unlike the jwpub zip-read funnel (getZipFileStats/decompress in
// src-electron/main/fs.ts), these read arbitrary media files directly in
// the preload/renderer process rather than the main process. A macOS
// security-scoped bookmark activated via startAccessingSecurityScopedResource
// in the main process doesn't extend across that process boundary, so a
// custom (e.g. Documents-folder) cache/watch location can still EPERM here
// even after the main-process fix. No-op on non-macOS and when access is
// already active (see startSecurityScopedAccess in src-electron/main/fs.ts).
export const getVideoDuration = async (
  filePath: string,
): Promise<VideoDuration> => {
  await startSecurityScopedAccess(filePath);
  const { videoDuration } = await import('@numairawan/video-duration');
  return videoDuration(filePath);
};

export const parseMediaFile = async (filePath: string, options?: IOptions) => {
  await startSecurityScopedAccess(filePath);
  const musicMetadata = await import('music-metadata');
  return musicMetadata.parseFile(filePath, options);
};

const isFileUrl = (testpath: string) => {
  if (!testpath) return false;
  try {
    return testpath.startsWith('file://');
  } catch (err) {
    capturePreloadError(err, {
      contexts: { fn: { name: 'isFileUrl', path: testpath } },
    });
    return false;
  }
};

export const pathToFileURL = (path: string) => {
  if (!path) return '';
  if (isFileUrl(path)) return path;
  return url.pathToFileURL(path).href;
};

export const fileUrlToPath = (fileurl?: string) => {
  if (!fileurl) return '';
  if (!isFileUrl(fileurl)) return fileurl;
  return normalize(url.fileURLToPath(fileurl));
};

// `attrib` lives in System32, and spawning it by bare name only resolves it
// through PATH: one machine where that failed reported an ENOENT per marker
// file (`spawn attrib ENOENT`, MMM-V2-3N0/3N1). Call it by full path and,
// when even that can't be spawned, stop trying for the rest of the session
// instead of repeating the failure for every file.
const getAttribCommand = () => {
  const windowsDir = process.env.SystemRoot || process.env.windir;
  if (!windowsDir) return 'attrib';
  return join(windowsDir, 'System32', 'attrib.exe');
};

let attribUnavailable = false;
const reportedAttribFailures = new Set<string>();

const ATTRIB_OUTPUT_MAX_LENGTH = 500;

const trimAttribOutput = (output: unknown) =>
  typeof output === 'string'
    ? output.trim().slice(0, ATTRIB_OUTPUT_MAX_LENGTH)
    : undefined;

/**
 * What a failed attrib run left to go on. attrib prints its own errors
 * ("Access denied", "File not found") on stdout and still exits 0, so a run
 * that fails is attrib itself not running properly: its exit code (in hex, a
 * Windows status such as 0xC0000142 when it couldn't start) or the signal
 * that ended it says why. Neither reached Sentry in MMM-V2-3P6: a preload
 * report only keeps an error's `code` when it's a string.
 */
const describeAttribFailure = (error: unknown) => {
  const { code, killed, signal, stderr, stdout } = (error ?? {}) as Record<
    string,
    unknown
  >;
  return {
    ...(typeof code === 'number' && {
      exitCode: code,
      exitCodeHex: `0x${code.toString(16).toUpperCase()}`,
    }),
    killed,
    signal,
    stderr: trimAttribOutput(stderr),
    stdout: trimAttribOutput(stdout),
  };
};

const setFileAttributes = async (
  operation: 'hideFileOnWindows' | 'showFileOnWindows',
  args: string[],
  filePath: string,
) => {
  if (PLATFORM !== 'win32' || !filePath || attribUnavailable) return;

  try {
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execFileAsync = promisify(execFile);

    await execFileAsync(getAttribCommand(), args);
  } catch (error) {
    // Hiding these marker files is cosmetic and self-healing, so a machine
    // that can't run attrib at all shouldn't report a burst of identical
    // errors on every launch: note it once and skip the rest.
    if (getFilesystemErrorCode(error) === 'ENOENT') {
      attribUnavailable = true;
      log(
        'attrib is unavailable; skipping marker file attributes',
        'errorHandling',
        'warn',
      );
      return;
    }
    if (reportedAttribFailures.has(operation)) return;
    reportedAttribFailures.add(operation);
    capturePreloadError(error, {
      contexts: {
        fn: {
          name: operation,
          path: filePath,
          ...describeAttribFailure(error),
        },
      },
    });
  }
};

export const hideFileOnWindows = async (filePath: string) => {
  await setFileAttributes('hideFileOnWindows', ['+h', filePath], filePath);
};

export const showFileOnWindows = async (filePath: string) => {
  // Not just -h: on a file that's also System, `attrib -h` leaves it
  // hidden ("Not resetting system file") yet still exits 0, and Windows
  // refuses to overwrite a Hidden, System or Read-only file in place -
  // so the caller's write failed with `EPERM ... open` (MMM-V2-3KQ).
  // Only ever called on this app's own marker files.
  await setFileAttributes(
    'showFileOnWindows',
    ['-h', '-s', '-r', filePath],
    filePath,
  );
};

/**
 * Infers the extension of a file based on its type.
 * @param filename The name of the file.
 * @param filetype The type of the file.
 * @returns The filename with the inferred extension.
 * @example
 * inferExtension('A video.mp4') // A video.mp4
 * inferExtension('An audio file', 'audio/mpeg') // An audio file.mp3
 */
export const inferExtension = async (filename: string, filetype?: string) => {
  if (!filetype || /\.[0-9a-z]+$/i.test(filename)) return filename;

  try {
    const { default: mime } = await import('mime');
    const extractedExtension = mime.getExtension(filetype);
    return extractedExtension ? `${filename}.${extractedExtension}` : filename;
  } catch (e) {
    capturePreloadError(e);
    return filename;
  }
};

export const readDirectory = async (
  dir: string,
  withSizes?: boolean,
  recursive?: boolean,
) => {
  try {
    if (!(await pathExists(dir))) return [];
    return await readDirRecursive(dir, withSizes, recursive);
  } catch (error) {
    capturePreloadError(error, {
      contexts: { fn: { dir, name: 'readDirectory', recursive, withSizes } },
    });
    return [];
  }
};

// Gone between the listing and the look at it: a download's `.part` file
// renamed into place as it finished (MMM-V2-3PH, in a publication folder
// while its media downloaded), or a folder cleaned up meanwhile.
const isVanished = (error: unknown) =>
  getFilesystemErrorCode(error) === 'ENOENT';

/** A folder's entries; none when it's gone. */
const listFolder = async (directory: string): Promise<Dirent[]> => {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isVanished(error)) return [];
    throw error;
  }
};

/** A file's size; null when it's gone. */
const getSizeIfPresent = async (path: string) => {
  try {
    return (await stat(path)).size;
  } catch (error) {
    if (isVanished(error)) return null;
    throw error;
  }
};

const readDirRecursive = async (
  directory: string,
  withSizes?: boolean,
  recursive?: boolean,
): Promise<FileItem[]> => {
  const dirItems: FileItem[] = [];
  for (const dirent of await listFolder(directory)) {
    const fullPath = join(directory, dirent.name);
    const size =
      withSizes && dirent.isFile()
        ? await getSizeIfPresent(fullPath) // NOSONAR: sequential - ordered recursive directory walk
        : undefined;
    if (size === null) continue;
    dirItems.push({
      isDirectory: dirent.isDirectory(),
      isFile: dirent.isFile(),
      name: dirent.name,
      parentPath: directory,
      ...(size !== undefined && { size }),
    });
    if (recursive && dirent.isDirectory()) {
      const subItems = await readDirRecursive(fullPath, withSizes, recursive); // NOSONAR: sequential - ordered recursive directory walk
      dirItems.push(...subItems);
    }
  }
  return dirItems;
};
