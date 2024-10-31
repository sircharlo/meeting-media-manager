import type { NavigateWebsiteAction } from 'src/types';

import { listen, send } from './ipc';

const webStreamBroadcastChannel = new BroadcastChannel('web-stream');

export const initWebsiteListeners = () => {
  listen('websiteWindowClosed', () => {
    webStreamBroadcastChannel.postMessage(false);
  });
};

export const openWebsiteWindow = () => {
  send('toggleWebsiteWindow', true);
  webStreamBroadcastChannel.postMessage(true);
};

export const navigateWebsiteWindow = (action: NavigateWebsiteAction) =>
  send('navigateWebsiteWindow', action);

export const zoomWebsiteWindow = (direction: 'in' | 'out') =>
  send('zoomWebsiteWindow', direction);

export const closeWebsiteWindow = () => send('toggleWebsiteWindow', false);
