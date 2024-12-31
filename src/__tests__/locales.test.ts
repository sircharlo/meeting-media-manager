import { readdir } from 'fs-extra';
import { enabled, locales as localeOptions } from 'src/constants/locales';
import appMessages from 'src/i18n';
import { camelToKebabCase } from 'src/utils/general';
import { resolve } from 'upath';
import { describe, expect, it } from 'vitest';

describe('Locales', () => {
  it('should be defined and equal', async () => {
    const locales = localeOptions.map((l) => l.value).sort();
    const localesKebab = locales.map(camelToKebabCase).sort();

    const srcMessages = Object.keys(appMessages);

    const srcLocaleFiles = (await readdir(resolve(__dirname, '../i18n')))
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''))
      .sort();

    expect(localesKebab).toEqual(srcLocaleFiles);
    expect(enabled).toEqual(srcMessages);
  });
});
