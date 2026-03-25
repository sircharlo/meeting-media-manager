import { beforeEach, describe, expect, it, vi } from 'vitest';

const readyCallbacks: (() => void)[] = [];
const onBeforeSendHeadersMock = vi.fn();
const onHeadersReceivedMock = vi.fn();
const getUserAgentMock = vi.fn(
  () => 'Meeting Media Manager Electron/38.2.2 Chrome/140.0.7339.133',
);
const setUserAgentMock = vi.fn();
const appOnMock = vi.fn((event: string, callback: () => void) => {
  if (event === 'ready') readyCallbacks.push(callback);
});

vi.mock('electron', () => ({
  app: {
    on: appOnMock,
  },
  session: {
    defaultSession: {
      getUserAgent: getUserAgentMock,
      setUserAgent: setUserAgentMock,
      webRequest: {
        onBeforeSendHeaders: onBeforeSendHeadersMock,
        onHeadersReceived: onHeadersReceivedMock,
      },
    },
  },
}));

vi.mock('src-electron/constants', () => ({
  TRUSTED_DOMAINS: [],
}));

vi.mock('src-electron/main/utils', () => ({
  getAppVersion: vi.fn(() => '1.0.0'),
  isJwDomain: vi.fn(() => true),
  isSelf: vi.fn(() => false),
  isTrustedDomain: vi.fn((url: string) => url.includes('trusted.test')),
  isValidUrl: vi.fn(() => true),
}));

describe('session listeners', () => {
  beforeEach(() => {
    readyCallbacks.length = 0;
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('registers webRequest listeners only once and reuses them when URL variables change', async () => {
    const { initSessionListeners, setElectronUrlVariables } =
      await import('../session');

    initSessionListeners();
    initSessionListeners();

    expect(appOnMock).toHaveBeenCalledTimes(1);
    expect(readyCallbacks).toHaveLength(1);

    readyCallbacks[0]?.();

    expect(onBeforeSendHeadersMock).toHaveBeenCalledTimes(1);
    expect(onHeadersReceivedMock).toHaveBeenCalledTimes(1);

    setElectronUrlVariables({
      base: 'trusted.test',
      mediator: 'https://trusted.test/',
      pubMedia: 'https://trusted.test/media',
    });
    setElectronUrlVariables({
      base: 'trusted.test',
      mediator: 'https://trusted.test/',
      pubMedia: 'https://trusted.test/media',
    });

    expect(onBeforeSendHeadersMock).toHaveBeenCalledTimes(1);
    expect(onHeadersReceivedMock).toHaveBeenCalledTimes(1);
  });

  it('updates referer and origin for trusted requests using the single registered listener', async () => {
    const { initSessionListeners } = await import('../session');

    initSessionListeners();
    readyCallbacks[0]?.();

    const handler = onBeforeSendHeadersMock.mock.calls[0]?.[1] as (
      details: { requestHeaders: Record<string, string>; url: string },
      callback: (result: { requestHeaders: Record<string, string> }) => void,
    ) => void;

    const callback = vi.fn();

    handler(
      {
        requestHeaders: { Accept: 'application/json' },
        url: 'https://trusted.test/path',
      },
      callback,
    );

    expect(callback).toHaveBeenCalledWith({
      requestHeaders: {
        Accept: 'application/json',
        Origin: 'https://trusted.test',
        Referer: 'https://trusted.test',
      },
    });
  });
});
