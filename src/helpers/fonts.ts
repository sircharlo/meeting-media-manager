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

const getLocalFontPath = async (fontName: FontName) => {
  const fontsDir = await getFontsPath();
  const fontFileName = `${fontName}.woff2`;
  const fontPath = join(fontsDir, fontFileName);
  let mustDownload = false;
  const fontUrls = useJwStore().fontUrls;

  try {
    if (await exists(fontPath)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const headReq = await fetchRaw(fontUrls[fontName], {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (headReq.ok) {
          const remoteSize = headReq.headers.get('content-length');
          const localSize = (await stat(fontPath)).size;
          mustDownload = remoteSize ? parseInt(remoteSize) !== localSize : true;
        } else {
          mustDownload = false;
        }
      } catch {
        mustDownload = false;
      }
    } else {
      mustDownload = true;
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
          url: fontUrls[fontName],
        },
      },
    });
    mustDownload = true;
  }

  if (mustDownload) {
    try {
      await ensureDir(fontsDir);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetchRaw(fontUrls[fontName], {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Failed to download font: ${response.statusText || response.status}`,
        );
      }

      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      await writeFile(fontPath, Buffer.from(buffer));
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            fontFileName,
            fontName,
            fontPath,
            fontsDir,
            name: 'getLocalFontPath download',
            url: fontUrls[fontName],
          },
        },
      });

      // If download failed and local file doesn't exist, throw error
      if (!(await exists(fontPath))) {
        throw new Error(
          `Failed to download font ${fontName} and no local copy exists`,
        );
      }
      // If local file exists, continue with it despite download failure
    }
  }

  return fontPath;
};
