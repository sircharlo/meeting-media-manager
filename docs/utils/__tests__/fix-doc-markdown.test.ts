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

describe('fix-doc-markdown', () => {
  it('should leave no duplicate explicit heading anchors in any locale file', async () => {
    const localeDirs = (await readdir(DOCS_SRC_DIR, { withFileTypes: true }))
      .filter(
        (d) => d.isDirectory() && d.name !== 'assets' && d.name !== 'public',
      )
      .map((d) => d.name);

    for (const locale of localeDirs) {
      const files = (await readdir(resolve(DOCS_SRC_DIR, locale))).filter((f) =>
        f.endsWith('.md'),
      );

      for (const file of files) {
        const content = await readFile(
          resolve(DOCS_SRC_DIR, locale, file),
          'utf-8',
        );
        const anchors: string[] = [];

        content.split('\n').forEach((line) => {
          if (!/^(#{1,6})[ \t]+\S/.test(line)) return;
          const anchor = getTrailingAnchor(line);
          if (anchor) anchors.push(anchor);
        });

        const duplicates = anchors.filter(
          (a, index) => anchors.indexOf(a) !== index,
        );
        expect(duplicates, `${locale}/${file}`).toEqual([]);
      }
    }
  });
});
