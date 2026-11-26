import type { DevMenuCommand } from 'src/types';

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

// What each dev-only command does, whether it comes from the main process's
// Demo menu (see src/boot/dev-menu.ts) or from the Dev actions popup.
// Dev-only copy, never user-facing.

// Enabling seeds the fake congregation only when there's nothing to lose
// (mirrors the demo-mode boot prompt's guard); otherwise it just activates
// the demo store so existing data is untouched. Reseeding - the explicit
// destructive action - is its own command.
const enableDemo = () => {
  if (Object.keys(useCongregationSettingsStore().congregations).length === 0) {
    seedDemoData();
  }
  useDemoModeStore().activate();
};

// Disabling demo mode resets the simulated meeting state immediately (and
// actually turns the store's enabled flag off), then offers to also remove
// the seeded demo congregation and its cached media so the dev can get
// back to a pristine, demo-free state.
const disableDemo = () => {
  disableDemoMode();
  const demoId = getSeededDemoCongregationId();
  if (!demoId) return;
  const demoName =
    useCongregationSettingsStore().congregations[demoId]?.congregationName;
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

const toggleTimerWindow = () => {
  const currentState = useCurrentStateStore();
  const show = !currentState.timerWindowVisible;
  currentState.setTimerWindowVisible(show);
  globalThis.electronApi?.toggleTimerWindow(show);
};

/** Runs one dev-only command. */
export const runDevMenuCommand = (command: DevMenuCommand) => {
  const quickActions = useMeetingQuickActionsStore();
  const music = useMusicStore();
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
      void music.playMusic('dev-menu');
      break;
    case 'reseed-demo':
      seedDemoData();
      useDemoModeStore().activate();
      break;
    case 'reset-demo':
      resetDemo();
      break;
    case 'reshow-panels':
      quickActions.resetCurrentScope();
      break;
    case 'set-demo-enabled':
      if (command.enabled) enableDemo();
      else disableDemo();
      break;
    case 'set-offline':
      useCurrentStateStore().online = !command.offline;
      break;
    case 'stop-music':
      music.stopMusic(true);
      break;
    case 'toggle-media-window':
      toggleMediaWindowVisibility();
      break;
    case 'toggle-timer-window':
      toggleTimerWindow();
      break;
  }
};
