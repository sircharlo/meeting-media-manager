import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export type DemoMeetingStage =
  'after-song' | 'last-song' | 'pre-meeting' | 'reset';

export const useDemoModeStore = defineStore('demo-mode', () => {
  // Forced on via M3_DEMO_MODE (automated screenshotting) starts enabled;
  // a dev build can also turn it on at runtime via activate() (see
  // src/boot/demo-mode.ts's launch prompt) - both paths land here so
  // everything gated on `enabled` (seeded data, the music store's demo
  // clock, the quick-actions demo controls) behaves identically either way.
  const enabled = ref(!!globalThis.electronApi?.isDemoMode);
  const clockOffsetMs = ref(0);
  const stage = ref<DemoMeetingStage>('reset');
  const now = computed(() => Date.now() + clockOffsetMs.value);

  const activate = () => {
    enabled.value = true;
  };

  const deactivate = () => {
    enabled.value = false;
    clockOffsetMs.value = 0;
    stage.value = 'reset';
  };

  const setVirtualTime = (timestamp: number, nextStage: DemoMeetingStage) => {
    if (!enabled.value) return;
    clockOffsetMs.value = timestamp - Date.now();
    stage.value = nextStage;
  };

  const reset = () => {
    if (!enabled.value) return;
    clockOffsetMs.value = 0;
    stage.value = 'reset';
  };

  return {
    activate,
    deactivate,
    enabled,
    now,
    reset,
    setVirtualTime,
    stage,
  };
});

/**
 * Effective demo-mode flag for behavior gates (network blocking, fetch skips)
 * that run outside components. Reads the runtime store so toggling demo mode
 * via the dev-only Demo menu changes these behaviors live, and falls back to
 * the launch flag when no Pinia is active yet (early init / unit tests), so
 * env-launched demo mode still blocks the network before the store exists.
 */
export const isDemoModeActive = (): boolean => {
  try {
    return useDemoModeStore().enabled;
  } catch {
    return !!globalThis.electronApi?.isDemoMode;
  }
};
