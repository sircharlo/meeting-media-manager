import { app } from 'electron';
import { detectAppStore } from 'src-electron/constants';

/**
 * How this copy of M³ was installed: from an app store (see detectAppStore),
 * as the portable build or the AppImage (whose launchers set
 * PORTABLE_EXECUTABLE_DIR and APPIMAGE), or else with M³'s own installer on
 * Windows and macOS, and unpacked on Linux.
 */
export const getInstallMethod = (): string => {
  const appStore = detectAppStore();
  if (appStore) return appStore;
  if (process.env.PORTABLE_EXECUTABLE_DIR) return 'portable';
  if (process.env.APPIMAGE) return 'appimage';
  return process.platform === 'linux' ? 'unpacked' : 'installer';
};

/**
 * The tags on every Sentry event, the main process's and the renderer's
 * (which gets them with getSentryTagsSync): how M³ was installed, and, on
 * Windows and macOS, whether it runs under emulation on an ARM computer
 * (Windows on ARM running the x64 build, or a Mac's Rosetta). An event's
 * device.arch is the processor M³ was built for, which an emulated x64
 * build reports as x64 too, so only this tells how many of M³'s Windows
 * users have ARM computers.
 */
export const getSentryTags = (): Record<string, string> => ({
  install_method: getInstallMethod(),
  ...(process.platform === 'linux'
    ? {}
    : { arm64_translation: String(app.runningUnderARM64Translation) }),
});
