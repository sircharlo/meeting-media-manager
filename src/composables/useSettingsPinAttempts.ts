import { storeToRefs } from 'pinia';
import { verifySettingsPin } from 'src/utils/settings-pin';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

const ATTEMPTS_BEFORE_RESET = 3;

/**
 * Checks a profile's settings PIN, and offers resetting it after a few wrong
 * tries. The tries add up wherever the PIN is asked for (the settings lock
 * screen, deleting the profile) until the right one is entered or M³ restarts.
 */
export const useSettingsPinAttempts = (
  congregationId: MaybeRefOrGetter<number | string>,
) => {
  const { settingsPinFailedAttempts } = storeToRefs(useCurrentStateStore());
  const id = computed(() => String(toValue(congregationId)));

  const canReset = computed(
    () =>
      (settingsPinFailedAttempts.value[id.value] ?? 0) >= ATTEMPTS_BEFORE_RESET,
  );

  const checkPin = async (pin: string, stored: string) => {
    const matches = await verifySettingsPin(pin, stored);
    settingsPinFailedAttempts.value[id.value] = matches
      ? 0
      : (settingsPinFailedAttempts.value[id.value] ?? 0) + 1;
    return matches;
  };

  return { canReset, checkPin };
};
