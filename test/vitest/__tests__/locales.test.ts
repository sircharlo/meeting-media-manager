import docsMessages from 'app/docs/locales';
import { readdir, readFile } from 'fs-extra';
import { enabled, locales as localeOptions } from 'src/constants/locales';
import appMessages from 'src/i18n';
import { camelToKebabCase } from 'src/utils/general';
import { resolve } from 'upath';
import { describe, expect, it } from 'vitest';

describe('Locales', () => {
  it('should be defined', async () => {
    const locales = localeOptions.map((l) => l.value).sort();
    const localesKebab = locales.map(camelToKebabCase).sort();

    const srcMessages = Object.keys(appMessages);
    const docsLocaleMessages = Object.keys(docsMessages).sort();

    const docsLocaleFiles = (
      await readdir(resolve(__dirname, '../../../docs/locales'))
    )
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''))
      .sort();

    const docsSrcFolders = (
      await readdir(resolve(__dirname, '../../../docs/src'))
    )
      .filter((f) => f !== 'assets' && f !== 'public')
      .sort();

    const srcLocaleFiles = (
      await readdir(resolve(__dirname, '../../../src/i18n'))
    )
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''))
      .sort();

    expect(locales).toEqual(docsLocaleMessages);
    expect(localesKebab).toEqual(docsLocaleFiles);
    expect(localesKebab).toEqual(docsSrcFolders);
    expect(localesKebab).toEqual(srcLocaleFiles);
    expect(enabled).toEqual(srcMessages);
  });

  it('should not have unused keys for docs', async () => {
    const localeMapper = await readFile(
      resolve(__dirname, '../../../docs/utils/locales.ts'),
      'utf-8',
    );

    const config = await readFile(
      resolve(__dirname, '../../../docs/.vitepress/config.mts'),
      'utf-8',
    );

    const docsKeys = Object.keys(docsMessages.en);
    docsKeys.forEach((key) => {
      expect(localeMapper + config).toContain(key);
    });
  });
});
