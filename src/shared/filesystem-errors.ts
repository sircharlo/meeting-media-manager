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
) => {
  if (!isPossiblyNetworkFolderPath(path)) return false;

  const code = getFilesystemErrorCode(error);
  return TRANSIENT_NETWORK_ACCESS_ERROR_CODES.has(code ?? '');
};

export const shouldIgnoreWatchFolderError = (
  folderPath: string,
  error: FilesystemErrorLike,
) => {
  if (
    error.syscall === 'stat' &&
    WATCH_FOLDER_STAT_ERROR_CODES.has(error.code ?? '')
  ) {
    return true;
  }

  if (!isPossiblyNetworkFolderPath(folderPath)) return false;
  return (
    error.syscall === 'watch' && NETWORK_WATCH_ERROR_CODES.has(error.code ?? '')
  );
};
