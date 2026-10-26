import type * as ApiModule from 'src/utils/api';

import { createPinia, setActivePinia } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useJwStore } from 'src/stores/jw';
import { registerCachePathProvider } from 'src/utils/fs';
import { join } from 'upath';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { fs, getAppDataPath } = globalThis.electronApi;
const { emptyDir, ensureDir, pathExists, readFile, remove, writeFile } = fs;

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

vi.mock('src/utils/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>();
  return {
    fetchRaw: vi.fn(),
    // Real implementation: without a mocked globalThis.electronApi, its
    // isDownloadErrorExpected() branch resolves to undefined/false, so this
    // still boils down to the same isFetchNetworkError-driven classification
    // the tests below exercise, no extra setup needed.
    shouldReportCaughtError: actual.shouldReportCaughtError,
  };
});

describe('getLocalFontPath', () => {
  let appDataPath = '';

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    setActivePinia(createPinia());
    registerCachePathProvider(() => undefined);
    appDataPath = await getAppDataPath();
    await remove(appDataPath);
  });

  it('reuses the legacy cached JW-Icons font without refetching it', async () => {
    const fontsDir = join(appDataPath, 'Fonts');
    await ensureDir(fontsDir);
    const legacyFontPath = join(fontsDir, 'JW-Icons.woff2');
    await writeFile(legacyFontPath, Buffer.from('cached-font'));

    const { fetchRaw } = await import('src/utils/api');
    const { getLocalFontPath } = await import('../fonts');

    await expect(getLocalFontPath('jw-icons-all')).resolves.toBe(
      legacyFontPath,
    );
    expect(fetchRaw).not.toHaveBeenCalled();
  });

  it('reuses a cached .woff file when no .woff2 cache entry exists', async () => {
    const fontsDir = join(appDataPath, 'Fonts');
    await ensureDir(fontsDir);
    const cachedFontPath = join(fontsDir, 'Wt-ClearText-Bold.woff');
    await writeFile(cachedFontPath, Buffer.from('cached-font'));

    const store = useJwStore();
    store.urlVariables.base = 'example.org';

    const { fetchRaw } = await import('src/utils/api');
    const { getLocalFontPath } = await import('../fonts');

    await expect(getLocalFontPath('Wt-ClearText-Bold')).resolves.toBe(
      cachedFontPath,
    );
    expect(fetchRaw).not.toHaveBeenCalled();
  });

  it('discovers the jw-icons URL dynamically when no URL is cached yet', async () => {
    const fontsDir = join(appDataPath, 'Fonts');
    await emptyDir(fontsDir);

    const store = useJwStore();
    store.urlVariables.base = 'example.org';
    store.updateJwIconsUrl = vi.fn(async () => {
      store.jwIconsUrl =
        'https://cdn.example.org/assets/fonts/jw-icons-all.woff';
    });

    // No hardcoded fallback URL exists anymore (it inevitably went stale
    // when the website rotated the asset hash), so there's nothing to fetch yet.
    expect(store.fontUrls['jw-icons-all']).toBe('');
    const dynamicUrl = 'https://cdn.example.org/assets/fonts/jw-icons-all.woff';
    const downloadedFont = Uint8Array.from([1, 2, 3, 4]);

    const { fetchRaw } = await import('src/utils/api');
    vi.mocked(fetchRaw).mockResolvedValueOnce(
      new Response(downloadedFont, { status: 200 }),
    );

    const { getLocalFontPath } = await import('../fonts');
    const fontPath = await getLocalFontPath('jw-icons-all');

    expect(fontPath).toBe(join(fontsDir, 'jw-icons-all.woff'));
    expect(store.updateJwIconsUrl).toHaveBeenCalledTimes(1);
    expect(fetchRaw).toHaveBeenCalledTimes(1);
    expect(fetchRaw).toHaveBeenNthCalledWith(
      1,
      dynamicUrl,
      expect.objectContaining({ method: 'GET' }),
      false,
    );
    expect(await pathExists(fontPath)).toBe(true);
    expect(await readFile(fontPath)).toEqual(Buffer.from(downloadedFont));
  });

  it('rediscovers the jw-icons URL when the previously cached one 404s', async () => {
    const fontsDir = join(appDataPath, 'Fonts');
    await emptyDir(fontsDir);

    const store = useJwStore();
    store.urlVariables.base = 'example.org';
    store.jwIconsUrl = 'https://cdn.example.org/assets/fonts/stale.woff';
    store.updateJwIconsUrl = vi.fn(async () => {
      store.jwIconsUrl =
        'https://cdn.example.org/assets/fonts/jw-icons-all.woff';
    });

    const staleUrl = store.fontUrls['jw-icons-all'];
    const dynamicUrl = 'https://cdn.example.org/assets/fonts/jw-icons-all.woff';
    const downloadedFont = Uint8Array.from([1, 2, 3, 4]);

    const { fetchRaw } = await import('src/utils/api');
    vi.mocked(fetchRaw)
      .mockResolvedValueOnce(
        new Response('missing', { status: 404, statusText: 'Not Found' }),
      )
      .mockResolvedValueOnce(new Response(downloadedFont, { status: 200 }));

    const { getLocalFontPath } = await import('../fonts');
    const fontPath = await getLocalFontPath('jw-icons-all');

    expect(fontPath).toBe(join(fontsDir, 'jw-icons-all.woff'));
    expect(store.updateJwIconsUrl).toHaveBeenCalledTimes(1);
    expect(fetchRaw).toHaveBeenNthCalledWith(
      1,
      staleUrl,
      expect.objectContaining({ method: 'GET' }),
      false,
    );
    expect(fetchRaw).toHaveBeenNthCalledWith(
      2,
      dynamicUrl,
      expect.objectContaining({ method: 'GET' }),
      false,
    );
    expect(await pathExists(fontPath)).toBe(true);
    expect(await readFile(fontPath)).toEqual(Buffer.from(downloadedFont));
  });

  it('does not report a transient network failure to Sentry', async () => {
    const fontsDir = join(appDataPath, 'Fonts');
    await emptyDir(fontsDir);

    const { fetchRaw } = await import('src/utils/api');
    vi.mocked(fetchRaw).mockRejectedValue(
      new TypeError('Failed to fetch (cdn.jsdelivr.net)'),
    );

    const { getLocalFontPath } = await import('../fonts');

    await expect(getLocalFontPath('NotoSansBengali')).rejects.toThrow(
      'Failed to download font NotoSansBengali and no local copy exists',
    );
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  // MMM-V2-3H3: when a font's URL has to be discovered from WOL and WOL
  // couldn't be reached, that's not a bug either.
  it('does not report a font whose URL could not be discovered because WOL was unreachable', async () => {
    const fontsDir = join(appDataPath, 'Fonts');
    await emptyDir(fontsDir);

    const store = useJwStore();
    store.urlVariables.base = 'example.org';
    store.updateJwIconsUrl = vi.fn(
      async () => new TypeError('Failed to fetch (wol.example.org)'),
    );

    const { getLocalFontPath } = await import('../fonts');

    await expect(getLocalFontPath('jw-icons-all')).rejects.toThrow(
      'Failed to download font jw-icons-all and no local copy exists',
    );
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('still reports a font WOL no longer exposes', async () => {
    const fontsDir = join(appDataPath, 'Fonts');
    await emptyDir(fontsDir);

    const store = useJwStore();
    store.urlVariables.base = 'example.org';
    store.updateJwIconsUrl = vi.fn(async () => undefined);

    const { getLocalFontPath } = await import('../fonts');

    await expect(getLocalFontPath('jw-icons-all')).rejects.toThrow(
      'Failed to download font jw-icons-all and no local copy exists',
    );
    expect(errorCatcher).toHaveBeenCalledTimes(1);
  });

  it('reports a non-network failure to Sentry', async () => {
    const fontsDir = join(appDataPath, 'Fonts');
    await emptyDir(fontsDir);

    const { fetchRaw } = await import('src/utils/api');
    vi.mocked(fetchRaw).mockRejectedValue(
      new Error('Unexpected parse failure'),
    );

    const { getLocalFontPath } = await import('../fonts');

    await expect(getLocalFontPath('NotoSansBengali')).rejects.toThrow(
      'Failed to download font NotoSansBengali and no local copy exists',
    );
    expect(errorCatcher).toHaveBeenCalledTimes(1);
  });
});

describe('loadUiLocaleFont', () => {
  let fontsDir = '';
  let failFontLoads = false;
  const addedFonts: string[] = [];

  const uiLocaleFont = () =>
    document.documentElement.style.getPropertyValue('--ui-locale-font');

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    setActivePinia(createPinia());
    registerCachePathProvider(() => undefined);
    const appDataPath = await getAppDataPath();
    await remove(appDataPath);
    fontsDir = join(appDataPath, 'Fonts');
    await emptyDir(fontsDir);
    document.documentElement.style.removeProperty('--ui-locale-font');

    // happy-dom has neither FontFace nor document.fonts
    failFontLoads = false;
    addedFonts.length = 0;
    Object.defineProperty(globalThis, 'FontFace', {
      configurable: true,
      value: class {
        family: string;
        constructor(family: string) {
          this.family = family;
        }
        async load() {
          if (failFontLoads) {
            throw new DOMException('A network error occurred.', 'NetworkError');
          }
          return this;
        }
      },
    });
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        add: (font: { family: string }) => addedFonts.push(font.family),
      },
    });
  });

  // Not vi.unstubAllGlobals(): that would also drop the electronApi stub
  // from the test setup.
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'FontFace');
    Reflect.deleteProperty(document, 'fonts');
  });

  it('downloads, caches and uses Noto Sans KR for the Korean UI', async () => {
    const { fetchRaw } = await import('src/utils/api');
    vi.mocked(fetchRaw).mockResolvedValueOnce(
      new Response(Uint8Array.from([1, 2, 3]), { status: 200 }),
    );
    const { loadUiLocaleFont } = await import('../fonts');

    await expect(loadUiLocaleFont('ko')).resolves.toBe(true);

    expect(fetchRaw).toHaveBeenCalledWith(
      useJwStore().fontUrls.NotoSansKR,
      expect.objectContaining({ method: 'GET' }),
      false,
    );
    expect(await pathExists(join(fontsDir, 'NotoSansKR.woff2'))).toBe(true);
    expect(addedFonts).toEqual(['NotoSansKR']);
    expect(uiLocaleFont()).toBe("'NotoSansKR'");
  });

  it('uses an already cached Noto Sans SC for the Chinese UI without going online', async () => {
    // Cached before its URL moved from .woff to .woff2
    await writeFile(join(fontsDir, 'NotoSansSC.woff'), Buffer.from('font'));
    const { fetchRaw } = await import('src/utils/api');
    const { loadUiLocaleFont } = await import('../fonts');

    await expect(loadUiLocaleFont('cmnHans')).resolves.toBe(true);

    expect(fetchRaw).not.toHaveBeenCalled();
    expect(addedFonts).toEqual(['NotoSansSC']);
    expect(uiLocaleFont()).toBe("'NotoSansSC'");
  });

  it('takes the font out of the stack for a language Noto Sans covers', async () => {
    document.documentElement.style.setProperty(
      '--ui-locale-font',
      "'NotoSansKR'",
    );
    const { fetchRaw } = await import('src/utils/api');
    const { loadUiLocaleFont } = await import('../fonts');

    await expect(loadUiLocaleFont('fr')).resolves.toBe(true);

    expect(uiLocaleFont()).toBe('');
    expect(fetchRaw).not.toHaveBeenCalled();
    expect(addedFonts).toEqual([]);
  });

  it('leaves the system font in place quietly while offline, then loads it once online', async () => {
    const currentState = useCurrentStateStore();
    currentState.online = false;
    failFontLoads = true;
    const { fetchRaw } = await import('src/utils/api');
    vi.mocked(fetchRaw).mockRejectedValue(
      new TypeError('Failed to fetch (cdn.jsdelivr.net)'),
    );
    const { loadUiLocaleFont } = await import('../fonts');

    await expect(loadUiLocaleFont('ko')).resolves.toBe(false);
    expect(errorCatcher).not.toHaveBeenCalled();
    expect(addedFonts).toEqual([]);

    currentState.online = true;
    failFontLoads = false;
    vi.mocked(fetchRaw).mockResolvedValueOnce(
      new Response(Uint8Array.from([1, 2, 3]), { status: 200 }),
    );

    await expect(loadUiLocaleFont('ko')).resolves.toBe(true);
    expect(addedFonts).toEqual(['NotoSansKR']);
  });

  it('reports a font the CDN fails to serve while online', async () => {
    useCurrentStateStore().online = true;
    failFontLoads = true;
    const { fetchRaw } = await import('src/utils/api');
    vi.mocked(fetchRaw).mockRejectedValue(
      new TypeError('Failed to fetch (cdn.jsdelivr.net)'),
    );
    const { loadUiLocaleFont } = await import('../fonts');

    await expect(loadUiLocaleFont('ko')).resolves.toBe(false);

    expect(errorCatcher).toHaveBeenCalledTimes(1);
    expect(errorCatcher).toHaveBeenCalledWith(
      expect.any(DOMException),
      expect.objectContaining({
        contexts: {
          fn: expect.objectContaining({
            fontName: 'NotoSansKR',
            name: 'setFallbackFont',
          }),
        },
      }),
    );
  });
});
