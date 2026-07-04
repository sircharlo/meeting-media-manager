export interface FilesystemErrorLike {
  code?: string;
  syscall?: string;
}

const TRANSIENT_NETWORK_ACCESS_ERROR_CODES = new Set([
  'EINVAL',
  'ENOENT',
  'UNKNOWN',
]);

const WATCH_FOLDER_STAT_ERROR_CODES = new Set(['EINVAL', 'UNKNOWN']);
const NETWORK_WATCH_ERROR_CODES = new Set(['EISDIR', 'UNKNOWN']);

export const getFilesystemErrorCode = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
};

export const normalizeFilesystemPath = (path: string) =>
  (path || '').replaceAll('\\', '/');

export const isPossiblyNetworkFolderPath = (
  folderPath: string,
  platform: NodeJS.Platform = process.platform,
) => {
  const unixPath = normalizeFilesystemPath(folderPath);
  if (unixPath.startsWith('//')) return true;
  if (/@SSL@\d+/i.test(unixPath)) return true;

  // On Windows, a non-C: drive letter may indicate a mapped network drive.
  if (platform === 'win32' && /^[a-bd-zA-BD-Z]:/.test(unixPath)) return true;

  return false;
};

export const isExpectedNetworkPathAccessError = (
  error: unknown,
  path: string,
  platform: NodeJS.Platform = process.platform,
) => {
  if (!isPossiblyNetworkFolderPath(path, platform)) return false;

  const code = getFilesystemErrorCode(error);
  return TRANSIENT_NETWORK_ACCESS_ERROR_CODES.has(code ?? '');
};

export const shouldIgnoreWatchFolderError = (
  folderPath: string,
  error: FilesystemErrorLike,
  platform: NodeJS.Platform = process.platform,
) => {
  if (
    error.syscall === 'stat' &&
    WATCH_FOLDER_STAT_ERROR_CODES.has(error.code ?? '')
  ) {
    return true;
  }

  if (!isPossiblyNetworkFolderPath(folderPath, platform)) return false;

  if (error.syscall === 'watch') {
    return NETWORK_WATCH_ERROR_CODES.has(error.code ?? '');
  }

  // Node labels readdir failures with syscall 'scandir'. Cloud-sync drives
  // (Google Drive, OneDrive, etc.) can transiently fail to enumerate a
  // folder mid-sync, especially newly-created date folders.
  return (
    error.syscall === 'scandir' &&
    TRANSIENT_NETWORK_ACCESS_ERROR_CODES.has(error.code ?? '')
  );
};
