/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable nuxt/no-cjs-in-config */
const resolve = require('path').resolve
const platform = require('os').platform
const { DefinePlugin } = require('webpack')
const SentryPlugin = require('@sentry/webpack-plugin')
const pkg = require('./../../package.json')
const { DAYJS_LOCALES, LOCALES } = require('./constants/lang.js')
require('dotenv').config()

const isDev = process.env.NODE_ENV !== 'production'

// Only initialize Sentry if all required env vars are set
const initSentry =
  !!process.env.SENTRY_DSN &&
  !!process.env.SENTRY_ORG &&
  !!process.env.SENTRY_PROJECT &&
  !!process.env.SENTRY_AUTH_TOKEN

const webpackPlugins = [
  new DefinePlugin({
    'process.env.FLUENTFFMPEG_COV': JSON.stringify(false),
  }),
]

// Only upload source maps in production
if (
  initSentry &&
  !process.env.SENTRY_DISABLE &&
  process.env.SENTRY_SOURCE_MAPS
) {
  webpackPlugins.push(
    new SentryPlugin({
      release: `meeting-media-manager@${
        isDev || !process.env.CI ? 'dev' : pkg.version
      }`,
      dist: platform().replace('32', ''), // Remove 32 from win32
      validate: true,
      urlPrefix: '~/_nuxt/',
      include: [
        { paths: [resolve('src', 'renderer', '.nuxt', 'dist', 'client')] },
      ],
    })
  )
}

/**
 * By default, Nuxt.js is configured to cover most use cases.
 * This default configuration can be overwritten in this file
 * @link {https://nuxtjs.org/guide/configuration/}
 */

module.exports = {
  ssr: false, // Server Side Rendering is not supported in combination with Electron.js
  target: 'static', // Create static html/js/css files
  telemetry: false,
  head: {
    title: 'M³',
    titleTemplate: '%s - Meeting Media Manager',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: 'Meeting Media Manager',
      },
    ],
  },
  loading: false,
  components: true,
  vue: {
    config: {
      runtimeCompiler: true,
    },
  },
  router: {
    middleware: ['reminders', 'allowQuit'],
  },
  css: [
    '@fortawesome/fontawesome-svg-core/styles.css',
    '~/assets/scss/main.scss',
  ],
  // !Order is important here
  plugins: [
    // No dependencies
    '~/plugins/sentry',
    '~/plugins/externals',
    '~/plugins/axios',
    '~/plugins/dayjs',
    '~/plugins/prefs',
    // Depends on prefs
    '~/plugins/helpers',
    '~/plugins/logger',
    // Depends on logger
    '~/plugins/db',
    '~/plugins/notify',
    // Depends on db/fs/notify/
    '~/plugins/fs',
    '~/plugins/cong',
    '~/plugins/converters',
    '~/plugins/jw',
    // Depends on jw
    '~/plugins/media',
    '~/plugins/present',
    // Depends on present
    '~/plugins/obs',
  ],

  buildModules: ['@nuxt/typescript-build'],
  modules: [
    '@nuxtjs/axios',
    '@nuxtjs/dayjs',
    '@nuxtjs/i18n',
    '@nuxtjs/vuetify',
  ],

  dayjs: {
    locales: DAYJS_LOCALES,
    defaultLocale: 'en',
    plugins: [
      'customParseFormat',
      'duration',
      'isBetween',
      'isSameOrBefore',
      'isoWeek',
      'localeData',
      'updateLocale',
    ],
  },

  vuetify: {
    defaultAssets: {
      icons: false,
    },
    optionsPath: '~/vuetify.options.js',
    customVariables: ['~/assets/scss/variables.scss'],
  },

  i18n: {
    langDir: '~/locales/',
    defaultLocale: 'en',
    vueI18n: {
      fallbackLocale: 'en',
    },
    detectBrowserLanguage: false,
    locales: LOCALES,
  },
  generate: {
    fallback: true, // 404 page
  },
  build: {
    babel: {
      // envName: server, client, modern
      presets({ envName }) {
        const envTargets = {
          client: { browsers: ['Chrome >= 110'] }, // Electron.js uses Chrome 110 (currently)
          server: { node: 'current' },
        }
        return [
          [
            '@nuxt/babel-preset-app',
            {
              corejs: { version: '3.28' },
              useBuiltIns: 'usage',
              shippedProposals: true,
              targets: envTargets[envName],
              include: [
                '@babel/plugin-proposal-logical-assignment-operators',
                '@babel/plugin-proposal-nullish-coalescing-operator',
                '@babel/plugin-proposal-optional-chaining',
              ],
            },
          ],
        ]
      },
    },
    extend(config, { isClient }) {
      config.module = {
        ...config.module,
        noParse: [
          /node_modules\/?\\?pdfjs-dist\/?\\?build\/?\\?pdf/, // Don't parse pdfjs-dist files
          /node_modules\/?\\?sql\.js\/?\\?dist\/?\\?sql-wasm/, // Don't parse sql-wasm files
        ],
      }
      if (isClient) {
        config.devtool = 'source-map'
      }
    },
    plugins: webpackPlugins,
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
  // Make env vars available in the app through $config
  publicRuntimeConfig: {
    author: pkg.author.name,
    ci: !!process.env.CI,
    isDev,
    name: pkg.name,
    repo: pkg.repository.url.replace('.git', ''),
    sentryDSN: process.env.SENTRY_DSN,
    sentryEnabled: initSentry && !process.env.SENTRY_DISABLE,
    sentryInit: initSentry,
    sqlJsVersion: pkg.devDependencies['sql.js'].replace('^', ''),
    version: 'v' + pkg.version,
  },
}
