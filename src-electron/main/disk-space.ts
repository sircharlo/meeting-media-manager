import { app } from 'electron';
import { statfs } from 'node:fs/promises';
import { log } from 'src/shared/vanilla';

const BYTES_PER_GB = 1024 * 1024 * 1024;
const bytesToGB = (bytes: number) => Math.round(bytes / BYTES_PER_GB);
const PERMISSION_ERRORS = new Set(['EACCES', 'EPERM']);
const getErrorCode = (error: unknown) => (error as { code?: string })?.code;

/** Below this much free space, the user is warned that disk space is low. */
export const LOW_DISK_SPACE_WARNING_GB = 10;

const getFreeBytesFromStatfs = async (path: string): Promise<number> => {
  const info = await statfs(path, { bigint: true });
  return Number(info.bavail * info.bsize);
};

/**
 * @param minFreeGB Free space below which the disk counts as low. Defaults to
 * the user-facing warning threshold; callers that need to know whether space
 * is genuinely critical pass a lower one.
 */
export async function getLowDiskSpaceStatus(
  minFreeGB = LOW_DISK_SPACE_WARNING_GB,
) {
  const userDataPath = app.getPath('userData');
  const minFreeBytes = minFreeGB * BYTES_PER_GB;
  try {
    const freeBytes = await getFreeBytesFromStatfs(userDataPath);
    const freeSpaceGB = bytesToGB(freeBytes);
    if (freeBytes < minFreeBytes) {
      log(
        `Low disk space warning: ${freeSpaceGB} GB free.`,
        'electronFilesystem',
        'warn',
      );
      return true;
    }
    log(
      `Disk space is OK: ${freeSpaceGB} GB free.`,
      'electronFilesystem',
      'log',
    );
    return false;
  } catch (error) {
    const code = getErrorCode(error);
    if (PERMISSION_ERRORS.has(code ?? '')) {
      log(
        'Skipping statfs() disk space check due to permissions; falling back to check-disk-space.',
        'electronFilesystem',
        'warn',
        error,
      );
    }
  }
  try {
    const checkDiskSpace = (await import('check-disk-space')).default;
    const diskSpace = await checkDiskSpace(userDataPath);
    const freeSpaceGB = bytesToGB(diskSpace.free);
    if (diskSpace.free < minFreeBytes) {
      log(
        `Low disk space warning: ${freeSpaceGB} GB free.`,
        'electronFilesystem',
        'warn',
      );
      return true;
    }
    log(
      `Disk space is OK: ${freeSpaceGB} GB free.`,
      'electronFilesystem',
      'log',
    );
    return false;
  } catch (error) {
    const code = getErrorCode(error);
    if (PERMISSION_ERRORS.has(code ?? '')) {
      log(
        'Skipping disk space check due to permissions.',
        'electronFilesystem',
        'warn',
        error,
      );
      return false;
    }

    log('Failed to check disk space:', 'electronFilesystem', 'error', error);
    return false;
  }
}
