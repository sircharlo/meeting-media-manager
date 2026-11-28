import type { LanguageValue } from 'src/constants/locales';

import { describe, expect, it } from 'vitest';

import { matchSystemLocale } from '../system-locale';

const AVAILABLE: LanguageValue[] = ['cmnHans', 'en', 'fr', 'pt'];

describe('matchSystemLocale', () => {
  it('picks Chinese (Simplified) for a Chinese operating system', () => {
    expect(matchSystemLocale(['zh-CN'], AVAILABLE)).toBe('cmnHans');
    expect(matchSystemLocale(['zh-Hans-CN'], AVAILABLE)).toBe('cmnHans');
    expect(matchSystemLocale(['zh-SG'], AVAILABLE)).toBe('cmnHans');
    expect(matchSystemLocale(['zh'], AVAILABLE)).toBe('cmnHans');
  });

  it("doesn't give Chinese (Simplified) to traditional-character Chinese", () => {
    expect(matchSystemLocale(['zh-TW', 'en-US'], AVAILABLE)).toBe('en');
    expect(matchSystemLocale(['zh-Hant-HK'], AVAILABLE)).toBeUndefined();
    expect(matchSystemLocale(['zh-TW'], [...AVAILABLE, 'cmnHant'])).toBe(
      'cmnHant',
    );
  });

  it('picks Tagalog for Filipino', () => {
    expect(matchSystemLocale(['fil-PH'], ['en', 'tl'] as LanguageValue[])).toBe(
      'tl',
    );
  });

  it('returns the language value, not its code', () => {
    expect(
      matchSystemLocale(['pt-PT'], ['pt', 'ptPt'] as LanguageValue[]),
    ).toBe('ptPt');
  });

  it('falls back to the base language', () => {
    expect(matchSystemLocale(['pt-BR'], AVAILABLE)).toBe('pt');
    expect(matchSystemLocale(['fr_CA'], AVAILABLE)).toBe('fr');
  });

  it('follows the order of preference', () => {
    expect(matchSystemLocale(['de-DE', 'fr-FR', 'en-US'], AVAILABLE)).toBe(
      'fr',
    );
  });

  it('returns nothing when no language matches', () => {
    expect(matchSystemLocale(['ja-JP'], AVAILABLE)).toBeUndefined();
    expect(matchSystemLocale([], AVAILABLE)).toBeUndefined();
  });
});
