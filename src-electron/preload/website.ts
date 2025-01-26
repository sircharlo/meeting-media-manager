import type { NavigateWebsiteAction } from 'src/types';

import { listen, send } from 'preload/ipc';

const webStreamBroadcastChannel = new BroadcastChannel('web-stream');

export const initWebsiteListeners = () => {
  listen('websiteWindowClosed', () => {
    webStreamBroadcastChannel.postMessage(false);
  });
};

export const openWebsiteWindow = (lang?: string) => {
  send('toggleWebsiteWindow', true, lang);
};

export const startWebsiteStream = () => {
  webStreamBroadcastChannel.postMessage(true);
};

export const navigateWebsiteWindow = (action: NavigateWebsiteAction) =>
  send('navigateWebsiteWindow', action);

export const zoomWebsiteWindow = (direction: 'in' | 'out') =>
  send('zoomWebsiteWindow', direction);

export const closeWebsiteWindow = () => send('toggleWebsiteWindow', false);
