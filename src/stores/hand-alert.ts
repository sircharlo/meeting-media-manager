import { defineStore } from 'pinia';

// The hand alert on the timer display (not persisted): a large hand shown
// to the chairman, either because the Zoom Meeting Manager saw someone raise
// their hand, or because the operator switched it on by hand.

interface Store {
  /** Switched on by the operator, whatever Zoom says. */
  manual: boolean;
  /** Participants Zoom reports with a raised hand, in the order they raised them. */
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
      // Keep the order hands went up in: a hand still raised stays where it
      // was, and newcomers join at the end, whatever order Zoom happens to
      // list its participants in.
      const next = [
        ...this.raisedHands.filter((name) => unique.includes(name)),
        ...unique.filter((name) => !this.raisedHands.includes(name)),
      ];
      const same =
        next.length === this.raisedHands.length &&
        next.every((name, index) => this.raisedHands[index] === name);
      if (!same) this.raisedHands = next;
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
