import { enableAutoUnmount, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import MediaGroup from '../MediaGroup.vue';

installQuasarPlugin();
installPinia();

const CONG_ID = '00000000-0000-4000-8000-000000000001';

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

const findMenuItem = (label: string) =>
  [...document.body.querySelectorAll<HTMLElement>('.q-item__label')]
    .find((el) => el.textContent?.trim() === label)
    ?.closest<HTMLElement>('[role="menuitem"]');

// Move up/Move down sit in the "..." menu's "Move" submenu, as on a media
// item.
const openMoveSubmenu = async (wrapper: ReturnType<typeof mount>) => {
  await wrapper.get('button[aria-label="More options"]').trigger('click');
  await nextTick();
  findMenuItem('Move')?.click();
  await nextTick();
  await nextTick();
};

// UX-6 (full-audit-2026-09-04.md): reordering was previously drag-and-drop
// only (a pointer-driven handle with no tabindex/keyboard handler). The
// keyboard-accessible alternative for a group's own position in the
// top-level list was two header buttons; it's now the "..." menu, like a
// media item's, since those buttons looked just like the expand chevron.
describe('MediaGroup header actions', () => {
  // q-menu teleports its content to document.body: the menu tests attach
  // there to reach it, so clear it between tests.
  afterEach(() => {
    document.body.innerHTML = '';
  });
  // Unmounting clears an open menu's transition timer (see MediaItem.test).
  // Registered after the hook above so it runs first.
  enableAutoUnmount(afterEach);

  it('has no separate move buttons in the header', () => {
    const wrapper = mount(MediaGroup, {
      props: {
        canMoveDown: true,
        canMoveUp: true,
        element: mockElement,
        expanded: false,
      },
    });

    expect(wrapper.find('button[aria-label="Move up"]').exists()).toBe(false);
    expect(wrapper.find('button[aria-label="Move down"]').exists()).toBe(false);
    expect(wrapper.find('button[aria-label="More options"]').exists()).toBe(
      true,
    );
  });

  it('disables Move up but not Move down per canMoveUp/canMoveDown, and emits move() on click', async () => {
    const wrapper = mount(MediaGroup, {
      attachTo: document.body,
      props: {
        canMoveDown: true,
        canMoveUp: false,
        element: mockElement,
        expanded: false,
      },
    });

    await openMoveSubmenu(wrapper);

    const moveUpItem = findMenuItem('Move up');
    const moveDownItem = findMenuItem('Move down');

    expect(moveUpItem?.getAttribute('aria-disabled')).toBe('true');
    expect(moveDownItem?.getAttribute('aria-disabled')).toBeNull();

    moveDownItem?.click();
    await nextTick();

    expect(wrapper.emitted('move')).toEqual([[1]]);
  });

  it('disables Move down at the end of the list and emits move(-1) for Move up', async () => {
    const wrapper = mount(MediaGroup, {
      attachTo: document.body,
      props: {
        canMoveDown: false,
        canMoveUp: true,
        element: mockElement,
        expanded: false,
      },
    });

    await openMoveSubmenu(wrapper);

    expect(findMenuItem('Move down')?.getAttribute('aria-disabled')).toBe(
      'true',
    );

    findMenuItem('Move up')?.click();
    await nextTick();

    expect(wrapper.emitted('move')).toEqual([[-1]]);
  });

  it('does not toggle the expansion panel when clicking the "..." button', async () => {
    const wrapper = mount(MediaGroup, {
      attachTo: document.body,
      props: {
        canMoveDown: true,
        canMoveUp: true,
        element: mockElement,
        expanded: false,
      },
    });

    await wrapper.get('button[aria-label="More options"]').trigger('click');

    expect(wrapper.emitted('update:expanded')).toBeUndefined();
  });

  it.each([false, true])(
    'shows the drag icon only when the "show drag handle" setting is on (%s)',
    (showMediaDragHandle) => {
      useCongregationSettingsStore().congregations = {
        [CONG_ID]: { ...defaultSettings, showMediaDragHandle },
      };
      useCurrentStateStore().currentCongregation = CONG_ID;

      const wrapper = mount(MediaGroup, {
        props: { element: mockElement, expanded: false },
      });

      expect(
        wrapper.find('.group-header-actions .media-drag-handle').exists(),
      ).toBe(showMediaDragHandle);
    },
  );

  // The whole header is the group's drag handle, like a media item's row,
  // since the drag icon can be turned off.
  it('makes the whole header the drag handle', () => {
    const wrapper = mount(MediaGroup, {
      props: { element: mockElement, expanded: false },
    });

    const header = wrapper.get('.q-expansion-item__container > .q-item');
    expect(header.classes()).toContain('section-drag-handle');
  });
});
