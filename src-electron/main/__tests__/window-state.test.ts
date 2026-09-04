import { beforeEach, describe, expect, it, vi } from 'vitest';

const appGetPath = vi.fn();
const browserWindowHandlers = new Map<string, () => void>();
const addElectronBreadcrumb = vi.fn();
const captureElectronError = vi.fn();
const ensureDir = vi.fn();
const getDisplayMatching = vi.fn();
const pathExistsSync = vi.fn();
const readJsonSync = vi.fn();
// resilient-storage.ts's atomic-write helper (BE-5, full-audit-2026-09-04.md)
// writes to a temp path then renames it over the destination instead of
// writing the destination directly, and best-effort removes the temp file
// if that fails - both now needed here alongside the pre-existing mocks.
const remove = vi.fn().mockResolvedValue(undefined);
const rename = vi.fn().mockResolvedValue(undefined);
const writeJson = vi.fn();

class MockBrowserWindow {
  getBounds = vi.fn(() => ({ height: 600, width: 1000, x: 0, y: 0 }));
  isDestroyed = vi.fn(() => false);
  isFullScreen = vi.fn(() => false);
  isMaximized = vi.fn(() => false);
  isMinimized = vi.fn(() => false);
  maximize = vi.fn();
  on = vi.fn((eventName: string, handler: () => void) => {
    browserWindowHandlers.set(eventName, handler);
  });
  removeListener = vi.fn();
  setBounds = vi.fn();
  setFullScreen = vi.fn();
}

vi.mock('electron', () => ({
  app: {
    getPath: appGetPath,
  },
  BrowserWindow: MockBrowserWindow,
  screen: {
    getDisplayMatching,
  },
}));

vi.mock('fs-extra/esm', () => ({
  ensureDir,
  pathExistsSync,
  readJsonSync,
  remove,
  writeJson,
}));

vi.mock('node:fs/promises', () => ({
  rename,
}));

vi.mock('src-electron/main/utils', () => ({
  addElectronBreadcrumb,
  captureElectronError,
}));

vi.mock('src/shared/vanilla', () => ({
  debounce: (func: () => void) => func,
  log: vi.fn(),
}));

describe('StatefulBrowserWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    browserWindowHandlers.clear();
    appGetPath.mockReturnValue('C:/Users/Test/AppData/Roaming/M3');
    getDisplayMatching.mockReturnValue({
      bounds: { height: 1080, width: 1920, x: 0, y: 0 },
      scaleFactor: 1,
    });
    pathExistsSync.mockReturnValue(false);
    readJsonSync.mockReturnValue(null);
  });

  it('captures the state file path when saving window state fails', async () => {
    const error = Object.assign(new Error('EPERM: operation not permitted'), {
      code: 'EPERM',
    });
    writeJson.mockRejectedValue(error);
    ensureDir.mockResolvedValue(undefined);

    const { StatefulBrowserWindow } =
      await import('src-electron/main/window/window-state');

    const statefulWindow = new StatefulBrowserWindow({
      configFileName: 'main-window-state.json',
      configFilePath: 'C:/Users/Test/AppData/Roaming/M3',
    });

    const closedHandler = browserWindowHandlers.get('closed');
    closedHandler?.();
    await vi.waitFor(() => {
      expect(captureElectronError).toHaveBeenCalledWith(error, {
        contexts: {
          fn: {
            name: 'StatefulBrowserWindow.saveState',
            path: 'C:/Users/Test/AppData/Roaming/M3/main-window-state.json',
          },
        },
      });
    });

    expect(statefulWindow.win.removeListener).toHaveBeenCalledWith(
      'closed',
      closedHandler,
    );
  });

  it('resolves the display once per state update instead of twice', async () => {
    const { StatefulBrowserWindow } =
      await import('src-electron/main/window/window-state');

    new StatefulBrowserWindow({
      configFileName: 'main-window-state.json',
      configFilePath: 'C:/Users/Test/AppData/Roaming/M3',
    });

    const closeHandler = browserWindowHandlers.get('close');
    closeHandler?.();

    expect(getDisplayMatching).toHaveBeenCalledTimes(1);
  });

  it('skips the display lookup when the window reports invalid bounds', async () => {
    const { StatefulBrowserWindow } =
      await import('src-electron/main/window/window-state');

    const statefulWindow = new StatefulBrowserWindow({
      configFileName: 'main-window-state.json',
      configFilePath: 'C:/Users/Test/AppData/Roaming/M3',
    });

    statefulWindow.win.getBounds = vi.fn(() => ({
      height: 0,
      width: 0,
      x: 0,
      y: 0,
    }));

    const closeHandler = browserWindowHandlers.get('close');
    closeHandler?.();

    expect(getDisplayMatching).not.toHaveBeenCalled();
  });
});
