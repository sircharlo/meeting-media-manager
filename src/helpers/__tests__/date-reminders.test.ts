import type { QNotifyCreateOptions } from 'quasar';

import { createTestingPinia } from '@pinia/testing';
import { i18n } from 'boot/i18n';
import { setActivePinia } from 'pinia';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isDateReminderSilenced,
  resetDateRemindersClosedThisSession,
  showDateReminder,
  snoozeDateReminder,
} from '../date-reminders';

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

type NotifyAction = NonNullable<QNotifyCreateOptions['actions']>[number];

const CONGREGATION_ID = 'test-cong';

const show = (onGoToSettings = vi.fn()) => {
  showDateReminder({
    caption: 'caption',
    congId: CONGREGATION_ID,
    id: 'coWeek',
    message: 'message',
    onGoToSettings,
  });
  const [[options]] = vi.mocked(createTemporaryNotification).mock.calls as [
    [{ actions: NotifyAction[] }],
  ];
  return options.actions;
};

const findAction = (actions: NotifyAction[], labelKey: string) =>
  actions.find((action) => action.label === i18n.global.t(labelKey));

const closeButton = (actions: NotifyAction[]) =>
  actions.find((action) => action.icon === 'close');

const silenced = (congId = CONGREGATION_ID, id = 'coWeek' as const) =>
  isDateReminderSilenced(congId, id);

describe('date reminders', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-25T10:00:00'));
    setActivePinia(
      createTestingPinia({ createSpy: vi.fn, stubActions: false }),
    );
    resetDateRemindersClosedThisSession();
    vi.mocked(createTemporaryNotification).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is not silenced by default', () => {
    expect(silenced()).toBe(false);
  });

  it('stays quiet until a snooze runs out', () => {
    snoozeDateReminder(
      CONGREGATION_ID,
      'coWeek',
      new Date('2026-12-01T10:00:00'),
    );
    expect(silenced()).toBe(true);
    expect(isDateReminderSilenced(CONGREGATION_ID, 'memorialDate')).toBe(false);
    expect(silenced('other-cong')).toBe(false);

    vi.setSystemTime(new Date('2026-12-01T10:00:01'));
    expect(silenced()).toBe(false);
  });

  it('stores nothing for a snooze already over', () => {
    snoozeDateReminder(
      CONGREGATION_ID,
      'coWeek',
      new Date('2026-11-01T10:00:00'),
    );
    expect(useCongregationSettingsStore().dateReminderSnoozes).toEqual({});
  });

  it('shows a warning with the settings, snooze and close buttons', () => {
    const actions = show();

    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: 'caption',
        deferWhileDialogOpen: true,
        message: 'message',
        type: 'warning',
      }),
    );
    expect(actions.map((action) => action.label ?? action.icon)).toEqual([
      i18n.global.t('go-to-settings'),
      i18n.global.t('remind-me-in-a-month'),
      i18n.global.t('dismiss-for-6-months'),
      'close',
    ]);
  });

  it('closing it keeps it quiet for this profile, until M³ restarts', () => {
    closeButton(show())?.handler?.();

    expect(silenced()).toBe(true);
    expect(isDateReminderSilenced(CONGREGATION_ID, 'memorialDate')).toBe(false);
    expect(silenced('other-cong')).toBe(false);
    expect(useCongregationSettingsStore().dateReminderSnoozes).toEqual({});

    resetDateRemindersClosedThisSession();
    expect(silenced()).toBe(false);
  });

  it('opens the setting, and keeps it quiet for the session', () => {
    const onGoToSettings = vi.fn();
    findAction(show(onGoToSettings), 'go-to-settings')?.handler?.();

    expect(onGoToSettings).toHaveBeenCalledOnce();
    expect(silenced()).toBe(true);
  });

  it.each([
    ['remind-me-in-a-month', '2026-12-25T00:00:00'],
    ['dismiss-for-6-months', '2027-05-25T00:00:00'],
  ])('%s keeps it quiet until %s', (labelKey, until) => {
    findAction(show(), labelKey)?.handler?.();
    resetDateRemindersClosedThisSession();

    expect(
      useCongregationSettingsStore().dateReminderSnoozes[CONGREGATION_ID]
        ?.coWeek,
    ).toBe(new Date(until).getTime());

    vi.setSystemTime(new Date(new Date(until).getTime() - 1000));
    expect(silenced()).toBe(true);
    vi.setSystemTime(new Date(new Date(until).getTime() + 1000));
    expect(silenced()).toBe(false);
  });
});
