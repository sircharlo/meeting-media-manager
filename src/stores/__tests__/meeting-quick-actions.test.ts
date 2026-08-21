import { createPinia, setActivePinia } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { beforeEach, describe, expect, it } from 'vitest';

import { useMeetingQuickActionsStore } from '../meeting-quick-actions';

beforeEach(() => {
  setActivePinia(createPinia());
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
