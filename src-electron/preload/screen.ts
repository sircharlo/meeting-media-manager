import type { ScreenPreferences } from 'src/types';

import { listen } from 'src-electron/preload/ipc';

export const initScreenListeners = () => {
  listen('screenChange', () => {
    globalThis.dispatchEvent(
      new CustomEvent<undefined>('screen-trigger-update'),
    );
  });

  listen('screenPrefsChange', (detail: ScreenPreferences) => {
    globalThis.dispatchEvent(
      new CustomEvent<ScreenPreferences>('windowScreen-update', { detail }),
    );
  });
};
