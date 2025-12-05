import { Notify, type QNotifyCreateOptions } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';

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
  group?: QNotifyCreateOptions['group'];
  icon?: QNotifyCreateOptions['icon'];
  message?: QNotifyCreateOptions['message'];
  noClose?: boolean;
  position?: QNotifyCreateOptions['position'];
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
    const {
      actions,
      caption,
      group,
      icon,
      message,
      noClose = false,
      position = 'top',
      timeout = 5000,
      type,
    } = props;

    // Runtime safety
    if (type && !allowedTypes.includes(type)) {
      throw new Error(`Unknown notify type: "${type}"`);
    }

    const dismiss = Notify.create({
      group: false,
      message,
      position,
      timeout,
      ...(caption && { caption }),
      ...(type && { type }),
      ...(icon && { icon }),
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

    // Track the dismiss function if it exists
    if (dismiss) {
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
