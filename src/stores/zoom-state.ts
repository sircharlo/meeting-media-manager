import { defineStore } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';

// The Zoom Meeting Manager's state for this M³ session (not persisted): the
// startup check's progress, and whether a failed check paused the Zoom
// automations, which then stay paused until M³ restarts or a check passes.

export interface ZoomAutomationPause {
  congregationId: string;
  /** i18n keys of what failed, to show the user. */
  problems: string[];
}

interface Store {
  /** Congregations whose Zoom was checked since M³ started. */
  checkedCongregations: string[];
  checkRunning: boolean;
  pause: null | ZoomAutomationPause;
}

export const useZoomStateStore = defineStore('zoom-state', {
  actions: {
    pauseAutomations(congregationId: string, problems: string[]) {
      this.pause = { congregationId, problems };
    },
    resumeAutomations() {
      this.pause = null;
    },
  },
  getters: {
    /** Whether a failed check paused the current congregation's automations. */
    automationsPaused: (state) =>
      !!state.pause &&
      state.pause.congregationId === useCurrentStateStore().currentCongregation,
  },
  state: (): Store => ({
    checkedCongregations: [],
    checkRunning: false,
    pause: null,
  }),
});
