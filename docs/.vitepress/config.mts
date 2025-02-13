import { exec } from 'child_process';
import path from 'upath';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { defineConfig } from 'vitepress';

const execPromise = promisify(exec);

import type { LanguageValue } from '../../src/constants/locales';

import messages, { enabled, localeOptions } from './../locales';
import { CANONICAL_URL, GH_REPO, GH_REPO_URL } from './../utils/constants';
import { camelToKebabCase, kebabToCamelCase } from './../utils/general';
import { mapLocales, mapSearch } from './../utils/locales';

const base = `/${GH_REPO}/`;
const srcExclude = localeOptions
  .filter((l) => l.value !== 'en' && !enabled.includes(l.value))
  .map((l) => `**/${camelToKebabCase(l.value)}/*.md`);

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base,
  cleanUrls: true,
  head: [
    // Favicon variants
    [
      'link',
      {
        href: `${base}icons/icon-128x128.png`,
        rel: 'icon',
        sizes: '128x128',
        type: 'image/png',
      },
    ],
    [
      'link',
      {
        href: `${base}icons/icon-96x96.png`,
        rel: 'icon',
        sizes: '96x96',
        type: 'image/png',
      },
    ],
    [
      'link',
      {
        href: `${base}icons/icon-32x32.png`,
        rel: 'icon',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    [
      'link',
      {
        href: `${base}icons/icon-16x16.png`,
        rel: 'icon',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    ['link', { href: `${base}favicon.ico`, rel: 'icon', type: 'image/ico' }],
    [
      'link',
      {
        href: `${base}logo.svg`,
        rel: 'icon',
        type: 'image/svg+xml',
      },
    ],

    // General meta tags
    ['meta', { content: 'light dark', name: 'color-scheme' }],
    ['meta', { content: '#3075F2', name: 'theme-color' }],
    ['meta', { content: 'yes', name: 'mobile-web-app-capable' }],
    ['meta', { content: 'telephone=no', name: 'format-detection' }],
    [
      'meta',
      { content: `${base}browserconfig.xml`, name: 'msapplication-config' },
    ],

    // Apple meta tags
    ['meta', { content: 'yes', name: 'apple-mobile-web-app-capable' }],
    [
      'meta',
      { content: 'black', name: 'apple-mobile-web-app-status-bar-style' },
    ],

    // Twitter meta tags
    ['meta', { content: 'summary_large_image', name: 'twitter:card' }],
    [
      'meta',
      {
        content: `${CANONICAL_URL}m3-project-cover.png`,
        name: 'twitter:image',
      },
    ],
    ['meta', { content: 'M³ project cover', name: 'twitter:image:alt' }],

    // Project cover og image
    [
      'meta',
      { content: `${CANONICAL_URL}m3-project-cover.png`, property: 'og:image' },
    ],
    ['meta', { content: 'image/png', property: 'og:image:type' }],
    ['meta', { content: '1442', property: 'og:image:width' }],
    ['meta', { content: '865', property: 'og:image:height' }],
    ['meta', { content: 'M³ project cover', property: 'og:image:alt' }],

    // Repo preview og image
    // [
    //   'meta',
    //   { content: `${CANONICAL_URL}m3-repo-preview.png`, property: 'og:image' },
    // ],
    // ['meta', { content: 'image/png', property: 'og:image:type' }],
    // ['meta', { content: '1280', property: 'og:image:width' }],
    // ['meta', { content: '640', property: 'og:image:height' }],
    // ['meta', { content: 'M³ repo preview banner', property: 'og:image:alt' }],

    // Logo og image
    [
      'meta',
      {
        content: `${CANONICAL_URL}icons/icon-512x512.png`,
        property: 'og:image',
      },
    ],
    ['meta', { content: 'image/png', property: 'og:image:type' }],
    ['meta', { content: '512', property: 'og:image:width' }],
    ['meta', { content: '512', property: 'og:image:height' }],
    ['meta', { content: 'The logo of M³', property: 'og:image:alt' }],
  ],
  lastUpdated: true,
  locales: mapLocales(),
  markdown: {
    config: (md) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const fence = md.renderer.rules.fence!;
      md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const { localeIndex = 'root' } = env;
        const locale: LanguageValue =
          localeIndex === 'root'
            ? 'en'
            : (kebabToCamelCase(localeIndex) as LanguageValue);
        const codeCopyButtonTitle = (() =>
          messages[locale]?.codeCopyButtonTitle ||
          messages.en.codeCopyButtonTitle)();
        return fence(tokens, idx, options, env, self).replace(
          '<button title="Copy Code" class="copy"></button>',
          `<button title="${codeCopyButtonTitle}" class="copy"></button>`,
        );
      };
    },
    image: { lazyLoading: true },
  },
  rewrites: { 'en/:rest*': ':rest*' },
  srcDir: './src',
  srcExclude,
  themeConfig: {
    externalLinkIcon: true,
    logo: '/logo.svg',
    search: mapSearch(),
    socialLinks: [{ ariaLabel: 'GitHub', icon: 'github', link: GH_REPO_URL }],
  },
  async transformPageData(pageData) {
    const canonicalUrl = `${CANONICAL_URL}${pageData.relativePath}`
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '');

    const pageLang = pageData.relativePath.split('/')[0];
    const messageLocale = kebabToCamelCase(pageLang) as LanguageValue;
    const isEnglish = pageData.relativePath.split('/').length === 1;

    let createdDate = '';
    try {
      const { stdout } = await execPromise(
        `git log --follow --format=%ad --date iso-strict ${fileURLToPath(
          new URL(path.join('../src/', pageData.filePath), import.meta.url),
        )} | tail -1`,
      );
      createdDate = stdout.trim();
    } catch {
      createdDate = '';
    }

    const lastUpdated = (
      pageData.lastUpdated ? new Date(pageData.lastUpdated) : new Date()
    ).toISOString();

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      // Site name
      [
        'meta',
        {
          content: messages[isEnglish ? 'en' : messageLocale].title,
          name: 'application-name',
        },
      ],
      [
        'meta',
        {
          content: messages[isEnglish ? 'en' : messageLocale].title,
          name: 'apple-mobile-web-app-title',
        },
      ],
      [
        'meta',
        {
          content: messages[isEnglish ? 'en' : messageLocale].title,
          property: 'og:site_name',
        },
      ],

      // Page url
      ['link', { href: canonicalUrl, rel: 'canonical' }],
      ['meta', { content: canonicalUrl, property: 'og:url' }],

      // Page type
      [
        'meta',
        {
          content:
            pageData.frontmatter.layout === 'home' ? 'website' : 'article',
          property: 'og:type',
        },
      ],

      // Page last updated
      ['meta', { content: lastUpdated, property: 'og:updated_time' }],
      ['meta', { content: lastUpdated, property: 'article:modified_time' }],

      // Page title
      [
        'meta',
        {
          content:
            pageData.frontmatter.layout === 'home'
              ? isEnglish
                ? messages['en'].title
                : messages[messageLocale].title
              : `${pageData.title} | M³ docs`,
          name: 'twitter:title',
        },
      ],
      [
        'meta',
        {
          content:
            pageData.frontmatter.layout === 'home'
              ? isEnglish
                ? messages['en'].title
                : messages[messageLocale].title
              : `${pageData.title} | M³ docs`,
          property: 'og:title',
        },
      ],

      // Page default locale
      [
        'link',
        {
          href: isEnglish
            ? canonicalUrl
            : canonicalUrl.replace(`/${pageLang}/`, '/'),
          hreflang: 'x-default',
          rel: 'alternate',
        },
      ],

      // Available page locales
      ...localeOptions
        .filter((l) => l.value === 'en' || enabled.includes(l.value))
        .map((l): [string, Record<string, string>] => {
          const lang = camelToKebabCase(l.value);
          return [
            'link',
            {
              href: (!isEnglish
                ? canonicalUrl.replace(`/${pageLang}/`, `/${lang}/`)
                : `${CANONICAL_URL}${lang}/${pageData.relativePath.replace('index.md', '').replace('.md', '')}`
              ).replace('/en/', '/'),
              hreflang: lang,
              rel: 'alternate',
            },
          ];
        }),
      [
        'script',
        {},
        `
        const firstVisit = sessionStorage.getItem('firstVisit') !== 'false';
        const parts = window.location.pathname.split('/');
        const isEnglish = parts.length === 3;

        if (firstVisit && isEnglish) {
          const langs = [${localeOptions.filter((l) => enabled.includes(l.value)).map((l) => `"${camelToKebabCase(l.value)}"`)}]

          function mapLang(lang) {
            switch (lang) {
              case 'zh':
              case 'zh-CN':
              case 'zh-TW':
                return 'cmn-hans';
              default:
                return lang.toLowerCase();
            }
          }

          let match;
          navigator.languages.forEach((lang) => {
            const mapped = mapLang(lang);
            if (!match) match = langs.find((l) => l === mapped);
            if (!match) match = langs.find((l) => l === mapped.split('-')[0]);
          })

          if (match) {
            sessionStorage.setItem('firstVisit', false);
            const page = isEnglish ? parts[2] : parts[3]
            window.location.pathname = "${base}" + (match !== 'en' ? match + '/' : '') + page
          }
        }
        `,
      ],
    );

    if (createdDate) {
      pageData.frontmatter.head.push(
        // Page published time
        ['meta', { content: createdDate, property: 'article:published_time' }],
      );
    }
  },
});
