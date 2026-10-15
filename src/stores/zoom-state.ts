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
  /** The user asked for the running automation to stop. */
  cancelRequested: boolean;
  /** Congregations whose Zoom was checked today. */
  checkedCongregations: string[];
  checkRunning: boolean;
  pause: null | ZoomAutomationPause;
  /** How many nested automation runs are going (0: none). */
  runDepth: number;
  /** i18n key of the outermost run going, shown on the overlay. */
  runLabel: null | string;
  /** i18n key of the Zoom action running right now. */
  runStep: null | string;
}

// A run that outlives this is force-ended: whatever it was doing, the
// overlay must never stay up for good.
const RUN_WATCHDOG_MS = 5 * 60 * 1000;
let runWatchdog: ReturnType<typeof setTimeout> | undefined;

export const useZoomStateStore = defineStore('zoom-state', {
  actions: {
    /** Force-ends the run (and whatever nested runs it holds). */
    abortRun() {
      clearTimeout(runWatchdog);
      runWatchdog = undefined;
      this.runDepth = 0;
      this.runLabel = null;
      this.runStep = null;
      this.cancelRequested = false;
    },
    /** A Zoom automation that moves the mouse or focus starts. */
    beginRun(labelKey: string) {
      if (this.runDepth === 0) {
        this.runLabel = labelKey;
        this.cancelRequested = false;
        clearTimeout(runWatchdog);
        runWatchdog = setTimeout(() => {
          this.abortRun();
        }, RUN_WATCHDOG_MS);
      }
      this.runDepth++;
    },
    endRun() {
      if (this.runDepth === 0) return;
      this.runDepth--;
      if (this.runDepth === 0) this.abortRun();
    },
    pauseAutomations(congregationId: string, problems: string[]) {
      this.pause = { congregationId, problems };
    },
    requestCancel() {
      if (this.runDepth > 0) this.cancelRequested = true;
    },
    resumeAutomations() {
      this.pause = null;
    },
    setRunStep(stepKey: null | string) {
      if (this.runDepth > 0) this.runStep = stepKey;
    },
  },
  getters: {
    /** Whether a failed check paused the current congregation's automations. */
    automationsPaused: (state) =>
      !!state.pause &&
      state.pause.congregationId === useCurrentStateStore().currentCongregation,
    runActive: (state) => state.runDepth > 0,
  },
  state: (): Store => ({
    cancelRequested: false,
    checkedCongregations: [],
    checkRunning: false,
    pause: null,
    runDepth: 0,
    runLabel: null,
    runStep: null,
  }),
});
