import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDisplayMatching = vi.fn();
const mockReadJsonSync = vi.fn();
const mockPathExistsSync = vi.fn();

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/app-data'),
  },
  screen: {
    getDisplayMatching,
  },
}));

vi.mock('fs-extra/esm', () => ({
  pathExistsSync: mockPathExistsSync,
  readJsonSync: mockReadJsonSync,
}));

vi.mock('src-electron/constants', () => ({
  HD_RESOLUTION: [1920, 1080],
  PLATFORM: 'linux',
}));

vi.mock('src-electron/main/screen', () => ({
  getAllScreens: vi.fn(),
  getWindowScreen: vi.fn(),
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
  getIconPath: vi.fn(() => '/tmp/icon.png'),
}));

vi.mock('src-electron/main/window/window-base', () => ({
  createWindow: vi.fn(),
  sendToWindow: vi.fn(),
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: { mainWindow: {} },
}));

describe('window-media placement helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathExistsSync.mockReturnValue(false);
    getDisplayMatching.mockReturnValue({ id: 2 });
  });

  it('recognizes effectively fullscreen bounds with tolerance', async () => {
    const { __testables } = await import('../window/window-media');

    expect(
      __testables.isWindowEffectivelyFullscreen(
        { height: 1075, width: 1915, x: 0, y: 0 },
        { height: 1080, width: 1920, x: 0, y: 0 },
      ),
    ).toBe(true);
    expect(
      __testables.isWindowEffectivelyFullscreen(
        { height: 900, width: 1600, x: 0, y: 0 },
        { height: 1080, width: 1920, x: 0, y: 0 },
      ),
    ).toBe(false);
  });

  it('moves a windowed media window to another display when multiple screens exist', async () => {
    const { __testables } = await import('../window/window-media');

    const result = __testables.shouldMoveWindowedToFullscreen(
      {
        currentBounds: { height: 720, width: 1280, x: 0, y: 0 },
        currentDisplayNr: 0,
        isEffectivelyFullscreen: false,
        screenBounds: { height: 1080, width: 1920, x: 0, y: 0 },
      },
      {
        isFullScreen: () => false,
        isMaximized: () => false,
      } as never,
      [
        {
          bounds: { height: 1080, width: 1920, x: 0, y: 0 },
          id: 1,
          mainWindow: true,
        },
        {
          bounds: { height: 1080, width: 1920, x: 1920, y: 0 },
          id: 2,
          mainWindow: false,
        },
      ] as never,
    );

    expect(result).toEqual({ shouldMove: true, targetDisplayNr: 1 });
  });

  it('keeps single-screen setups windowed instead of forcing fullscreen', async () => {
    const { __testables } = await import('../window/window-media');

    const result = __testables.getTargetWhenOnMainScreen(
      [
        {
          bounds: { height: 1080, width: 1920, x: 0, y: 0 },
          id: 1,
          mainWindow: true,
        },
      ] as never,
      0,
      0,
    );

    expect(result).toEqual({ targetDisplayNr: 0, targetFullscreen: false });
  });

  it('redirects fullscreen placement away from the main window display', async () => {
    const { __testables } = await import('../window/window-media');

    const result = __testables.validateAndAdjustTarget(
      { targetDisplayNr: 0, targetFullscreen: true },
      [
        {
          bounds: { height: 1080, width: 1920, x: 0, y: 0 },
          id: 1,
          mainWindow: true,
        },
        {
          bounds: { height: 1080, width: 1920, x: 1920, y: 0 },
          id: 2,
          mainWindow: false,
        },
      ] as never,
    );

    expect(result).toEqual({ targetDisplayNr: 1, targetFullscreen: true });
  });

  it('uses saved window preferences to choose the preferred screen when available', async () => {
    mockPathExistsSync.mockReturnValue(true);
    mockReadJsonSync.mockReturnValue({
      height: 1080,
      width: 1920,
      x: 1920,
      y: 0,
    });

    const { __testables } = await import('../window/window-media');

    const result = __testables.getPreferredScreenFromPrefs([
      {
        bounds: { height: 1080, width: 1920, x: 0, y: 0 },
        id: 1,
        mainWindow: true,
      },
      {
        bounds: { height: 1080, width: 1920, x: 1920, y: 0 },
        id: 2,
        mainWindow: false,
      },
      {
        bounds: { height: 1080, width: 1920, x: 3840, y: 0 },
        id: 3,
        mainWindow: false,
      },
    ] as never);

    expect(getDisplayMatching).toHaveBeenCalled();
    expect(result).toBe(1);
  });
});
