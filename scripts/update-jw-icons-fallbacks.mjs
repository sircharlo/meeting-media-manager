#!/usr/bin/env node

import { create } from 'fontkit';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, join, resolve, sep } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

const constantsFilePath = resolve('src/constants/jw-icons.ts');

const getFontPathInput = async () => {
  const fromArgs = process.argv[2];
  if (fromArgs) return fromArgs;

  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(
    'Path to jw-icons font file (.woff/.woff2): ',
  );
  rl.close();

  if (!answer.trim()) {
    throw new Error('No font file path provided.');
  }

  return answer;
};

const ensureTrailingSeparator = (directoryPath) =>
  directoryPath.endsWith(sep) ? directoryPath : `${directoryPath}${sep}`;

const getCanonicalFontPath = async () => {
  const fontPathInput = (await getFontPathInput()).trim();
  if (isAbsolute(fontPathInput)) {
    throw new Error(
      'Font file path must be relative to the current working directory.',
    );
  }

  const extension = extname(fontPathInput).toLowerCase();
  if (!['.woff', '.woff2'].includes(extension)) {
    throw new Error('Font file path must point to a .woff or .woff2 file.');
  }

  const baseDirectory = ensureTrailingSeparator(await realpath(process.cwd()));
  const fontPath = await realpath(join(baseDirectory, fontPathInput));
  if (!fontPath.startsWith(baseDirectory)) {
    throw new Error('Font file path must stay within the current directory.');
  }

  return fontPath;
};

const glyphToUnicodeEscape = (codePoint) =>
  String.raw`\u${codePoint.toString(16).padStart(4, '0')}`;

const extractFallbackEntries = (content) => {
  const match = content.match(
    /export const fallbackJwIconsGlyphMap: Record<string, string> = \{([\s\S]*?)\n\};/,
  );
  if (!match) {
    throw new Error(
      'Could not find fallbackJwIconsGlyphMap in src/constants/jw-icons.ts',
    );
  }

  const objectBody = match[1];
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

const buildGlyphCodePointMap = async (fontPath) => {
  const buffer = await readFile(fontPath);
  const font = create(buffer);
  const characterSet = font.characterSet;
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

const updateFallbackMap = async () => {
  const fontPath = await getCanonicalFontPath();
  const constantsContent = await readFile(constantsFilePath, 'utf8');
  const fallbackEntries = extractFallbackEntries(constantsContent);
  const glyphMap = await buildGlyphCodePointMap(fontPath);

  const missingGlyphs = [];
  const fallbackLines = fallbackEntries.map(
    ({ existingCodePoint, key, rawKey }) => {
      const codePoint = glyphMap[key];
      if (!codePoint) {
        missingGlyphs.push(key);
        return String.raw`  ${rawKey}: '\u${existingCodePoint.toLowerCase()}',`;
      }
      return `  ${rawKey}: '${glyphToUnicodeEscape(codePoint)}',`;
    },
  );

  const updatedContent = constantsContent.replace(
    /export const fallbackJwIconsGlyphMap: Record<string, string> = \{[\s\S]*?\n\};/,
    `export const fallbackJwIconsGlyphMap: Record<string, string> = {\n${fallbackLines.join('\n')}\n};`,
  );

  await writeFile(constantsFilePath, updatedContent, 'utf8');

  console.log(`Updated fallbackJwIconsGlyphMap using ${fontPath}`);
  if (missingGlyphs.length > 0) {
    console.warn(
      `Missing glyph names in font (kept existing fallback values): ${missingGlyphs.join(', ')}`,
    );
    process.exitCode = 1;
  }
};

await updateFallbackMap();
