import type { PanzoomEventDetail } from '@panzoom/panzoom';

export type PanzoomEvent = CustomEvent<PanzoomEventDetail>;

// Augment the global HTMLElementEventMap to include the custom event
declare global {
  interface HTMLElementEventMap {
    panzoomchange: PanzoomEvent;
  }
}
