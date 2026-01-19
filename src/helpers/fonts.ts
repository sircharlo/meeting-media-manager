import type { FontName } from 'src/types';

import { Buffer } from 'buffer';
import { create, type Font } from 'fontkit';
import { fallbackJwIconsGlyphMap } from 'src/constants/jw-icons';
import { errorCatcher } from 'src/helpers/error-catcher';
import { fetchRaw } from 'src/utils/api';
import { getFontsPath } from 'src/utils/fs';
import { useJwStore } from 'stores/jw';

const { fs, path } = window.electronApi;
const { ensureDir, exists, readFile, stat, writeFile } = fs;
const { join } = path;

let jwIconsGlyphMapPromise: null | Promise<void> = null;
let jwIconsGlyphMap: null | Record<string, string> = null;

const buildJwIconsMap = async (fontPath: string) => {
  if (jwIconsGlyphMap) return;
  if (jwIconsGlyphMapPromise) return jwIconsGlyphMapPromise;

  jwIconsGlyphMapPromise = (async () => {
    try {
      const buffer = await readFile(fontPath);
      const font = create(buffer) as Font;
      const characterSet = font.characterSet; // id: dec code point
      const map: Record<string, string> = {};
      let unusedGlyphs = 0;
      for (let i = 0; i < font.numGlyphs; i++) {
        const glyph = font.getGlyph(i);
        if (['.notdef', '.null', 'nonmarkingreturn'].includes(glyph.name)) {
          unusedGlyphs++;
          continue;
        }
        const codePoint = characterSet[glyph.id - unusedGlyphs];
        if (glyph.name && codePoint) {
          map[glyph.name] = String.fromCodePoint(codePoint);
        }
      }
      jwIconsGlyphMap = map;
    } catch (error) {
      errorCatcher(error, {
        contexts: { fn: { fontPath, name: 'buildJwIconsMap' } },
      });
      jwIconsGlyphMap = fallbackJwIconsGlyphMap;
    }
  })();
  return jwIconsGlyphMapPromise;
};

export const jwIcons = new Proxy({} as Record<string, string>, {
  get: (_target, prop: string) => {
    // Ignore Vue internals and non-string properties
    if (
      typeof prop !== 'string' ||
      prop.startsWith('__v_') ||
      prop === 'constructor' ||
      !prop
    ) {
      return undefined;
    }

    return jwIconsGlyphMap?.[prop] || fallbackJwIconsGlyphMap[prop] || '';
  },
});

export const setElementFont = async (fontName: FontName) => {
  if (!fontName) return;

  try {
    const fontPath = await getLocalFontPath(fontName);
    const fontFace = new FontFace(fontName, 'url("' + fontPath + '")');
    await fontFace.load();
    document.fonts.add(fontFace);

    if (fontName === 'JW-Icons') {
      await buildJwIconsMap(fontPath);
    }
  } catch (error) {
    const url = useJwStore().fontUrls[fontName];
    const fallbackLoaded = await setFallbackFont(fontName, url);

    if (!fallbackLoaded) {
      errorCatcher(error, {
        contexts: { fn: { fontName, name: 'setElementFont fallback', url } },
      });
    }

    if (useJwStore().urlVariables.base !== 'jw.org') return;
    if (await window.electronApi?.isDownloadErrorExpected()) return;
    errorCatcher(error, {
      contexts: { fn: { fontName, name: 'setElementFont', url } },
    });
  }
};

const setFallbackFont = async (
  fontName: FontName,
  url: string,
): Promise<boolean> => {
  try {
    const fontFace = new FontFace(fontName, 'url("' + url + '")');
    await fontFace.load();
    document.fonts.add(fontFace);
    return true;
  } catch (e) {
    errorCatcher(e, {
      contexts: { fn: { fontName, name: 'setFallbackFont', url } },
    });
    return false;
  }
};

const withTimeout = async <T>(
  ms: number,
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(id);
  }
};

const needsDownload = async (
  fontPath: string,
  fontName: FontName,
): Promise<boolean> => {
  if (!(await exists(fontPath))) return true;

  const store = useJwStore();
  const url = store.fontUrls[fontName];

  try {
    const head = await withTimeout(5000, (signal) =>
      fetchRaw(url, { method: 'HEAD', signal }),
    );

    if (!head.ok) {
      if (fontName === 'JW-Icons') {
        await store.updateJwIconsUrl();
        return needsDownload(fontPath, fontName);
      }
      return false;
    }

    const remoteSize = head.headers.get('content-length');
    if (!remoteSize) return true;

    const localSize = (await stat(fontPath)).size;
    return parseInt(remoteSize, 10) !== localSize;
  } catch {
    return false;
  }
};

const downloadFont = async (fontPath: string, fontName: FontName) => {
  const store = useJwStore();

  const fetchFont = async () =>
    withTimeout(30000, (signal) =>
      fetchRaw(store.fontUrls[fontName], { method: 'GET', signal }),
    );

  let response = await fetchFont();
  console.log('response', response);

  if (!response.ok && fontName === 'JW-Icons') {
    await store.updateJwIconsUrl();
    response = await fetchFont();
  }

  if (!response.ok) {
    throw new Error(
      `Failed to download font: ${response.statusText || response.status}`,
    );
  }

  const buffer = Buffer.from(await (await response.blob()).arrayBuffer());
  await writeFile(fontPath, buffer);
};

export const getLocalFontPath = async (fontName: FontName) => {
  const fontsDir = await getFontsPath();
  const fontFileName = `${fontName}.woff2`;
  const fontPath = join(fontsDir, fontFileName);

  try {
    if (await needsDownload(fontPath, fontName)) {
      await ensureDir(fontsDir);
      await downloadFont(fontPath, fontName);
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          fontFileName,
          fontName,
          fontPath,
          fontsDir,
          name: 'getLocalFontPath',
          url: useJwStore().fontUrls[fontName],
        },
      },
    });

    if (!(await exists(fontPath))) {
      throw new Error(
        `Failed to download font ${fontName} and no local copy exists`,
      );
    }
  }

  return fontPath;
};
