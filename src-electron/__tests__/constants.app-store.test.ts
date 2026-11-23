import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// What Electron sets on process for a store build.
type StoreProcess = NodeJS.Process & { mas?: boolean; windowsStore?: boolean };
const storeProcess = process as StoreProcess;

describe('detectAppStore', () => {
  beforeEach(() => {
    vi.stubEnv('SNAP', '');
    vi.stubEnv('SNAP_NAME', '');
    vi.stubEnv('SNAP_USER_COMMON', '');
    vi.stubEnv('FLATPAK_ID', '');
  });

  afterEach(() => {
    // Electron types them as always there; outside Electron they aren't.
    Reflect.deleteProperty(process, 'mas');
    Reflect.deleteProperty(process, 'windowsStore');
    vi.unstubAllEnvs();
  });

  it("is none for M³'s own installers, the AppImage and the portable build", async () => {
    const { detectAppStore } = await import('../constants');

    expect(detectAppStore()).toBeNull();
  });

  it.each([
    [
      'mac-app-store',
      () => {
        storeProcess.mas = true;
      },
    ],
    [
      'microsoft-store',
      () => {
        storeProcess.windowsStore = true;
      },
    ],
    [
      'snap-store',
      () => {
        vi.stubEnv('SNAP', '/snap/meeting-media-manager/12');
        vi.stubEnv('SNAP_NAME', 'meeting-media-manager');
      },
    ],
    [
      'flathub',
      () =>
        vi.stubEnv('FLATPAK_ID', 'io.github.sircharlo.meeting-media-manager'),
    ],
  ])('tells a %s build', async (store, install) => {
    install();
    const { detectAppStore } = await import('../constants');

    expect(detectAppStore()).toBe(store);
  });

  it.each([
    [
      'a classic snap (VS Code) whose terminal started the AppImage',
      () => {
        vi.stubEnv('SNAP', '/snap/code/212');
        vi.stubEnv('SNAP_NAME', 'code');
        vi.stubEnv('SNAP_USER_COMMON', '/home/user/snap/code/common');
      },
    ],
    ['another Flatpak', () => vi.stubEnv('FLATPAK_ID', 'org.mozilla.firefox')],
  ])("isn't a store build when started from %s", async (_from, install) => {
    install();
    const { detectAppStore } = await import('../constants');

    expect(detectAppStore()).toBeNull();
  });
});
