import type { DateReminderId } from 'src/types';

import { i18n } from 'boot/i18n';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { addToDate } from 'src/utils/date';
import { useCongregationSettingsStore } from 'stores/congregation-settings';

const DATE_REMINDER_TIMEOUT_MS = 30_000;

/**
 * Reminders closed with their close button, per profile: they stay quiet
 * until M³ restarts.
 */
const closedThisSession = new Set<string>();

const getSessionKey = (congId: string, id: DateReminderId) => `${congId}:${id}`;

/** Forgets the reminders closed this session (for tests). */
export const resetDateRemindersClosedThisSession = () => {
  closedThisSession.clear();
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

/**
 * Reminds the user to add a special date that isn't set, with a button to
 * open the setting, two to snooze the reminder (a month, or 6 months: the
 * date is often not known yet right after it's needed), and a close button
 * that keeps it quiet for the rest of the session.
 */
export const showDateReminder = ({
  caption,
  congId,
  id,
  message,
  onGoToSettings,
}: {
  caption: string;
  congId: string;
  id: DateReminderId;
  message: string;
  onGoToSettings: () => void;
}) => {
  const { t } = i18n.global;
  const closeForSession = () => {
    closedThisSession.add(getSessionKey(congId, id));
  };
  // Until the start of that day (addToDate drops the time of day), so it
  // comes back at the first launch that day.
  const snoozeForMonths = (months: number) => () => {
    snoozeDateReminder(congId, id, addToDate(new Date(), { months }));
  };

  createTemporaryNotification({
    actions: [
      {
        color: 'white',
        handler: () => {
          closeForSession();
          onGoToSettings();
        },
        label: t('go-to-settings'),
      },
      {
        color: 'white',
        handler: snoozeForMonths(1),
        label: t('remind-me-in-a-month'),
      },
      {
        color: 'white',
        handler: snoozeForMonths(6),
        label: t('dismiss-for-6-months'),
      },
      { color: 'white', handler: closeForSession, icon: 'close', round: true },
    ],
    caption,
    // This can fire right as the congregation switcher modal is closing
    // (both react to the same congregation switch) - deferWhileDialogOpen
    // holds it back until nothing is open, rather than it stacking visually
    // on top of a still-open/closing modal.
    deferWhileDialogOpen: true,
    message,
    timeout: DATE_REMINDER_TIMEOUT_MS,
    type: 'warning',
  });
};
