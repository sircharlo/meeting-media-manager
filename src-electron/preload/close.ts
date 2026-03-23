import { listen, send } from 'src-electron/preload/ipc';
import { capturePreloadError } from 'src-electron/preload/log';

export const initCloseListeners = () => {
  const bcClose = new BroadcastChannel('closeAttempts');
  listen('attemptedClose', () => {
    try {
      bcClose.postMessage({ attemptedClose: true });
    } catch (error) {
      capturePreloadError(error, {
        contexts: {
          fn: {
            name: 'initCloseListeners attemptedClose',
          },
        },
      });
    }
  });

  bcClose.onmessage = (event) => {
    try {
      if (event.data.authorizedClose) send('authorizedClose');
    } catch (error) {
      capturePreloadError(error, {
        contexts: {
          fn: {
            name: 'initCloseListeners authorizedClose',
          },
        },
      });
    }
  };
};
