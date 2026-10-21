import { beforeEach, describe, expect, it, vi } from 'vitest';

const { appOn, isSelfMock, setPermissionRequestHandler } = vi.hoisted(() => ({
  appOn: vi.fn(),
  isSelfMock: vi.fn(),
  setPermissionRequestHandler: vi.fn(),
}));

vi.mock('electron', () => ({
  app: { on: appOn },
  session: { defaultSession: { setPermissionRequestHandler } },
  shell: { openExternal: vi.fn(async () => undefined) },
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
  isSelf: isSelfMock,
  isTrustedNavigationTarget: vi.fn(() => false),
}));

vi.mock('src-electron/main/window/window-base', () => ({
  logToWindow: vi.fn(),
}));

vi.mock('src-electron/main/window/window-main', () => ({
  mainWindowInfo: { mainWindow: null },
}));

type PermissionHandler = (
  webContents: { getURL: () => string; id: number },
  permission: string,
  callback: (granted: boolean) => void,
  details?: { requestingUrl?: string },
) => void;

const getPermissionHandler = async (): Promise<PermissionHandler> => {
  await import('../security');
  const onReady = appOn.mock.calls.find(([event]) => event === 'ready')?.[1];
  onReady?.();
  return setPermissionRequestHandler.mock.calls[0]?.[0];
};

describe('permission request handler', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    isSelfMock.mockImplementation((url: string) => url === 'app://index.html');
  });

  // MMM-V2-3JN: a request made before the webContents committed its first
  // navigation saw getURL() === '' and was denied as "untrusted".
  it('falls back to the requesting frame URL when the webContents has none yet', async () => {
    const handler = await getPermissionHandler();
    const callback = vi.fn();

    handler({ getURL: () => '', id: 1 }, 'media', callback, {
      requestingUrl: 'app://index.html',
    });

    expect(callback).toHaveBeenCalledWith(true);
  });

  it('still blocks an untrusted origin', async () => {
    const handler = await getPermissionHandler();
    const callback = vi.fn();

    handler({ getURL: () => '', id: 1 }, 'media', callback, {
      requestingUrl: 'https://example.com/',
    });

    expect(callback).toHaveBeenCalledWith(false);
  });

  // MMM-V2-3ME: Electron asks for clipboard-sanitized-write even right after
  // a click, so denying it broke navigator.clipboard.writeText() everywhere.
  it.each([
    {
      expected: true,
      permission: 'clipboard-sanitized-write',
      url: 'app://index.html',
    },
    {
      expected: false,
      permission: 'clipboard-sanitized-write',
      url: 'https://example.com/',
    },
    { expected: false, permission: 'clipboard-read', url: 'app://index.html' },
  ])(
    'answers $permission from $url with $expected',
    async ({ expected, permission, url }) => {
      const handler = await getPermissionHandler();
      const callback = vi.fn();

      handler({ getURL: () => url, id: 1 }, permission, callback);

      expect(callback).toHaveBeenCalledWith(expected);
    },
  );
});
