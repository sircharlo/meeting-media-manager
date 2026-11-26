import type { DateReminderId } from 'src/types';

import { i18n } from 'boot/i18n';
import {
  isOutsideMeetingTime,
  wasSetUpThisSession,
} from 'src/helpers/feature-nudges';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { addToDate } from 'src/utils/date';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { ref } from 'vue';

const DATE_REMINDER_TIMEOUT_MS = 30_000;

/** A reminder to add a special date that isn't set (see showDateReminder). */
export interface DateReminder {
  /** What adding it does, e.g. "For best results, add the date of…". */
  caption: string;
  congId: string;
  id: DateReminderId;
  /** What's missing, e.g. "The date of the Memorial is not set". */
  message: string;
  /** Opens the date's setting. */
  onGoToSettings: () => void;
}

/**
 * Reminders closed with their close button, per profile: they stay quiet
 * until M³ restarts.
 */
const closedThisSession = new Set<string>();

const getSessionKey = (congId: string, id: DateReminderId) => `${congId}:${id}`;

/**
 * The reminders waiting to show over the whole window, all of a profile's
 * together (see DialogMissingDates, which takes them once it's its turn).
 */
export const pendingDateReminders = ref<DateReminder[]>([]);

/** Forgets the reminders closed this session (for tests). */
export const resetDateRemindersClosedThisSession = () => {
  closedThisSession.clear();
  pendingDateReminders.value = [];
};

/**
 * Whether a profile's reminder to add a special date should stay quiet: it
 * was closed this session, or snoozed until a time still to come.
 */
export const isDateReminderSilenced = (
  congId: string,
  id: DateReminderId,
): boolean => {
  if (closedThisSession.has(getSessionKey(congId, id))) return true;
  const snoozedUntil =
    useCongregationSettingsStore().dateReminderSnoozes[congId]?.[id];
  return !!snoozedUntil && snoozedUntil > Date.now();
};

/**
 * Keeps a profile's reminder to add a special date quiet until `until`
 * (never shortening a longer snooze). Nothing is stored for a time already
 * past.
 */
export const snoozeDateReminder = (
  congId: string,
  id: DateReminderId,
  until: Date,
) => {
  if (until.getTime() <= Date.now()) return;
  useCongregationSettingsStore().snoozeDateReminder(
    congId,
    id,
    until.getTime(),
  );
};

/** Keeps a reminder quiet for the rest of the session. */
export const closeDateReminderForSession = ({ congId, id }: DateReminder) => {
  closedThisSession.add(getSessionKey(congId, id));
};

/**
 * Keeps a reminder quiet for `months`, until the start of that day
 * (addToDate drops the time of day), so it comes back at the first launch
 * that day. The date is often not known yet right after it's needed.
 */
export const snoozeDateReminderForMonths = (
  { congId, id }: DateReminder,
  months: number,
) => {
  snoozeDateReminder(congId, id, addToDate(new Date(), { months }));
};

/** Opens the reminder's setting, keeping it quiet for the session. */
export const goToDateReminderSetting = (reminder: DateReminder) => {
  closeDateReminderForSession(reminder);
  reminder.onGoToSettings();
};

/**
 * Whether a reminder may show over the whole window now: not from shortly
 * before the meeting until it ends (the operator is busy then; M³ is often
 * started on the hall's computer just before the meeting), not in the
 * session the profile was set up in, and not while media shows.
 */
export const canShowDateRemindersFullScreen = (congId: string) =>
  isOutsideMeetingTime() &&
  !wasSetUpThisSession(congId) &&
  !useCurrentStateStore().mediaPlaying.url;

/**
 * The reminder as a notification, with a button to open the setting, two to
 * snooze it (a month, or 6 months), and a close button that keeps it quiet
 * for the rest of the session.
 */
export const notifyDateReminder = (reminder: DateReminder) => {
  const { t } = i18n.global;
  createTemporaryNotification({
    actions: [
      {
        color: 'white',
        handler: () => {
          goToDateReminderSetting(reminder);
        },
        label: t('go-to-settings'),
      },
      {
        color: 'white',
        handler: () => {
          snoozeDateReminderForMonths(reminder, 1);
        },
        label: t('remind-me-in-a-month'),
      },
      {
        color: 'white',
        handler: () => {
          snoozeDateReminderForMonths(reminder, 6);
        },
        label: t('dismiss-for-6-months'),
      },
      {
        color: 'white',
        handler: () => {
          closeDateReminderForSession(reminder);
        },
        icon: 'close',
        round: true,
      },
    ],
    caption: reminder.caption,
    // This can fire right as the congregation switcher modal is closing
    // (both react to the same congregation switch) - deferWhileDialogOpen
    // holds it back until nothing is open, rather than it stacking visually
    // on top of a still-open/closing modal.
    deferWhileDialogOpen: true,
    message: reminder.message,
    timeout: DATE_REMINDER_TIMEOUT_MS,
    type: 'warning',
  });
};

/**
 * Reminds the user to add a special date that isn't set: over the whole
 * window when there's time for it (see canShowDateRemindersFullScreen), all
 * of the profile's missing dates together (DialogMissingDates), else as a
 * notification (notifyDateReminder). Both offer the same choices.
 */
export const showDateReminder = (reminder: DateReminder) => {
  if (!canShowDateRemindersFullScreen(reminder.congId)) {
    notifyDateReminder(reminder);
    return;
  }
  const alreadyPending = pendingDateReminders.value.some(
    ({ congId, id }) => congId === reminder.congId && id === reminder.id,
  );
  if (!alreadyPending) {
    pendingDateReminders.value = [...pendingDateReminders.value, reminder];
  }
};

/**
 * Takes the pending reminders, for DialogMissingDates to show: those of
 * `congId` (the others are for a profile no longer open, and are dropped:
 * its next load checks again).
 */
export const takePendingDateReminders = (congId: string) => {
  const taken = pendingDateReminders.value.filter(
    (reminder) => reminder.congId === congId,
  );
  pendingDateReminders.value = [];
  return taken;
};
