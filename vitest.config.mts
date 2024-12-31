import { fileURLToPath } from 'url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    define: { global: 'window' },
    target: ['chrome130', 'node20.18.1'],
  },
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      app: fileURLToPath(new URL('.', import.meta.url)),
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: { env: { repository: pkg.repository.url.replace('.git', '') } },
});
