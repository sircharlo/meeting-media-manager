import { defineConfig } from 'vitepress';
import messages, { localeOptions, enabled } from './../locales';
import { mapLocales, mapSearch } from './../utils/locales';
import { CANONICAL_URL, GH_REPO, GH_REPO_URL } from './../utils/constants';
import { camelToKebabCase, kebabToCamelCase } from './../utils/general';
import type { LanguageValue } from '../../src/constants/locales';

const base = `/${GH_REPO}/`;
const srcExclude = localeOptions
  .filter((l) => l.value !== 'en' && !enabled.includes(l.value))
  .map((l) => `**/${camelToKebabCase(l.value)}/*.md`);

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base,
  srcDir: './src',
  cleanUrls: true,
  lastUpdated: true,
  rewrites: { 'en/:rest*': ':rest*' },
  markdown: { image: { lazyLoading: true } },
  srcExclude,
  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '128x128',
        href: `${base}icons/favicon-128x128.png`,
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        href: `${base}icons/favicon-96x96.png`,
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: `${base}icons/favicon-32x32.png`,
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: `${base}icons/favicon-16x16.png`,
      },
    ],
    ['link', { rel: 'icon', type: 'image/ico', href: `${base}favicon.ico` }],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: `${base}logo-no-background.svg`,
      },
    ],
    ['meta', { name: 'color-scheme', content: 'light dark' }],
    ['meta', { name: 'theme-color', content: '#3075F2' }],
    ['meta', { name: 'mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    [
      'meta',
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
    ],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image:alt', content: 'M³ project cover' }],
    [
      'meta',
      { content: `${CANONICAL_URL}m3-project-cover.png`, property: 'og:image' },
    ],
    ['meta', { content: 'image/png', property: 'og:image:type' }],
    ['meta', { content: '1442', property: 'og:image:width' }],
    ['meta', { content: '865', property: 'og:image:height' }],
    ['meta', { content: 'M³ project cover', property: 'og:image:alt' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { content: `${CANONICAL_URL}icon.png`, property: 'og:image' }],
    ['meta', { content: 'image/png', property: 'og:image:type' }],
    ['meta', { content: '512', property: 'og:image:width' }],
    ['meta', { content: '513', property: 'og:image:height' }],
    ['meta', { content: 'The logo of M³', property: 'og:image:alt' }],
    [
      'meta',
      { content: `${CANONICAL_URL}m3-repo-preview.jpg`, property: 'og:image' },
    ],
    ['meta', { content: 'image/jpg', property: 'og:image:type' }],
    ['meta', { content: '1280', property: 'og:image:width' }],
    ['meta', { content: '640', property: 'og:image:height' }],
    ['meta', { content: 'M³ repo preview banner', property: 'og:image:alt' }],
  ],
  transformPageData(pageData) {
    const canonicalUrl = `${CANONICAL_URL}${pageData.relativePath}`
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '');

    const pageLang = pageData.relativePath.split('/')[0];
    const messageLocale = kebabToCamelCase(pageLang) as LanguageValue;
    const isEnglish = pageData.relativePath.split('/').length === 1;

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: canonicalUrl }],
      ['meta', { property: 'og:url', content: canonicalUrl }],
      [
        'meta',
        {
          property: 'og:title',
          content:
            pageData.frontmatter.layout === 'home'
              ? isEnglish
                ? messages['en'].title
                : messages[messageLocale].title
              : `${pageData.title} | M³ docs`,
        },
      ],
      [
        'link',
        {
          rel: 'alternate',
          hreflang: 'x-default',
          href: isEnglish
            ? canonicalUrl
            : canonicalUrl.replace(`/${pageLang}/`, '/'),
        },
      ],
      ...localeOptions
        .filter((l) => l.value === 'en' || enabled.includes(l.value))
        .map((l): [string, Record<string, string>] => {
          const lang = camelToKebabCase(l.value);
          return [
            'link',
            {
              rel: 'alternate',
              hreflang: lang,
              href: (!isEnglish
                ? canonicalUrl.replace(`/${pageLang}/`, `/${lang}/`)
                : `${CANONICAL_URL}${lang}/${pageData.relativePath.replace('index.md', '').replace('.md', '')}`
              ).replace('/en/', '/'),
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
  },
  locales: mapLocales(),
  themeConfig: {
    externalLinkIcon: true,
    logo: '/icon.png',
    search: mapSearch(),
    socialLinks: [{ icon: 'github', link: GH_REPO_URL, ariaLabel: 'GitHub' }],
  },
});
