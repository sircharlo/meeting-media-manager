import { defineConfig } from 'vitepress';
import { localeOptions } from './../locales';
import { mapLocales, mapSearch } from './../utils/locales';
import { CANONICAL_URL, GH_REPO, GH_REPO_URL } from './../utils/constants';
import { camelToKebabCase } from './../utils/general';

const base = `/${GH_REPO}/`;

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base,
  srcDir: './src',
  cleanUrls: true,
  lastUpdated: true,
  rewrites: { 'en/:rest*': ':rest*' },
  markdown: { image: { lazyLoading: true } },
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
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { content: `${CANONICAL_URL}icon.png`, property: 'og:image' }],
    ['meta', { content: 'image/png', property: 'og:image:type' }],
    ['meta', { content: '512', property: 'og:image:width' }],
    ['meta', { content: '513', property: 'og:image:height' }],
    ['meta', { content: 'The logo of M³', property: 'og:image:alt' }],
  ],
  transformPageData(pageData) {
    const canonicalUrl = `${CANONICAL_URL}${pageData.relativePath}`
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '');

    const pageLang = pageData.relativePath.split('/')[0];
    const isEnglish = pageData.relativePath.split('/').length === 1;

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: canonicalUrl }],
      [
        'meta',
        {
          name: 'og:title',
          content:
            pageData.frontmatter.layout === 'home'
              ? `M³ docs`
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
      ...localeOptions.map((l): [string, Record<string, string>] => {
        const lang = camelToKebabCase(l.value);
        return [
          'link',
          {
            rel: 'alternate',
            hreflang: lang,
            href: (!isEnglish
              ? canonicalUrl.replace(`/${pageLang}/`, `/${lang}/`)
              : `${CANONICAL_URL}${lang}/${pageData.relativePath}`
            ).replace('/en/', '/'),
          },
        ];
      }),
      [
        'script',
        {},
        `
        const initialVisit = localStorage.getItem('initialVisit') !== 'false'

        if (initialVisit) {
          const langs = [${localeOptions.map((l) => `"${camelToKebabCase(l.value)}"`)}]

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
            localStorage.setItem('initialVisit', false);
            const parts = window.location.pathname.split('/');
            const isEnglish = parts.length === 3;
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
    outline: { level: 'deep' },
    search: mapSearch(),
    socialLinks: [{ icon: 'github', link: GH_REPO_URL, ariaLabel: 'GitHub' }],
  },
});
