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

  it('includes custom base domain origins in CSP when URL variables are updated', async () => {
    const { initSessionListeners, setElectronUrlVariables } =
      await import('../session');
    const utilsModule = await import('src-electron/main/utils');

    vi.mocked(utilsModule.isSelf).mockReturnValue(true);

    setElectronUrlVariables({
      base: 'custom-domain.test',
      mediator: 'https://media-api.custom-domain.test/apis/mediator',
      pubMedia:
        'https://media-api.custom-domain.test/apis/pub-media/GETPUBMEDIALINKS',
    });

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

    expect(csp).toContain('https://*.custom-domain.test');
  });

  it('ignores badly formed hostnames when building CSP origins', async () => {
    const { initSessionListeners } = await import('../session');
    const constantsModule = await import('src-electron/constants');
    const utilsModule = await import('src-electron/main/utils');

    vi.mocked(utilsModule.isSelf).mockReturnValue(true);
    constantsModule.TRUSTED_DOMAINS.push('badly formed hostname');

    initSessionListeners();
    readyCallbacks[0]?.();

    const handler = onHeadersReceivedMock.mock.calls[0]?.[0] as (
      details: { responseHeaders?: Record<string, string[]>; url: string },
      callback: (result: {
        responseHeaders?: Record<string, string[]>;
      }) => void,
    ) => void;

    const callback = vi.fn();
    expect(() =>
      handler(
        {
          responseHeaders: {},
          url: 'file:///index.html',
        },
        callback,
      ),
    ).not.toThrow();

    const csp =
      callback.mock.calls[0]?.[0]?.responseHeaders?.[
        'Content-Security-Policy'
      ]?.[0];
    expect(csp).not.toContain('badly formed hostname');
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

  // SEC-2 (full-audit-2026-09-04.md): connect-src used to be a bare "https:
  // ws: devtools:" wildcard, letting the renderer fetch/connect to any host
  // whatsoever - defeating CSP's exfiltration protection.
  it("scopes connect-src to the app's actual network destinations, not a bare https:/ws: wildcard", async () => {
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

    // Bare scheme wildcards, not a specific host - would defeat scoping.
    expect(connectSrcTokens).not.toContain('https:');
    expect(connectSrcTokens).not.toContain('ws:');
    expect(connectSrc).toContain("'self'");
    expect(connectSrc).toContain('https://hub.jw.org');
    expect(connectSrc).toContain('https://cdn.jsdelivr.net');
    expect(connectSrc).toContain('https://api.github.com');
    expect(connectSrc).toContain('https://raw.githubusercontent.com');
    expect(connectSrc).toContain('https://fake.ingest.sentry.io');
    expect(connectSrc).toContain('ws://127.0.0.1:*');
  });
});
