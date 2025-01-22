import type { FontName } from 'src/types';

import { Buffer } from 'buffer';
import { errorCatcher } from 'src/helpers/error-catcher';
import { fetchRaw } from 'src/utils/api';
import { getFontsPath } from 'src/utils/fs';
import { useJwStore } from 'stores/jw';

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
    const url = useJwStore().fontUrls[fontName];
    setFallbackFont(fontName, url);
    if (!(await window.electronApi.isDownloadErrorExpected())) {
      errorCatcher(error, {
        contexts: { fn: { fontName, name: 'setElementFont', url } },
      });
    }
  }
};

const setFallbackFont = async (fontName: FontName, url: string) => {
  try {
    const fontFace = new FontFace(fontName, 'url("' + url + '")');
    await fontFace.load();
    document.fonts.add(fontFace);
  } catch (e) {
    errorCatcher(e, {
      contexts: { fn: { fontName, name: 'setFallbackFont', url } },
    });
  }
};

const getLocalFontPath = async (fontName: FontName) => {
  const fontsDir = await getFontsPath();
  const fontFileName = `${fontName}.woff2`;
  const fontPath = window.electronApi.path.join(fontsDir, fontFileName);
  let mustDownload = false;
  const fontUrls = useJwStore().fontUrls;
  try {
    if (await window.electronApi.fs.exists(fontPath)) {
      try {
        const headReq = await fetchRaw(fontUrls[fontName], {
          method: 'HEAD',
        });
        if (headReq.ok) {
          const remoteSize = headReq.headers.get('content-length');
          const localSize = (await window.electronApi.fs.stat(fontPath)).size;
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
        fn: { fontName, name: 'getLocalFontPath', url: fontUrls[fontName] },
      },
    });
    mustDownload = true;
  }
  if (mustDownload) {
    await window.electronApi.fs.ensureDir(fontsDir);
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
    await window.electronApi.fs.writeFile(fontPath, Buffer.from(buffer));
  }
  return fontPath;
};
