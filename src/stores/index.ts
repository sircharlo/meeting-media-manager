import { createSentryPiniaPlugin } from '@sentry/vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { log } from 'src/shared/vanilla';

import { defineStore } from '#q-app';

/*
 * When adding new properties to stores, you should also
 * extend the `PiniaCustomProperties` interface.
 * @see https://pinia.vuejs.org/core-concepts/plugins.html#typing-new-store-properties
 */
declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface PiniaCustomProperties {
    // add your custom properties here, if any
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

export default defineStore(() => {
  const pinia = createPinia();

  pinia.use(piniaPluginPersistedstate);

  pinia.use(
    createSentryPiniaPlugin({
      attachPiniaState: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stateTransformer: (state: Record<string, any>) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const jwStore: Record<string, any> = state['jw-store'] || {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const congregationSettings: Record<string, any> =
            state['congregation-settings'] || {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const congregations: Record<string, any> =
            congregationSettings.congregations || {};

          // Transform the state to remove unneeded/sensitive information
          return {
            ...state,
            'congregation-settings': {
              ...congregationSettings,
              congregations: Object.fromEntries(
                Object.entries(congregations).map(([id, settings]) => [
                  id,
                  {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ...(settings as Record<string, any>),
                    obsPassword: (settings as { obsPassword?: string })
                      ?.obsPassword
                      ? 'REDACTED'
                      : null,
                  },
                ]),
              ),
            },
            'jw-store': {
              ...jwStore,
              jwBibleFiles:
                'FILTERED (length: ' +
                Object.keys(jwStore.jwBibleFiles || {}).length +
                ')',
              jwLanguages:
                'FILTERED (length: ' +
                (jwStore.jwLanguages?.list?.length || 0) +
                ')',
              jwMepsLanguages:
                'FILTERED (length: ' +
                (jwStore.jwMepsLanguages?.list?.length || 0) +
                ')',
              jwSongs:
                'FILTERED (length: ' +
                (Object.keys(jwStore.jwSongs || {}).length || 0) +
                ')',
              yeartexts:
                'FILTERED (length: ' +
                (Object.keys(jwStore.yeartexts || {}).length || 0) +
                ')',
            },
          };
        } catch (error) {
          log(error, 'stores', 'error');
          return state;
        }
      },
    }),
  );

  return pinia;
});
