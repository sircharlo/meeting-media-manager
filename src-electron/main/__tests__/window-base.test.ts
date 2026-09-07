import type { JwSiteParams } from 'src/types';

import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/tmp/app-data') },
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

const { __testables } = await import('../window/window-base');
const { buildWebsitePage } = __testables;

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
