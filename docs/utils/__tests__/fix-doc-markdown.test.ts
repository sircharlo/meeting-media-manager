import { readdir, readFile } from 'fs-extra';
import { resolve } from 'upath';
import { describe, expect, it } from 'vitest';

const DOCS_SRC_DIR = resolve(__dirname, '../../src');

/**
 * Return the last explicit trailing anchor of a heading line, e.g.
 * `{#foo}` from `### Title {#foo}`, or null when there is none.
 * Mirrors the parsing in docs/utils/fix-doc-markdown.mjs.
 */
function getTrailingAnchor(line: string): null | string {
  const matches = [...line.matchAll(/\{#([^{}\s]+)\}/g)];
  if (matches.length === 0) return null;

  const last = matches[matches.length - 1];
  if (last.index === undefined) return null;
  if (line.slice(last.index + last[0].length).trim() !== '') return null;
  return last[1];
}

/** Every locale's docs pages, as `locale/file.md`. */
const getDocPages = async () => {
  const localeDirs = (await readdir(DOCS_SRC_DIR, { withFileTypes: true }))
    .filter(
      (d) => d.isDirectory() && d.name !== 'assets' && d.name !== 'public',
    )
    .map((d) => d.name);
  const pages = await Promise.all(
    localeDirs.map(async (locale) =>
      (await readdir(resolve(DOCS_SRC_DIR, locale)))
        .filter((file) => file.endsWith('.md'))
        .map((file) => `${locale}/${file}`),
    ),
  );
  return pages.flat();
};

describe('fix-doc-markdown', () => {
  // Every page of every locale: read together rather than one after the
  // other, and with more time than a test's 15 seconds, which a busy full
  // test run took it past.
  it('should leave no duplicate explicit heading anchors in any locale file', async () => {
    const pages = await getDocPages();
    const contents = await Promise.all(
      pages.map((page) => readFile(resolve(DOCS_SRC_DIR, page), 'utf-8')),
    );

    pages.forEach((page, index) => {
      const anchors: string[] = [];

      (contents[index] ?? '').split('\n').forEach((line) => {
        if (!/^(#{1,6})[ \t]+\S/.test(line)) return;
        const anchor = getTrailingAnchor(line);
        if (anchor) anchors.push(anchor);
      });

      const duplicates = anchors.filter(
        (a, position) => anchors.indexOf(a) !== position,
      );
      // With the page, so a failure says which one.
      expect({ duplicates, page }).toEqual({ duplicates: [], page });
    });
  }, 60_000);
});
