import { listen, send } from 'preload/ipc';

export const initCloseListeners = () => {
  const bcClose = new BroadcastChannel('closeAttempts');
  listen('attemptedClose', () => {
    try {
      bcClose.postMessage({ attemptedClose: true });
    } catch (error) {
      console.error('Error posting message to closeAttempts channel:', error);
    }
  });

  bcClose.onmessage = (event) => {
    try {
      if (event.data.authorizedClose) send('authorizedClose');
    } catch (error) {
      console.error('Error handling authorizedClose message:', error);
    }
  };
};
