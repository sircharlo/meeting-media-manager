import type {
  DefaultTheme,
  LocaleConfig,
  LocaleSpecificConfig,
} from 'vitepress';
import type { LocalSearchTranslations } from 'vitepress/types/local-search';

import pkg from './../../package.json';
import messages, { localeOptions } from './../locales';
import { GH_REPO_URL } from './constants';
import { camelToKebabCase } from './general';

export type MessageLanguages = keyof typeof messages;
export type MessageSchema = (typeof messages)['en'];

const mapLocale = (
  lang: string,
  label: string,
  msg: MessageSchema,
): {
  label: string;
  link?: string;
} & LocaleSpecificConfig<DefaultTheme.Config> => ({
  description: msg.description,
  head: [
    ['meta', { content: msg.title, property: 'og:site_name' }],
    ['meta', { content: msg.description, property: 'og:description' }],
    ['meta', { content: lang, property: 'og:locale' }],
    ...localeOptions
      .filter((l) => l.label !== label)
      .map((l): [string, Record<string, string>] => [
        'meta',
        {
          content: camelToKebabCase(l.value),
          property: 'og:locale:alternate',
        },
      ]),
  ],
  label,
  lang,
  themeConfig: mapThemeConfig(lang, msg),
  title: msg.title,
});

export const mapLocales = (): LocaleConfig<DefaultTheme.Config> => {
  const locales: LocaleConfig<DefaultTheme.Config> = {
    root: mapLocale('en', 'English', messages.en),
  };

  localeOptions
    .filter((l) => l.value !== 'en')
    .forEach((locale) => {
      const lang = camelToKebabCase(locale.value);
      const msg = messages[locale.value as MessageLanguages];
      locales[lang] = mapLocale(lang, locale.label, msg);
    });

  return locales;
};

const mapSearchTranslations = (
  msg: MessageSchema,
): LocalSearchTranslations => ({
  button: { buttonAriaLabel: msg.search, buttonText: msg.search },
  modal: {
    backButtonTitle: msg.backButtonTitle,
    displayDetails: msg.displayDetails,
    footer: {
      closeKeyAriaLabel: msg.esc,
      closeText: msg.closeText,
      navigateDownKeyAriaLabel: msg.arrowDown,
      navigateText: msg.navigateText,
      navigateUpKeyAriaLabel: msg.arrowUp,
      selectKeyAriaLabel: msg.enter,
      selectText: msg.selectText,
    },
    noResultsText: msg.noResultsText,
    resetButtonTitle: msg.resetButtonTitle,
  },
});

export const mapSearch = (): {
  options: DefaultTheme.LocalSearchOptions;
  provider: 'local';
} => {
  const locales: Record<
    string,
    Partial<Omit<DefaultTheme.LocalSearchOptions, 'locales'>>
  > = {};

  localeOptions
    .filter((l) => l.value !== 'en')
    .forEach((locale) => {
      const lang = camelToKebabCase(locale.value);
      const msg = messages[locale.value as MessageLanguages];
      locales[lang] = {
        translations: mapSearchTranslations(msg),
      };
    });

  return {
    options: {
      detailedView: true,
      locales,
      translations: mapSearchTranslations(messages.en),
    },
    provider: 'local',
  };
};

const link = (locale: string, url: string) =>
  `${locale === 'en' ? '' : `/${locale}`}/${url}`;

export const mapThemeConfig = (
  locale: string,
  msg: MessageSchema,
): DefaultTheme.Config => ({
  darkModeSwitchLabel: msg.darkModeSwitchLabel,
  darkModeSwitchTitle: msg.darkModeSwitchTitle,
  docFooter: { next: msg.docFooterNext, prev: msg.docFooterPrev },
  editLink: {
    pattern: 'https://crowdin.com/project/meeting-media-manager',
    text: msg.editLink,
  },
  lastUpdated: {
    formatOptions: { dateStyle: 'long', forceLocale: true },
    text: msg.lastUpdated,
  },
  lightModeSwitchTitle: msg.lightModeSwitchTitle,
  nav: [
    { link: link(locale, 'about'), text: msg.about },
    {
      items: [
        {
          link: GH_REPO_URL + '/blob/main/CHANGELOG.md',
          text: 'Changelog',
        },
        {
          link: GH_REPO_URL + '/issues/new',
          text: msg.reportIssue,
        },
      ],
      text: pkg.version,
    },
  ],
  outline: { label: msg.outline },
  returnToTopLabel: msg.returnToTopLabel,
  sidebar: [
    { link: link(locale, 'about'), text: msg.about },
    {
      link: link(locale, 'using-at-a-kingdom-hall'),
      text: msg.usingAtAKingdomHall,
    },
    { link: link(locale, 'faq'), text: msg.faq },
  ],
});
