import type { DateInfo, MediaItem } from 'src/types';

import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import MediaMoveMenuItem from '../MediaMoveMenuItem.vue';

installQuasarPlugin();
installPinia();

const CONGREGATION_ID = 'test-cong';

const item = (uniqueId: string): MediaItem => ({
  title: uniqueId,
  type: 'media',
  uniqueId,
});

// A day with no meeting (no meeting days are configured in these tests), so
// every section of it is shown, in stored order.
const setUpDay = () => {
  const currentState = useCurrentStateStore();
  currentState.currentCongregation = CONGREGATION_ID;
  currentState.selectedDate = '2026-11-18';

  const jwStore = useJwStore();
  jwStore.lookupPeriod[CONGREGATION_ID] = [
    {
      date: new Date('2026-11-18T00:00:00'),
      mediaSections: [
        {
          config: { label: 'Section A', uniqueId: 'custom-a' },
          items: [item('a1'), item('a2')],
        },
        {
          config: { label: 'Section B', uniqueId: 'custom-b' },
          items: [item('b1')],
        },
        {
          config: { label: 'Section C', uniqueId: 'custom-c' },
          items: [],
        },
      ],
      status: 'complete',
    } as unknown as DateInfo,
  ];
};

const sectionItemIds = () =>
  useCurrentStateStore().selectedDateObject?.mediaSections.map((section) =>
    section.items?.map((media) => media.uniqueId),
  );

// q-menu teleports its content to document.body, outside the wrapper.
const menuLabels = () =>
  [
    ...document.body.querySelectorAll<HTMLElement>('.q-menu .q-item__label'),
  ].map((el) => el.textContent?.trim());

const findMenuItem = (label: string) =>
  [...document.body.querySelectorAll<HTMLElement>('.q-menu .q-item__label')]
    .find((el) => el.textContent?.trim() === label)
    ?.closest<HTMLElement>('.q-item');

const openSubmenu = async (wrapper: ReturnType<typeof mount>) => {
  await wrapper.get('.q-item').trigger('click');
  await nextTick();
  await nextTick();
};

describe('MediaMoveMenuItem', () => {
  beforeEach(setUpDay);

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it("offers Move up/Move down and the item's other sections in one Move submenu", async () => {
    const wrapper = mount(MediaMoveMenuItem, {
      attachTo: document.body,
      props: {
        canMoveDown: true,
        canMoveUp: false,
        mediaIds: ['a1'],
        reorder: true,
      },
    });

    expect(wrapper.text()).toContain('Move');
    await openSubmenu(wrapper);

    expect(menuLabels()).toEqual([
      'Move up',
      'Move down',
      'Move to section',
      'Section B',
      'Section C',
    ]);
    expect(findMenuItem('Move up')?.getAttribute('aria-disabled')).toBe('true');

    findMenuItem('Move down')?.click();
    await nextTick();
    expect(wrapper.emitted('move')).toEqual([[1]]);

    wrapper.unmount();
  });

  it('moves the item to the end of the chosen section', async () => {
    const wrapper = mount(MediaMoveMenuItem, {
      attachTo: document.body,
      props: { mediaIds: ['a1'], reorder: true },
    });
    await openSubmenu(wrapper);

    findMenuItem('Section B')?.click();
    await nextTick();

    expect(sectionItemIds()).toEqual([['a2'], ['b1', 'a1'], []]);

    wrapper.unmount();
  });

  it("only reorders a group's child, which never leaves its group", async () => {
    const wrapper = mount(MediaMoveMenuItem, {
      attachTo: document.body,
      props: {
        canMoveDown: true,
        canMoveUp: true,
        mediaIds: [],
        reorder: true,
      },
    });
    await openSubmenu(wrapper);

    expect(menuLabels()).toEqual(['Move up', 'Move down']);

    wrapper.unmount();
  });

  it('gathers a multi-selection spread over two sections into either one', async () => {
    const wrapper = mount(MediaMoveMenuItem, {
      attachTo: document.body,
      props: { mediaIds: ['b1', 'a2'] },
    });

    expect(wrapper.text()).toContain('Move to section');
    await openSubmenu(wrapper);

    expect(menuLabels()).toEqual(['Section A', 'Section B', 'Section C']);

    findMenuItem('Section B')?.click();
    await nextTick();

    expect(sectionItemIds()).toEqual([['a1'], ['b1', 'a2'], []]);

    wrapper.unmount();
  });

  it('leaves out the section that already holds every selected item', async () => {
    const wrapper = mount(MediaMoveMenuItem, {
      attachTo: document.body,
      props: { mediaIds: ['a1', 'a2'] },
    });
    await openSubmenu(wrapper);

    expect(menuLabels()).toEqual(['Section B', 'Section C']);

    wrapper.unmount();
  });

  it('renders nothing when a selection has nothing that can move', () => {
    const wrapper = mount(MediaMoveMenuItem, {
      props: { mediaIds: ['not-on-this-day'] },
    });

    expect(wrapper.find('.q-item').exists()).toBe(false);
  });
});
