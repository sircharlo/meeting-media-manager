import { beforeEach, describe, expect, it, vi } from 'vitest';

const checkForUpdatesAndNotifyMock = vi.fn(async () => undefined);
const handlers = new Map<string, (...args: unknown[]) => void>();
const pathExistsMock = vi.fn(async () => false);
const quitAndInstallMock = vi.fn();
const toggleAuthorizedCloseMock = vi.fn();
// SEC-6 (full-audit backlog): the currently-installed version downgrade
// detection compares against - lower than every hardcoded update version
// used by the other tests below ('26.6.2', '26.6.3'), so they stay ordinary
// upgrades (isDowngrade: false) and aren't affected by this addition.
const getVersionMock = vi.fn(() => '26.6.0');
const appOnMock = vi.fn();
const getAllWindowsMock = vi.fn((): unknown[] => []);
const powerMonitorOnMock = vi.fn();
const isMachineWideInstallationMock = vi.fn(() => false);
const constants = { IS_TEST: false, PLATFORM: 'linux' as NodeJS.Platform };
const pendingUpdate = {
  clearPendingUpdate: vi.fn(),
  countPendingUpdateInstallAttempt: vi.fn(),
  readPendingUpdate: vi.fn(
    (): null | { installAttempts: number; version: string } => null,
  ),
  rememberPendingUpdate: vi.fn(),
};

vi.mock('electron', () => ({
  app: {
    getVersion: getVersionMock,
    on: appOnMock,
  },
  BrowserWindow: { getAllWindows: getAllWindowsMock },
  powerMonitor: { on: powerMonitorOnMock },
}));

vi.mock('src-electron/constants', () => constants);

vi.mock('src-electron/main/pending-update', () => pendingUpdate);

vi.mock('electron-updater', () => ({
  default: {
    autoUpdater: {
      allowDowngrade: false,
      allowPrerelease: false,
      autoDownload: false,
      autoInstallOnAppQuit: false,
      checkForUpdatesAndNotify: checkForUpdatesAndNotifyMock,
      logger: null,
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        handlers.set(event, handler);
      }),
      quitAndInstall: quitAndInstallMock,
    },
  },
}));

vi.mock('fs-extra/esm', () => ({
  pathExists: pathExistsMock,
}));

vi.mock('is-online', () => ({
  default: vi.fn(async () => true),
}));

vi.mock('src-electron/main/downloads', () => ({
  isDownloadErrorExpected: vi.fn(async () => false),
}));

vi.mock('src-electron/main/fs', () => ({
  getAppDataPath: vi.fn(async () => '/app-data'),
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
  isIgnoredUpdateError: vi.fn(() => false),
  isMachineWideInstallation: isMachineWideInstallationMock,
  isUpdaterFullDownloadFallbackError: vi.fn(() => false),
  markUpdaterFullDownloadFallback: vi.fn(),
}));

vi.mock('src-electron/main/window/window-base', () => ({
  sendToWindow: vi.fn(),
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: { mainWindow: null },
  toggleAuthorizedClose: toggleAuthorizedCloseMock,
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

describe('updater install flow', () => {
  beforeEach(() => {
    handlers.clear();
    vi.resetModules();
    vi.clearAllMocks();
    // clearAllMocks() doesn't undo a mockReturnValue override from a
    // previous test - reset explicitly so each test starts from the same
    // "installed version" baseline unless it deliberately overrides it.
    getVersionMock.mockReturnValue('26.6.0');
    pathExistsMock.mockResolvedValue(false);
    // Linux installs on quit, as every platform used to: the tests for
    // installing on the next launch switch to Windows themselves.
    constants.PLATFORM = 'linux';
    getAllWindowsMock.mockReturnValue([]);
    isMachineWideInstallationMock.mockReturnValue(false);
    pendingUpdate.readPendingUpdate.mockReturnValue(null);
    pendingUpdate.rememberPendingUpdate.mockImplementation(() => undefined);
  });

  it('checks for updates', async () => {
    const { initUpdater } = await import('../updater');

    await initUpdater();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(checkForUpdatesAndNotifyMock).toHaveBeenCalledTimes(1);
  });

  it('does not call quitAndInstall before an update is downloaded', async () => {
    const { quitAndInstallUpdate } = await import('../updater');

    quitAndInstallUpdate();

    expect(quitAndInstallMock).not.toHaveBeenCalled();
  });

  it('calls quitAndInstall only once for duplicate install requests', async () => {
    const { initUpdater, isUpdateInstallInProgress, quitAndInstallUpdate } =
      await import('../updater');

    await initUpdater();
    handlers.get('update-downloaded')?.({ version: '26.6.2' });

    expect(isUpdateInstallInProgress()).toBe(false);

    quitAndInstallUpdate();
    quitAndInstallUpdate();

    expect(isUpdateInstallInProgress()).toBe(true);
    expect(quitAndInstallMock).toHaveBeenCalledTimes(1);
    expect(quitAndInstallMock).toHaveBeenCalledWith(false, true);
  });

  // BE-15 (full-audit-2026-09-05.md): on macOS, Electron's native
  // quitAndInstall() closes every window BEFORE firing 'before-quit' -
  // authorizedClose.authorized must already be true by then, or the main
  // window's own close handler intercepts with its confirm-quit prompt and
  // silently aborts the whole install.
  it('authorizes the close before calling quitAndInstall, matching relaunchApp', async () => {
    const { initUpdater, quitAndInstallUpdate } = await import('../updater');

    await initUpdater();
    handlers.get('update-downloaded')?.({ version: '26.6.2' });
    quitAndInstallUpdate();

    expect(toggleAuthorizedCloseMock).toHaveBeenCalledWith(true);
    const authorizeOrder =
      toggleAuthorizedCloseMock.mock.invocationCallOrder[0];
    const installOrder = quitAndInstallMock.mock.invocationCallOrder[0];
    expect(authorizeOrder).toBeDefined();
    expect(installOrder).toBeDefined();
    expect(authorizeOrder as number).toBeLessThan(installOrder as number);
  });

  it('revokes the close authorization if quitAndInstall throws', async () => {
    const { initUpdater, quitAndInstallUpdate } = await import('../updater');

    await initUpdater();
    handlers.get('update-downloaded')?.({ version: '26.6.2' });
    quitAndInstallMock.mockImplementationOnce(() => {
      throw new Error('quitAndInstall failed');
    });

    quitAndInstallUpdate();

    expect(toggleAuthorizedCloseMock).toHaveBeenCalledWith(true);
    expect(toggleAuthorizedCloseMock).toHaveBeenLastCalledWith(false);
  });

  it('resets install state when a new update becomes available', async () => {
    const { initUpdater, quitAndInstallUpdate } = await import('../updater');

    await initUpdater();
    handlers.get('update-downloaded')?.({ version: '26.6.2' });
    quitAndInstallUpdate();
    handlers.get('update-available')?.({ version: '26.6.3' });
    handlers.get('update-downloaded')?.({ version: '26.6.3' });
    quitAndInstallUpdate();

    expect(quitAndInstallMock).toHaveBeenCalledTimes(2);
  });

  it('tracks updater lifecycle state for renderer catch-up', async () => {
    const { getUpdaterState, initUpdater } = await import('../updater');

    expect(getUpdaterState()).toEqual({
      phase: null,
      progress: null,
      versionInfo: null,
    });

    await initUpdater();
    handlers.get('update-available')?.({ version: '26.6.2' });
    expect(getUpdaterState()).toEqual({
      phase: 'downloading',
      progress: null,
      versionInfo: {
        installOnLaunch: false,
        isDowngrade: false,
        version: '26.6.2',
      },
    });

    const progress = {
      bytesPerSecond: 1000,
      delta: 5,
      percent: 50,
      total: 100,
      transferred: 50,
    };
    handlers.get('download-progress')?.(progress);
    expect(getUpdaterState()).toEqual({
      phase: 'downloading',
      progress,
      versionInfo: {
        installOnLaunch: false,
        isDowngrade: false,
        version: '26.6.2',
      },
    });

    handlers.get('update-downloaded')?.({ version: '26.6.2' });
    expect(getUpdaterState()).toEqual({
      phase: 'downloaded',
      progress,
      versionInfo: {
        installOnLaunch: false,
        isDowngrade: false,
        version: '26.6.2',
      },
    });
  });

  it('resets tracked updater state when the updater errors', async () => {
    const { getUpdaterState, initUpdater } = await import('../updater');

    await initUpdater();
    handlers.get('update-available')?.({ version: '26.6.2' });
    expect(getUpdaterState()).toEqual({
      phase: 'downloading',
      progress: null,
      versionInfo: {
        installOnLaunch: false,
        isDowngrade: false,
        version: '26.6.2',
      },
    });

    handlers.get('error')?.(new Error('network error'), 'network error');

    // A future renderer mount's catch-up must not see a stale 'downloading'
    // phase for an update that actually failed.
    expect(getUpdaterState()).toEqual({
      phase: null,
      progress: null,
      versionInfo: null,
    });
  });

  // SEC-6 (full-audit backlog): allowDowngrade is always on (needed for the
  // beta->stable channel switch), but a downgrade previously installed with
  // the exact same one-click wording as any other update, no indication
  // given at all.
  describe('downgrade detection', () => {
    it('flags update-available as a downgrade when the version is lower than the installed one', async () => {
      const { getUpdaterState, initUpdater } = await import('../updater');

      await initUpdater();
      handlers.get('update-available')?.({ version: '26.5.9' });

      expect(getUpdaterState().versionInfo).toEqual({
        installOnLaunch: false,
        isDowngrade: true,
        version: '26.5.9',
      });
    });

    it('flags update-downloaded as a downgrade independently, even without a preceding update-available', async () => {
      const { getUpdaterState, initUpdater } = await import('../updater');

      await initUpdater();
      handlers.get('update-downloaded')?.({ version: '26.5.9' });

      expect(getUpdaterState().versionInfo).toEqual({
        installOnLaunch: false,
        isDowngrade: true,
        version: '26.5.9',
      });
    });

    it.each([
      {
        // The exact scenario allowDowngrade exists for: switching a beta
        // build back to the latest matching stable release is a promotion,
        // not a downgrade, even though the beta's own prerelease suffix makes
        // the installed version string "26.6.0-beta.9" look larger at a
        // glance than the plain "26.6.0" it's switching to.
        installedVersion: '26.6.0-beta.9',
        isDowngrade: false,
        title:
          'does not flag a beta->stable channel switch to a numerically-lower-looking version as a downgrade when it is not one',
        updateVersion: '26.6.0',
      },
      {
        // The actual motivating case from the code comment: a beta tester on
        // 26.6.1-beta.24 (already past 26.6.0) turns beta updates off and
        // rolls back to the last real stable release, 26.6.0.
        installedVersion: '26.6.1-beta.24',
        isDowngrade: true,
        title:
          'does flag a genuine downgrade away from an in-progress beta cycle',
        updateVersion: '26.6.0',
      },
      {
        installedVersion: '26.6.0',
        isDowngrade: false,
        title: 'treats an identical version as not a downgrade',
        updateVersion: '26.6.0',
      },
    ])('$title', async ({ installedVersion, isDowngrade, updateVersion }) => {
      getVersionMock.mockReturnValue(installedVersion);
      const { getUpdaterState, initUpdater } = await import('../updater');

      await initUpdater();
      handlers.get('update-available')?.({ version: updateVersion });

      expect(getUpdaterState().versionInfo).toEqual({
        installOnLaunch: false,
        isDowngrade,
        version: updateVersion,
      });
    });

    const isDowngradeFrom = async (
      installedVersion: string,
      updateVersion: string,
    ) => {
      getVersionMock.mockReturnValue(installedVersion);
      const { getUpdaterState, initUpdater } = await import('../updater');
      await initUpdater();
      handlers.get('update-available')?.({ version: updateVersion });
      return getUpdaterState().versionInfo?.isDowngrade;
    };

    it.each([
      ['26.6.0', '26.6.1'],
      ['26.9.0', '26.10.0'],
      ['26.12.5', '27.0.0'],
      ['26.6.0', '26.6.0.1'],
      ['26.6.0-beta.2', '26.6.0-beta.10'],
      ['26.6.0-alpha.1', '26.6.0-beta.1'],
      ['26.6.0-beta', '26.6.0-beta.1'],
      ['26.6.0-beta.1', '26.6.0-beta.x'],
      ['26.6.0-beta', '26.6.0-rc'],
      ['26.6.0-beta.9', '26.6.0'],
      ['26.6.0-1.alpha', '26.6.0-1.beta'],
      ['', '26.6.0'],
    ])('orders %j before %j', async (lower, higher) => {
      expect(await isDowngradeFrom(higher, lower)).toBe(true);
      vi.resetModules();
      expect(await isDowngradeFrom(lower, higher)).toBe(false);
    });

    it.each([
      ['26.6', '26.6.0'],
      ['26.6.0-beta.1', '26.6.0-beta.1'],
      ['26.6.0-', '26.6.0'],
      ['26.6.0-beta.01', '26.6.0-beta.1'],
      ['26.6.0-beta.', '26.6.0-beta.0'],
      ['26.6.0-beta.Infinity', '26.6.0-beta.Infinity'],
      // Only the first "-" starts the prerelease tag.
      ['26.6.0-beta-2', '26.6.0-beta-3'],
      // Not a number: neither is lower.
      ['26.x.0', '26.6.0'],
    ])('treats %j and %j as no downgrade either way', async (a, b) => {
      expect(await isDowngradeFrom(a, b)).toBe(false);
      vi.resetModules();
      expect(await isDowngradeFrom(b, a)).toBe(false);
    });
  });

  it('logs update download progress as readable text', async () => {
    const { sendToWindow } =
      await import('src-electron/main/window/window-base');
    const { log } = await import('src/shared/vanilla');
    const { initUpdater } = await import('../updater');
    const progress = {
      bytesPerSecond: 224980,
      delta: 260723,
      percent: 13.749029536464944,
      total: 126027404,
      transferred: 17327545,
    };

    await initUpdater();
    handlers.get('download-progress')?.(progress);

    expect(log).toHaveBeenCalledWith(
      'Update download progress: 13.75%, 17327545/126027404 bytes, 224980 B/s, delta 260723 bytes',
      'electronUpdater',
      'log',
    );
    expect(log).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      progress,
    );
    expect(sendToWindow).toHaveBeenCalledWith(
      null,
      'update-download-progress',
      progress,
    );
  });

  const getAutoUpdater = async () =>
    (await import('electron-updater')).default.autoUpdater;

  // electron-builder#7807: installing on quit runs the installer just as the
  // computer gets turned off, which kills it halfway and leaves an app that
  // no longer opens.
  describe('installing on the next launch (Windows, installed for one user)', () => {
    beforeEach(() => {
      constants.PLATFORM = 'win32';
    });

    it('does not install on quit, and remembers the downloaded update', async () => {
      const { getUpdaterState, initUpdater } = await import('../updater');

      await initUpdater();
      handlers.get('update-downloaded')?.({ version: '26.6.2' });

      expect((await getAutoUpdater()).autoInstallOnAppQuit).toBe(false);
      expect(pendingUpdate.rememberPendingUpdate).toHaveBeenCalledWith(
        '26.6.2',
      );
      expect(getUpdaterState().versionInfo?.installOnLaunch).toBe(false);
    });

    it('installs an update that waited since an earlier session', async () => {
      pendingUpdate.readPendingUpdate.mockReturnValue({
        installAttempts: 1,
        version: '26.6.2',
      });
      const { sendToWindow } =
        await import('src-electron/main/window/window-base');
      const { getUpdaterState, initUpdater } = await import('../updater');

      await initUpdater();
      handlers.get('update-downloaded')?.({ version: '26.6.2' });

      const versionInfo = {
        installOnLaunch: true,
        isDowngrade: false,
        version: '26.6.2',
      };
      expect(getUpdaterState().versionInfo).toEqual(versionInfo);
      expect(sendToWindow).toHaveBeenCalledWith(
        null,
        'update-downloaded',
        versionInfo,
      );
    });

    it.each([
      {
        downloaded: '26.6.3',
        pending: { installAttempts: 0, version: '26.6.2' },
        title: 'a newer update than the one that waited',
      },
      {
        downloaded: '26.6.2',
        pending: { installAttempts: 2, version: '26.6.2' },
        title: 'an update whose install already failed twice',
      },
    ])(
      'does not install $title right away',
      async ({ downloaded, pending }) => {
        pendingUpdate.readPendingUpdate.mockReturnValue(pending);
        const { getUpdaterState, initUpdater } = await import('../updater');

        await initUpdater();
        handlers.get('update-downloaded')?.({ version: downloaded });

        expect(getUpdaterState().versionInfo?.installOnLaunch).toBe(false);
      },
    );

    it('forgets the pending update once it is the running version', async () => {
      getVersionMock.mockReturnValue('26.6.2');
      pendingUpdate.readPendingUpdate.mockReturnValue({
        installAttempts: 1,
        version: '26.6.2',
      });
      const { initUpdater } = await import('../updater');

      await initUpdater();

      expect(pendingUpdate.clearPendingUpdate).toHaveBeenCalledOnce();
    });

    it('counts the install attempt before the app quits for the installer', async () => {
      const { initUpdater, quitAndInstallUpdate } = await import('../updater');

      await initUpdater();
      handlers.get('update-downloaded')?.({ version: '26.6.2' });
      quitAndInstallUpdate();

      const { countPendingUpdateInstallAttempt } = pendingUpdate;
      expect(countPendingUpdateInstallAttempt).toHaveBeenCalledWith('26.6.2');
      expect(
        countPendingUpdateInstallAttempt.mock.invocationCallOrder[0],
      ).toBeLessThan(quitAndInstallMock.mock.invocationCallOrder[0] as number);
    });

    it.each([
      {
        isSilent: true,
        pending: { installAttempts: 0, version: '26.6.2' },
        when: 'on launch',
      },
      { isSilent: false, pending: null, when: 'after its download' },
    ])(
      'runs the installer silently only $when',
      async ({ isSilent, pending }) => {
        pendingUpdate.readPendingUpdate.mockReturnValue(pending);
        const { initUpdater, quitAndInstallUpdate } =
          await import('../updater');

        await initUpdater();
        handlers.get('update-downloaded')?.({ version: '26.6.2' });
        quitAndInstallUpdate();

        // Silent, the installer starts the app again by itself.
        expect(quitAndInstallMock).toHaveBeenCalledWith(isSilent, true);
      },
    );

    it('reports a pending update that cannot be saved, unless the disk is full', async () => {
      const { captureElectronError } = await import('src-electron/main/utils');
      const { initUpdater } = await import('../updater');
      await initUpdater();

      pendingUpdate.rememberPendingUpdate.mockImplementationOnce(() => {
        throw Object.assign(new Error('no space left'), { code: 'ENOSPC' });
      });
      handlers.get('update-downloaded')?.({ version: '26.6.2' });
      expect(captureElectronError).not.toHaveBeenCalled();

      const error = Object.assign(new Error('denied'), { code: 'EPERM' });
      pendingUpdate.rememberPendingUpdate.mockImplementationOnce(() => {
        throw error;
      });
      handlers.get('update-downloaded')?.({ version: '26.6.2' });
      expect(captureElectronError).toHaveBeenCalledWith(error, {
        contexts: { fn: { name: 'rememberDownloadedUpdate' } },
      });
    });

    it('keeps installing on quit when installed for all users', async () => {
      isMachineWideInstallationMock.mockReturnValue(true);
      const { initUpdater } = await import('../updater');

      await initUpdater();
      handlers.get('update-downloaded')?.({ version: '26.6.2' });

      expect((await getAutoUpdater()).autoInstallOnAppQuit).toBe(true);
      expect(pendingUpdate.readPendingUpdate).not.toHaveBeenCalled();
      expect(pendingUpdate.rememberPendingUpdate).not.toHaveBeenCalled();
    });
  });

  describe('install on quit while the system shuts down', () => {
    const createWindow = () => {
      const windowHandlers = new Map<string, () => void>();
      return {
        handlers: windowHandlers,
        on: vi.fn((event: string, handler: () => void) => {
          windowHandlers.set(event, handler);
        }),
      };
    };

    it.each(['query-session-end', 'session-end'])(
      'is skipped once a Windows window gets %s',
      async (event) => {
        constants.PLATFORM = 'win32';
        isMachineWideInstallationMock.mockReturnValue(true);
        const window = createWindow();
        getAllWindowsMock.mockReturnValue([window]);
        const { initUpdater } = await import('../updater');
        const autoUpdater = await getAutoUpdater();

        await initUpdater();
        expect(autoUpdater.autoInstallOnAppQuit).toBe(true);

        window.handlers.get(event)?.();
        expect(autoUpdater.autoInstallOnAppQuit).toBe(false);
      },
    );

    it('is skipped once a window opened later learns that the session ends', async () => {
      constants.PLATFORM = 'win32';
      isMachineWideInstallationMock.mockReturnValue(true);
      const { initUpdater } = await import('../updater');
      const autoUpdater = await getAutoUpdater();

      await initUpdater();
      const [, onWindowCreated] =
        appOnMock.mock.calls.find(
          ([name]) => name === 'browser-window-created',
        ) ?? [];
      const window = createWindow();
      (onWindowCreated as (event: unknown, window: unknown) => void)(
        {},
        window,
      );
      window.handlers.get('session-end')?.();

      expect(autoUpdater.autoInstallOnAppQuit).toBe(false);
    });

    it('is skipped once Linux shuts down', async () => {
      const { initUpdater } = await import('../updater');
      const autoUpdater = await getAutoUpdater();

      await initUpdater();
      const [, onShutdown] =
        powerMonitorOnMock.mock.calls.find(([name]) => name === 'shutdown') ??
        [];
      (onShutdown as () => void)();

      expect(autoUpdater.autoInstallOnAppQuit).toBe(false);
    });

    it('is left to Squirrel.Mac on macOS', async () => {
      constants.PLATFORM = 'darwin';
      const { initUpdater } = await import('../updater');

      await initUpdater();

      expect((await getAutoUpdater()).autoInstallOnAppQuit).toBe(true);
      expect(powerMonitorOnMock).not.toHaveBeenCalled();
      expect(getAllWindowsMock).not.toHaveBeenCalled();
    });

    it('is not watched when the update installs on the next launch', async () => {
      constants.PLATFORM = 'win32';
      const { initUpdater } = await import('../updater');

      await initUpdater();

      expect(getAllWindowsMock).not.toHaveBeenCalled();
      expect(appOnMock).not.toHaveBeenCalled();
    });
  });
});
