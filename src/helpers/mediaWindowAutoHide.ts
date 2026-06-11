import { i18n } from 'boot/i18n';
import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';

import { toggleMediaWindowVisibility } from './mediaPlayback';
import { createTemporaryNotification } from './notifications';

let shouldAutoHideAfterPlayback = false;

const showAutoHiddenNotification = () => {
  createTemporaryNotification({
    actions: [
      {
        color: 'white',
        handler: () => {
          toggleMediaWindowVisibility(true);
        },
        label: i18n.global.t('show-media-display'),
      },
    ],
    caption: i18n.global.t('media-window-auto-hidden-caption'),
    group: 'mediaWindowAutoHide',
    message: i18n.global.t('media-window-auto-hidden-message'),
    timeout: 10000,
    type: 'info',
  });
};

/**
 * Tracks whether playback temporarily showed a hidden media window and restores
 * that hidden state when playback fully stops.
 */
export const triggerMediaWindowAutoHide = (startPlayback: boolean) => {
  try {
    const currentState = useCurrentStateStore();

    if (startPlayback) {
      shouldAutoHideAfterPlayback = !currentState.mediaWindowVisible;
      log(
        ` [Media window] Auto-hide ${shouldAutoHideAfterPlayback ? 'armed' : 'skipped'} for playback`,
        'mediaPlayback',
        'log',
      );
      return;
    }

    if (!shouldAutoHideAfterPlayback) return;

    shouldAutoHideAfterPlayback = false;

    if (!currentState.mediaWindowVisible) return;

    toggleMediaWindowVisibility(false);
    showAutoHiddenNotification();
  } catch (error) {
    shouldAutoHideAfterPlayback = false;
    errorCatcher(error, {
      contexts: {
        fn: { name: 'triggerMediaWindowAutoHide', startPlayback },
      },
    });
  }
};
