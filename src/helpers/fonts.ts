import type { FontName } from 'src/types';

import { FONT_URLS } from 'src/constants/fonts';

import { getFontsPath } from './fs';
import { downloadFile } from './jw-media';

const { fs, path } = window.electronApi;

const getLocalFontPath = async (fontName: FontName) => {
  const fontsDir = getFontsPath();
  const fontFileName = `${fontName}.woff2`;
  const fontPath = path.join(fontsDir, fontFileName);
  if (!(await fs.exists(fontPath))) {
    await downloadFile({
      dir: fontsDir,
      filename: fontFileName,
      url: FONT_URLS[fontName],
    });
  }
  return fontPath;
};

export { getLocalFontPath };
