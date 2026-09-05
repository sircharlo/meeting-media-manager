import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { describe, expect, it } from 'vitest';

import MediaGroup from '../MediaGroup.vue';

installQuasarPlugin();
installPinia();

const mockElement = {
  children: [
    {
      title: 'Child 1',
      type: 'media' as const,
      uniqueId: 'child-1',
    },
  ],
  title: 'Test Group',
  type: 'media' as const,
  uniqueId: 'test-group-1',
};

// UX-6 (full-audit-2026-09-04.md): reordering was previously drag-and-drop
// only (a pointer-driven handle with no tabindex/keyboard handler) - these
// always-visible buttons are the keyboard-accessible alternative for a
// group's own position in the top-level list.
describe('MediaGroup move-up/move-down', () => {
  it('disables move-up when canMoveUp is false and emits move(-1) when enabled', async () => {
    const wrapper = mount(MediaGroup, {
      props: { canMoveUp: false, element: mockElement, expanded: false },
    });

    const moveUpButton = wrapper.get('button[aria-label="Move up"]');
    expect(moveUpButton.attributes('disabled')).toBeDefined();

    await wrapper.setProps({ canMoveUp: true });
    await wrapper.get('button[aria-label="Move up"]').trigger('click');

    expect(wrapper.emitted('move')).toEqual([[-1]]);
  });

  it('disables move-down when canMoveDown is false and emits move(1) when enabled', async () => {
    const wrapper = mount(MediaGroup, {
      props: { canMoveDown: false, element: mockElement, expanded: false },
    });

    const moveDownButton = wrapper.get('button[aria-label="Move down"]');
    expect(moveDownButton.attributes('disabled')).toBeDefined();

    await wrapper.setProps({ canMoveDown: true });
    await wrapper.get('button[aria-label="Move down"]').trigger('click');

    expect(wrapper.emitted('move')).toEqual([[1]]);
  });

  it('does not toggle the expansion panel when clicking a move button', async () => {
    const wrapper = mount(MediaGroup, {
      props: {
        canMoveDown: true,
        canMoveUp: true,
        element: mockElement,
        expanded: false,
      },
    });

    await wrapper.get('button[aria-label="Move up"]').trigger('click');

    expect(wrapper.emitted('update:expanded')).toBeUndefined();
  });
});
