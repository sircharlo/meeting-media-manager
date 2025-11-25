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

    const i18nFiles = await Promise.all(
      (await readdir(resolve(__dirname, '../i18n')))
        .filter((f) => f.endsWith('.json'))
        .map((f) => readFile(resolve(__dirname, '../i18n', f), 'utf-8')),
    );

    const allContents = [...files, ...i18nFiles];
    const content = allContents.join(' ');

    const keys = Object.keys(appMessages.en);
    const unusedKeys: string[] = [];

    for (const key of keys) {
      // Skip foo-explain when foo exists
      if (
        key.endsWith('-explain') &&
        keys.includes(key.replace('-explain', ''))
      ) {
        continue;
      }

      const isUsed =
        content.includes(`'${key}'`) ||
        content.includes(`${key}: {`) ||
        content.includes(`@:${key}`);

      if (!isUsed) {
        unusedKeys.push(key);
      }
    }

    expect(
      unusedKeys,
      `The following translation keys are unused: ${unusedKeys.join(', ')}`,
    ).toHaveLength(0);
  });
});
