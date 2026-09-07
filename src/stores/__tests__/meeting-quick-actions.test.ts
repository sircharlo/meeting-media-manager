import { createPinia, setActivePinia } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useDemoModeStore } from 'stores/demo-mode';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMeetingQuickActionsStore } from '../meeting-quick-actions';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-21T12:00:00'));
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('meeting quick-actions store', () => {
  it('keeps checklist state separate for each congregation and date', () => {
    const currentState = useCurrentStateStore();
    const quickActions = useMeetingQuickActionsStore();
    currentState.currentCongregation = 'congregation-a';
    currentState.selectedDate = '2026/08/21';

    quickActions.toggleItemChecked('task-1');
    expect(quickActions.isItemChecked('task-1')).toBe(true);

    currentState.selectedDate = '2026/08/22';
    expect(quickActions.isItemChecked('task-1')).toBe(false);

    currentState.currentCongregation = 'congregation-a';
    currentState.selectedDate = '2026/08/21';
    expect(quickActions.isItemChecked('task-1')).toBe(true);

    currentState.currentCongregation = 'congregation-b';
    expect(quickActions.isItemChecked('task-1')).toBe(false);
  });

  it('keeps dismissal and the recorded song end in the current scope only', () => {
    const currentState = useCurrentStateStore();
    const quickActions = useMeetingQuickActionsStore();
    currentState.currentCongregation = 'congregation-a';
    currentState.selectedDate = '2026/08/21';

    quickActions.dismissAfter();
    quickActions.recordLastSongEnded(12345);
    expect(quickActions.dismissedAfterPanel).toBe(true);
    expect(quickActions.lastSongEndedAt).toBe(12345);

    currentState.selectedDate = '2026/08/22';
    expect(quickActions.dismissedAfterPanel).toBe(false);
    expect(quickActions.lastSongEndedAt).toBeNull();
  });

  it('can reset the current demo scope without affecting another scope', () => {
    const currentState = useCurrentStateStore();
    const quickActions = useMeetingQuickActionsStore();
    currentState.currentCongregation = 'congregation-a';
    currentState.selectedDate = '2026/08/21';

    quickActions.toggleItemChecked('task-1');
    quickActions.recordLastSongEnded(12345);
    quickActions.resetCurrentScope();

    expect(quickActions.isItemChecked('task-1')).toBe(false);
    expect(quickActions.lastSongEndedAt).toBeNull();
  });

  // FE-18 (full-audit-2026-09-05.md): the real (non-demo-button) call site
  // calls recordLastSongEnded() with no argument - its default used to
  // ignore demo mode's virtual clock entirely, unlike every other timing
  // computation in this feature.
  it('defaults to the real wall clock when demo mode is disabled', () => {
    const currentState = useCurrentStateStore();
    const quickActions = useMeetingQuickActionsStore();
    currentState.currentCongregation = 'congregation-a';
    currentState.selectedDate = '2026/08/21';

    quickActions.recordLastSongEnded();

    expect(quickActions.lastSongEndedAt).toBe(
      new Date('2026-08-21T12:00:00').getTime(),
    );
  });

  it('defaults to the demo virtual clock when demo mode is enabled, not the real wall clock', () => {
    const currentState = useCurrentStateStore();
    const quickActions = useMeetingQuickActionsStore();
    currentState.currentCongregation = 'congregation-a';
    currentState.selectedDate = '2026/08/21';

    const demoMode = useDemoModeStore();
    demoMode.enabled = true;
    const virtualTime = new Date('2026-08-21T19:00:00').getTime();
    demoMode.setVirtualTime(virtualTime, 'after-song');

    quickActions.recordLastSongEnded();

    expect(quickActions.lastSongEndedAt).toBe(virtualTime);
    expect(quickActions.lastSongEndedAt).not.toBe(
      new Date('2026-08-21T12:00:00').getTime(),
    );
  });

  it('resets naturally when a new Pinia session is created', () => {
    const currentState = useCurrentStateStore();
    const quickActions = useMeetingQuickActionsStore();
    currentState.currentCongregation = 'congregation-a';
    currentState.selectedDate = '2026/08/21';
    quickActions.toggleItemChecked('task-1');

    setActivePinia(createPinia());
    const newCurrentState = useCurrentStateStore();
    const newQuickActions = useMeetingQuickActionsStore();
    newCurrentState.currentCongregation = 'congregation-a';
    newCurrentState.selectedDate = '2026/08/21';

    expect(newQuickActions.isItemChecked('task-1')).toBe(false);
  });
});
