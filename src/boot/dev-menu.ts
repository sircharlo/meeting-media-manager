import { runDevMenuCommand } from 'src/helpers/dev-menu-commands';
import { useCurrentStateStore } from 'stores/current-state';
import { useDemoModeStore } from 'stores/demo-mode';
import { watch } from 'vue';

import { defineBoot } from '#q-app';

// Dev-only bridge between the main process's Demo menu (which only exists
// in dev builds — see src-electron/main/dev-menu.ts) and the renderer
// stores/helpers that actually implement each command (see
// src/helpers/dev-menu-commands.ts, which the Dev actions popup runs too).
// The listener no-ops outside dev builds, and the main process never sends
// these commands in production anyway.
export default defineBoot(() => {
  if (!globalThis.electronApi?.isDev) return;

  const { onDevMenuCommand, sendDevMenuState } = globalThis.electronApi;

  const demoMode = useDemoModeStore();
  const currentState = useCurrentStateStore();

  onDevMenuCommand(runDevMenuCommand);

  // Keep the menu's checkboxes and enabled/disabled states in sync with the
  // runtime state, including state changes that come from elsewhere (e.g.
  // the demo-mode boot prompt, the quick-actions panel buttons or the Dev
  // actions popup).
  watch(
    [() => demoMode.enabled, () => currentState.online],
    () => {
      sendDevMenuState({
        demoEnabled: demoMode.enabled,
        offline: !currentState.online,
      });
    },
    { immediate: true },
  );
});
