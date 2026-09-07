import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

installQuasarPlugin();
installPinia({ stubActions: false });

// ShortcutInput.vue transitively imports src/utils/dialog-plugin.ts, whose
// exported singleton calls useDialogStateStore() at module-evaluation time -
// it needs an active Pinia the moment it's first imported, before
// installPinia()'s own beforeAll hook above has actually run (see
// keyboardShortcuts.test.ts's identical guard).
setActivePinia(createPinia());
const { default: ShortcutInput } = await import('../ShortcutInput.vue');

afterEach(() => {
  document.body.innerHTML = '';
});

// UX-20 (full-audit-2026-09-05.md): each key segment used to be its own
// real, independently-focusable q-btn with no click handler of its own -
// a keyboard user tabbing through hit one redundant, purpose-less stop per
// configured shortcut, on top of the one real control that actually opens
// the editor.
describe('ShortcutInput - single focusable control per assigned shortcut', () => {
  it('exposes exactly one labeled, focusable control for a multi-key shortcut, not one per key segment', async () => {
    const wrapper = mount(ShortcutInput, {
      attachTo: document.body,
      props: {
        dialogId: 'shortcut-input-test',
        modelValue: 'Ctrl+Shift+F',
        shortcutName: 'zoomScreenShareShortcut',
      },
    });

    const row = wrapper.find('[role="button"]');
    expect(row.exists()).toBe(true);
    expect(row.attributes('tabindex')).toBe('0');
    expect(row.attributes('aria-label')).toContain('Ctrl+Shift+F');

    // Three key segments (Ctrl/Shift/F) must render as plain, non-focusable
    // display elements now - none of them a real <button>.
    expect(row.findAll('button').length).toBe(0);

    row.element.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
    );
    await nextTick();
    await nextTick();

    expect(document.body.textContent).toContain(
      'Enter a key combination now using your keyboard',
    );

    wrapper.unmount();
  });
});
