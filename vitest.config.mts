import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    define: { global: 'window' },
    target: ['chrome136', 'node22.16.0'],
  },
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
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
  },
  test: {
    env: {
      repository: pkg.repository.url.replace('.git', ''),
      version: '1.2.3',
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
          server: { deps: { inline: ['fs-extra', 'graceful-fs'] } },
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
  },
});
