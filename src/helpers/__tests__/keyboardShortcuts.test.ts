import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { beforeEach, describe, expect, it } from 'vitest';

// keyboardShortcuts.ts transitively imports src/utils/dialog-plugin.ts,
// whose exported singleton calls useDialogStateStore() at module-evaluation
// time - it needs an active Pinia the moment it's first imported, before any
// test body runs, or that call throws ("no active Pinia").
setActivePinia(createPinia());
const { getConflictingShortcutName } = await import('../keyboardShortcuts');

// FE-5 (full-audit-2026-09-04.md): ShortcutInput.vue used to accept and
// display a key combination already assigned to another shortcut, since the
// only conflict check silently skipped committing it with no user-facing
// signal. getConflictingShortcutName() is what now lets the picker reject
// it up front instead.
describe('getConflictingShortcutName', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    const congregationSettings = useCongregationSettingsStore();
    congregationSettings.congregations['test-cong'] = {
      ...defaultSettings,
      shortcutMediaNext: 'Ctrl+Right',
      shortcutMediaStop: 'Ctrl+End',
    };

    const currentState = useCurrentStateStore();
    currentState.currentCongregation = 'test-cong';
  });

  it('returns the other shortcut name already using that combination', () => {
    const result = getConflictingShortcutName('Ctrl+End', 'shortcutMediaNext');

    expect(result).toBe('shortcutMediaStop');
  });

  it('returns undefined for a combination not used by anything', () => {
    const result = getConflictingShortcutName(
      'Ctrl+Alt+Z',
      'shortcutMediaNext',
    );

    expect(result).toBeUndefined();
  });

  it('does not flag a shortcut against its own currently-assigned combination', () => {
    const result = getConflictingShortcutName(
      'Ctrl+Right',
      'shortcutMediaNext',
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when there are no settings yet', () => {
    const currentState = useCurrentStateStore();
    currentState.currentCongregation = 'no-such-congregation';

    const result = getConflictingShortcutName('Ctrl+End', 'shortcutMediaNext');

    expect(result).toBeUndefined();
  });
});
