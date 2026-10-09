import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  appPath: 'C:/m3/resources/app.asar',
  existsSync: vi.fn<(path: string) => boolean>(),
  isDev: false,
  logToWindow: vi.fn(),
  request: vi.fn(async () => ({ ok: true })),
  start: vi.fn(async () => ({ ok: true })),
}));

vi.mock('node:fs', () => ({ existsSync: mocks.existsSync }));

vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn(() => mocks.appPath),
    getPath: vi.fn(() => 'C:/m3/user-data'),
  },
}));

vi.mock('src-electron/constants', () => ({
  get IS_DEV() {
    return mocks.isDev;
  },
  PLATFORM: 'win32',
}));

vi.mock('src-electron/main/window/window-base', () => ({
  logToWindow: mocks.logToWindow,
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: { mainWindow: null },
}));

vi.mock('src-electron/main/zoom-helper-process', () => ({
  ZoomHelperProcess: class {
    request = mocks.request;
    start = mocks.start;
    stop = vi.fn();
  },
}));

describe('Zoom helper manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mocks.appPath = 'C:/m3/resources/app.asar';
    mocks.isDev = false;
    // Only Electron sets it: where packaged builds keep resources/zoom-helper.
    Object.defineProperty(process, 'resourcesPath', {
      configurable: true,
      value: 'C:/m3/resources',
    });
  });

  it("reports the helper's files missing instead of trying to start it", async () => {
    mocks.existsSync.mockReturnValue(false);
    const { runZoomHelperCommand, startZoomHelper } =
      await import('../zoom-helper-manager');

    expect(await startZoomHelper()).toEqual({
      error: 'helper-missing',
      ok: false,
    });
    expect(await runZoomHelperCommand({ type: 'meeting' })).toEqual({
      error: 'helper-missing',
      ok: false,
    });
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.request).not.toHaveBeenCalled();
    expect(mocks.existsSync).toHaveBeenCalledWith(
      expect.stringMatching(/zoom-helper[\\/]zoom-helper\.ps1$/),
    );
  });

  it('starts the helper and runs commands when its files are there', async () => {
    mocks.existsSync.mockReturnValue(true);
    const { runZoomHelperCommand, startZoomHelper } =
      await import('../zoom-helper-manager');

    expect(await startZoomHelper()).toEqual({ ok: true });
    expect(await runZoomHelperCommand({ type: 'meeting' })).toEqual({
      ok: true,
    });
    expect(mocks.request).toHaveBeenCalledWith({ type: 'meeting' });
  });

  it('finds the helper in the repository under `yarn dev`', async () => {
    // Quasar's dev build runs the app from inside .quasar/.
    mocks.isDev = true;
    mocks.appPath = 'C:/repo/.quasar/dev-electron/electron';
    mocks.existsSync.mockImplementation(
      (path) =>
        path === 'C:/repo/src-electron' ||
        path === 'C:/repo/src-electron/zoom-helper/zoom-helper.ps1',
    );
    const { getDevRepoPath, startZoomHelper } =
      await import('../zoom-helper-manager');

    expect(await startZoomHelper()).toEqual({ ok: true });
    expect(mocks.existsSync).toHaveBeenCalledWith(
      'C:/repo/src-electron/zoom-helper/zoom-helper.ps1',
    );
    expect(getDevRepoPath('.env.zoom-test')).toBe('C:/repo/.env.zoom-test');
  });
});
