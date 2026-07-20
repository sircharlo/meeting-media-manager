#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';

import { extractCssUrls, findIconUrlInCss } from '../src/shared/vanilla.ts';
import {
  applyGlyphMap,
  buildGlyphCodePointMap,
  constantsFilePath,
  extractFallbackEntries,
  replaceFallbackMap,
} from './lib/jw-icons-fallback-map.mjs';

// The default base URL the app itself falls back to (src/stores/jw.ts) when
// no congregation-specific one applies.
const BASE_URL = 'jw.org';

const SOURCE_URL_COMMENT_PATTERN = /\/\/ Source font: (\S+).*\n/;

// This mirrors the CSS-scraping half of useJwStore().updateJwIconsUrl() in
// src/stores/jw.ts, which the app calls when its cached jw-icons font URL
// stops working - extractCssUrls/findIconUrlInCss live in shared/vanilla.ts
// so this script can reuse the exact same discovery logic outside the
// Vue/Pinia runtime.
const discoverJwIconsFontUrl = async () => {
  const wolUrl = `https://wol.${BASE_URL}/en/wol/h/r1/lp-e`;
  const response = await fetch(wolUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${wolUrl}: ${response.status}`);
  }

  const html = await response.text();
  const cssUrls = extractCssUrls(html, BASE_URL);

  for (const cssUrl of cssUrls) {
    try {
      const cssResponse = await fetch(cssUrl);
      if (!cssResponse.ok) continue;
      const fontUrl = findIconUrlInCss(await cssResponse.text(), cssUrl);
      if (fontUrl) return fontUrl;
    } catch {
      // Try the next stylesheet.
    }
  }

  throw new Error(
    'Could not discover the jw-icons font URL from any stylesheet.',
  );
};

// A HEAD-only reachability probe isn't reliable here - wol.jw.org's CDN
// resets the connection on HEAD from Node's fetch (though curl -I and a
// plain GET both work fine) - so the recorded URL is checked by actually
// downloading it, and only falls back to rediscovery if that fails.
const fetchFontBuffer = async (url) => {
  const response = await fetch(url);
  if (!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
};

const getRecordedSourceUrl = (content) =>
  SOURCE_URL_COMMENT_PATTERN.exec(content)?.[1];

const setRecordedSourceUrl = (content, url) => {
  const comment = `// Source font: ${url} (auto-refreshed ${new Date().toISOString().slice(0, 10)})\n`;
  return SOURCE_URL_COMMENT_PATTERN.test(content)
    ? content.replace(SOURCE_URL_COMMENT_PATTERN, comment)
    : content.replace(
        'export const fallbackJwIconsGlyphMap',
        `${comment}export const fallbackJwIconsGlyphMap`,
      );
};

const refreshFallbackMap = async () => {
  const constantsContent = await readFile(constantsFilePath, 'utf8');
  const recordedUrl = getRecordedSourceUrl(constantsContent);

  let fontUrl = recordedUrl;
  let buffer = fontUrl
    ? await fetchFontBuffer(fontUrl).catch(() => null)
    : null;

  if (buffer) {
    console.log(`Recorded source font is still reachable: ${fontUrl}`);
  } else {
    console.log(
      recordedUrl
        ? `Recorded source font (${recordedUrl}) is no longer reachable, rediscovering...`
        : 'No recorded source font yet, discovering...',
    );
    fontUrl = await discoverJwIconsFontUrl();
    buffer = await fetchFontBuffer(fontUrl);
    if (!buffer) {
      throw new Error(`Failed to download discovered font from ${fontUrl}`);
    }
  }
  console.log(`Using font URL: ${fontUrl}`);

  const glyphMap = buildGlyphCodePointMap(buffer);

  const fallbackEntries = extractFallbackEntries(constantsContent);
  const { changedKeys, lines, missingGlyphs } = applyGlyphMap(
    fallbackEntries,
    glyphMap,
  );

  const urlChanged = fontUrl !== recordedUrl;
  if (changedKeys.length === 0 && !urlChanged) {
    console.log('No changes: fallback glyph map is already up to date.');
    return;
  }

  const updatedContent = setRecordedSourceUrl(
    replaceFallbackMap(constantsContent, lines),
    fontUrl,
  );
  await writeFile(constantsFilePath, updatedContent, 'utf8');

  const summaryLines = [
    `Auto-refreshed the jw-icons fallback glyph map from ${fontUrl}.`,
    '',
    changedKeys.length > 0
      ? `Changed glyphs (${changedKeys.length}): ${changedKeys.join(', ')}`
      : 'No glyph codepoints changed - only the recorded source URL was updated.',
  ];
  if (urlChanged) {
    summaryLines.push(
      '',
      `Source font URL changed from ${recordedUrl ?? '(none recorded)'} to ${fontUrl}.`,
    );
  }
  if (missingGlyphs.length > 0) {
    summaryLines.push(
      '',
      `⚠️ These glyph names were not found in the new font and kept their previous fallback value - please verify they still render correctly: ${missingGlyphs.join(', ')}`,
    );
  }

  console.log(summaryLines.join('\n'));
  await writeFile(
    'jw-icons-refresh-summary.md',
    summaryLines.join('\n'),
    'utf8',
  );
};

await refreshFallbackMap();
