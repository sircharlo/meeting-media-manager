import { Dialog } from 'quasar';
import {
  disableDemoMode,
  finishLastSong,
  getSeededDemoCongregationId,
  jumpToLastSong,
  jumpToPreMeeting,
  removeDemoCongregationData,
  resetDemo,
  seedDemoData,
} from 'src/helpers/demo-mode';
import { toggleMediaWindowVisibility } from 'src/helpers/mediaPlayback';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useDemoModeStore } from 'stores/demo-mode';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { useMusicStore } from 'stores/music';
import { watch } from 'vue';

import { defineBoot } from '#q-app';

// Dev-only bridge between the main process's Demo menu (which only exists
// in dev builds — see src-electron/main/dev-menu.ts) and the renderer
// stores/helpers that actually implement each command. The listener no-ops
// outside dev builds, and the main process never sends these commands in
// production anyway.
export default defineBoot(() => {
  if (!globalThis.electronApi?.isDev) return;

  const { onDevMenuCommand, sendDevMenuState } = globalThis.electronApi;

  const demoMode = useDemoModeStore();
  const currentState = useCurrentStateStore();
  const quickActions = useMeetingQuickActionsStore();
  const music = useMusicStore();
  const congregationSettings = useCongregationSettingsStore();

  // Enabling seeds the fake congregation only when there's nothing to lose
  // (mirrors the demo-mode boot prompt's guard); otherwise it just activates
  // the demo store so existing data is untouched. Reseeding — the explicit
  // destructive action — lives in its own menu item.
  const enableDemo = () => {
    if (Object.keys(congregationSettings.congregations).length === 0) {
      seedDemoData();
    }
    demoMode.activate();
  };

  // Disabling demo mode resets the simulated meeting state immediately (and
  // actually turns the store's enabled flag off), then offers to also remove
  // the seeded demo congregation and its cached media so the dev can get
  // back to a pristine, demo-free state. Dev-only copy, never user-facing.
  const handleDisableDemo = () => {
    disableDemoMode();
    const demoId = getSeededDemoCongregationId();
    if (!demoId) return;
    const demoName =
      congregationSettings.congregations[demoId]?.congregationName;
    Dialog.create({
      cancel: { flat: true, label: 'Keep Data' },
      message: demoName
        ? `Demo mode is off. Also remove ${demoName} and its cached media?`
        : 'Demo mode is off. Also remove the seeded demo congregation and its cached media?',
      ok: { color: 'negative', label: 'Remove Demo Data' },
      persistent: true,
      title: 'Disable Demo Mode',
    }).onOk(() => {
      void removeDemoCongregationData();
    });
  };

  onDevMenuCommand((command) => {
    switch (command.type) {
      case 'dismiss-after-panel':
        quickActions.dismissAfter();
        break;
      case 'dismiss-before-panel':
        quickActions.dismissBefore();
        break;
      case 'finish-last-song':
        finishLastSong();
        break;
      case 'jump-last-song':
        jumpToLastSong();
        break;
      case 'jump-pre-meeting':
        jumpToPreMeeting();
        break;
      case 'play-music':
        music.playMusic('dev-menu');
        break;
      case 'reseed-demo':
        seedDemoData();
        demoMode.activate();
        break;
      case 'reset-demo':
        resetDemo();
        break;
      case 'reshow-panels':
        quickActions.resetCurrentScope();
        break;
      case 'set-demo-enabled':
        if (command.enabled) enableDemo();
        else handleDisableDemo();
        break;
      case 'set-offline':
        currentState.online = !command.offline;
        break;
      case 'stop-music':
        music.stopMusic(true);
        break;
      case 'toggle-media-window':
        toggleMediaWindowVisibility();
        break;
      case 'toggle-timer-window': {
        const show = !currentState.timerWindowVisible;
        currentState.setTimerWindowVisible(show);
        globalThis.electronApi?.toggleTimerWindow(show);
        break;
      }
    }
  });

  // Keep the menu's checkboxes and enabled/disabled states in sync with the
  // runtime state, including state changes that come from elsewhere (e.g.
  // the demo-mode boot prompt or the quick-actions panel buttons).
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
