import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const whenReady = vi.fn();
const removeAllListeners = vi.fn();
const on = vi.fn();
const getAllDisplays = vi.fn();
const getDisplayMatching = vi.fn();
const captureElectronError = vi.fn();
const moveMediaWindowThrottled = vi.fn();
const moveTimerWindowThrottled = vi.fn();

const { mainWindowInfo, mediaWindowInfo, timerWindowInfo } = vi.hoisted(() => ({
  mainWindowInfo: { mainWindow: null as FakeWindow | null },
  mediaWindowInfo: { mediaWindow: null as FakeWindow | null },
  timerWindowInfo: { timerWindow: null as FakeWindow | null },
}));

interface FakeWindow {
  getBounds: ReturnType<typeof vi.fn>;
  isDestroyed: ReturnType<typeof vi.fn>;
}

const makeWindow = (bounds: Electron.Rectangle): FakeWindow => ({
  getBounds: vi.fn(() => bounds),
  isDestroyed: vi.fn(() => false),
});

const boundsAt = (x: number, width = 1920, height = 1080) => ({
  height,
  width,
  x,
  y: 0,
});

vi.mock('electron', () => ({
  app: {
    whenReady,
  },
  screen: {
    getAllDisplays,
    getDisplayMatching,
    on,
    removeAllListeners,
  },
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError,
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo,
}));

vi.mock('src-electron/main/window/window-media', () => ({
  mediaWindowInfo,
  moveMediaWindowThrottled,
}));

vi.mock('src-electron/main/window/window-timer', () => ({
  moveTimerWindowThrottled,
  timerWindowInfo,
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

describe('screen listeners', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    whenReady.mockResolvedValue(undefined);
    getAllDisplays.mockReturnValue([]);
  });

  it('moves both media and timer windows when a display changes', async () => {
    const { initScreenListeners } = await import('../screen');

    initScreenListeners();
    await Promise.resolve();

    const displayAddedHandler = on.mock.calls.find(
      ([eventName]) => eventName === 'display-added',
    )?.[1];

    expect(displayAddedHandler).toBeTypeOf('function');

    displayAddedHandler();

    expect(moveMediaWindowThrottled).toHaveBeenCalledOnce();
    expect(moveTimerWindowThrottled).toHaveBeenCalledOnce();
    expect(captureElectronError).not.toHaveBeenCalled();
  });

  it('initializes listeners only once', async () => {
    const { initScreenListeners } = await import('../screen');

    initScreenListeners();
    await Promise.resolve();
    initScreenListeners();

    expect(whenReady).toHaveBeenCalledOnce();
    expect(on).toHaveBeenCalledTimes(3);
    expect(removeAllListeners).toHaveBeenCalledTimes(3);
  });
});

describe('getAllScreens', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mainWindowInfo.mainWindow = null;
    mediaWindowInfo.mediaWindow = null;
    timerWindowInfo.timerWindow = null;
    getAllDisplays.mockReturnValue([]);
    getDisplayMatching.mockReturnValue({ id: 1 });
  });

  it('sorts displays by position and returns them', async () => {
    getAllDisplays.mockReturnValue([
      { bounds: boundsAt(1920), id: 2 },
      { bounds: boundsAt(0), id: 1 },
    ]);

    const { getAllScreens } = await import('../screen');

    expect(getAllScreens().map((display) => display.id)).toEqual([1, 2]);
  });

  it('marks the display containing each window', async () => {
    getAllDisplays.mockReturnValue([
      { bounds: boundsAt(0), id: 1 },
      { bounds: boundsAt(1920), id: 2 },
    ]);
    getDisplayMatching.mockImplementation((rect: Electron.Rectangle) => ({
      id: rect.x >= 1920 ? 2 : 1,
    }));

    mainWindowInfo.mainWindow = makeWindow(boundsAt(0, 1000, 600));
    mediaWindowInfo.mediaWindow = makeWindow(boundsAt(1920));
    timerWindowInfo.timerWindow = makeWindow(boundsAt(1920, 400, 200));

    const { getAllScreens } = await import('../screen');

    const screens = getAllScreens();
    expect(screens[0]?.mainWindow).toBe(true);
    expect(screens[0]?.mainWindowBounds).toEqual(boundsAt(0, 1000, 600));
    expect(screens[1]?.mediaWindow).toBe(true);
    expect(screens[1]?.timerWindow).toBe(true);
  });

  it('calls getDisplayMatching once per window, not once per display', async () => {
    getAllDisplays.mockReturnValue([
      { bounds: boundsAt(0), id: 1 },
      { bounds: boundsAt(1920), id: 2 },
      { bounds: boundsAt(3840), id: 3 },
    ]);
    getDisplayMatching.mockReturnValue({ id: 2 });

    mainWindowInfo.mainWindow = makeWindow(boundsAt(0, 1000, 600));
    mediaWindowInfo.mediaWindow = makeWindow(boundsAt(1920));
    timerWindowInfo.timerWindow = makeWindow(boundsAt(3840, 400, 200));

    const { getAllScreens } = await import('../screen');

    getAllScreens();

    expect(getDisplayMatching).toHaveBeenCalledTimes(3);
  });

  it('skips destroyed windows and windows with invalid bounds', async () => {
    getAllDisplays.mockReturnValue([{ bounds: boundsAt(0), id: 1 }]);

    const destroyed = makeWindow(boundsAt(0));
    destroyed.isDestroyed.mockReturnValue(true);
    mediaWindowInfo.mediaWindow = destroyed;

    // Zero-size bounds are unsafe to hand to getDisplayMatching.
    mainWindowInfo.mainWindow = makeWindow({ height: 0, width: 0, x: 0, y: 0 });
    timerWindowInfo.timerWindow = null;

    const { getAllScreens } = await import('../screen');

    const screens = getAllScreens();

    expect(getDisplayMatching).not.toHaveBeenCalled();
    expect(screens[0]?.mainWindow).toBeUndefined();
    expect(screens[0]?.mediaWindow).toBeUndefined();
  });

  it('reuses the snapshot within the TTL and refreshes after it expires', async () => {
    vi.useFakeTimers();
    try {
      getAllDisplays.mockReturnValue([{ bounds: boundsAt(0), id: 1 }]);

      const { getAllScreens } = await import('../screen');

      getAllScreens();
      getAllScreens();
      expect(getAllDisplays).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(251);
      getAllScreens();
      expect(getAllDisplays).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('invalidates the snapshot when a display event fires', async () => {
    getAllDisplays.mockReturnValue([{ bounds: boundsAt(0), id: 1 }]);

    const { getAllScreens, initScreenListeners } = await import('../screen');

    initScreenListeners();
    await Promise.resolve();

    const displayAddedHandler = on.mock.calls.find(
      ([eventName]) => eventName === 'display-added',
    )?.[1];

    getAllScreens();
    expect(getAllDisplays).toHaveBeenCalledTimes(1);

    displayAddedHandler();
    getAllScreens();
    expect(getAllDisplays).toHaveBeenCalledTimes(2);
  });
});

describe('getWindowScreen', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mainWindowInfo.mainWindow = null;
    mediaWindowInfo.mediaWindow = null;
    timerWindowInfo.timerWindow = null;
  });

  it('returns the index of the display containing the window', async () => {
    getAllDisplays.mockReturnValue([
      { bounds: boundsAt(0), id: 1 },
      { bounds: boundsAt(1920), id: 2 },
    ]);
    getDisplayMatching.mockImplementation((rect: Electron.Rectangle) => ({
      id: rect.x >= 1920 ? 2 : 1,
    }));

    const { getWindowScreen } = await import('../screen');

    expect(getWindowScreen(makeWindow(boundsAt(1920, 500, 500)) as never)).toBe(
      1,
    );
  });

  it('returns 0 for a null or destroyed window', async () => {
    const destroyed = makeWindow(boundsAt(0));
    destroyed.isDestroyed.mockReturnValue(true);

    const { getWindowScreen } = await import('../screen');

    expect(getWindowScreen(null)).toBe(0);
    expect(getWindowScreen(destroyed as never)).toBe(0);
    expect(getDisplayMatching).not.toHaveBeenCalled();
  });
});

afterEach(() => {
  vi.useRealTimers();
});
