import { fileURLToPath } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    define: { global: 'window' },
    target: ['chrome136', 'node22.15.1'],
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
  },
});
