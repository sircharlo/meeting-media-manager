/* eslint-disable nuxt/no-cjs-in-config */
// const path = require('path')
// const fs = require('fs')
const webpack = require('webpack')
const pkg = require('./../../package.json')
const { LOCAL_LANGS } = require('./constants/lang.ts')

/**
 * By default, Nuxt.js is configured to cover most use cases.
 * This default configuration can be overwritten in this file
 * @link {https://nuxtjs.org/guide/configuration/}
 */

// eslint-disable-next-line nuxt/no-cjs-in-config
module.exports = {
  ssr: false,
  target: 'static',
  head: {
    titleTemplate: '%s - Meeting Media Manager',
    title: 'M³',
    meta: [{ charset: 'utf-8' }],
  },
  loading: false,
  components: true,
  vue: {
    config: {
      runtimeCompiler: true,
    },
  },
  css: ['@fortawesome/fontawesome-svg-core/styles.css', '~/assets/main.scss'],
  plugins: [
    '~/plugins/prefs',
    '~/plugins/logger',
    '~/plugins/externals',
    '~/plugins/axios',
    '~plugins/db',
    '~/plugins/flash',
    '~plugins/dayjs',
    '~plugins/fs',
    '~plugins/jw',
    '~plugins/media',
    '~plugins/converters',
    '~plugins/present',
    '~plugins/cong',
    '~plugins/obs',
  ],

  buildModules: ['@nuxt/typescript-build'],
  modules: [
    '@nuxtjs/vuetify',
    '@nuxtjs/axios',
    '@nuxtjs/i18n',
    '@nuxtjs/dayjs',
  ],

  dayjs: {
    locales: LOCAL_LANGS,
    defaultLocale: 'en',
    plugins: [
      'isoWeek',
      'isBetween',
      'isSameOrBefore',
      'customParseFormat',
      'duration',
      'localeData',
      'updateLocale',
    ],
  },

  vuetify: {
    defaultAssets: {
      icons: false,
    },
    optionsPath: '~/vuetify.options.js',
    customVariables: ['~/assets/variables.scss'],
  },

  i18n: {
    langDir: '~/locales/',
    defaultLocale: 'en',
    lazy: true,
    vueI18n: {
      fallbackLocale: 'en',
    },
    locales: [
      { code: 'de', iso: 'de-DE', file: 'de.json', name: 'Deutsch (German)' },
      { code: 'en', iso: 'en-US', file: 'en.json', name: 'English (English)' },
      { code: 'es', iso: 'es-ES', file: 'es.json', name: 'español (Spanish)' },
      { code: 'et', iso: 'et-EE', file: 'et.json', name: 'eesti (Estonian)' },
      { code: 'fi', iso: 'fi-FI', file: 'fi.json', name: 'suomi (Finnish)' },
      { code: 'fr', iso: 'fr-FR', file: 'fr.json', name: 'Français (French)' },
      { code: 'it', iso: 'it-IT', file: 'it.json', name: 'Italiano (Italian)' },
      { code: 'nl', iso: 'nl-NL', file: 'nl.json', name: 'Nederlands (Dutch)' },
      {
        code: 'pt-pt',
        iso: 'pt-PT',
        file: 'pt-pt.json',
        name: 'Português - Portugal (Portuguese - Portugal)',
      },
      {
        code: 'pt',
        iso: 'pt-BR',
        file: 'pt.json',
        name: 'Português - Brasil (Portuguese - Brazil)',
      },
      { code: 'ru', iso: 'ru-RU', file: 'ru.json', name: 'русский (Russian)' },
      { code: 'sv', iso: 'sv-SE', file: 'sv.json', name: 'Svenska (Swedish)' },
    ],
  },
  /*
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl', 'server.key'), {
        encoding: 'utf8',
      }),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl', 'server.crt'), {
        encoding: 'utf8',
      }),
    },
  },
*/
  generate: {
    fallback: true, // 404 page
  },
  build: {
    babel: {
      // envName: server, client, modern
      presets({ envName }) {
        const envTargets = {
          client: { browsers: ['last 2 versions'] },
          server: { node: 'current' },
        }
        return [
          [
            '@nuxt/babel-preset-app',
            {
              corejs: { version: 3 },
              shippedProposals: true,
              targets: envTargets[envName],
            },
          ],
        ]
      },
    },
    extend(config, _ctx) {
      config.module = {
        ...config.module,
        noParse: [
          /node_modules\/?\\?sql\.js\/?\\?dist\/?\\?sql-wasm/,
          /node_modules\/?\\?pdfjs-dist\/?\\?build\/?\\?pdf/,
        ],
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.FLUENTFFMPEG_COV': JSON.stringify(false),
      }),
    ],
    externals: [
      function ({ request }, callback) {
        const IGNORES = ['fluent-ffmpeg']
        if (IGNORES.includes(request)) {
          return callback(null, `require('${request}')`)
        }
        return callback()
      },
    ],
  },
  publicRuntimeConfig: {
    version: 'v' + pkg.version,
    isDev: process.env.NODE_ENV !== 'production',
    repo: pkg.repository.url.replace('.git', ''),
  },
}
