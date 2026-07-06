import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.repository': JSON.stringify(
      pkg.repository.url.replace('.git', ''),
    ),
    'import.meta.env.version': JSON.stringify('1.2.3'),
    'import.meta.env.VITEST': JSON.stringify(true),
  },
  plugins: [],
  resolve: {
    alias: {
      // tsconfigPaths (below) picks up '#q-app' as a type-only path pointing
      // at a .d.ts file; this alias takes priority and resolves it to the
      // real runtime package instead, matching @quasar/app-vite's own config.
      '#q-app': '@quasar/app-vite',
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
      'src-electron': fileURLToPath(new URL('./src-electron', import.meta.url)),
      stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
    },
    tsconfigPaths: true,
  },
  test: {
    env: {
      VITEST: 'true',
    },
    projects: [
      {
        extends: './vitest.config.mts',
        plugins: [
          vue({
            features: { optionsAPI: false },
            template: { transformAssetUrls },
          }),
          quasar({ sassVariables: 'src/quasar-variables.scss' }),
        ],
        test: {
          environment: 'happy-dom',
          include: ['src/**/*.test.ts'],
          name: 'quasar',
          server: { deps: { inline: ['fs-extra', 'graceful-fs'] } },
          setupFiles: 'test/vitest/setup/setup.quasar.ts',
        },
      },
      {
        extends: './vitest.config.mts',
        test: {
          environment: 'node',
          include: ['src-electron/**/*.test.ts'],
          name: 'electron',
          server: {
            deps: { inline: ['fs-extra', 'graceful-fs', '@quasar/app-vite'] },
          },
          setupFiles: 'test/vitest/setup/setup.electron.ts',
        },
      },
      {
        extends: './vitest.config.mts',
        plugins: [vue({ template: { transformAssetUrls } })],
        test: {
          environment: 'node',
          include: ['docs/**/*.test.ts'],
          name: 'docs',
          setupFiles: 'test/vitest/setup/setup.docs.ts',
        },
      },
    ],
    testTimeout: 15000,
  },
});
