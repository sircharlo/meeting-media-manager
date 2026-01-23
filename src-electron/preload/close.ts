import { captureElectronError } from 'app/src-electron/main/utils';
import { listen, send } from 'src-electron/preload/ipc';

export const initCloseListeners = () => {
  const bcClose = new BroadcastChannel('closeAttempts');
  listen('attemptedClose', () => {
    try {
      bcClose.postMessage({ attemptedClose: true });
    } catch (error) {
      captureElectronError(error, {
        contexts: {
          fn: {
            name: 'initCloseListeners',
          },
        },
      });
    }
  });

  bcClose.onmessage = (event) => {
    try {
      if (event.data.authorizedClose) send('authorizedClose');
    } catch (error) {
      captureElectronError(error, {
        contexts: {
          fn: {
            name: 'initCloseListeners',
          },
        },
      });
    }
  };
};
