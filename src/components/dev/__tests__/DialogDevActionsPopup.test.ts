import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useDevBus } from 'src/helpers/dev-bus';
import { devMeetingOverride } from 'src/helpers/dev-state';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import DialogDevActionsPopup from '../DialogDevActionsPopup.vue';

// Ending a faked meeting fetches the week's media again: not from here.
vi.mock('src/helpers/date', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  updateLookupPeriod: vi.fn(),
}));
vi.mock('src/helpers/jw-media', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  fetchMedia: vi.fn(),
}));

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'dev-cong';

let wrapper: undefined | VueWrapper;

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  devMeetingOverride.value = null;
  localStorage.clear();
  vi.restoreAllMocks();
});

const mountPopup = async () => {
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: { ...defaultSettings },
  };
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        component: { template: '<div />' },
        name: 'media-calendar',
        path: '/media-calendar/:typeOfLoad?',
      },
    ],
  });
  await router.push('/media-calendar');
  wrapper = mount(DialogDevActionsPopup, {
    global: {
      plugins: [router],
      stubs: { ZoomSelfTestPanel: true },
    },
    props: { modelValue: true },
  });
  await flushPromises();
};

// QMenu teleports its content to document.body, outside the wrapper's tree.
const getStatus = () => document.querySelector('.action-popup__status');
const getItem = (label: string) =>
  [...document.querySelectorAll<HTMLElement>('.q-item')].find(
    (item) =>
      item.querySelector('.q-item__label')?.textContent?.trim() === label,
  );
const isGroupOpen = (label: string) =>
  !!getItem(label)
    ?.closest('.q-expansion-item')
    ?.classList.contains('q-expansion-item--expanded');
// Unmounted mid-slide, Quasar's slide transition cancels its animation, which
// happy-dom reports as an unhandled rejection: let it end first.
const openGroup = async (label: string) => {
  getItem(label)?.click();
  await new Promise((resolve) => {
    setTimeout(resolve, 400);
  });
  await flushPromises();
};

describe('DialogDevActionsPopup', () => {
  it('lists every group, with the meeting times open at first', async () => {
    await mountPopup();

    for (const group of [
      'Meeting time',
      'Downloads',
      'Updates',
      'Zoom',
      'Demo mode',
    ]) {
      expect(getItem(group)).toBeDefined();
    }
    expect(isGroupOpen('Meeting time')).toBe(true);
    expect(isGroupOpen('Crashes and windows')).toBe(false);
    expect(getStatus()?.textContent).toContain('Nothing faked');
  });

  it('says what it fakes once an action runs, until it is all undone', async () => {
    await mountPopup();

    getItem('Starts in 10 minutes')?.click();
    await flushPromises();

    expect(devMeetingOverride.value).not.toBeNull();
    expect(getStatus()?.textContent).toContain('Faking: Midweek meeting today');

    const footerButton = document.querySelector<HTMLButtonElement>(
      '.action-popup__footer .q-btn',
    );
    footerButton?.click();
    await flushPromises();

    expect(devMeetingOverride.value).toBeNull();
    expect(getStatus()?.textContent).toContain('Nothing faked');
  });

  it('closes before an action that opens something of its own', async () => {
    await mountPopup();
    const shown = vi.fn();
    useDevBus().on(shown);
    await openGroup('Prompts and tours');

    getItem('Quick-start tour')?.click();
    await flushPromises();

    expect(shown.mock.calls[0]?.[0]).toEqual({
      type: 'replay-quick-start-tour',
    });
    expect(wrapper?.emitted('update:modelValue')?.at(-1)).toEqual([false]);
    useDevBus().off(shown);
  });

  it('remembers which groups the developer keeps open', async () => {
    await mountPopup();
    await openGroup('Crashes and windows');
    wrapper?.unmount();
    document.body.innerHTML = '';

    await mountPopup();

    expect(isGroupOpen('Crashes and windows')).toBe(true);
    expect(isGroupOpen('Meeting time')).toBe(true);
  });
});
