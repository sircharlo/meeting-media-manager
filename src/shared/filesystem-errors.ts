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
// EBUSY: chokidar's underlying fs.watch() call can hit a file mid-sync that
// a cloud client (observed with Google Drive) is holding a transient lock
// on, e.g. a freshly-written conflict copy.
const NETWORK_WATCH_ERROR_CODES = new Set(['EBUSY', 'EISDIR', 'UNKNOWN']);

// Node's fallback for a raw OS error libuv can't translate is the literal
// string `util.getSystemErrorName()` returns, e.g. "Unknown system error
// -214545202" - not the generic 'UNKNOWN' code used for UV_UNKNOWN. Cloud
// sync/VFS drivers (Nextcloud, OneDrive, etc.) commonly surface these, so
// normalize them to 'UNKNOWN' for callers that already tolerate that code.
const UNKNOWN_SYSTEM_ERROR_CODE_PATTERN = /^Unknown system error -?\d+$/i;

const CLOUD_STORAGE_PROVIDERS: [marker: string, provider: string][] = [
  ['/library/mobile documents/', 'iCloud'],
  ['/icloud drive/', 'iCloud'],
  ['/dropbox/', 'Dropbox'],
  ['/onedrive', 'OneDrive'],
  ['/google drive/', 'Google Drive'],
  ['/nextcloud', 'Nextcloud'],
];

// Google Drive for desktop's "Mirror files" mode (as opposed to the virtual
// drive-letter "Stream files" mode already covered by the non-C: drive
// heuristic below) creates a folder directly under the user's home
// directory named "<locale's 'My Drive'> (<account email>)", e.g. "Meu
// Drive (user@gmail.com)" in Portuguese. The localized folder name varies
// per language, but the " (<email>)" suffix Google always appends doesn't,
// so match on that structurally instead of enumerating every translation.
const GOOGLE_DRIVE_ACCOUNT_FOLDER_PATTERN =
  /\([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\)(\/|$)/i;

// Errors thrown by fs functions Electron exposes straight through
// contextBridge (rather than through an ipcRenderer.invoke channel) lose
// non-standard properties like `code`/`syscall` by the time they reach the
// renderer - only `name`/`message`/`stack` survive the crossing. The code
// and syscall are still in the message text Node generated them from, e.g.
// "ENOENT: no such file or directory, rename 'a' -> 'b'".
const NODE_FS_ERROR_MESSAGE_PATTERN = /^(E[A-Z]+): .+?, (\w+)/;

const parseNodeFsErrorMessage = (message: unknown) => {
  if (typeof message !== 'string') return undefined;
  const match = NODE_FS_ERROR_MESSAGE_PATTERN.exec(message);
  return match ? { code: match[1], syscall: match[2] } : undefined;
};

export const getFilesystemErrorCode = (error: unknown) => {
  if (typeof error !== 'object' || error === null) return undefined;

  const code = (error as { code?: unknown }).code;
  const resolvedCode =
    typeof code === 'string'
      ? code
      : parseNodeFsErrorMessage((error as { message?: unknown }).message)?.code;

  if (!resolvedCode) return undefined;
  return UNKNOWN_SYSTEM_ERROR_CODE_PATTERN.test(resolvedCode)
    ? 'UNKNOWN'
    : resolvedCode;
};

export const getFilesystemErrorSyscall = (error: unknown) => {
  if (typeof error !== 'object' || error === null) return undefined;

  const syscall = (error as { syscall?: unknown }).syscall;
  if (typeof syscall === 'string') return syscall;
  return parseNodeFsErrorMessage((error as { message?: unknown }).message)
    ?.syscall;
};

export const normalizeFilesystemPath = (path: string) =>
  (path || '').replaceAll('\\', '/');

export const getCloudStorageProvider = (filePath: string) => {
  const normalizedPath = normalizeFilesystemPath(filePath).toLowerCase();
  const knownProvider = CLOUD_STORAGE_PROVIDERS.find(([marker]) =>
    normalizedPath.includes(marker),
  )?.[1];
  if (knownProvider) return knownProvider;

  return GOOGLE_DRIVE_ACCOUNT_FOLDER_PATTERN.test(normalizedPath)
    ? 'Google Drive'
    : undefined;
};

export const isCloudStoragePath = (filePath: string) =>
  !!getCloudStorageProvider(filePath);

// `platform` has no default here on purpose: `process.platform` doesn't
// exist in the renderer (no Node globals across Electron's contextBridge),
// so a default that silently falls back to it would throw ReferenceError
// for any renderer caller that forgets to pass it explicitly. Requiring the
// argument turns that into a compile-time error instead.
export const isPossiblyNetworkFolderPath = (
  folderPath: string,
  platform: NodeJS.Platform,
) => {
  const unixPath = normalizeFilesystemPath(folderPath);
  if (unixPath.startsWith('//')) return true;
  if (/@SSL@\d+/i.test(unixPath)) return true;
  if (isCloudStoragePath(unixPath)) return true;

  // On Windows, a non-C: drive letter may indicate a mapped network drive.
  if (platform === 'win32' && /^[a-bd-zA-BD-Z]:/.test(unixPath)) return true;

  // On macOS, anything under /Volumes is an external/removable/network-
  // mounted volume (USB drive, network share, mounted disk image, ...) -
  // the same "can legitimately disappear" territory as a non-C: drive
  // letter on Windows.
  if (platform === 'darwin' && /^\/volumes\//i.test(unixPath)) return true;

  return false;
};

export const isExpectedNetworkPathAccessError = (
  error: unknown,
  path: string,
  platform: NodeJS.Platform,
) => {
  if (!isPossiblyNetworkFolderPath(path, platform)) return false;

  const code = getFilesystemErrorCode(error);
  return TRANSIENT_NETWORK_ACCESS_ERROR_CODES.has(code ?? '');
};

export const shouldIgnoreWatchFolderError = (
  folderPath: string,
  error: FilesystemErrorLike,
  platform: NodeJS.Platform,
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
