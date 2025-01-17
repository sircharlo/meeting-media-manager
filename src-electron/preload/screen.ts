import type { ScreenPreferences } from 'src/types';

import { listen } from 'preload/ipc';

export const initScreenListeners = () => {
  listen('screenChange', () => {
    window.dispatchEvent(new CustomEvent<undefined>('screen-trigger-update'));
  });

  listen('screenPrefsChange', (detail: ScreenPreferences) => {
    window.dispatchEvent(
      new CustomEvent<ScreenPreferences>('windowScreen-update', { detail }),
    );
  });
};
