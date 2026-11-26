import { whenever } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useAttentionStore } from 'stores/attention';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { ref, watch } from 'vue';

/**
 * When the media calendar shows the quick-start tour (QuickStartGuide): once
 * per congregation profile, when it has a footer button to point at, and
 * once the screen is free (see the attention store). Over a dialog, another
 * tour, the profile picker or the setup wizard, it would cover them or be
 * covered, so it waits for them.
 *
 * It's marked as seen once it's been shown and dismissed (see UX-0 in
 * full-audit-2026-09-04.md), not when it's asked for: one that never got to
 * show is asked for again on the next mount or profile switch.
 */
export const useQuickStartTour = () => {
  const congregationSettings = useCongregationSettingsStore();
  const attention = useAttentionStore();
  const { currentCongregation, currentSettings } = storeToRefs(
    useCurrentStateStore(),
  );

  /** Whether the tour shows (QuickStartGuide's v-model). */
  const visible = ref(false);
  // The profile it was opened for, so that marking it as seen can't land on
  // another profile if the user switches while it shows.
  const shownFor = ref<string>();
  // Asked for, waiting for the screen to be free.
  const wanted = ref(false);

  const isDue = (congId: string) =>
    !!congId &&
    !congregationSettings.quickStartTourSeen[congId] &&
    (!!currentSettings.value?.enableMediaDisplayButton ||
      !!currentSettings.value?.enableMusicButton);

  /** Asks for the tour for the current profile, if it hasn't seen it yet. */
  const requestQuickStartTour = () => {
    wanted.value = isDue(currentCongregation.value);
  };

  whenever(
    () => wanted.value && !attention.isScreenTaken,
    () => {
      wanted.value = false;
      const congId = currentCongregation.value;
      if (!isDue(congId)) return;
      shownFor.value = congId;
      visible.value = true;
    },
  );

  watch(visible, (isShowing, wasShowing) => {
    if (wasShowing && !isShowing && shownFor.value) {
      congregationSettings.markQuickStartTourSeen(shownFor.value);
      shownFor.value = undefined;
    }
  });

  return { requestQuickStartTour, visible };
};
