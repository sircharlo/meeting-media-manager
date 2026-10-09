import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { describe, expect, it } from 'vitest';

import MediaDivider from '../MediaDivider.vue';

installQuasarPlugin();
installPinia();

const mockDivider = {
  section: 'tgw' as const,
  sortOrderOriginal: 0,
  title: 'Test Divider',
  uniqueId: 'test-divider-1',
};

// UX-6 (full-audit-2026-09-04.md): reordering was previously drag-and-drop
// only (a pointer-driven handle with no tabindex/keyboard handler) - these
// always-visible buttons are the keyboard-accessible alternative.
describe('MediaDivider move-up/move-down', () => {
  it('disables move-up when canMoveUp is false and emits move(-1) when enabled', async () => {
    const wrapper = mount(MediaDivider, {
      props: { canMoveUp: false, divider: mockDivider },
    });

    const moveUpButton = wrapper.get('button[aria-label="Move up"]');
    expect(moveUpButton.attributes('disabled')).toBeDefined();

    await wrapper.setProps({ canMoveUp: true });
    await wrapper.get('button[aria-label="Move up"]').trigger('click');

    expect(wrapper.emitted('move')).toEqual([[-1]]);
  });

  it('disables move-down when canMoveDown is false and emits move(1) when enabled', async () => {
    const wrapper = mount(MediaDivider, {
      props: { canMoveDown: false, divider: mockDivider },
    });

    const moveDownButton = wrapper.get('button[aria-label="Move down"]');
    expect(moveDownButton.attributes('disabled')).toBeDefined();

    await wrapper.setProps({ canMoveDown: true });
    await wrapper.get('button[aria-label="Move down"]').trigger('click');

    expect(wrapper.emitted('move')).toEqual([[1]]);
  });
});
