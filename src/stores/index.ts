import type { Router } from 'vue-router';

import { createSentryPiniaPlugin } from '@sentry/vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { PiniaSharedState } from 'pinia-shared-state';
import { store } from 'quasar/wrappers';

/*
 * When adding new properties to stores, you should also
 * extend the `PiniaCustomProperties` interface.
 * @see https://pinia.vuejs.org/core-concepts/plugins.html#typing-new-store-properties
 */
declare module 'pinia' {
  export interface PiniaCustomProperties {
    readonly router: Router;
  }
}

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default store((/* { ssrContext } */) => {
  const pinia = createPinia();

  // You can add Pinia plugins here
  pinia.use(
    PiniaSharedState({
      // Enables the plugin for all stores. Defaults to true.
      enable: true,
      // If set to true this tab tries to immediately recover the shared state from another tab. Defaults to true.
      initialize: true,
      // Enforce a type. One of native, idb, local storage or node. Defaults to native.
      type: 'native',
    }),
  );

  pinia.use(piniaPluginPersistedstate);

  pinia.use(
    createSentryPiniaPlugin({
      attachPiniaState: false, // Until https://github.com/getsentry/sentry-javascript/issues/14441 is fixed
      stateTransformer: (state) => {
        // Transform the state to remove unneeded information that only takes up space
        const transformedState = {
          ...state,
          jwLanguages: 'FILTERED',
          jwSongs: 'FILTERED',
          yeartexts: 'FILTERED',
        };
        return transformedState;
      },
    }),
  );

  return pinia;
});
