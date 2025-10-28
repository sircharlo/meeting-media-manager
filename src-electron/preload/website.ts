import type { NavigateWebsiteAction } from 'src/types';

import { listen, send } from 'preload/ipc';

export const initWebsiteListeners = () => {
  listen('websiteWindowClosed', () => {
    console.log('[Electron] Website window closed, sending IPC event');
    send('websiteWindowClosed');
  });
};

export const openWebsiteWindow = (lang?: string) => {
  send('toggleWebsiteWindow', true, lang);
};

export const navigateWebsiteWindow = (action: NavigateWebsiteAction) =>
  send('navigateWebsiteWindow', action);

export const zoomWebsiteWindow = (direction: 'in' | 'out') =>
  send('zoomWebsiteWindow', direction);

export const closeWebsiteWindow = () => send('toggleWebsiteWindow', false);
