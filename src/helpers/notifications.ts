import { i18n } from 'boot/i18n';
import { Notify, type QNotifyCreateOptions } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useDialogStateStore } from 'stores/dialog-state';
import { watch } from 'vue';

// 1. Strict allowed types
const allowedTypes = [
  'positive',
  'negative',
  'warning',
  'info',
  'ongoing',
  'primary',
] as const;

// 2. Interface with strict type
interface AllowedNotifyProps {
  actions?: QNotifyCreateOptions['actions'];
  caption?: QNotifyCreateOptions['caption'];
  /**
   * Extra CSS class(es) applied to the notification card itself - mainly
   * useful as a `:has()` hook so a specific dialog can boost the whole
   * (shared, app-wide) `.q-notifications__list` container above itself
   * while one of its own notifications is showing, without affecting
   * notifications everywhere else. See DialogCongregationSwitcher.vue for
   * an example.
   */
  classes?: QNotifyCreateOptions['classes'];
  /**
   * When true, and a dialog (any BaseDialog-registered one, e.g. a picker or
   * the congregation switcher) is open at the moment this is called, hold
   * off actually creating the notification until every open dialog has
   * closed, instead of potentially rendering on top of one - Quasar
   * notifications sit above dialogs in z-index by default, so a
   * notification that happens to fire on the same event that closes a
   * modal (e.g. a congregation-switch side effect racing the congregation
   * switcher's own close) can otherwise visibly stack on top of it.
   *
   * Returns `undefined` immediately when deferring, since the notification
   * (and its dismiss handle) doesn't exist yet - only opt in for
   * notifications whose caller doesn't need that handle.
   */
  deferWhileDialogOpen?: boolean;
  group?: QNotifyCreateOptions['group'];
  icon?: QNotifyCreateOptions['icon'];
  message?: QNotifyCreateOptions['message'];
  noClose?: boolean;
  position?: QNotifyCreateOptions['position'];
  /**
   * When true, this notification is not tracked by
   * dismissAllTemporaryNotifications() and therefore survives events (like
   * switching congregations) that dismiss regular temporary notifications.
   * Use this for app-level notifications (e.g. the updater) that aren't tied
   * to the currently selected congregation.
   */
  protect?: boolean;
  timeout?: QNotifyCreateOptions['timeout'];
  type?: AllowedNotifyType; // 👈 strict union
}

type AllowedNotifyType = (typeof allowedTypes)[number];

// 3. Reject extra keys
type NoExtraKeys<T> = Record<
  Exclude<keyof T, keyof AllowedNotifyProps>,
  never
> &
  T;

// Track all active notification dismiss functions
const activeTemporaryNotifications: (() => void)[] = [];

export const createTemporaryNotification = (
  props: NoExtraKeys<AllowedNotifyProps>,
) => {
  try {
    if (props.deferWhileDialogOpen) {
      const dialogStateStore = useDialogStateStore();
      if (dialogStateStore.isAnyDialogOpen) {
        const stopWaiting = watch(
          () => dialogStateStore.isAnyDialogOpen,
          (stillOpen) => {
            if (stillOpen) return;
            stopWaiting();
            createTemporaryNotification(props);
          },
        );
        return undefined;
      }
    }

    const {
      actions,
      caption,
      classes,
      group,
      icon,
      message,
      noClose = false,
      position = 'top',
      protect = false,
      timeout = 5000,
      type,
    } = props;

    // Runtime safety
    if (type && !allowedTypes.includes(type)) {
      throw new Error(`Unknown notify type: "${type}"`);
    }

    const typeIcons: Record<string, string> = {
      info: 'mmm-info',
      negative: 'mmm-error',
      ongoing: 'mmm-loading',
      positive: 'mmm-check',
      primary: 'mmm-info',
      warning: 'mmm-warning',
    };

    const resolvedIcon = icon ?? (type ? typeIcons[type] : undefined);

    const dismiss = Notify.create({
      group: false,
      message,
      position,
      timeout,
      ...(caption && { caption }),
      ...(classes && { classes }),
      ...(type && { type }),
      ...(resolvedIcon && { icon: resolvedIcon }),
      ...(group && { group }),
      ...(!noClose && {
        actions: actions ?? [
          {
            color: type === 'warning' ? 'dark' : 'white',
            icon: 'close',
            round: true,
          },
        ],
      }),
    });

    // Track the dismiss function if it exists, unless it's protected from
    // being swept up by dismissAllTemporaryNotifications()
    if (dismiss && !protect) {
      activeTemporaryNotifications.push(dismiss);

      // Auto-remove from tracking after timeout (if not indefinite)
      if (timeout > 0) {
        setTimeout(() => {
          const index = activeTemporaryNotifications.indexOf(dismiss);
          if (index > -1) {
            activeTemporaryNotifications.splice(index, 1);
          }
        }, timeout);
      }
    }

    return dismiss;
  } catch (error) {
    errorCatcher(error);
  }
};

/**
 * Checks disk space and warns the user if it's running low. Shared so both
 * the one-time congregation-switch check (DialogCongregationSwitcher.vue)
 * and the periodic during-downloads check (MainLayout.vue, added for BE-8 in
 * full-audit-2026-09-04.md - a user switching congregations with just-enough
 * free space got no further warning even as a long download session kept
 * consuming it) show the exact same warning.
 */
export const checkLowDiskSpaceAndNotify = async (): Promise<void> => {
  if (!globalThis.electronApi) return;
  try {
    const isLowDiskSpace = await globalThis.electronApi.getLowDiskSpaceStatus();
    if (!isLowDiskSpace) return;

    createTemporaryNotification({
      caption: i18n.global.t('low-disk-space-warning'),
      deferWhileDialogOpen: true,
      message: i18n.global.t('disk-space-is-running-low'),
      timeout: 10000,
      type: 'warning',
    });
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'checkLowDiskSpaceAndNotify' } },
    });
  }
};

/**
 * Dismisses all active temporary notifications
 */
export const dismissAllTemporaryNotifications = () => {
  try {
    // Call all dismiss functions
    while (activeTemporaryNotifications.length > 0) {
      const dismiss = activeTemporaryNotifications.pop();
      dismiss?.();
    }
  } catch (error) {
    errorCatcher(error);
  }
};
