import { listen, send } from 'preload/ipc';

const bcClose = new BroadcastChannel('closeAttempts');

export const initCloseListeners = () => {
  listen('attemptedClose', () => {
    bcClose.postMessage({ attemptedClose: true });
  });

  bcClose.onmessage = (event) => {
    if (event.data.authorizedClose) send('authorizedClose');
  };
};
