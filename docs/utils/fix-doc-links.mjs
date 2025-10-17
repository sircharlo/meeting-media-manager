#!/usr/bin/env node
import fsx from 'fs-extra';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { pathExists, readdir, readFile, writeFile } = fsx;

const DOCS_SRC_DIR = resolve(__dirname, '../src');

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
  if (trimmed.startsWith('https://')) return trimmed; // leave external links

  // Normalize leading slashes to make splitting predictable
  const withoutLeading = trimmed.replace(/^\/+/, '');
  const parts = withoutLeading.split('/');

  // Recreate the test's linkPage logic robustly
  let linkPage = parts[2] ?? parts[1] ?? parts[0] ?? '';

  // Guard: if linkPage is still empty, keep original
  if (!linkPage) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  const prefix = locale === 'en' ? '' : `/${locale}`;
  return `${prefix}/${linkPage}`;
}

async function main() {
  if (!(await pathExists(DOCS_SRC_DIR))) {
    console.error(`Docs src directory not found at: ${DOCS_SRC_DIR}`);
    process.exit(1);
  }

  const localeDirs = (await readdir(DOCS_SRC_DIR, { withFileTypes: true }))
    .filter(
      (d) => d.isDirectory() && d.name !== 'assets' && d.name !== 'public',
    )
    .map((d) => d.name)
    .sort();

  let totalChanges = 0;

  for (const locale of localeDirs) {
    const indexPath = resolve(DOCS_SRC_DIR, locale, 'index.md');
    if (!(await pathExists(indexPath))) continue;

    const original = await readFile(indexPath, 'utf-8');

    const updated = original.replace(
      /(^|\n)(\s*)link:\s*(.+?)\s*(?=\n|$)/g,
      (m, lead, indent, linkValue) => {
        const fixed = fixLink(locale, linkValue);
        if (fixed !== linkValue.trim()) {
          totalChanges += 1;
          return `${lead}${indent}link: ${fixed}`;
        }
        return m;
      },
    );

    if (updated !== original) {
      await writeFile(indexPath, updated, 'utf-8');
      console.log(`Updated links in ${indexPath}`);
    }
  }

  console.log(
    `Done. Fixed ${totalChanges} link${totalChanges === 1 ? '' : 's'}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
