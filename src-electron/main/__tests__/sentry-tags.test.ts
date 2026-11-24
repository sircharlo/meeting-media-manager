import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { electronApp } = vi.hoisted(() => ({
  electronApp: { runningUnderARM64Translation: false },
}));

vi.mock('electron', () => ({ app: electronApp }));

// What Electron sets on process for a Microsoft Store build.
type StoreProcess = NodeJS.Process & { windowsStore?: boolean };

const setPlatform = (platform: NodeJS.Platform) => {
  Object.defineProperty(process, 'platform', {
    configurable: true,
    value: platform,
  });
};

describe('Sentry tags', () => {
  const realPlatform = process.platform;

  beforeEach(() => {
    vi.stubEnv('APPIMAGE', '');
    vi.stubEnv('FLATPAK_ID', '');
    vi.stubEnv('PORTABLE_EXECUTABLE_DIR', '');
    vi.stubEnv('SNAP_NAME', '');
    electronApp.runningUnderARM64Translation = false;
  });

  afterEach(() => {
    setPlatform(realPlatform);
    Reflect.deleteProperty(process, 'windowsStore');
    vi.unstubAllEnvs();
  });

  describe('getInstallMethod', () => {
    it("is the app store's, before anything else", async () => {
      setPlatform('win32');
      (process as StoreProcess).windowsStore = true;
      vi.stubEnv('PORTABLE_EXECUTABLE_DIR', String.raw`C:\Users\x\Desktop`);
      const { getInstallMethod } = await import('../sentry-tags');

      expect(getInstallMethod()).toBe('microsoft-store');
    });

    it('tells the snap from the AppImage it could have been started from', async () => {
      setPlatform('linux');
      vi.stubEnv('SNAP_NAME', 'meeting-media-manager');
      vi.stubEnv('APPIMAGE', '/home/x/Other.AppImage');
      const { getInstallMethod } = await import('../sentry-tags');

      expect(getInstallMethod()).toBe('snap-store');
    });

    it('tells the portable build and the AppImage', async () => {
      const { getInstallMethod } = await import('../sentry-tags');

      setPlatform('win32');
      vi.stubEnv('PORTABLE_EXECUTABLE_DIR', String.raw`C:\Users\x\Desktop`);
      expect(getInstallMethod()).toBe('portable');

      vi.stubEnv('PORTABLE_EXECUTABLE_DIR', '');
      setPlatform('linux');
      vi.stubEnv('APPIMAGE', '/home/x/meeting-media-manager.AppImage');
      expect(getInstallMethod()).toBe('appimage');
    });

    it("is M³'s installer on Windows and macOS, and unpacked on Linux", async () => {
      const { getInstallMethod } = await import('../sentry-tags');

      setPlatform('win32');
      expect(getInstallMethod()).toBe('installer');
      setPlatform('darwin');
      expect(getInstallMethod()).toBe('installer');
      setPlatform('linux');
      expect(getInstallMethod()).toBe('unpacked');
    });
  });

  describe('getSentryTags', () => {
    it('says whether M³ runs under emulation on an ARM computer, on Windows and macOS', async () => {
      const { getSentryTags } = await import('../sentry-tags');

      setPlatform('win32');
      expect(getSentryTags()).toEqual({
        arm64_translation: 'false',
        install_method: 'installer',
      });

      electronApp.runningUnderARM64Translation = true;
      expect(getSentryTags()).toEqual({
        arm64_translation: 'true',
        install_method: 'installer',
      });
      setPlatform('darwin');
      expect(getSentryTags().arm64_translation).toBe('true');
    });

    it("leaves emulation out on Linux, where Electron doesn't tell", async () => {
      setPlatform('linux');
      vi.stubEnv('APPIMAGE', '/home/x/meeting-media-manager.AppImage');
      const { getSentryTags } = await import('../sentry-tags');

      expect(getSentryTags()).toEqual({ install_method: 'appimage' });
    });
  });
});
