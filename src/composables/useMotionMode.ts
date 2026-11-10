import { usePreferredReducedMotion } from '@vueuse/core';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

/**
 * How much the playful animations (the liquid progress, its digits and
 * confetti) may move:
 * - still: the user asked for reduced motion, so nothing moves on its own;
 * - gentle: media is on the audience's screen (or the caller wants it calm),
 *   so only a slow, quiet wave, with no bubbles, pops or confetti;
 * - lively: everything.
 */
export type MotionMode = 'gentle' | 'lively' | 'still';

export const useMotionMode = (
  forceGentle: MaybeRefOrGetter<boolean | undefined> = false,
) => {
  const reducedMotion = usePreferredReducedMotion();
  const currentState = useCurrentStateStore();

  return computed<MotionMode>(() => {
    if (reducedMotion.value === 'reduce') return 'still';
    if (toValue(forceGentle) || currentState.mediaIsPlaying) return 'gentle';
    return 'lively';
  });
};
