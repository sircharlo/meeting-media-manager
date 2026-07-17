// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { sentryRollupPlugin } from '@sentry/rollup-plugin';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { fileURLToPath } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';
import { mergeConfig } from 'vite'; // use mergeConfig helper to avoid overwriting the default config

import { defineConfig } from '#q-app';

import { name, productName, repository, version } from './package.json';
import { dependencies as electronDependencies } from './src-electron/package.json';

// Environment
const IS_DEV = process.env.NODE_ENV === 'development';
const IS_BETA = version.includes('beta');
const IS_TEST = process.env.TEST_VERSION === 'true';

// App
const APP_NAME = `${name}${IS_TEST ? '-test' : ''}`;
const PRODUCT_NAME = `${productName}${IS_TEST ? ' - Test' : ''}`;
const APP_ID = `sircharlo.${APP_NAME}`;

// Sentry
const SENTRY_ORG = 'jw-projects';
const SENTRY_PROJECT = 'mmm-v2';
const SENTRY_VERSION = `${name}@${version}`;
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_DSN = process.env.SENTRY_DSN ?? '';
const ENABLE_SOURCE_MAPS = !!SENTRY_AUTH_TOKEN && !IS_TEST;

const repoURL = repository.url.replace('.git', '');

const getIconPath = (iconType: 'icns' | 'ico' | 'png' | 'splash') => {
  // electron-builder resolves these relative paths against /src-electron
  // (its "project dir" in v3), not the repo root.
  if (iconType === 'splash') {
    return `../build/logos/splash-portable.bmp`;
  }
  return `electron-assets/icons/${IS_BETA ? 'beta' : 'icon'}.${iconType}`;
};

export default defineConfig((ctx) => {
  return {
    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: ['fadeIn', 'fadeOut', 'shakeX'],

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: ['demo-mode', 'fonts', 'sentry', 'i18n', 'globals', 'notify-types'],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
    build: {
      alias: {
        // Quasar CLI v3 only auto-injects '@/' (-> /src) and '#q-app'.
        // Re-inject the old aliases so the rest of the app doesn't need
        // to be rewritten to use '@/'.
        app: fileURLToPath(new URL('.', import.meta.url)),
        assets: fileURLToPath(new URL('./src/assets', import.meta.url)),
        boot: fileURLToPath(new URL('./src/boot', import.meta.url)),
        components: fileURLToPath(new URL('./src/components', import.meta.url)),
        layouts: fileURLToPath(new URL('./src/layouts', import.meta.url)),
        main: fileURLToPath(new URL('./src-electron/main', import.meta.url)),
        pages: fileURLToPath(new URL('./src/pages', import.meta.url)),
        preload: fileURLToPath(
          new URL('./src-electron/preload', import.meta.url),
        ),
        src: fileURLToPath(new URL('./src', import.meta.url)),
        'src-electron': fileURLToPath(
          new URL('./src-electron', import.meta.url),
        ),
        stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
      },
      defineEnv: {
        APP_ID,
        APP_NAME,
        IS_BETA,
        IS_DEV,
        IS_TEST,
        PRODUCT_NAME,
        repository: repoURL,
        SENTRY_DSN,
        version,
      },
      extendViteConf(viteConf) {
        if (ctx.prod && !ctx.debug && ENABLE_SOURCE_MAPS) {
          viteConf.build = mergeConfig(viteConf.build ?? {}, {
            sourcemap: true,
          });
          viteConf.plugins ??= [];
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
      target: { browser: ['chrome146'], node: 'node24.14.0' },
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
        visualizer(),
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
        appId: APP_ID,
        // eslint-disable-next-line no-template-curly-in-string
        artifactName: APP_NAME + '-${version}-${arch}.${ext}',
        generateUpdatesFilesForAllChannels: true,
        linux: {
          category: 'Utility',
          icon: getIconPath('png'),
          target: 'AppImage',
        },
        mac: {
          // Unlike other resource paths in this config, mac.entitlements is read
          // via fs.readFile relative to process.cwd() (the repo root), not
          // resolved against src-electron/projectDir — so no '../' prefix here.
          entitlements: 'build/entitlements.mac.plist',
          extendInfo: {
            NSAppleEventsUsageDescription:
              'Apple Events access is required to control media playback and window management. Please note that this app will never access or control other applications on your device without your explicit permission.',
            NSCameraUsageDescription:
              "Camera access is required in order to use the website mirroring feature, as screen recording is treated as camera and microphone access. Please note that your device's camera will never be accessed or used in any way by this app.",
            NSMicrophoneUsageDescription:
              "Microphone access is required in order to use the website mirroring feature, as screen recording is treated as camera and microphone access. Please note that your device's microphone will never be accessed or used in any way by this app.",
            NSScreenCaptureUsageDescription:
              'Screen recording access is required in order to use the website mirroring feature. Please note that this app will never record your screen content.',
          },
          hardenedRuntime: true,
          icon: getIconPath('icns'),
          minimumSystemVersion: '10.15',
          target: {
            arch: ['universal'],
            target: 'default',
          },
          x64ArchFiles: '**/@napi-rs/**',
        },
        nsis: {
          deleteAppDataOnUninstall: true,
          include: '../build/installer.nsh',
          oneClick: false,
        },
        portable: {
          // eslint-disable-next-line no-template-curly-in-string
          artifactName: APP_NAME + '-${version}-portable.${ext}',
          splashImage: getIconPath('splash'),
          useZip: true,
        },
        productName: PRODUCT_NAME,
        publish: ['github'],
        win: {
          icon: getIconPath('ico'),
          target: [
            { arch: ctx.debug ? 'x64' : ['x64', 'ia32'], target: 'nsis' },
            'portable',
          ],
        },
      },
      bundler: 'builder', // 'packager' or 'builder'
      extendElectronMainConf: (rolldownConf) => {
        // build.sourcemap (set below) already propagates to the Rolldown
        // output config, so only the Sentry plugin needs adding here.
        if (ctx.prod && !ctx.debug && ENABLE_SOURCE_MAPS) {
          rolldownConf.plugins = [
            ...(Array.isArray(rolldownConf.plugins)
              ? rolldownConf.plugins
              : []),
            sentryRollupPlugin({
              authToken: SENTRY_AUTH_TOKEN,
              org: SENTRY_ORG,
              project: SENTRY_PROJECT,
              release: { name: SENTRY_VERSION },
              telemetry: false,
            }),
          ];
        }
      },
      extendElectronPreloadConf: (rolldownConf) => {
        // Unlike the main process config, the preload config doesn't
        // externalize node_modules by default (dev or prod), so native
        // modules like @jitsi/robotjs would get inlined and lose the
        // ability to resolve their compiled .node binary at runtime.
        rolldownConf.external = [
          ...(Array.isArray(rolldownConf.external)
            ? rolldownConf.external
            : []),
          'electron/renderer',
          ...Object.keys(electronDependencies),
        ];

        if (ctx.prod && !ctx.debug && ENABLE_SOURCE_MAPS) {
          rolldownConf.plugins = [
            ...(Array.isArray(rolldownConf.plugins)
              ? rolldownConf.plugins
              : []),
            sentryRollupPlugin({
              authToken: SENTRY_AUTH_TOKEN,
              org: SENTRY_ORG,
              project: SENTRY_PROJECT,
              release: { name: SENTRY_VERSION },
              telemetry: false,
            }),
          ];
        }
      },
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
    framework: {
      config: { dark: 'auto' },
      plugins: ['LocalStorage', 'Notify', 'Dialog'],
    },
  };
});
