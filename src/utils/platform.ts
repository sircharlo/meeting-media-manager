import { Platform } from 'quasar';

export const getCurrentPlatform = (): NodeJS.Platform => {
  if (Platform.is.win) return 'win32';
  if (Platform.is.linux) return 'linux';
  return 'darwin';
};
