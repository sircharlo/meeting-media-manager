import type { ScreenPreferences } from 'src/types';

import { listen } from './ipc';

export const initScreenListeners = () => {
  listen('screenChange', () => {
    window.dispatchEvent(new CustomEvent<undefined>('screen-trigger-update'));
  });

  listen(
    'screenPrefsChange',
    ({ preferredScreenNumber, preferWindowed }: ScreenPreferences) => {
      window.dispatchEvent(
        new CustomEvent<ScreenPreferences>('windowScreen-update', {
          detail: { preferredScreenNumber, preferWindowed },
        }),
      );
    },
  );
};
