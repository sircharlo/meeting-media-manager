import type {
  DefaultTheme,
  LocaleConfig,
  LocaleSpecificConfig,
} from 'vitepress';

import enBase from './../locales/en.json' with { type: 'json' };
import messages, { enabled, localeOptions } from './../locales/index.ts';
import { fetchLatestVersion } from './api.ts';
import { AUTHOR, GH_ISSUES, GH_REPO_URL } from './constants.ts';
import { camelToKebabCase } from './general.ts';

export type MessageSchema = typeof enBase;

interface ButtonTranslations {
  buttonAriaLabel?: string;
  buttonText?: string;
}

interface FooterTranslations {
  closeKeyAriaLabel?: string;
  closeText?: string;
  navigateDownKeyAriaLabel?: string;
  navigateText?: string;
  navigateUpKeyAriaLabel?: string;
  selectKeyAriaLabel?: string;
  selectText?: string;
}

//Re-created LocalSearchTranslations from ../../node_modules/vitepress/types/local-search.d.ts
interface LocalSearchTranslations {
  button?: ButtonTranslations;
  modal?: ModalTranslations;
}

interface ModalTranslations {
  backButtonTitle?: string;
  displayDetails?: string;
  footer?: FooterTranslations;
  noResultsText?: string;
  resetButtonTitle?: string;
}

const withDefaults = (
  msg: Partial<MessageSchema> | undefined,
): MessageSchema => ({ ...enBase, ...msg });

const latestVersion = await fetchLatestVersion();

const mapLocale = (
  lang: string,
  label: string,
  msg: MessageSchema,
): LocaleSpecificConfig<DefaultTheme.Config> & {
  label: string;
  link?: string;
} => ({
  description: msg.description,
  head: [
    // Site description
    ['meta', { content: msg.description, property: 'og:description' }],
    ['meta', { content: msg.description, name: 'twitter:description' }],

    // Current locale and alternate locales
    ['meta', { content: lang, property: 'og:locale' }],
    ...localeOptions
      .filter(
        (l) =>
          l.label !== label && (l.value === 'en' || enabled.includes(l.value)),
      )
      .map((l): [string, Record<string, string>] => [
        'meta',
        {
          content: camelToKebabCase(l.value),
          property: 'og:locale:alternate',
        },
      ]),

    // Translate the "Copied" message in code blocks
    [
      'style',
      {},
      `:lang(${lang}) {--vp-code-copy-copied-text-content: '${msg.copied}'}`,
    ],
  ],
  label,
  lang,
  themeConfig: mapThemeConfig(lang, msg, latestVersion),
  title: msg.title,
});

export const mapLocales = (): LocaleConfig<DefaultTheme.Config> => {
  const locales: LocaleConfig<DefaultTheme.Config> = {
    root: mapLocale('en', 'English', withDefaults(messages.en)),
  };

  localeOptions
    .filter((l) => enabled.includes(l.value))
    .forEach((locale) => {
      const lang = camelToKebabCase(locale.value);
      const msg = withDefaults(messages[locale.value]);
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
    .filter((l) => enabled.includes(l.value))
    .forEach((locale) => {
      const lang = camelToKebabCase(locale.value);
      const msg = withDefaults(messages[locale.value]);
      locales[lang] = { translations: mapSearchTranslations(msg) };
    });

  return {
    options: {
      detailedView: true,
      locales,
      translations: mapSearchTranslations(withDefaults(messages.en)),
    },
    provider: 'local',
  };
};

const link = (locale: string, url: string) => {
  if (locale === 'en') {
    return `/${url}`;
  }
  return `/${locale}/${url}`;
};

export const mapThemeConfig = (
  locale: string,
  msg: MessageSchema,
  version: string,
): DefaultTheme.Config => ({
  darkModeSwitchLabel: msg.darkModeSwitchLabel,
  darkModeSwitchTitle: msg.darkModeSwitchTitle,
  docFooter: { next: msg.docFooterNext, prev: msg.docFooterPrev },
  editLink: {
    pattern: 'https://crowdin.com/project/meeting-media-manager',
    text: msg.editLink,
  },
  footer: {
    copyright: `${msg.copyright} © 2022-${new Date().getFullYear()} ${AUTHOR}`,
    message: msg.footerMessage?.replace(
      '{linkToLicense}',
      `<a href="${GH_REPO_URL}/blob/master/LICENSE.md">AGPL-3.0 License</a>`,
    ),
  },
  langMenuLabel: msg.langMenuLabel,
  lastUpdated: {
    formatOptions: { dateStyle: 'long', forceLocale: true },
    text: msg.lastUpdated,
  },
  lightModeSwitchTitle: msg.lightModeSwitchTitle,
  nav: [
    { link: link(locale, 'about'), text: msg.about },
    // { link: link(locale, 'user-guide'), text: msg.userGuide },
    // { link: link(locale, 'settings-guide'), text: msg.settingsGuide },
    { link: link(locale, 'faq'), text: msg.faq },
    {
      items: [
        {
          link: `${GH_REPO_URL}/blob/master/CHANGELOG.md`,
          text: 'Changelog',
        },
        { link: GH_ISSUES, text: msg.reportIssue },
      ],
      text: version,
    },
  ],
  notFound: {
    linkLabel: msg.notFoundLink,
    linkText: msg.notFoundLink,
    quote: msg.notFoundQuote,
    title: msg.notFoundTitle,
  },
  outline: { label: msg.outline, level: 'deep' },
  returnToTopLabel: msg.returnToTopLabel,
  sidebar: [
    { link: link(locale, 'download'), text: msg.download },
    {
      link: link(locale, 'user-guide'),
      text: msg.userGuide,
    },
    { link: link(locale, 'settings-guide'), text: msg.settingsGuide },
    // { link: link(locale, 'faq'), text: msg.faq },
  ],
  sidebarMenuLabel: msg.sidebarMenuLabel,
  siteTitle: msg.title,
  skipToContentLabel: msg.skipToContentLabel,
});
