#!/usr/bin/env node

import { readFile, realpath, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, join, sep } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

import {
  applyGlyphMap,
  buildGlyphCodePointMap,
  constantsFilePath,
  extractFallbackEntries,
  replaceFallbackMap,
} from './lib/jw-icons-fallback-map.mjs';

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

const updateFallbackMap = async () => {
  const fontPath = await getCanonicalFontPath();
  const constantsContent = await readFile(constantsFilePath, 'utf8');
  const fallbackEntries = extractFallbackEntries(constantsContent);
  const glyphMap = buildGlyphCodePointMap(await readFile(fontPath));

  const { lines, missingGlyphs } = applyGlyphMap(fallbackEntries, glyphMap);
  const updatedContent = replaceFallbackMap(constantsContent, lines);
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
