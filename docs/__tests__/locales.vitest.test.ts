import { readdir, readFile } from 'fs-extra';
import { resolve } from 'upath';
import { describe, expect, it } from 'vitest';

import { locales as localeOptions } from './../../src/constants/locales';
import { camelToKebabCase } from './../../src/utils/general';
import docsMessages from './../locales';

describe('Locales', () => {
  it('should be defined and equal', async () => {
    const locales = localeOptions.map((l) => l.value).sort();
    const localesKebab = locales.map(camelToKebabCase).sort();

    const docsLocaleMessages = Object.keys(docsMessages).sort();

    const docsLocaleFiles = (await readdir(resolve(__dirname, '../locales')))
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''))
      .sort();

    const docsSrcFolders = (await readdir(resolve(__dirname, '../src')))
      .filter((f) => f !== 'assets' && f !== 'public')
      .sort();

    expect(locales).toEqual(docsLocaleMessages);
    expect(localesKebab).toEqual(docsLocaleFiles);
    expect(localesKebab).toEqual(docsSrcFolders);
  });

  it('should have correct links', async () => {
    const localeUrls = await Promise.all(
      localeOptions.map(async (l) => {
        const locale = camelToKebabCase(l.value);
        const page = await readFile(
          resolve(__dirname, `../src/${locale}/index.md`),
          'utf-8',
        );

        const links = [...page.matchAll(/link: (.+)/g)].map((m) => m[1]);

        return links.map((link) => {
          const linkParts = link?.split('/') ?? [];
          return {
            link,
            linkPage: linkParts[2] ? linkParts[2] : linkParts[1],
            locale,
          };
        });
      }),
    );

    localeUrls.flat().forEach((localeUrl) => {
      const { link, linkPage, locale } = localeUrl;
      if (link?.startsWith('https://')) return;
      expect(link).toBe(`${locale === 'en' ? '' : `/${locale}`}/${linkPage}`);
    });
  });

  it('should not have unused keys', async () => {
    const localeMapper = await readFile(
      resolve(__dirname, '../utils/locales.ts'),
      'utf-8',
    );

    const config = await readFile(
      resolve(__dirname, '../.vitepress/config.mts'),
      'utf-8',
    );

    const docsKeys = Object.keys(docsMessages.en);
    docsKeys.forEach((key) => {
      expect(localeMapper + config).toContain(key);
    });
  });
});
