import { beforeEach, describe, expect, it, vi } from 'vitest';

const whenReady = vi.fn();
const removeAllListeners = vi.fn();
const on = vi.fn();
const getAllDisplays = vi.fn();
const getDisplayMatching = vi.fn();
const captureElectronError = vi.fn();
const moveMediaWindowThrottled = vi.fn();
const moveTimerWindowThrottled = vi.fn();

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
  mainWindowInfo: {
    mainWindow: null,
  },
}));

vi.mock('src-electron/main/window/window-media', () => ({
  mediaWindowInfo: {
    mediaWindow: null,
  },
  moveMediaWindowThrottled,
}));

vi.mock('src-electron/main/window/window-timer', () => ({
  moveTimerWindowThrottled,
  timerWindowInfo: {
    timerWindow: null,
  },
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
