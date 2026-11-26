import { defineStore } from 'pinia';

// The Zoom display setup for this M³ session (not persisted): the meeting
// it's open for, if any, and how far the user is in the short tour of the
// media display button that follows it (see DialogZoomDisplaySetup and
// ZoomDisplaySetupTour).

/** Which meeting the setup is for: its question differs. */
export type ZoomDisplaySetupMeeting = 'mw' | 'we';

interface Store {
  /** The meeting the setup is open for; null while it's closed. */
  meeting: null | ZoomDisplaySetupMeeting;
  /**
   * The tour's step (see ZOOM_DISPLAY_TOUR_STEPS): 0 points at the action
   * island's media display button, the next ones at the Hide (or Show)
   * button in its menu. Null while the tour isn't running.
   */
  tourStep: null | number;
}

export const useZoomDisplaySetupStore = defineStore('zoom-display-setup', {
  actions: {
    close() {
      this.meeting = null;
    },
    endTour() {
      this.tourStep = null;
    },
    open(meeting: ZoomDisplaySetupMeeting) {
      this.meeting = meeting;
    },
    startTour() {
      this.tourStep = 0;
    },
  },
  getters: {
    tourActive: (state) => state.tourStep !== null,
  },
  state: (): Store => ({
    meeting: null,
    tourStep: null,
  }),
});
