// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app/wrappers';
import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite'; // use mergeConfig helper to avoid overwriting the default config

import { repository, version } from './package.json';
import { APP_NAME, IS_TEST, PRODUCT_NAME } from './src-electron/constants';

const IS_BETA = version.includes('beta');

const SENTRY_ORG = 'jw-projects';
const SENTRY_PROJECT = 'mmm-v2';
const SENTRY_VERSION = `meeting-media-manager@${version}`;
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const ENABLE_SOURCE_MAPS = !!SENTRY_AUTH_TOKEN && !IS_TEST;

export default defineConfig((ctx) => {
  return {
    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: ['fadeIn', 'fadeOut', 'shakeX'],

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: ['sentry', 'i18n', 'globals'],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
    build: {
      alias: {
        main: fileURLToPath(new URL('./src-electron/main', import.meta.url)),
        preload: fileURLToPath(
          new URL('./src-electron/preload', import.meta.url),
        ),
        'src-electron': fileURLToPath(
          new URL('./src-electron', import.meta.url),
        ),
      },
      env: {
        isBeta: IS_BETA,
        repository: repository.url.replace('.git', ''),
        TEST_VERSION: IS_TEST,
        version,
      },
      extendViteConf(viteConf) {
        viteConf.optimizeDeps = mergeConfig(viteConf.optimizeDeps ?? {}, {
          esbuildOptions: {
            define: {
              global: 'window',
            },
          },
        });

        if (ctx.prod && !ctx.debug && ENABLE_SOURCE_MAPS) {
          viteConf.build = mergeConfig(viteConf.build ?? {}, {
            sourcemap: true,
          });
          if (!viteConf.plugins) viteConf.plugins = [];
          viteConf.plugins.push(
            sentryVitePlugin({
              authToken: SENTRY_AUTH_TOKEN,
              org: SENTRY_ORG,
              project: SENTRY_PROJECT,
              release: { name: SENTRY_VERSION },
              telemetry: false,
            }),
          );
        }
      },
      sourcemap: true,
      // See: https://www.electronjs.org/docs/latest/tutorial/electron-timelines#timeline
      target: { browser: ['chrome132'], node: 'node20.18.1' },
      typescript: {
        extendTsConfig: (tsConfig) => {
          tsConfig.exclude?.push('./../docs');
        },
        strict: true,
        vueShim: true,
      },
      vitePlugins: [
        [
          '@intlify/unplugin-vue-i18n/vite',
          {
            include: [fileURLToPath(new URL('./src/i18n', import.meta.url))],
            ssr: ctx.modeName === 'ssr',
          },
        ],
      ],
      vueOptionsAPI: false,
      vueRouterMode: 'hash', // available values: 'hash', 'history'
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#css
    css: ['app.scss', 'mmm-icons.css'],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#devServer
    devServer: {
      // https: true
      open: true, // opens browser window automatically
    },
    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      builder: {
        appId: `sircharlo.${APP_NAME}`,
        // eslint-disable-next-line no-template-curly-in-string
        artifactName: APP_NAME + '-${version}-${arch}.${ext}',
        generateUpdatesFilesForAllChannels: true,
        linux: {
          category: 'Utility',
          icon: `icons/${IS_BETA ? 'beta' : 'icon'}.png`,
          publish: ['github'],
          target: 'AppImage',
        },
        mac: {
          extendInfo: {
            //'com.apple.security.cs.allow-jit': true,
            'com.apple.security.device.audio-input': true,
            'com.apple.security.device.camera': true,
            'com.apple.security.device.microphone': true,
            NSCameraUsageDescription:
              "Camera access is required in order to use the website mirroring feature, as screen recording is treated as camera and microphone access. Please note that your device's camera will never be accessed or used in any way by this app.",
            NSMicrophoneUsageDescription:
              "Microphone access is required in order to use the website mirroring feature, as screen recording is treated as camera and microphone access. Please note that your device's microphone will never be accessed or used in any way by this app.",
          },
          hardenedRuntime: true,
          icon: `icons/${IS_BETA ? 'beta' : 'icon'}.icns`,
          minimumSystemVersion: '10.15',
          publish: IS_TEST ? [] : ['github'],
          target: { target: 'default' },
        },
        nsis: { oneClick: false },
        portable: {
          // eslint-disable-next-line no-template-curly-in-string
          artifactName: APP_NAME + '-${version}-portable.${ext}',
        },
        productName: PRODUCT_NAME,
        win: {
          icon: `icons/${IS_BETA ? 'beta' : 'icon'}.ico`,
          publish: IS_TEST ? [] : ['github'],
          target: [
            { arch: ctx.debug ? 'x64' : ['x64', 'ia32'], target: 'nsis' },
            'portable',
          ],
        },
      },
      bundler: 'builder', // 'packager' or 'builder'
      extendElectronMainConf: (esbuildConf) => {
        if (ctx.prod && !ctx.debug && ENABLE_SOURCE_MAPS) {
          esbuildConf.sourcemap = true;
          if (!esbuildConf.plugins) esbuildConf.plugins = [];
          esbuildConf.plugins.push(
            sentryEsbuildPlugin({
              authToken: SENTRY_AUTH_TOKEN,
              org: SENTRY_ORG,
              project: SENTRY_PROJECT,
              release: { name: SENTRY_VERSION },
              telemetry: false,
            }),
          );
        }
      },
      extendElectronPreloadConf: (esbuildConf) => {
        if (ctx.prod && !ctx.debug && ENABLE_SOURCE_MAPS) {
          esbuildConf.sourcemap = true;
          if (!esbuildConf.plugins) esbuildConf.plugins = [];
          esbuildConf.plugins.push(
            sentryEsbuildPlugin({
              authToken: SENTRY_AUTH_TOKEN,
              org: SENTRY_ORG,
              project: SENTRY_PROJECT,
              release: { name: SENTRY_VERSION },
              telemetry: false,
            }),
          );
        }
      },
      extendPackageJson(pkg) {
        // All dependencies required by the main and preload scripts need to be listed here
        const electronDeps = new Set([
          '@numairawan/video-duration',
          '@sentry/electron',
          'better-sqlite3',
          'chokidar',
          'countries-and-timezones',
          'decompress',
          'electron-dl-manager',
          'electron-updater',
          'fluent-ffmpeg',
          'fs-extra',
          'heic-convert',
          'image-size',
          'is-online',
          'music-metadata',
          'pdfjs-dist',
          'upath',
        ]);

        // Remove unneeded dependencies from production build
        Object.keys(pkg.dependencies).forEach((dep) => {
          if (!electronDeps.has(dep)) {
            console.log(`Removing dependency: ${dep}`);
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete pkg.dependencies[dep];
          }
        });
      },
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
    framework: {
      config: { dark: 'auto' },
      plugins: ['LocalStorage', 'Notify'],
    },
  };
});
