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
  SENTRY_DSN: 'https://fake-key@fake.ingest.sentry.io/123456',
  TRUSTED_DOMAINS: [],
  WINDOW_MOVE_THROTTLE_MS: 100,
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

    expect(appOnMock).toHaveBeenCalledTimes(2);
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

  it('ignores non-https mediator/pubMedia URLs and malformed base domains', async () => {
    const { setElectronUrlVariables, urlVariables } =
      await import('../session');

    setElectronUrlVariables({
      base: 'valid-domain.test',
      mediator: 'https://mediator.test/',
      pubMedia: 'https://pubmedia.test/',
    });

    setElectronUrlVariables({
      base: 'not a domain!',
      mediator: 'javascript:alert(1)',
      pubMedia: 'not-a-url',
    });

    expect(urlVariables).toEqual({
      base: 'valid-domain.test',
      mediator: 'https://mediator.test/',
      pubMedia: 'https://pubmedia.test/',
    });
  });

  it('accepts empty strings to reset previously set URL variables', async () => {
    const { setElectronUrlVariables, urlVariables } =
      await import('../session');

    setElectronUrlVariables({
      base: 'valid-domain.test',
      mediator: 'https://mediator.test/',
      pubMedia: 'https://pubmedia.test/',
    });

    setElectronUrlVariables({
      base: '',
      mediator: '',
      pubMedia: '',
    });

    expect(urlVariables).toEqual({
      base: '',
      mediator: '',
      pubMedia: '',
    });
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

  it('does not allow unsafe-inline or unsafe-eval scripts in the CSP', async () => {
    const { initSessionListeners } = await import('../session');
    const utilsModule = await import('src-electron/main/utils');

    vi.mocked(utilsModule.isSelf).mockReturnValue(true);

    initSessionListeners();
    readyCallbacks[0]?.();

    const handler = onHeadersReceivedMock.mock.calls[0]?.[0] as (
      details: { responseHeaders?: Record<string, string[]>; url: string },
      callback: (result: {
        responseHeaders?: Record<string, string[]>;
      }) => void,
    ) => void;

    const callback = vi.fn();
    handler(
      {
        responseHeaders: {},
        url: 'file:///index.html',
      },
      callback,
    );

    const csp =
      callback.mock.calls[0]?.[0]?.responseHeaders?.[
        'Content-Security-Policy'
      ]?.[0];

    const scriptSrc = csp
      ?.split(';')
      .map((directive: string) => directive.trim())
      .find((directive: string) => directive.startsWith('script-src'));

    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  // connect-src must allow any HTTPS host: the media API hosts come from the
  // user-configurable Website setting and are only discovered after the page
  // (and its CSP) loaded (MMM-V2-3JB/3JP). The websocket wildcard stays
  // scoped to localhost (OBS).
  it('allows any HTTPS host in connect-src but scopes websockets to localhost', async () => {
    const { initSessionListeners } = await import('../session');
    const utilsModule = await import('src-electron/main/utils');

    vi.mocked(utilsModule.isSelf).mockReturnValue(true);

    initSessionListeners();
    readyCallbacks[0]?.();

    const handler = onHeadersReceivedMock.mock.calls[0]?.[0] as (
      details: { responseHeaders?: Record<string, string[]>; url: string },
      callback: (result: {
        responseHeaders?: Record<string, string[]>;
      }) => void,
    ) => void;

    const callback = vi.fn();
    handler(
      {
        responseHeaders: {},
        url: 'file:///index.html',
      },
      callback,
    );

    const csp =
      callback.mock.calls[0]?.[0]?.responseHeaders?.[
        'Content-Security-Policy'
      ]?.[0];

    const connectSrc = csp
      ?.split(';')
      .map((directive: string) => directive.trim())
      .find((directive: string) => directive.startsWith('connect-src'));
    const connectSrcTokens = connectSrc?.split(/\s+/) ?? [];

    expect(connectSrcTokens).toContain("'self'");
    expect(connectSrcTokens).toContain('https:');
    expect(connectSrcTokens).toContain('ws://127.0.0.1:*');
    expect(connectSrcTokens).not.toContain('ws:');
    expect(connectSrcTokens).not.toContain('http:');
  });

  // MMM-V2-3KV: images and media load from the configured Website's CDN
  // (e.g. streaming before the local copy exists), and that host isn't known
  // yet when the CSP is built.
  it.each(['img-src', 'media-src'])(
    'allows any HTTPS host in %s before URL variables are known',
    async (directiveName) => {
      const { initSessionListeners } = await import('../session');
      const utilsModule = await import('src-electron/main/utils');

      vi.mocked(utilsModule.isSelf).mockReturnValue(true);

      initSessionListeners();
      readyCallbacks[0]?.();

      const handler = onHeadersReceivedMock.mock.calls[0]?.[0] as (
        details: { responseHeaders?: Record<string, string[]>; url: string },
        callback: (result: {
          responseHeaders?: Record<string, string[]>;
        }) => void,
      ) => void;

      const callback = vi.fn();
      handler(
        {
          responseHeaders: {},
          url: 'file:///index.html',
        },
        callback,
      );

      const csp =
        callback.mock.calls[0]?.[0]?.responseHeaders?.[
          'Content-Security-Policy'
        ]?.[0];

      const directiveTokens =
        csp
          ?.split(';')
          .map((directive: string) => directive.trim())
          .find((directive: string) => directive.startsWith(directiveName))
          ?.split(/\s+/) ?? [];

      expect(directiveTokens).toContain('https:');
      expect(directiveTokens).toContain('file:');
      expect(directiveTokens).not.toContain('http:');
    },
  );
});
