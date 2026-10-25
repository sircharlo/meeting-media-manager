import type { JwSiteParams } from 'src/types';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn(() => '/tmp/app'),
    getPath: vi.fn(() => '/tmp/app-data'),
  },
  BrowserWindow: vi.fn(),
}));

vi.mock('src-electron/constants', () => ({
  IS_BETA: false,
  IS_DEMO_MODE: false,
  IS_DEV: false,
  PLATFORM: 'linux',
  PRODUCT_NAME: 'M3',
}));

vi.mock('src-electron/main/resilient-storage', () => ({
  readJsonResilient: vi.fn(),
}));

vi.mock('src-electron/main/session', () => ({
  urlVariables: { base: 'jw.org' },
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
  getIconPath: vi.fn(() => '/tmp/icon.png'),
}));

vi.mock('src-electron/main/window/window-state', () => ({
  StatefulBrowserWindow: vi.fn(),
}));

const { __testables, createWindow } = await import('../window/window-base');
const { buildWebsitePage } = __testables;
const { captureElectronError } = await import('src-electron/main/utils');
const { StatefulBrowserWindow } =
  await import('src-electron/main/window/window-state');

afterEach(() => {
  vi.clearAllMocks();
});

const siteParams = (overrides: Partial<JwSiteParams>): JwSiteParams => ({
  langCode: 'en',
  langSymbol: 'E',
  site: undefined,
  ...overrides,
});

// SEC-13 (full-audit-2026-09-05.md): langSymbol reaches this URL
// construction over the raw IPC channel - a compromised renderer could
// send a value crafted to break out of the intended URL shape.
describe('buildWebsitePage', () => {
  it('builds a plain jw.org URL for the default (no explicit site) case', () => {
    expect(buildWebsitePage(undefined, 'jw.org')).toBe('https://www.jw.org/');
    expect(buildWebsitePage(siteParams({ langSymbol: 'E' }), 'jw.org')).toBe(
      'https://www.jw.org/E',
    );
  });

  it("uses the configured Website's own host", () => {
    expect(
      buildWebsitePage(siteParams({ langSymbol: 'E' }), 'example.test'),
    ).toBe('https://www.example.test/E');
  });

  // A different Website must never fall back to jw.org.
  it('shows a blank page rather than jw.org without a known Website', () => {
    expect(buildWebsitePage(siteParams({ langSymbol: 'E' }), undefined)).toBe(
      'about:blank',
    );
    expect(buildWebsitePage(siteParams({ langSymbol: 'E' }), '')).toBe(
      'about:blank',
    );
  });

  // A different Website never gets jw.org's own Stream/Conventions sites.
  it('never opens JW Stream or the conventions site for a different Website', () => {
    expect(
      buildWebsitePage(siteParams({ site: 'stream' }), 'example.test'),
    ).toBe('about:blank');
    expect(
      buildWebsitePage(siteParams({ site: 'jwevent' }), 'example.test'),
    ).toBe('about:blank');
  });

  it('builds a site-specific URL with a lang query param', () => {
    expect(
      buildWebsitePage(
        siteParams({ langSymbol: 'E', site: 'stream' }),
        'jw.org',
      ),
    ).toBe('https://stream.jw.org/?lang=E');
    expect(
      buildWebsitePage(
        siteParams({ langSymbol: 'E', site: 'jwevent' }),
        'jw.org',
      ),
    ).toBe('https://www.jwevent.org/?lang=E');
  });

  it('percent-encodes a langSymbol containing URL-structural characters', () => {
    const maliciousSymbol = '../../evil.com/#';

    const path = buildWebsitePage(
      siteParams({ langSymbol: maliciousSymbol }),
      'jw.org',
    );
    expect(path).toBe(
      'https://www.jw.org/' + encodeURIComponent(maliciousSymbol),
    );
    expect(path).not.toContain('../');
    expect(path).not.toContain('#');

    const query = buildWebsitePage(
      siteParams({ langSymbol: maliciousSymbol, site: 'stream' }),
      'jw.org',
    );
    expect(query).toBe(
      'https://stream.jw.org/?lang=' + encodeURIComponent(maliciousSymbol),
    );
    expect(query).not.toContain('../');
    expect(query).not.toContain('#');
  });
});

/**
 * A window whose page load fails with `loadError`. Like Electron's, its
 * webContents can't be read any more once the window itself is destroyed.
 * @param loadError The error the load fails with
 * @returns What's destroyed so far, for the test to change
 */
const mockWindowFailingToLoad = (loadError: Error) => {
  const destroyed = { webContents: false, window: false };
  const webContents = {
    closeDevTools: vi.fn(),
    isDestroyed: () => destroyed.webContents,
    on: vi.fn(),
    openDevTools: vi.fn(),
  };
  const win = {
    isDestroyed: () => destroyed.window,
    loadFile: vi.fn(async () => {
      throw loadError;
    }),
    on: vi.fn(),
    setMenuBarVisibility: vi.fn(),
    get webContents() {
      if (destroyed.window) throw new Error('Object has been destroyed');
      return webContents;
    },
  };
  vi.mocked(StatefulBrowserWindow).mockImplementation(function () {
    return { win } as unknown as InstanceType<typeof StatefulBrowserWindow>;
  });
  return destroyed;
};

const flushLoad = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

describe('createWindow - page load errors', () => {
  const loadError = Object.assign(
    new Error(
      "ERR_FAILED (-2) loading 'file:///app/index.html#?page=media-player'",
    ),
    { code: 'ERR_FAILED', errno: -2 },
  );

  it('reports a page that failed to load', async () => {
    mockWindowFailingToLoad(loadError);

    createWindow('media');
    await flushLoad();

    expect(captureElectronError).toHaveBeenCalledWith(loadError, {
      contexts: { fn: { name: 'createWindow', window: 'media' } },
    });
  });

  // MMM-V2-3MT: Electron fails a load that's still under way when its
  // window goes away, e.g. when M³ quits. Closing destroys the page first,
  // destroying the window takes both (checked against Electron 45).
  it.each([
    { how: 'closed', webContents: true, window: false },
    { how: 'destroyed', webContents: true, window: true },
  ])(
    "doesn't report a load cut short by the window being $how",
    async ({ webContents, window }) => {
      const destroyed = mockWindowFailingToLoad(loadError);

      createWindow('media');
      Object.assign(destroyed, { webContents, window });
      await flushLoad();

      expect(captureElectronError).not.toHaveBeenCalled();
    },
  );
});
