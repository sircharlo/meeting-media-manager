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
        label: 'Show media window',
      },
    ],
    caption:
      'You can show the media window manually from the Display menu or by clicking the “Show media window” button.',
    message: 'Media window automatically hidden',
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
