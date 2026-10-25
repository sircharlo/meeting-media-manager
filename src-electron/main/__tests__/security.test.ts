import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  appOn,
  isSelfMock,
  isTrustedNavigationTargetMock,
  setPermissionRequestHandler,
} = vi.hoisted(() => ({
  appOn: vi.fn(),
  isSelfMock: vi.fn(),
  isTrustedNavigationTargetMock: vi.fn(() => false),
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
  isTrustedNavigationTarget: isTrustedNavigationTargetMock,
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

const OWN = 'app://index.html';
const TRUSTED = 'https://trusted.example/';

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
    isTrustedNavigationTargetMock.mockReturnValue(false);
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

  // Electron 45 requests screen/window/tab capture as `display-capture`
  // rather than `media`; the media preview and website mirroring need it,
  // and only our own pages get it. MMM-V2-3ME: Electron asks for
  // clipboard-sanitized-write even right after a click, so denying it broke
  // navigator.clipboard.writeText() everywhere.
  it.each([
    { expected: true, permission: 'display-capture', trusted: false, url: OWN },
    {
      expected: false,
      permission: 'display-capture',
      trusted: true,
      url: TRUSTED,
    },
    { expected: true, permission: 'media', trusted: true, url: TRUSTED },
    {
      expected: true,
      permission: 'notifications',
      trusted: true,
      url: TRUSTED,
    },
    {
      expected: true,
      permission: 'clipboard-sanitized-write',
      trusted: false,
      url: OWN,
    },
    {
      expected: true,
      permission: 'clipboard-sanitized-write',
      trusted: true,
      url: TRUSTED,
    },
    {
      expected: false,
      permission: 'clipboard-sanitized-write',
      trusted: false,
      url: 'https://example.com/',
    },
    { expected: false, permission: 'clipboard-read', trusted: false, url: OWN },
  ])(
    'answers $permission from $url with $expected',
    async ({ expected, permission, trusted, url }) => {
      isTrustedNavigationTargetMock.mockReturnValue(trusted);
      const handler = await getPermissionHandler();
      const callback = vi.fn();

      handler({ getURL: () => url, id: 1 }, permission, callback);

      expect(callback).toHaveBeenCalledWith(expected);
    },
  );
});
