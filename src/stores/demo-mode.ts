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
    enabled,
    now,
    reset,
    setVirtualTime,
    stage,
  };
});
