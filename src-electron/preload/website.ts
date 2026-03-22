import type { JwSiteParams, NavigateWebsiteAction } from 'src/types';

import { listen, send } from 'src-electron/preload/ipc';
import { log } from 'src/shared/vanilla';

export const initWebsiteListeners = () => {
  listen('websiteWindowClosed', () => {
    log(
      '[Electron] Website window closed, sending IPC event',
      'electron',
      'log',
    );
    send('websiteWindowClosed');
  });
};

export const openWebsiteWindow = (websiteParams?: JwSiteParams) => {
  send('toggleWebsiteWindow', true, websiteParams);
};

export const navigateWebsiteWindow = (action: NavigateWebsiteAction) =>
  send('navigateWebsiteWindow', action);

export const zoomWebsiteWindow = (direction: 'in' | 'out') =>
  send('zoomWebsiteWindow', direction);

export const closeWebsiteWindow = () => send('toggleWebsiteWindow', false);
