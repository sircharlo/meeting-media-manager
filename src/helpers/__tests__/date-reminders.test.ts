import type { QNotifyCreateOptions } from 'quasar';

import { createTestingPinia } from '@pinia/testing';
import { i18n } from 'boot/i18n';
import { setActivePinia } from 'pinia';
import {
  markSetUpThisSession,
  resetFeatureNudgeSession,
} from 'src/helpers/feature-nudges';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type DateReminder,
  isDateReminderSilenced,
  notifyDateReminder,
  pendingDateReminders,
  resetDateRemindersClosedThisSession,
  showDateReminder,
  snoozeDateReminder,
  takePendingDateReminders,
} from '../date-reminders';

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

const meeting = vi.hoisted(() => ({ start: null as Date | null }));

vi.mock('src/helpers/date', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getMeetingStartToday: () => meeting.start,
}));

type NotifyAction = NonNullable<QNotifyCreateOptions['actions']>[number];

const CONGREGATION_ID = 'test-cong';

const reminder = (overrides: Partial<DateReminder> = {}): DateReminder => ({
  caption: 'caption',
  congId: CONGREGATION_ID,
  id: 'coWeek',
  message: 'message',
  onGoToSettings: vi.fn(),
  ...overrides,
});

// The reminder as a notification (see notifyDateReminder).
const show = (onGoToSettings = vi.fn()) => {
  notifyDateReminder(reminder({ onGoToSettings }));
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
    resetFeatureNudgeSession();
    meeting.start = null;
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

describe('showDateReminder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-25T10:00:00'));
    setActivePinia(
      createTestingPinia({ createSpy: vi.fn, stubActions: false }),
    );
    resetDateRemindersClosedThisSession();
    resetFeatureNudgeSession();
    meeting.start = null;
    vi.mocked(createTemporaryNotification).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Shown over the whole window (DialogMissingDates), all together.
  it('keeps the missing dates for the full-screen reminder when there is time', () => {
    showDateReminder(reminder());
    showDateReminder(reminder({ id: 'memorialDate' }));
    showDateReminder(reminder());

    expect(createTemporaryNotification).not.toHaveBeenCalled();
    expect(pendingDateReminders.value.map(({ id }) => id)).toEqual([
      'coWeek',
      'memorialDate',
    ]);
  });

  it.each([
    [
      'shortly before a meeting',
      () => {
        meeting.start = new Date('2026-11-25T10:10:00');
      },
    ],
    [
      'in the session the profile was set up in',
      () => {
        markSetUpThisSession(CONGREGATION_ID);
      },
    ],
  ])('notifies instead %s', (_, arrange) => {
    arrange();

    showDateReminder(reminder());

    expect(createTemporaryNotification).toHaveBeenCalledOnce();
    expect(pendingDateReminders.value).toEqual([]);
  });

  it("hands over the profile's reminders, dropping another profile's", () => {
    showDateReminder(reminder());
    showDateReminder(reminder({ congId: 'other-cong' }));

    expect(takePendingDateReminders(CONGREGATION_ID)).toHaveLength(1);
    expect(pendingDateReminders.value).toEqual([]);
  });
});
