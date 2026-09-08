import type { OsSupportWarning } from 'src/types';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const checkForUpdatesAndNotifyMock = vi.fn(async () => undefined);
const handlers = new Map<string, (...args: unknown[]) => void>();
const pathExistsMock = vi.fn(async () => false);
const quitAndInstallMock = vi.fn();
const toggleAuthorizedCloseMock = vi.fn();
const getOsSupportWarningMock = vi.fn<() => null | OsSupportWarning>(
  () => null,
);
// SEC-6 (full-audit backlog): the currently-installed version downgrade
// detection compares against - lower than every hardcoded update version
// used by the other tests below ('26.6.2', '26.6.3'), so they stay ordinary
// upgrades (isDowngrade: false) and aren't affected by this addition.
const getVersionMock = vi.fn(() => '26.6.0');

vi.mock('electron', () => ({
  app: {
    getVersion: getVersionMock,
  },
}));

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

vi.mock('src-electron/main/os-support', () => ({
  getOsSupportWarning: getOsSupportWarningMock,
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
  isIgnoredUpdateError: vi.fn(() => false),
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
    getOsSupportWarningMock.mockReturnValue(null);
  });

  it('checks for updates on supported platforms', async () => {
    const { initUpdater } = await import('../updater');

    await initUpdater();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(checkForUpdatesAndNotifyMock).toHaveBeenCalledTimes(1);
  });

  it('skips the update check on platforms future releases will not support', async () => {
    const { log } = await import('src/shared/vanilla');
    getOsSupportWarningMock.mockReturnValue('win32-ia32');
    const { initUpdater } = await import('../updater');

    await initUpdater();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(checkForUpdatesAndNotifyMock).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      'Skipping update check: this platform is no longer supported by future releases.',
      'electronUpdater',
      'info',
    );
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
      versionInfo: { isDowngrade: false, version: '26.6.2' },
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
      versionInfo: { isDowngrade: false, version: '26.6.2' },
    });

    handlers.get('update-downloaded')?.({ version: '26.6.2' });
    expect(getUpdaterState()).toEqual({
      phase: 'downloaded',
      progress,
      versionInfo: { isDowngrade: false, version: '26.6.2' },
    });
  });

  it('resets tracked updater state when the updater errors', async () => {
    const { getUpdaterState, initUpdater } = await import('../updater');

    await initUpdater();
    handlers.get('update-available')?.({ version: '26.6.2' });
    expect(getUpdaterState()).toEqual({
      phase: 'downloading',
      progress: null,
      versionInfo: { isDowngrade: false, version: '26.6.2' },
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
        isDowngrade: true,
        version: '26.5.9',
      });
    });

    it('flags update-downloaded as a downgrade independently, even without a preceding update-available', async () => {
      const { getUpdaterState, initUpdater } = await import('../updater');

      await initUpdater();
      handlers.get('update-downloaded')?.({ version: '26.5.9' });

      expect(getUpdaterState().versionInfo).toEqual({
        isDowngrade: true,
        version: '26.5.9',
      });
    });

    it('does not flag a beta->stable channel switch to a numerically-lower-looking version as a downgrade when it is not one', async () => {
      // The exact scenario allowDowngrade exists for: switching a beta
      // build back to the latest matching stable release is a promotion,
      // not a downgrade, even though the beta's own prerelease suffix makes
      // the installed version string "26.6.0-beta.9" look larger at a
      // glance than the plain "26.6.0" it's switching to.
      getVersionMock.mockReturnValue('26.6.0-beta.9');
      const { getUpdaterState, initUpdater } = await import('../updater');

      await initUpdater();
      handlers.get('update-available')?.({ version: '26.6.0' });

      expect(getUpdaterState().versionInfo).toEqual({
        isDowngrade: false,
        version: '26.6.0',
      });
    });

    it('does flag a genuine downgrade away from an in-progress beta cycle', async () => {
      // The actual motivating case from the code comment: a beta tester on
      // 26.6.1-beta.24 (already past 26.6.0) turns beta updates off and
      // rolls back to the last real stable release, 26.6.0.
      getVersionMock.mockReturnValue('26.6.1-beta.24');
      const { getUpdaterState, initUpdater } = await import('../updater');

      await initUpdater();
      handlers.get('update-available')?.({ version: '26.6.0' });

      expect(getUpdaterState().versionInfo).toEqual({
        isDowngrade: true,
        version: '26.6.0',
      });
    });

    it('treats an identical version as not a downgrade', async () => {
      getVersionMock.mockReturnValue('26.6.0');
      const { getUpdaterState, initUpdater } = await import('../updater');

      await initUpdater();
      handlers.get('update-available')?.({ version: '26.6.0' });

      expect(getUpdaterState().versionInfo).toEqual({
        isDowngrade: false,
        version: '26.6.0',
      });
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
});
