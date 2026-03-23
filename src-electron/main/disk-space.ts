import checkDiskSpace from 'check-disk-space';
import { app } from 'electron';
import { log } from 'src/shared/vanilla';

const bytesToGB = (bytes: number) => Math.round(bytes / (1024 * 1024 * 1024));

export async function getLowDiskSpaceStatus() {
  try {
    const userDataPath = app.getPath('userData');
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
    log('Failed to check disk space:', 'electronFilesystem', 'error', error);
    return false;
  }
}
