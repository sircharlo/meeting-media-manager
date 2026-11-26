import type { DateReminderId } from 'src/types';

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import {
  isDateReminderSilenced,
  resetDateRemindersClosedThisSession,
  showDateReminder,
} from 'src/helpers/date-reminders';
import { resetFeatureNudgeSession } from 'src/helpers/feature-nudges';
import { createTemporaryNotification } from 'src/helpers/notifications';
import en from 'src/i18n/en.json';
import { useAttentionStore } from 'stores/attention';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import DialogMissingDates from '../DialogMissingDates.vue';

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

vi.mock('src/helpers/date', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getMeetingStartToday: () => null,
}));

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'dates-cong';
const CO_MESSAGE = "The date of the circuit overseer's visit is not set";
const MEMORIAL_MESSAGE = 'The date of the Memorial is not set';

let wrapper: undefined | VueWrapper;
let router: Router;
const goneTo: string[] = [];

const remind = (id: DateReminderId) => {
  showDateReminder({
    caption: `For best results, add the ${id} date.`,
    congId: CONGREGATION_ID,
    id,
    message: id === 'coWeek' ? CO_MESSAGE : MEMORIAL_MESSAGE,
    onGoToSettings: () => {
      goneTo.push(id);
    },
  });
};

const mountScreen = async (path = '/media-calendar') => {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        component: { template: '<div />' },
        name: 'media-calendar',
        path: '/media-calendar',
      },
      {
        component: { template: '<div />' },
        name: 'settings',
        path: '/settings',
      },
    ],
  });
  await router.push(path);
  wrapper = mount(DialogMissingDates, {
    attachTo: document.body,
    global: { plugins: [router] },
  });
  await flushPromises();
};

const text = () => document.body.textContent ?? '';

// By the button's label alone: an icon's name is in its text too.
const click = async (label: string, nth = 0) => {
  const buttons = Array.from(document.querySelectorAll('button')).filter(
    (el) => el.querySelector('.block')?.textContent?.trim() === label,
  );
  const button = buttons[nth];
  if (!button) throw new Error(`No button labelled "${label}"`);
  button.click();
  await flushPromises();
};

const isShowing = () => useDialogStateStore().isDialogOpen('missing-dates');

beforeEach(() => {
  resetDateRemindersClosedThisSession();
  resetFeatureNudgeSession();
  goneTo.length = 0;
  useDialogStateStore().closeAllDialogs();
  useAttentionStore().claims.clear();
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: { ...defaultSettings },
  };
  useCongregationSettingsStore().dateReminderSnoozes = {};
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('DialogMissingDates', () => {
  it('shows a missing date over the whole window, and opens its setting', async () => {
    await mountScreen();
    remind('coWeek');
    await flushPromises();
    expect(text()).toContain(CO_MESSAGE);
    expect(text()).toContain('For best results, add the coWeek date.');

    await click(en['go-to-settings'].replace('@:settings', 'Settings'));

    expect(goneTo).toEqual(['coWeek']);
    expect(isDateReminderSilenced(CONGREGATION_ID, 'coWeek')).toBe(true);
    expect(isShowing()).toBe(false);
  });

  it('shows both missing dates together, the second joining the first', async () => {
    await mountScreen();
    remind('coWeek');
    await flushPromises();
    // The Memorial's is only known once its dates are fetched.
    remind('memorialDate');
    await flushPromises();

    expect(text()).toContain(en['missing-dates-title']);
    expect(text()).toContain(CO_MESSAGE);
    expect(text()).toContain(MEMORIAL_MESSAGE);

    await click(en['go-to-settings'].replace('@:settings', 'Settings'), 1);
    expect(goneTo).toEqual(['memorialDate']);
    expect(isDateReminderSilenced(CONGREGATION_ID, 'coWeek')).toBe(true);
  });

  it.each([
    [en['remind-me-in-a-month'], '2026-12-26'],
    [en['dismiss-for-6-months'], '2027-05-26'],
  ])('"%s" snoozes every date shown', async (label, until) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-26T10:00:00'));
    await mountScreen();
    remind('coWeek');
    remind('memorialDate');
    await flushPromises();

    await click(label);

    const snoozes =
      useCongregationSettingsStore().dateReminderSnoozes[CONGREGATION_ID];
    expect(snoozes).toEqual({
      coWeek: new Date(`${until}T00:00:00`).getTime(),
      memorialDate: new Date(`${until}T00:00:00`).getTime(),
    });
    expect(isShowing()).toBe(false);
    vi.useRealTimers();
  });

  it('keeps them quiet for the session on "Later"', async () => {
    await mountScreen();
    remind('coWeek');
    await flushPromises();

    await click(en.later);

    expect(isDateReminderSilenced(CONGREGATION_ID, 'coWeek')).toBe(true);
    expect(useCongregationSettingsStore().dateReminderSnoozes).toEqual({});
  });

  it('waits for its turn', async () => {
    useDialogStateStore().openDialog('something-else', 'BaseDialog');
    await mountScreen();
    remind('coWeek');
    await flushPromises();
    expect(isShowing()).toBe(false);

    useDialogStateStore().closeDialog('something-else');
    await flushPromises();
    expect(text()).toContain(CO_MESSAGE);
  });

  // By its turn, the user left the media calendar: a notification instead.
  it('notifies instead when the moment has passed by its turn', async () => {
    useAttentionStore().claim('setup-wizard');
    await mountScreen('/settings');
    remind('coWeek');
    useAttentionStore().release('setup-wizard');
    await flushPromises();

    expect(isShowing()).toBe(false);
    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: CO_MESSAGE }),
    );
  });
});
