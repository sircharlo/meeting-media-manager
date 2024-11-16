import type { FontName } from 'src/types';

import { Buffer } from 'buffer';
import { useJwStore } from 'src/stores/jw';

import { fetchRaw } from './api';
import { errorCatcher } from './error-catcher';
import { getFontsPath } from './fs';

const { fs, path } = window.electronApi;

export const setElementFont = async (fontName: FontName) => {
  if (!fontName) return;

  try {
    const fontFace = new FontFace(
      fontName,
      'url("' + (await getLocalFontPath(fontName)) + '")',
    );
    await fontFace.load();
    document.fonts.add(fontFace);
  } catch (error) {
    const fontFace = new FontFace(
      fontName,
      'url("' + useJwStore().fontUrls[fontName] + '")',
    );
    await fontFace.load();
    document.fonts.add(fontFace);
    errorCatcher(error, {
      contexts: { fn: { fontName, name: 'setElementFont' } },
    });
  }
};

const getLocalFontPath = async (fontName: FontName) => {
  const fontsDir = await getFontsPath();
  const fontFileName = `${fontName}.woff2`;
  const fontPath = path.join(fontsDir, fontFileName);
  let mustDownload = false;
  const fontUrls = useJwStore().fontUrls;
  try {
    if (await fs.exists(fontPath)) {
      const headReq = await fetchRaw(fontUrls[fontName], {
        method: 'HEAD',
      });
      if (headReq.ok) {
        const remoteSize = headReq.headers.get('content-length');
        const localSize = (await fs.stat(fontPath)).size;
        mustDownload = remoteSize ? parseInt(remoteSize) !== localSize : true;
      } else {
        mustDownload = true;
      }
    } else {
      mustDownload = true;
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: { fontName, name: 'getLocalFontPath', url: fontUrls[fontName] },
      },
    });
    mustDownload = true;
  }
  if (mustDownload) {
    await fs.ensureDir(fontsDir);
    const response = await fetchRaw(fontUrls[fontName], {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(
        `Failed to download font: ${response.statusText || response.status}`,
      );
    }
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    await fs.writeFile(fontPath, Buffer.from(buffer));
  }
  return fontPath;
};
