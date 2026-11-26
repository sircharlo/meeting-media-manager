import type { Announcement } from 'src/types';

import { useEventBus } from '@vueuse/core';

/**
 * What the dev-only Dev actions popup asks of components whose own,
 * internal code shows the state to preview (the updater toast, the yeartext
 * preview offer, ...). Only listened to in dev builds.
 */
export type DevBusEvent =
  | { announcement: Announcement; type: 'show-announcement' }
  | { id: string; type: 'show-feature-nudge' }
  | { simulation: DevUpdateSimulation; type: 'simulate-update' }
  | { type: 'offer-yeartext-preview' }
  | { type: 'replay-quick-start-tour' };

/** The updater notifications the Dev actions popup can preview. */
export type DevUpdateSimulation =
  'all-users' | 'downgrade' | 'flow' | 'install-on-launch' | 'stalled';

/**
 * The Dev actions popup's event bus. Listeners added in a component's setup
 * go away with it.
 */
export const useDevBus = () => useEventBus<DevBusEvent>('m3-dev-actions');
