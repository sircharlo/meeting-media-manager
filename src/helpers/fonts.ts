import type { FontName } from 'src/types';

import { FONT_URLS } from 'src/constants/fonts';

import { getFontsPath } from './fs';

const { fs, path } = window.electronApi;

const getLocalFontPath = async (fontName: FontName) => {
  const fontsDir = await getFontsPath();
  const fontFileName = `${fontName}.woff2`;
  const fontPath = path.join(fontsDir, fontFileName);
  if (!(await fs.exists(fontPath))) {
    await window.electronApi.downloadFile(
      FONT_URLS[fontName],
      fontsDir,
      fontFileName,
    );
  }
  return fontPath;
};

export { getLocalFontPath };
