import { watchImmediate } from '@vueuse/core';
import { useAttentionStore } from 'stores/attention';
import { type MaybeRefOrGetter, onScopeDispose, toValue } from 'vue';

/**
 * Claims the screen under `name` (see the attention store) while `active` is
 * true, from now on, and releases it when it turns false or the component
 * goes away. For what takes over the screen without being a dialog: tours,
 * the setup wizard.
 */
export const useScreenClaim = (
  name: string,
  active: MaybeRefOrGetter<boolean> = true,
) => {
  const attention = useAttentionStore();

  onScopeDispose(() => {
    attention.release(name);
  });

  watchImmediate(
    () => toValue(active),
    (isActive) => {
      if (isActive) attention.claim(name);
      else attention.release(name);
    },
  );
};
