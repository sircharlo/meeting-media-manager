import { createPinia, setActivePinia } from 'pinia';
import { useJwStore } from 'src/stores/jw';
import { registerCachePathProvider } from 'src/utils/fs';
import { join } from 'upath';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fs, getAppDataPath } = globalThis.electronApi;
const { emptyDir, ensureDir, pathExists, readFile, remove, writeFile } = fs;

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

vi.mock('src/utils/api', () => ({
  fetchRaw: vi.fn(),
}));

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
});
