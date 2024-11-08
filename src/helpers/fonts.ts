import type { FontName } from 'src/types';

import { Buffer } from 'buffer';
import { FONT_URLS } from 'src/constants/fonts';

import { errorCatcher } from './error-catcher';
import { getFontsPath } from './fs';

const { fs, path } = window.electronApi;

const getLocalFontPath = async (fontName: FontName) => {
  const fontsDir = await getFontsPath();
  const fontFileName = `${fontName}.woff2`;
  const fontPath = path.join(fontsDir, fontFileName);
  let mustDownload = false;
  try {
    if (await fs.exists(fontPath)) {
      const headReq = await fetch(FONT_URLS[fontName], {
        method: 'HEAD',
      });
      if (headReq.ok) {
        const remoteSize = headReq.headers.get('content-length');
        const localSize = (await fs.stat(fontPath)).size;
        console.log({ localSize, remoteSize });
        mustDownload = remoteSize ? parseInt(remoteSize) !== localSize : true;
      } else {
        mustDownload = true;
      }
    } else {
      mustDownload = true;
    }
  } catch (error) {
    errorCatcher(error);
    mustDownload = true;
  }
  if (mustDownload) {
    await fs.ensureDir(fontsDir);
    const response = await fetch(FONT_URLS[fontName], {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`Failed to download font: ${response.statusText}`);
    }
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    await fs.writeFile(fontPath, Buffer.from(buffer));
  }
  return fontPath;
};

export { getLocalFontPath };
