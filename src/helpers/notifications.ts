import { Notify, type QNotifyCreateOptions } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';

export const createTemporaryNotification = ({
  actions,
  badgeStyle,
  caption,
  color,
  group,
  icon,
  message,
  noClose = false,
  position,
  textColor,
  timeout = 5000,
  type,
}: QNotifyCreateOptions & { noClose?: boolean }) => {
  try {
    return Notify.create({
      // actions: [
      //   {
      //     color: 'white',
      //     icon: 'mmm-minus',
      //     round: true,
      //   },
      // ],
      group: false,
      message,
      timeout,
      ...(caption && { caption }),
      ...(color && { color }),
      ...(textColor && { textColor }),
      ...(type && { type }),
      ...(icon && { icon }),
      ...(group && { group }),
      ...(badgeStyle && { badgeStyle }),
      ...(!noClose && {
        actions: actions || [
          {
            color: 'white',
            icon: 'close',
            round: true,
          },
        ],
      }),
      position: position || 'top',
    });
  } catch (error) {
    errorCatcher(error);
  }
};
