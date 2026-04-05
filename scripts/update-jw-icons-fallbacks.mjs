#!/usr/bin/env node

import { create } from 'fontkit';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

const constantsFilePath = resolve('src/constants/jw-icons.ts');

const getFontPathFromArgs = async () => {
  const fromArgs = process.argv[2];
  if (fromArgs) return resolve(fromArgs);

  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(
    'Path to jw-icons font file (.woff/.woff2): ',
  );
  rl.close();

  if (!answer.trim()) {
    throw new Error('No font file path provided.');
  }

  return resolve(answer.trim());
};

const glyphToUnicodeEscape = (codePoint) =>
  `\\u${codePoint.toString(16).padStart(4, '0')}`;

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
    const key = entryMatch[1].replace(/^'|'$/g, '');
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
  const fontPath = await getFontPathFromArgs();
  const constantsContent = await readFile(constantsFilePath, 'utf8');
  const fallbackEntries = extractFallbackEntries(constantsContent);
  const glyphMap = await buildGlyphCodePointMap(fontPath);

  const missingGlyphs = [];
  const fallbackLines = fallbackEntries.map(
    ({ existingCodePoint, key, rawKey }) => {
      const codePoint = glyphMap[key];
      if (!codePoint) {
        missingGlyphs.push(key);
        return `  ${rawKey}: '\\u${existingCodePoint.toLowerCase()}',`;
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
