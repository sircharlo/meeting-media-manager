#!/usr/bin/env node
import fsx from 'fs-extra';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { pathExists, readdir, readFile, writeFile } = fsx;

const DOCS_SRC_DIR = resolve(__dirname, '../src');
const EN_LOCALE = 'en';
const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const verbose = args.has('--verbose');

async function fixIndexLinks(locale, totals) {
  const indexPath = resolve(DOCS_SRC_DIR, locale, 'index.md');
  if (!(await pathExists(indexPath))) return;

  const original = await readFile(indexPath, 'utf-8');

  const updated = original.replaceAll(
    /(^|\n)(\s*)link:\s*(.+?)\s*(?=\n|$)/g,
    (m, lead, indent, linkValue) => {
      const fixed = fixLink(locale, linkValue);
      if (fixed !== linkValue.trim()) {
        totals.linkChanges += 1;
        if (verbose) {
          console.log(
            `[link] ${getRelativePath(indexPath)}: ${linkValue.trim()} -> ${fixed}`,
          );
        }
        return `${lead}${indent}link: ${fixed}`;
      }
      return m;
    },
  );

  if (updated !== original && !checkOnly) {
    await writeFile(indexPath, updated, 'utf-8');
    console.log(`Updated links in ${getRelativePath(indexPath)}`);
  }
}

/**
 * Determine the expected link for a given locale and original link string.
 * Rules mirror docs/utils/__tests__/locales.test.ts:
 * - External links (https://...) are left unchanged
 * - linkPage is derived from the original by splitting on '/':
 *   - If there is a third segment (index 2), use it
 *   - Else use the second segment (index 1)
 *   - If neither exist, use the first segment
 * - Final format:
 *   - en: /{linkPage}
 *   - others: /{locale}/{linkPage}
 */
function fixLink(locale, link) {
  const trimmed = (link || '').trim();
  if (trimmed.startsWith('https://')) return trimmed;

  // Extract just the slug - last non-empty segment.
  const slug = trimmed.replace(/^\/+/, '').split('/').findLast(Boolean);
  if (!slug) return trimmed;

  const prefix = locale === EN_LOCALE ? '' : `/${locale}`;
  return `${prefix}/${slug}`;
}

async function fixMarkdownAnchors(locale, markdownFile, totals) {
  const enPath = resolve(DOCS_SRC_DIR, EN_LOCALE, markdownFile);
  const localePath = resolve(DOCS_SRC_DIR, locale, markdownFile);

  if (!(await pathExists(enPath)) || !(await pathExists(localePath))) return;

  const enContent = await readFile(enPath, 'utf-8');
  const localeContent = await readFile(localePath, 'utf-8');
  const enHeadings = parseHeadings(enContent);
  const localeHeadings = parseHeadings(localeContent);
  const enAnchorIndexes = new Map(
    enHeadings
      .map((heading, index) => [heading.anchor, index])
      .filter(([anchor]) => anchor),
  );
  const lines = localeContent.split('\n');
  const state = {
    cursor: 0,
    usedAnchors: new Set(),
  };
  let changed = false;

  if (enHeadings.length !== localeHeadings.length) {
    totals.anchorWarnings += 1;
    console.warn(
      `[anchor] ${getRelativePath(localePath)}: heading count differs from English (${localeHeadings.length} vs ${enHeadings.length})`,
    );
  }

  for (const localeHeading of localeHeadings) {
    const expectedAnchor = getExpectedAnchor(
      localeHeading,
      enHeadings,
      enAnchorIndexes,
      state,
    );
    if (!expectedAnchor) continue;

    const updatedLine = replaceHeadingAnchor(
      localeHeading.line,
      expectedAnchor,
    );

    if (
      localeHeading.anchor === expectedAnchor &&
      localeHeading.anchorCount === 1 &&
      localeHeading.line === updatedLine
    ) {
      continue;
    }

    totals.anchorChanges += 1;
    changed = true;
    lines[localeHeading.index] = updatedLine;

    let before = '(missing)';
    if (localeHeading.anchor) {
      before =
        localeHeading.anchorCount === 1
          ? `{#${localeHeading.anchor}}`
          : `${localeHeading.anchorCount} anchors ending with {#${localeHeading.anchor}}`;
    }
    const after = `{#${expectedAnchor}}`;
    console.log(
      `[anchor] ${getRelativePath(localePath)}:${localeHeading.index + 1}: ${before} -> ${after}`,
    );
    if (verbose) {
      console.log(`  before: ${localeHeading.line}`);
      console.log(`  after:  ${lines[localeHeading.index]}`);
    }
  }

  if (changed && !checkOnly) {
    await writeFile(localePath, lines.join('\n'), 'utf-8');
  }
}

function getExpectedAnchor(localeHeading, enHeadings, enAnchorIndexes, state) {
  if (localeHeading.anchor) {
    const matchingIndex = enAnchorIndexes.get(localeHeading.anchor);
    const alreadyUsed = state.usedAnchors.has(localeHeading.anchor);

    if (
      matchingIndex !== undefined &&
      matchingIndex >= state.cursor &&
      !alreadyUsed
    ) {
      state.cursor = matchingIndex + 1;
      state.usedAnchors.add(localeHeading.anchor);
      return localeHeading.anchor;
    }
  }

  while (
    state.cursor < enHeadings.length &&
    (!enHeadings[state.cursor].anchor ||
      state.usedAnchors.has(enHeadings[state.cursor].anchor))
  ) {
    state.cursor += 1;
  }

  const expectedAnchor = enHeadings[state.cursor]?.anchor;
  if (expectedAnchor) {
    state.cursor += 1;
    state.usedAnchors.add(expectedAnchor);
  }

  return expectedAnchor ?? null;
}

function getHeadingAnchors(line) {
  const match = /((?:\s*\{#[^}\s]+\})+)\s*$/.exec(line);
  if (!match) return [];

  return [...match[1].matchAll(/\{#([^}\s]+)\}/g)].map(
    (anchorMatch) => anchorMatch[1],
  );
}

async function getLocaleDirs() {
  return (await readdir(DOCS_SRC_DIR, { withFileTypes: true }))
    .filter(
      (d) => d.isDirectory() && d.name !== 'assets' && d.name !== 'public',
    )
    .map((d) => d.name)
    .sort();
}

async function getMarkdownFiles(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getMarkdownFiles(fullPath, relativePath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

function getRelativePath(path) {
  return relative(resolve(__dirname, '../..'), path).replaceAll('\\', '/');
}

async function main() {
  try {
    if (!(await pathExists(DOCS_SRC_DIR))) {
      console.error(`Docs src directory not found at: ${DOCS_SRC_DIR}`);
      process.exit(1);
    }

    const localeDirs = await getLocaleDirs();
    const englishMarkdownFiles = await getMarkdownFiles(
      resolve(DOCS_SRC_DIR, EN_LOCALE),
    );
    const totals = {
      anchorChanges: 0,
      anchorWarnings: 0,
      linkChanges: 0,
    };

    for (const locale of localeDirs) {
      await fixIndexLinks(locale, totals);

      if (locale === EN_LOCALE) continue;

      for (const markdownFile of englishMarkdownFiles) {
        await fixMarkdownAnchors(locale, markdownFile, totals);
      }
    }

    const changeCount = totals.linkChanges + totals.anchorChanges;
    console.log(
      `Done. ${checkOnly ? 'Found' : 'Fixed'} ${totals.linkChanges} link${totals.linkChanges === 1 ? '' : 's'} and ${totals.anchorChanges} anchor${totals.anchorChanges === 1 ? '' : 's'}.`,
    );

    if (totals.anchorWarnings > 0) {
      console.warn(
        `Found ${totals.anchorWarnings} anchor warning${totals.anchorWarnings === 1 ? '' : 's'}.`,
      );
    }

    if (checkOnly && changeCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

function parseHeadings(content) {
  const headings = [];
  const lines = content.split('\n');
  let inFence = false;

  lines.forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }

    if (inFence) return;

    const headingMatch = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!headingMatch) return;

    const anchors = getHeadingAnchors(line);

    headings.push({
      anchor: anchors.at(-1) ?? null,
      anchorCount: anchors.length,
      index,
      level: headingMatch[1].length,
      line,
    });
  });

  return headings;
}

function replaceHeadingAnchor(line, anchor) {
  const withoutAnchors = line.replace(/(?:\s*\{#[^}\s]+\})+\s*$/, '');
  return `${withoutAnchors} {#${anchor}}`;
}

await main();
