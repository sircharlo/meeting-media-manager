import { Notify } from 'quasar';
import { NOTICE_ICONS } from 'src/constants/notices';

/**
 * The toast types createTemporaryNotification offers, besides Quasar's own
 * 'ongoing' (grey, with a spinner), which stays as it is.
 */
export const NOTICE_TOAST_TYPES = [
  'positive',
  'info',
  'warning',
  'negative',
] as const;

// In place of Quasar's own looks: the .bg-notice-* solid fills (app.scss),
// with white text, actions and close buttons on every one of them, and the
// type's own icon. Registered as this module loads, before any boot file
// runs, so even a toast from a boot file has them.
for (const type of NOTICE_TOAST_TYPES) {
  Notify.registerType(type, {
    color: `notice-${type}`,
    icon: NOTICE_ICONS[type],
    textColor: 'white',
  });
}
