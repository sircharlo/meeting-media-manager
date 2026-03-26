import checkDiskSpace from 'check-disk-space';
import { app } from 'electron';
import { statfs } from 'node:fs/promises';
import { log } from 'src/shared/vanilla';

const bytesToGB = (bytes: number) => Math.round(bytes / (1024 * 1024 * 1024));
const PERMISSION_ERRORS = new Set(['EACCES', 'EPERM']);
const getErrorCode = (error: unknown) => (error as { code?: string })?.code;

const getFreeBytesFromStatfs = async (path: string): Promise<number> => {
  const info = await statfs(path, { bigint: true });
  return Number(info.bavail * info.bsize);
};

export async function getLowDiskSpaceStatus() {
  const userDataPath = app.getPath('userData');
  try {
    const freeBytes = await getFreeBytesFromStatfs(userDataPath);
    const freeSpaceGB = bytesToGB(freeBytes);
    if (freeSpaceGB < 10) {
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
  } catch {
    // Fallback for environments where statfs may not be available/reliable.
  }
  try {
    const diskSpace = await checkDiskSpace(userDataPath);
    const freeSpaceGB = bytesToGB(diskSpace.free);
    if (freeSpaceGB < 10) {
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
        'Skipping disk space check due permissions.',
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
