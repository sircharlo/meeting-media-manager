import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
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
]);
