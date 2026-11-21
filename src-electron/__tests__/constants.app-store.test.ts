import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { existsSyncMock } = vi.hoisted(() => ({
  existsSyncMock: vi.fn<(path: string) => boolean>(() => false),
}));

vi.mock('node:fs', () => ({ existsSync: existsSyncMock }));

// What Electron sets on process for a store build.
type StoreProcess = NodeJS.Process & { mas?: boolean; windowsStore?: boolean };
const storeProcess = process as StoreProcess;

describe('detectAppStore', () => {
  beforeEach(() => {
    existsSyncMock.mockReturnValue(false);
    vi.stubEnv('SNAP', '');
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
    ['snap-store', () => vi.stubEnv('SNAP', '/snap/meeting-media-manager/12')],
    ['flathub', () => vi.stubEnv('FLATPAK_ID', 'io.github.sircharlo.M3')],
    ['flathub', () => existsSyncMock.mockReturnValue(true)],
  ])('tells a %s build', async (store, install) => {
    install();
    const { detectAppStore } = await import('../constants');

    expect(detectAppStore()).toBe(store);
  });

  it("looks for Flatpak's sandbox info file", async () => {
    const { detectAppStore } = await import('../constants');

    detectAppStore();

    expect(existsSyncMock).toHaveBeenCalledWith('/.flatpak-info');
  });
});
