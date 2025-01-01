import { readdir, readFile } from 'fs-extra';
import { enabled, locales as localeOptions } from 'src/constants/locales';
import appMessages from 'src/i18n';
import { camelToKebabCase } from 'src/utils/general';
import { normalize, resolve } from 'upath';
import { describe, expect, it } from 'vitest';

describe('Locales', () => {
  it('should be defined and equal', async () => {
    const locales = localeOptions.map((l) => l.value).sort();
    const localesKebab = locales.map(camelToKebabCase).sort();

    const messages = Object.keys(appMessages).sort();

    expect(enabled).toEqual(messages);

    const localeFiles = (await readdir(resolve(__dirname, '../i18n')))
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''))
      .sort();

    expect(localesKebab).toEqual(localeFiles);
  });

  it('should not have unused keys', async () => {
    const srcFolders = new Set([
      'components',
      'composables',
      'constants',
      'helpers',
      'layouts',
      'pages',
      'stores',
    ]);
    const files = await Promise.all(
      (await readdir(resolve(__dirname, '..'), { recursive: true }))
        .filter(
          (f) =>
            typeof f === 'string' &&
            srcFolders.has(normalize(f).split('/')[0] ?? '') &&
            !f.includes('__tests__') &&
            (f.endsWith('.ts') || f.endsWith('.vue')),
        )
        .map((f) => readFile(resolve(__dirname, '..', f), 'utf-8')),
    );

    const keys = new Set(Object.keys(appMessages.en));
    keys.forEach((key) => {
      if (key.endsWith('-explain') && keys.has(key.replace('-explain', ''))) {
        return;
      }

      const content = files.join(' ');
      const match =
        content.includes(`'${key}'`) || content.includes(`${key}: {`);
      expect(match, `${key} not found`).toBe(true);
    });
  });
});
