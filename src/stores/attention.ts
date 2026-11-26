import { defineStore, storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { computed, ref } from 'vue';

/**
 * Whether something has the user's attention, so that whatever opens on its
 * own (a feature tip, the Zoom display question, the quick-start tour) waits
 * for it instead of opening over it, or under it. The screen is taken while:
 *
 * - a dialog is open (they register in the dialog-state store);
 * - the profile picker is up, including while it picks a profile by itself
 *   at startup, when no dialog shows;
 * - something that isn't a dialog claimed it: a tour, the setup wizard (see
 *   useScreenClaim).
 *
 * Keyboard shortcuts and deferred notifications still look at dialogs only
 * (dialog-state's isAnyDialogOpen), not at this.
 */
export const useAttentionStore = defineStore('attention', () => {
  const dialogState = useDialogStateStore();
  const { congregationSwitcherOpen } = storeToRefs(useCurrentStateStore());

  /** What claimed the screen, by name (e.g. 'zoom-display-tour'). */
  const claims = ref(new Set<string>());

  const isScreenTaken = computed(
    () =>
      claims.value.size > 0 ||
      dialogState.isAnyDialogOpen ||
      congregationSwitcherOpen.value,
  );

  const claim = (name: string) => {
    claims.value.add(name);
  };

  const release = (name: string) => {
    claims.value.delete(name);
  };

  const isClaimed = (name: string) => claims.value.has(name);

  return { claim, claims, isClaimed, isScreenTaken, release };
});
