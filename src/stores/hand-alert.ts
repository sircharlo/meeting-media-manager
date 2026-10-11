import { defineStore } from 'pinia';

// The hand alert on the timer display (not persisted): a large hand shown
// to the chairman, either because the Zoom Meeting Manager saw someone raise
// their hand, or because the operator switched it on by hand.

interface Store {
  /** Switched on by the operator, whatever Zoom says. */
  manual: boolean;
  /** Participants Zoom reports with a raised hand, in list order. */
  raisedHands: string[];
}

export const useHandAlertStore = defineStore('hand-alert', {
  actions: {
    clear() {
      this.manual = false;
      this.raisedHands = [];
    },
    setRaisedHands(names: string[]) {
      const unique = [...new Set(names)];
      const same =
        unique.length === this.raisedHands.length &&
        unique.every((name, index) => this.raisedHands[index] === name);
      if (!same) this.raisedHands = unique;
    },
    toggleManual() {
      this.manual = !this.manual;
    },
  },
  getters: {
    active: (state) => state.manual || state.raisedHands.length > 0,
  },
  state: (): Store => ({
    manual: false,
    raisedHands: [],
  }),
});
