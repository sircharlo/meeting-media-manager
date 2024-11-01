import type { ScreenPreferences } from 'src/types';

import { errorCatcher } from '../utils';
import { listen, send } from './ipc';

export const initScreenListeners = () => {
  listen('screenChange', () => {
    window.dispatchEvent(new CustomEvent('screen-trigger-update'));
  });

  listen(
    'screenPrefsChange',
    ({ preferredScreenNumber, preferWindowed }: ScreenPreferences) => {
      window.dispatchEvent(
        new CustomEvent('windowScreen-update', {
          detail: { preferredScreenNumber, preferWindowed },
        }),
      );
    },
  );
};

export const moveMediaWindow = (
  targetScreenNumber?: number,
  windowedMode?: boolean,
  noEvent?: boolean,
) => {
  if (targetScreenNumber === undefined || windowedMode === undefined) {
    try {
      const screenPreferences: Partial<ScreenPreferences> =
        JSON.parse(window.localStorage.getItem('app-settings') ?? '{}')
          ?.screenPreferences || {};
      targetScreenNumber = screenPreferences.preferredScreenNumber;
      windowedMode = screenPreferences.preferWindowed;
    } catch (err) {
      errorCatcher(err);
    }
  }

  send(
    'moveMediaWindow',
    targetScreenNumber,
    windowedMode === undefined ? undefined : !windowedMode,
    noEvent,
  );
};
