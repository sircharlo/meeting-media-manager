import { beforeEach, describe, expect, it, vi } from 'vitest';

const captureElectronError = vi.fn();

vi.mock('electron', () => ({
  systemPreferences: {
    askForMediaAccess: vi.fn(),
    getMediaAccessStatus: vi.fn(),
  },
}));

vi.mock('src-electron/constants', () => ({
  HD_RESOLUTION: [1920, 1080],
  PLATFORM: 'linux',
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError,
}));

vi.mock('src-electron/main/window/window-base', () => ({
  createWindow: vi.fn(),
  logToWindow: vi.fn(),
  sendToWindow: vi.fn(),
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: { mainWindow: null },
}));

describe('window-website cursor indicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('injects the cursor indicator CSS before the script', async () => {
    const calls: string[] = [];
    const webContents = {
      executeJavaScript: vi.fn(async () => {
        calls.push('executeJavaScript');
      }),
      insertCSS: vi.fn(async () => {
        calls.push('insertCSS');
      }),
    };

    const { injectCursorIndicator } = await import('../window/window-website');

    await injectCursorIndicator(webContents as never);

    expect(calls).toEqual(['insertCSS', 'executeJavaScript']);
    expect(captureElectronError).not.toHaveBeenCalled();
  });

  it('captures rejected injection promises instead of throwing', async () => {
    const error = new Error('Script failed to execute');
    const webContents = {
      executeJavaScript: vi.fn(async () => {
        throw error;
      }),
      insertCSS: vi.fn(async () => undefined),
    };

    const { injectCursorIndicator } = await import('../window/window-website');

    await expect(injectCursorIndicator(webContents as never)).resolves.toBe(
      undefined,
    );
    expect(captureElectronError).toHaveBeenCalledWith(error, {
      contexts: { fn: { name: 'injectCursorIndicator' } },
    });
  });
});
