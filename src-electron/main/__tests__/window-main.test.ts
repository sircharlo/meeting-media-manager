import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAllWindows = vi.fn();
const createWindow = vi.fn();
const closeOtherWindows = vi.fn();
const sendToWindow = vi.fn();
const createMediaWindow = vi.fn();
const cancelAllDownloads = vi.fn();
const setAppQuitting = vi.fn();
const setShouldQuit = vi.fn();

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows,
  },
}));

vi.mock('src-electron/constants', () => ({
  PLATFORM: 'darwin',
  PRODUCT_NAME: 'Meeting Media Manager',
}));

vi.mock('src-electron/main/downloads', () => ({
  cancelAllDownloads,
}));

vi.mock('src-electron/main/session', () => ({
  setAppQuitting,
  setShouldQuit,
}));

vi.mock('src-electron/main/window/window-base', () => ({
  closeOtherWindows,
  createWindow,
  sendToWindow,
}));

vi.mock('src-electron/main/window/window-media', () => ({
  createMediaWindow,
  moveMediaWindowThrottled: vi.fn(),
}));

describe('window-main', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllWindows.mockReturnValue([]);
  });

  it('reuses an existing main window discovered from BrowserWindow.getAllWindows', async () => {
    const existingWindow = {
      focus: vi.fn(),
      getTitle: vi.fn(() => 'Meeting Media Manager'),
      isDestroyed: vi.fn(() => false),
      isMinimized: vi.fn(() => false),
      show: vi.fn(),
    };

    getAllWindows.mockReturnValue([existingWindow]);

    const { createMainWindow, mainWindowInfo } =
      await import('../window/window-main');

    mainWindowInfo.mainWindow = null;

    createMainWindow();

    expect(createWindow).not.toHaveBeenCalled();
    expect(existingWindow.show).toHaveBeenCalledOnce();
    expect(existingWindow.focus).toHaveBeenCalledOnce();
    expect(mainWindowInfo.mainWindow).toBe(existingWindow);
  });

  it('restores a minimized main window before focusing it', async () => {
    const minimizedWindow = {
      focus: vi.fn(),
      getTitle: vi.fn(() => 'Meeting Media Manager'),
      isDestroyed: vi.fn(() => false),
      isMinimized: vi.fn(() => true),
      restore: vi.fn(),
      show: vi.fn(),
    };

    getAllWindows.mockReturnValue([minimizedWindow]);

    const { focusMainWindow, mainWindowInfo } =
      await import('../window/window-main');

    mainWindowInfo.mainWindow = null;

    expect(focusMainWindow()).toBe(true);
    expect(minimizedWindow.restore).toHaveBeenCalledOnce();
    expect(minimizedWindow.show).toHaveBeenCalledOnce();
    expect(minimizedWindow.focus).toHaveBeenCalledOnce();
  });
});
