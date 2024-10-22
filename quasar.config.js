/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js
const { sentryEsbuildPlugin } = require('@sentry/esbuild-plugin');
const { sentryVitePlugin } = require('@sentry/vite-plugin');
const path = require('path');
const { configure } = require('quasar/wrappers');
const { mergeConfig } = require('vite'); // use mergeConfig helper to avoid overwriting the default config

const { version } = require('./package.json');
const devMode = process.env.NODE_ENV === 'development';

module.exports = configure(function (/* ctx */) {
  return {
    // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // https://v2.quasar.dev/options/animations
    animations: ['fadeIn', 'fadeOut'],

    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: ['sentry', 'i18n', 'axios', 'globals'],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
    build: {
      extendViteConf(viteConf) {
        viteConf.optimizeDeps = mergeConfig(viteConf, {
          esbuildOptions: {
            define: {
              global: 'window',
            },
          },
        });
        if (!devMode) {
          viteConf.build = mergeConfig(viteConf.build, {
            sourcemap: true,
          });
          if (!viteConf.plugins) viteConf.plugins = [];
          viteConf.plugins.push(
            sentryVitePlugin({
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: 'jw-projects',
              project: 'mmm-v2',
              release: {
                name: version,
              },
              telemetry: false,
            }),
          );
        }
      },
      sourcemap: true,
      // See: https://www.electronjs.org/docs/latest/tutorial/electron-timelines#timeline
      target: { browser: ['chrome130'], node: 'node20' },
      vitePlugins: [
        [
          '@intlify/vite-plugin-vue-i18n',
          {
            include: path.resolve(__dirname, './src/i18n/**'),
          },
        ],
        // [
        //   'vite-plugin-checker',
        //   {
        //     eslint: {
        //       lintCommand: 'eslint "./**/*.{js,ts,mjs,cjs,vue}"',
        //     },
        //     vueTsc: {
        //       tsconfigPath: 'tsconfig.vue-tsc.json',
        //     },
        //   },
        //   { server: false },
        // ],
      ],
      vueRouterMode: 'hash', // available values: 'hash', 'history'
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: ['app.scss', 'mmm-icons.css'],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   registerServiceWorker: 'src-pwa/register-service-worker',
    //   serviceWorker: 'src-pwa/custom-service-worker',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload'
    // },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      // https: true
      open: true, // opens browser window automatically
    },
    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      builder: {
        appId: 'sircharlo.meeting-media-manager',
        // eslint-disable-next-line no-template-curly-in-string
        artifactName: 'meeting-media-manager-${version}-${arch}.${ext}',
        buildDependenciesFromSource: false,
        generateUpdatesFilesForAllChannels: true,
        linux: {
          category: 'Utility',
          icon: 'icons/icon.png',
          publish: ['github'],
          target: 'AppImage',
        },
        mac: {
          entitlements: 'build/entitlements.mac.plist',
          extendInfo: {
            NSCameraUsageDescription:
              "Camera access is required in order to use the website mirroring feature, as screen recording is treated as camera and microphone access. Please note that your device's camera will never be accessed or used in any way by this app.",
            NSMicrophoneUsageDescription:
              "Microphone access is required in order to use the website mirroring feature, as screen recording is treated as camera and microphone access. Please note that your device's microphone will never be accessed or used in any way by this app.",
          },
          icon: 'icons/icon.icns',
          publish: ['github'],
          target: {
            arch: ['x64', 'arm64'],
            target: 'default',
          },
        },
        nsis: {
          // eslint-disable-next-line no-template-curly-in-string
          artifactName: 'meeting-media-manager-${version}-${arch}.${ext}',
          oneClick: false,
        },
        productName: 'Meeting Media Manager', // don't delete this or the productName in package.json; needed for app directory name
        win: {
          // asar: false,
          icon: 'icons/icon.ico',
          publish: ['github'],
          target: [
            {
              arch: ['x64', 'ia32'],
              target: 'nsis',
            },
          ],
        },
      },
      bundler: 'builder', // 'packager' or 'builder'
      extendElectronMainConf: (esbuildConf) => {
        if (!devMode) {
          esbuildConf.sourcemap = true;
          if (!esbuildConf.plugins) esbuildConf.plugins = [];
          esbuildConf.plugins.push(
            sentryEsbuildPlugin({
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: 'jw-projects',
              project: 'mmm-v2',
              release: {
                name: version,
              },
              telemetry: false,
            }),
          );
        }
      },
      extendElectronPreloadConf: (esbuildConf) => {
        if (!devMode) {
          esbuildConf.sourcemap = true;
          if (!esbuildConf.plugins) esbuildConf.plugins = [];
          esbuildConf.plugins.push(
            sentryEsbuildPlugin({
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: 'jw-projects',
              project: 'mmm-v2',
              release: {
                name: version,
              },
              telemetry: false,
            }),
          );
        }
      },
      extendPackageJson(pkg) {
        const requiredNonUiElectronDependencies = [
          '@electron/remote',
          '@sentry/electron',
          'adm-zip',
          'better-sqlite3',
          'electron-updater',
          'electron-window-state',
          'fs-extra',
          'heic-convert',
          'klaw-sync',
          'music-metadata',
          'pdfjs-dist',
          'upath',
        ];

        // Remove unneeded dependencies from production build
        Object.keys(pkg.dependencies).forEach((dep) => {
          if (!requiredNonUiElectronDependencies.includes(dep)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete pkg.dependencies[dep];
          }
        });
      },
      inspectPort: 5858,
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
    framework: {
      config: {
        dark: 'auto',
      },

      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: ['LocalStorage', 'Notify'],
    },
  };
});
