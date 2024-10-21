import { electronApi } from './electron-api';
import { getFontsPath } from './fs';
import { downloadFile } from './jw-media';

const { fs, path } = electronApi;

const fontUrls: Record<string, string> = {
  'JW-Icons': 'https://wol.jw.org/assets/fonts/jw-icons-external-1970474.woff',
  'WT-ClearText-Bold':
    'https://b.jw-cdn.org/fonts/wt-clear-text/1.019/Wt-ClearText-Bold.woff2',
  // 'NotoSerif': 'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@100..900&display=swap',
};

const getLocalFontPath = async (fontName: string) => {
  const fontsDir = getFontsPath();
  const fontFileName = `${fontName}.woff2`;
  const fontPath = path.join(fontsDir, fontFileName);
  if (!fs.existsSync(fontPath)) {
    await downloadFile({
      dir: fontsDir,
      filename: fontFileName,
      url: fontUrls[fontName],
    });
    console.log(
      'Downloaded',
      fontFileName,
      'from',
      fontUrls[fontName],
      'to',
      fontPath,
    );
  }
  return fontPath;
};

export { fontUrls, getLocalFontPath };
