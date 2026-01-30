import checkDiskSpace from 'check-disk-space';
import { app } from 'electron';
import { captureElectronError } from 'src-electron/main/utils';

const bytesToGB = (bytes: number) => Math.round(bytes / (1024 * 1024 * 1024));

export async function getLowDiskSpaceStatus() {
  try {
    const userDataPath = app.getPath('userData');
    const diskSpace = await checkDiskSpace(userDataPath);
    const freeSpaceGB = bytesToGB(diskSpace.free);
    if (freeSpaceGB < 10) {
      console.warn(`Low disk space warning: ${freeSpaceGB} GB free.`);
      return true;
    }
    console.log(`Disk space is OK: ${freeSpaceGB} GB free.`);
    return false;
  } catch (error) {
    captureElectronError(error, {
      contexts: { fn: { name: 'isLowDiskSpace' } },
    });
    console.error('Failed to check disk space:', error);
    return false;
  }
}
