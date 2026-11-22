import { createSentryPiniaPlugin } from '@sentry/vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { redactStateForSentry } from 'src/stores/sentry-state';

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

// Read-only query actions the settings UI and media calendar call many times
// per render, and the Zoom Meeting Manager's bookkeeping: every Zoom action
// begins and ends a run and sets its step, and the meeting and raised hands
// are polled every few seconds. Each call used to add a "pinia.action"
// breadcrumb, filling Sentry's 100-breadcrumb buffer within seconds and
// pushing out the breadcrumbs that actually explain an error (e.g.
// MMM-V2-3JK, 3K0; in MMM-V2-3MF they made up 80 of the 100). The music
// store's clock formatter runs every second while music plays (the "stops
// at" summary follows the clock): in MMM-V2-3MW it made up 80 of the 100.
const QUIET_ACTIONS = new Set([
  'areDependenciesSatisfied',
  'beginRun',
  'endRun',
  'formatClockTime',
  'getInvalidSettings',
  'getMeetingType',
  'invalidSettings',
  'isHiddenByUnless',
  'isSettingInvalid',
  'sceneExists',
  'setMeeting',
  'setRaisedHands',
  'setRunStep',
]);

/**
 * Drops breadcrumbs for frequent actions (see QUIET_ACTIONS).
 * @param action The action name
 * @returns The name to record, or null to skip the breadcrumb
 */
export const piniaBreadcrumbActionTransformer = (action: string) =>
  QUIET_ACTIONS.has(action) ? null : action;

export default defineStore(() => {
  const pinia = createPinia();

  pinia.use(piniaPluginPersistedstate);

  pinia.use(
    createSentryPiniaPlugin({
      actionTransformer: piniaBreadcrumbActionTransformer,
      // Only leaves out the state as an attachment: the plugin still adds it
      // to every report, as its "state" context, hence the redaction.
      attachPiniaState: false,
      stateTransformer: redactStateForSentry,
    }),
  );

  return pinia;
});
