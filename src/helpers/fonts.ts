import type { FontName } from 'src/types';

import { Buffer } from 'buffer/';
import { create, type Font } from 'fontkit';
import {
  fallbackJwIconsGlyphMap,
  keywordToJwIconMapping,
} from 'src/constants/jw-icons';
import { errorCatcher } from 'src/helpers/error-catcher';
import { fetchRaw } from 'src/utils/api';
import { getFontsPath } from 'src/utils/fs';
import { useJwStore } from 'stores/jw';

const { fs, path } = globalThis.electronApi;
const { ensureDir, exists, readFile, writeFile } = fs;
const { extname, join } = path;

let jwIconsGlyphMapPromise: null | Promise<void> = null;
let jwIconsGlyphMap: null | Record<string, string> = null;

// Yeartext font configuration per writing script
interface YeartextFontConfig {
  cdnFont?: FontName;
  fontFamily: string;
}

const DEFAULT_YEARTEXT_FONT: YeartextFontConfig = {
  fontFamily: "'Wt-ClearText-Bold', serif",
};

// Maps JwLanguage.script (uppercase) to font config
// Based on JW.org's jwac.ms-* CSS classes
const YEARTEXT_FONTS: Record<string, YeartextFontConfig> = {
  ARABIC: {
    cdnFont: 'NotoNaskhArabic',
    fontFamily: "'NotoNaskhArabic', 'NotoSerifVariable', serif",
  },
  ARMENIAN: {
    cdnFont: 'NotoSerifArmenian',
    fontFamily: "'NotoSerifArmenian', 'Noto Serif Variable', serif",
  },
  ASSYRIAN: { fontFamily: "'Noto Serif Variable', Georgia, serif" },
  BENGALI: {
    cdnFont: 'NotoSansBengali',
    fontFamily: "'NotoSansBengali', 'NotoSans', sans-serif",
  },
  CAMBODIAN: {
    cdnFont: 'NotoSerifKhmer',
    fontFamily: "'NotoSerifKhmer', 'Noto Serif Variable', serif",
  },
  CHINESE: {
    cdnFont: 'NotoSansSC',
    fontFamily:
      "'NotoSansSC', 'Microsoft YaHei', 'Heiti SC', 'Arial Unicode MS', sans-serif",
  },
  CYRILLIC: { fontFamily: "'Wt-ClearText-Bold', serif" },
  DEVANAGARI: {
    cdnFont: 'NotoSerifDevanagari',
    fontFamily: "'NotoSerifDevanagari', 'Noto Serif Variable', serif",
  },
  ETHIOPIC: {
    cdnFont: 'AbyssinicaSIL',
    fontFamily: "'AbyssinicaSIL', sans-serif",
  },
  GEORGIAN: {
    cdnFont: 'WTClearTextGeorgian',
    fontFamily: "'WTClearTextGeorgian', 'Noto Serif Variable', serif",
  },
  GREEK: { fontFamily: "'Wt-ClearText-Bold', serif" },
  GUJARATI: {
    cdnFont: 'NotoSerifGujarati',
    fontFamily: "'NotoSerifGujarati', 'Noto Serif Variable', serif",
  },
  GURMUKHI: {
    cdnFont: 'NotoSansGurmukhi',
    fontFamily: "'NotoSansGurmukhi', 'NotoSans', Raavi",
  },
  HEBREW: {
    cdnFont: 'NotoSerifHebrew',
    fontFamily: "'NotoSerifHebrew', 'Noto Serif Variable', serif",
  },
  JAPANESE: {
    cdnFont: 'WTClearTextJapanese',
    fontFamily: "'WTClearTextJapanese', serif",
  },
  KANNADA: {
    cdnFont: 'NotoSerifKannada',
    fontFamily: "'NotoSerifKannada', 'Noto Serif Variable', serif",
  },
  KOREAN: {
    cdnFont: 'Wt-BaeumMyungjo',
    fontFamily: "'Wt-BaeumMyungjo', serif",
  },
  LAOTIAN: {
    cdnFont: 'WTSetthaSpecial',
    fontFamily: "'WTSetthaSpecial', 'Dok Champa', sans-serif",
  },
  MALAYALAM: {
    cdnFont: 'NotoSansMalayalam',
    fontFamily: "'NotoSansMalayalam', 'NotoSans', Kartika, sans-serif",
  },
  MONGOLIAN: {
    cdnFont: 'WTMannaSansMongolian',
    fontFamily: "'WTMannaSansMongolian', 'NotoSansSC', 'NotoSans'",
  },
  MYANMAR: {
    cdnFont: 'WTMannaSansMyanmar',
    fontFamily:
      "'WTMannaSansMyanmar', 'NotoSans', 'Myanmar Sangam MN', sans-serif",
  },
  ORIYA: {
    cdnFont: 'NotoSansOriya',
    fontFamily:
      "'NotoSansOriya', 'NotoSans', 'Oriya Sangam MN', Kalinga, sans-serif",
  },
  ROMAN: { fontFamily: "'Wt-ClearText-Bold', serif" },
  SINDHI: { fontFamily: "'Noto Serif Variable', Georgia, serif" },
  SINHALESE: {
    cdnFont: 'NotoSerifSinhala',
    fontFamily: "'NotoSerifSinhala', 'Noto Serif Variable', serif",
  },
  TAMIL: {
    cdnFont: 'NotoSansTamil',
    fontFamily: "'NotoSansTamil', 'NotoSans', Latha, sans-serif",
  },
  TELUGU: {
    cdnFont: 'NotoSansTelugu',
    fontFamily: "'NotoSansTelugu', 'NotoSans', Gautami, sans-serif",
  },
  THAI: { cdnFont: 'WTTextNew', fontFamily: "'WTTextNew', serif" },
  TIBETAN: {
    cdnFont: 'WTMannaSansTibetan',
    fontFamily: "'WTMannaSansTibetan', 'NotoSans', sans-serif",
  },
  URDU: {
    cdnFont: 'NotoNastaliqUrdu',
    fontFamily: "'NotoNastaliqUrdu', 'NotoSans', 'Jameel Noori Nastaleeq'",
  },
};

// Language-specific overrides (script.langCode → font config)
// From JW.org CSS: .jwac.ms-SCRIPT.ml-LANG rules
const YEARTEXT_LANG_OVERRIDES: Record<string, YeartextFontConfig> = {
  'ARABIC.AJA': {
    cdnFont: 'WTXBZSpecial',
    fontFamily: "'WTXBZSpecial', 'Geeza Pro', 'Simplified Arabic'",
  },
  'ARABIC.AZA': {
    cdnFont: 'WTXBZSpecial',
    fontFamily: "'WTXBZSpecial', sans-serif",
  },
  'ARABIC.DAR': {
    cdnFont: 'WTXBZSpecial',
    fontFamily: "'WTXBZSpecial', 'Geeza Pro', 'Simplified Arabic'",
  },
  'ARABIC.PH': {
    cdnFont: 'WTXBZSpecial',
    fontFamily: "'WTXBZSpecial', 'Geeza Pro', 'Simplified Arabic'",
  },
  'ARABIC.PR': {
    cdnFont: 'WTXBZSpecial',
    fontFamily: "'WTXBZSpecial', 'Geeza Pro', 'Simplified Arabic'",
  },
  'ARABIC.RDA': {
    cdnFont: 'WTXBZSpecial',
    fontFamily: "'WTXBZSpecial', 'Geeza Pro', 'Simplified Arabic'",
  },
  'CHINESE.CH': {
    cdnFont: 'NotoSansTC',
    fontFamily:
      "'NotoSansTC', 'Microsoft YaHei', 'Heiti SC', 'Arial Unicode MS', sans-serif",
  },
  'CHINESE.CHC': {
    cdnFont: 'NotoSansTC',
    fontFamily:
      "'NotoSansTC', 'Microsoft YaHei', 'Heiti SC', 'Arial Unicode MS', sans-serif",
  },
  'CHINESE.CHH': {
    cdnFont: 'NotoSansTC',
    fontFamily:
      "'NotoSansTC', 'Microsoft YaHei', 'Heiti SC', 'Arial Unicode MS', sans-serif",
  },
  'CHINESE.CHW': {
    cdnFont: 'NotoSansTC',
    fontFamily:
      "'NotoSansTC', 'Microsoft YaHei', 'Heiti SC', 'Arial Unicode MS', sans-serif",
  },
  'CHINESE.HSL': {
    cdnFont: 'NotoSansTC',
    fontFamily:
      "'NotoSansTC', 'Microsoft YaHei', 'Heiti SC', 'Arial Unicode MS', sans-serif",
  },
  'CHINESE.TSL': {
    cdnFont: 'NotoSansTC',
    fontFamily:
      "'NotoSansTC', 'Microsoft YaHei', 'Heiti SC', 'Arial Unicode MS', sans-serif",
  },
  'MYANMAR.KR': {
    cdnFont: 'WTMannaSansKaren',
    fontFamily: "'WTMannaSansKaren', Padauk, Zawgyi, sans-serif",
  },
  'MYANMAR.PK': {
    cdnFont: 'WTMannaSansKaren',
    fontFamily: "'WTMannaSansKaren', Padauk, Zawgyi, sans-serif",
  },
};

/**
 * Load the yeartext font for a given writing script and optional language code.
 * Downloads the font from CDN (jsDelivr or JW CDN) and caches locally.
 */
export const loadYeartextFont = async (
  script?: string,
  langCode?: string,
): Promise<string> => {
  const scriptKey = script?.toUpperCase() || '';

  // Check language-specific override first, then fall back to script
  const langKey = langCode
    ? `${scriptKey}.${langCode.toUpperCase()}`
    : undefined;
  const config =
    (langKey ? YEARTEXT_LANG_OVERRIDES[langKey] : undefined) ||
    YEARTEXT_FONTS[scriptKey] ||
    DEFAULT_YEARTEXT_FONT;

  if (config.cdnFont) {
    // For WT/JW/Manna fonts, ensure URLs are discovered first
    const store = useJwStore();
    const isWtFont =
      config.cdnFont.startsWith('WT') ||
      config.cdnFont.startsWith('Wt-') ||
      config.cdnFont === 'AbyssinicaSIL';
    if (isWtFont && !store.fontUrls[config.cdnFont]) {
      await store.updateYeartextFontUrls();
    }
    await setElementFont(config.cdnFont);
  }

  return config.fontFamily;
};

const fontFacePromises: Partial<Record<FontName, Promise<boolean>>> = {};
const localFontPathPromises: Partial<Record<FontName, Promise<string>>> = {};
const legacyFontFileNames: Partial<Record<FontName, string[]>> = {
  'jw-icons-all': ['JW-Icons'],
};
const fontExtensions = ['woff2', 'woff'] as const;

const getFontExtensionFromUrl = (url = '') => {
  if (!url) return 'woff2';
  const extension = extname(new URL(url).pathname).replace('.', '');
  return fontExtensions.includes(extension as (typeof fontExtensions)[number])
    ? (extension as (typeof fontExtensions)[number])
    : 'woff2';
};

const getFontPath = (
  fontsDir: string,
  fontName: string,
  extension: (typeof fontExtensions)[number],
) => join(fontsDir, `${fontName}.${extension}`);

const getFontPathCandidates = (fontsDir: string, fontName: FontName) => {
  const fontNames = [fontName, ...(legacyFontFileNames[fontName] || [])];
  return fontNames.flatMap((name) =>
    fontExtensions.map((extension) => getFontPath(fontsDir, name, extension)),
  );
};

const getExistingLocalFontPath = async (
  fontsDir: string,
  fontName: FontName,
) => {
  for (const fontPath of getFontPathCandidates(fontsDir, fontName)) {
    if (await exists(fontPath)) {
      return fontPath;
    }
  }

  return null;
};

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

export const getJwIconFromKeyword = (keyword: number | string | undefined) => {
  if (!keyword) return '';
  const icon = keywordToJwIconMapping[keyword.toString()];
  if (!icon) return '';
  return jwIconsGlyphMap?.[icon] || fallbackJwIconsGlyphMap[icon] || '';
};

export const setElementFont = async (fontName: FontName) => {
  if (!fontName) return false;

  if (fontFacePromises[fontName]) return fontFacePromises[fontName];

  fontFacePromises[fontName] = (async () => {
    try {
      const fontPath = await getLocalFontPath(fontName);
      const fontFace = new FontFace(fontName, 'url("' + fontPath + '")');
      await fontFace.load();
      document.fonts.add(fontFace);

      if (fontName === 'jw-icons-all') {
        await buildJwIconsMap(fontPath);
      }
      return true;
    } catch (error) {
      errorCatcher(error, {
        contexts: { fn: { fontName, name: 'setElementFont first try' } },
      });
      const url = useJwStore().fontUrls[fontName];
      const fallbackLoaded = await setFallbackFont(fontName, url);

      if (!fallbackLoaded) {
        errorCatcher(error, {
          contexts: { fn: { fontName, name: 'setElementFont fallback', url } },
        });
        fontFacePromises[fontName] = undefined;
      }

      return fallbackLoaded;
    }
  })();

  return fontFacePromises[fontName];
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

const resolveFontRequest = async (
  fontName: FontName,
  method: 'GET' | 'HEAD',
) => {
  const store = useJwStore();
  const originalUrl = store.fontUrls[fontName];

  const fetchFont = async (url: string) =>
    withTimeout(method === 'HEAD' ? 5000 : 30000, (signal) =>
      fetchRaw(url, { method, signal }, method === 'HEAD'),
    );

  let resolvedUrl = originalUrl;
  let response = await fetchFont(resolvedUrl);

  if (!response.ok && fontName === 'jw-icons-all') {
    await store.updateJwIconsUrl();
    const fallbackUrl = store.fontUrls[fontName];
    if (fallbackUrl && fallbackUrl !== originalUrl) {
      resolvedUrl = fallbackUrl;
      response = await fetchFont(resolvedUrl);
    }
  }

  if (!response.ok) {
    throw new Error(
      `Failed to download font: ${response.statusText || response.status}`,
    );
  }

  return { resolvedUrl, response };
};

const downloadFont = async (fontsDir: string, fontName: FontName) => {
  const { resolvedUrl, response } = await resolveFontRequest(fontName, 'GET');
  const buffer = Buffer.from(await (await response.blob()).arrayBuffer());
  const fontPath = getFontPath(
    fontsDir,
    fontName,
    getFontExtensionFromUrl(resolvedUrl),
  );
  await writeFile(fontPath, buffer);
  return fontPath;
};

export const getLocalFontPath = async (fontName: FontName) => {
  if (localFontPathPromises[fontName]) return localFontPathPromises[fontName];

  localFontPathPromises[fontName] = (async () => {
    const fontsDir = await getFontsPath();
    const existingFontPath = await getExistingLocalFontPath(fontsDir, fontName);

    if (existingFontPath) {
      return existingFontPath;
    }

    try {
      await ensureDir(fontsDir);
      return await downloadFont(fontsDir, fontName);
    } catch (error) {
      const fallbackPath = await getExistingLocalFontPath(fontsDir, fontName);
      errorCatcher(error, {
        contexts: {
          fn: {
            fontName,
            fontPath: fallbackPath,
            fontsDir,
            name: 'getLocalFontPath',
            url: useJwStore().fontUrls[fontName],
          },
        },
      });

      if (!fallbackPath) {
        throw new Error(
          `Failed to download font ${fontName} and no local copy exists`,
          { cause: error },
        );
      }

      return fallbackPath;
    }
  })();

  return localFontPathPromises[fontName];
};
