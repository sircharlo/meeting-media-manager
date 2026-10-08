import { createTestingPinia, type TestingOptions } from '@pinia/testing';
import { config } from '@vue/test-utils';
import { cloneDeep } from 'lodash-es';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { afterAll, beforeAll, vi } from 'vitest';
import { createApp } from 'vue';

/**
 * Creates a Pinia with `pinia-plugin-persistedstate` already registered *and*
 * installed into an app, so `$persist`/`$hydrate` are available on stores.
 *
 * Pinia v4 defers plugins registered via `pinia.use()` until the pinia is
 * installed into an app (`app.use(pinia)`); calling `use()` alone in a test
 * silently no-ops the plugin, which masks persistence bugs. Callers should
 * still `setActivePinia(createPersistedPinia())` before creating stores.
 */
export const createPersistedPinia = () => {
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  createApp({}).use(pinia);
  return pinia;
};

export function installPinia(options?: TestingOptions) {
  const globalConfigBackup = cloneDeep(config.global);

  beforeAll(() => {
    config.global.plugins.unshift(
      createTestingPinia({ ...options, createSpy: vi.fn }),
    );
  });

  afterAll(() => {
    config.global = globalConfigBackup;
  });
}
