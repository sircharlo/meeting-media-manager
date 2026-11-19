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

/**
 * A website window for createWebsiteWindow to set up, keeping the
 * listeners it registers on the page.
 */
const mockWebsiteWindow = () => {
  const pageListeners = new Map<string, (...args: unknown[]) => void>();
  const win = {
    center: vi.fn(),
    getContentSize: vi.fn(() => [1920, 1080]),
    getMediaSourceId: vi.fn(() => 'window:1:0'),
    getSize: vi.fn(() => [1920, 1080]),
    getTitle: vi.fn(() => 'Website Stream'),
    isDestroyed: vi.fn(() => false),
    on: vi.fn(),
    setAspectRatio: vi.fn(),
    show: vi.fn(),
    webContents: {
      on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
        pageListeners.set(event, listener);
      }),
      setVisualZoomLevelLimits: vi.fn(async () => undefined),
      setWindowOpenHandler: vi.fn(),
    },
  };
  return { pageListeners, win };
};

// MMM-V2-3P7: the computer couldn't look up the website's address, and the
// window stayed blank with nothing to say why.
describe('createWebsiteWindow - pages that fail to load', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const failLoad = async (errorDescription: string, isMainFrame: boolean) => {
    const { createWindow, sendToWindow } =
      await import('src-electron/main/window/window-base');
    const { createWebsiteWindow, websiteWindowInfo } =
      await import('../window/window-website');
    const { pageListeners, win } = mockWebsiteWindow();
    vi.mocked(createWindow).mockReturnValue(win as never);
    websiteWindowInfo.websiteWindow = null;

    createWebsiteWindow({ langCode: 'am', langSymbol: 'AM', site: undefined });
    pageListeners.get('did-fail-load')?.(
      {},
      -105,
      errorDescription,
      'https://www.jw.org/am',
      isMainFrame,
    );
    return vi.mocked(sendToWindow);
  };

  it('tells the main window when the page fails for want of a network', async () => {
    const sendToWindow = await failLoad('ERR_NAME_NOT_RESOLVED', true);

    expect(sendToWindow).toHaveBeenCalledWith(null, 'websiteLoadFailed');
  });

  it.each([
    { errorDescription: 'ERR_NAME_NOT_RESOLVED', isMainFrame: false },
    { errorDescription: 'ERR_ABORTED', isMainFrame: true },
  ])(
    'says nothing for $errorDescription (main frame: $isMainFrame)',
    async ({ errorDescription, isMainFrame }) => {
      const sendToWindow = await failLoad(errorDescription, isMainFrame);

      expect(sendToWindow).not.toHaveBeenCalledWith(
        expect.anything(),
        'websiteLoadFailed',
      );
    },
  );
});

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
    } as never;

    const { injectCursorIndicator } = await import('../window/window-website');

    await injectCursorIndicator(webContents);

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
    } as never;

    const { injectCursorIndicator } = await import('../window/window-website');
    await expect(injectCursorIndicator(webContents)).resolves.toBe(undefined);
    expect(captureElectronError).toHaveBeenCalledWith(error, {
      contexts: { fn: { name: 'injectCursorIndicator' } },
    });
  });
});
