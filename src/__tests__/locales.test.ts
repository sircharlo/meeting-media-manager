import { readdir, readFile } from 'fs-extra';
import { enabled, locales as localeOptions } from 'src/constants/locales';
import appMessages from 'src/i18n';
import { camelToKebabCase, kebabToCamelCase } from 'src/utils/general';
import { normalize, resolve } from 'upath';
import { describe, expect, it } from 'vitest';

describe('Locales', () => {
  it('should be defined and equal', async () => {
    const locales = localeOptions
      .map((l) => l.value)
      .sort((a, b) => a.localeCompare(b));
    const localesKebab = locales
      .map(camelToKebabCase)
      .sort((a, b) => a.localeCompare(b));

    const messages = Object.keys(appMessages).sort((a, b) =>
      a.localeCompare(b),
    );

    expect(enabled).toEqual(messages);

    const allLocaleFiles = (await readdir(resolve(__dirname, '../i18n')))
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''))
      .sort((a, b) => a.localeCompare(b));

    // Filenames on disk are kebab-case (e.g. cmn-hans.json), while message
    // keys are camelCase (e.g. cmnHans), so convert before comparing.
    const enabledLocaleFiles = allLocaleFiles.filter((f) =>
      messages.includes(kebabToCamelCase(f)),
    );

    const inactiveLocaleFiles = enabledLocaleFiles.filter(
      (f) => !localesKebab.includes(f),
    );

    expect(inactiveLocaleFiles).toHaveLength(0);

    const localeFiles = enabledLocaleFiles.filter((f) =>
      localesKebab.includes(f),
    );

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
      'utils',
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
        .map((f) => readFile(resolve(__dirname, '..', f as string), 'utf-8')),
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

  it('should not have messages that fail to compile', async () => {
    // Mirror the runtime's message compilation (see src/boot/i18n.ts): any
    // string the vue-i18n compiler rejects throws during render in production
    // builds, crashing the page (e.g. MMM-V2-3H6). Guard every locale so
    // malformed Crowdin output fails CI instead of shipping.
    const { baseCompile } = await import('@intlify/message-compiler');
    const compile = (message: string) =>
      baseCompile(message, {
        jit: true,
        location: false,
        onError: (error: unknown) => {
          throw error;
        },
      });

    const failures: {
      code?: number;
      key: string;
      locale: string;
      message: string;
      value: string;
    }[] = [];

    const walk = (obj: unknown, path: string, locale: string): void => {
      for (const [key, value] of Object.entries(
        obj as Record<string, unknown>,
      )) {
        const fullKey = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          try {
            compile(value);
          } catch (error) {
            failures.push({
              code: (error as { code?: number }).code,
              key: fullKey,
              locale,
              message: String((error as Error).message),
              value,
            });
          }
        } else if (value && typeof value === 'object') {
          walk(value, fullKey, locale);
        }
      }
    };

    for (const [locale, messages] of Object.entries(appMessages)) {
      walk(messages, '', locale);
    }

    expect(
      failures,
      `The following messages fail to compile (${failures.length}):\n${failures
        .map(
          (f) =>
            `  ${f.locale}.${f.key} (code ${f.code ?? '?'}): ${JSON.stringify(f.value)}`,
        )
        .join('\n')}`,
    ).toHaveLength(0);
  });
});
