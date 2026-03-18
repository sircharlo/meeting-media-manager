import { createPinia, setActivePinia } from 'pinia';
import { useJwStore } from 'src/stores/jw';
import { registerCachePathProvider } from 'src/utils/fs';
import { join } from 'upath';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fs } = globalThis.electronApi;
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
    appDataPath = await globalThis.electronApi.getAppDataPath();
    await remove(appDataPath);
  });

  it('reuses the legacy cached JW-Icons font without refetching it', async () => {
    const fontsDir = join(appDataPath, 'Fonts');
    await ensureDir(fontsDir);
    const legacyFontPath = join(fontsDir, 'JW-Icons.woff2');
    await writeFile(legacyFontPath, Buffer.from('cached-font'));

    const store = useJwStore();
    store.urlVariables.base = 'example.org';
    store.updateJwIconsUrl = vi.fn();

    const { fetchRaw } = await import('src/utils/api');
    vi.mocked(fetchRaw).mockResolvedValue(
      new Response('missing', { status: 404, statusText: 'Not Found' }),
    );
    const { getLocalFontPath } = await import('../fonts');

    await expect(getLocalFontPath('jw-icons-all')).resolves.toBe(
      legacyFontPath,
    );
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(fetchRaw).toHaveBeenCalledWith(
      store.fontUrls['jw-icons-all'],
      expect.objectContaining({ method: 'HEAD' }),
      true,
    );
  });

  it('reuses a cached .woff file when no .woff2 cache entry exists', async () => {
    const fontsDir = join(appDataPath, 'Fonts');
    await ensureDir(fontsDir);
    const cachedFontPath = join(fontsDir, 'Wt-ClearText-Bold.woff');
    await writeFile(cachedFontPath, Buffer.from('cached-font'));

    const store = useJwStore();
    store.urlVariables.base = 'example.org';

    const { fetchRaw } = await import('src/utils/api');
    vi.mocked(fetchRaw).mockResolvedValue(
      new Response('', {
        headers: {
          'content-length': String(Buffer.from('cached-font').length),
        },
        status: 200,
      }),
    );
    const { getLocalFontPath } = await import('../fonts');

    await expect(getLocalFontPath('Wt-ClearText-Bold')).resolves.toBe(
      cachedFontPath,
    );
  });

  it('falls back to the dynamically discovered jw-icons URL when the hard-coded URL 404s', async () => {
    const fontsDir = join(appDataPath, 'Fonts');
    await emptyDir(fontsDir);

    const store = useJwStore();
    store.urlVariables.base = 'example.org';
    store.updateJwIconsUrl = vi.fn(async () => {
      store.jwIconsUrl =
        'https://cdn.example.org/assets/fonts/jw-icons-all.woff';
    });

    const firstUrl = store.fontUrls['jw-icons-all'];
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
      firstUrl,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchRaw).toHaveBeenNthCalledWith(
      2,
      dynamicUrl,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(await pathExists(fontPath)).toBe(true);
    expect(await readFile(fontPath)).toEqual(Buffer.from(downloadedFont));
  });
});
