import type { LanguageValue } from 'src/constants/locales';

import { camelToKebabCase } from 'src/utils/general';

// Chinese written in traditional characters: its script subtag, or a region
// where it's the usual script.
const TRADITIONAL_CHINESE_SUBTAGS = new Set(['hant', 'hk', 'mo', 'tw']);

/**
 * The language code M³ uses for an operating system language whose code
 * differs from M³'s: the OS calls Chinese "zh", M³ "cmn-hans" or "cmn-hant",
 * and Windows and Chromium call Tagalog "fil" (Filipino).
 * @param tag A lowercase language tag, such as "zh-cn".
 * @returns M³'s kebab-case code for it, if it has another one.
 */
const getAlias = (tag: string) => {
  const [base, ...subtags] = tag.split('-');
  if (base === 'zh') {
    return subtags.some((subtag) => TRADITIONAL_CHINESE_SUBTAGS.has(subtag))
      ? 'cmn-hant'
      : 'cmn-hans';
  }
  if (base === 'fil') return 'tl';
  return undefined;
};

/**
 * The first of the operating system's preferred languages that M³'s
 * interface is available in.
 * @param systemLocales The OS's languages, most preferred first, such as
 * `['zh-CN', 'en-US']`.
 * @param available M³'s interface languages.
 * @returns The matching interface language, if any.
 */
export const matchSystemLocale = (
  systemLocales: readonly string[],
  available: readonly LanguageValue[],
): LanguageValue | undefined => {
  const byCode = new Map(
    available.map((value) => [camelToKebabCase(value), value]),
  );

  for (const locale of systemLocales) {
    const tag = locale.toLowerCase().replaceAll('_', '-');
    const base = tag.split('-')[0] ?? '';
    const match =
      byCode.get(tag) ?? byCode.get(getAlias(tag) ?? '') ?? byCode.get(base);
    if (match) return match;
  }

  return undefined;
};
