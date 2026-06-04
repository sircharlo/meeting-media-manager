import { beforeEach, describe, expect, it, vi } from 'vitest';

const appGetPath = vi.fn();
const browserWindowHandlers = new Map<string, () => void>();
const captureElectronError = vi.fn();
const ensureDir = vi.fn();
const getDisplayMatching = vi.fn();
const readJsonSync = vi.fn();
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
  readJsonSync,
  writeJson,
}));

vi.mock('src-electron/main/utils', () => ({
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

    browserWindowHandlers.get('closed')?.();
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
      expect.any(Function),
    );
  });
});
