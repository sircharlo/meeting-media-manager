import { create } from 'fontkit';
import { resolve } from 'node:path';

export const constantsFilePath = resolve('src/constants/jw-icons.ts');

const FALLBACK_MAP_PATTERN =
  /export const fallbackJwIconsGlyphMap: Record<string, string> = \{[\s\S]*?\n\};/;

export const buildGlyphCodePointMap = (buffer) => {
  const font = create(buffer);
  const characterSet = font.characterSet; // id: dec code point
  const map = {};
  let unusedGlyphs = 0;

  for (let i = 0; i < font.numGlyphs; i++) {
    const glyph = font.getGlyph(i);
    if (['.notdef', '.null', 'nonmarkingreturn'].includes(glyph.name)) {
      unusedGlyphs++;
      continue;
    }
    const codePoint = characterSet[glyph.id - unusedGlyphs];
    if (glyph.name && codePoint) {
      map[glyph.name] = codePoint;
    }
  }

  return map;
};

export const glyphToUnicodeEscape = (codePoint) =>
  String.raw`\u${codePoint.toString(16).padStart(4, '0')}`;

export const extractFallbackEntries = (content) => {
  const match = content.match(FALLBACK_MAP_PATTERN);
  if (!match) {
    throw new Error(
      'Could not find fallbackJwIconsGlyphMap in src/constants/jw-icons.ts',
    );
  }

  const objectBody = match[0]
    .replace(
      'export const fallbackJwIconsGlyphMap: Record<string, string> = {',
      '',
    )
    .replace(/\n\};$/, '');
  const lines = objectBody
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/,$/, ''));

  return lines.map((line) => {
    const entryMatch = line.match(
      /^((?:'[^']+'|[\w-]+)):\s*'\\u([0-9a-fA-F]+)'$/,
    );
    if (!entryMatch) {
      throw new Error(`Unsupported fallback map line: ${line}`);
    }
    const key = entryMatch[1].replaceAll(/^'|'$/g, '');
    return { existingCodePoint: entryMatch[2], key, rawKey: entryMatch[1] };
  });
};

/**
 * Recomputes each existing fallback entry's line against a freshly-extracted
 * glyph map, keeping the existing codepoint for any glyph name the new font
 * no longer has (reported back via `missingGlyphs`) instead of dropping it.
 */
export const applyGlyphMap = (fallbackEntries, glyphMap) => {
  const missingGlyphs = [];
  const changedKeys = [];

  const lines = fallbackEntries.map(({ existingCodePoint, key, rawKey }) => {
    const codePoint = glyphMap[key];
    if (!codePoint) {
      missingGlyphs.push(key);
      return String.raw`  ${rawKey}: '\u${existingCodePoint.toLowerCase()}',`;
    }

    const newEscape = glyphToUnicodeEscape(codePoint);
    if (newEscape.toLowerCase() !== `\\u${existingCodePoint.toLowerCase()}`) {
      changedKeys.push(key);
    }
    return `  ${rawKey}: '${newEscape}',`;
  });

  return { changedKeys, lines, missingGlyphs };
};

export const replaceFallbackMap = (content, lines) =>
  content.replace(
    FALLBACK_MAP_PATTERN,
    `export const fallbackJwIconsGlyphMap: Record<string, string> = {\n${lines.join('\n')}\n};`,
  );
