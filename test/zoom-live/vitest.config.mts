import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

import baseConfig from '../../vitest.config.mjs';

// The live Zoom test drives the real Zoom desktop app on this computer (see
// test/zoom-live/README.md). It is deliberately not one of the projects in
// the main Vitest config, so `yarn test:unit` and CI never run it.
export default defineConfig({
  define: baseConfig.define,
  plugins: [
    vue({
      features: { optionsAPI: false },
      template: { transformAssetUrls },
    }),
    quasar({ sassVariables: 'src/quasar-variables.scss' }),
  ],
  resolve: baseConfig.resolve,
  test: {
    env: { VITEST: 'true' },
    environment: 'happy-dom',
    // Lets happy-dom's fetch reach the local helper and participants
    // servers, which send no CORS headers.
    environmentOptions: {
      happyDOM: { settings: { fetch: { disableSameOriginPolicy: true } } },
    },
    fileParallelism: false,
    hookTimeout: 180_000,
    include: ['test/zoom-live/**/*.live.test.ts'],
    setupFiles: 'test/zoom-live/setup.ts',
    testTimeout: 900_000,
  },
});
