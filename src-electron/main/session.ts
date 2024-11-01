import type { UrlVariables } from 'src/types';

import { app, session } from 'electron';

import { isJwDomain, isTrustedDomain } from './../utils';

export let urlVariables: undefined | UrlVariables;

export const setUrlVariables = (variables: UrlVariables) => {
  urlVariables = variables;
};

export const initSessionListeners = () => {
  app.on('ready', () => {
    session.defaultSession.webRequest.onBeforeSendHeaders(
      (details, callback) => {
        if (isTrustedDomain(details.url) && details.requestHeaders) {
          const url = new URL(details.url);
          const baseUrl = `${url.protocol}//${url.hostname}`;
          details.requestHeaders['Referer'] = baseUrl;
          details.requestHeaders['Origin'] = baseUrl;
          details.requestHeaders['User-Agent'] = details.requestHeaders[
            'User-Agent'
          ].replace('Electron', '');
        }

        callback({ requestHeaders: details.requestHeaders });
      },
    );

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      if (!details.responseHeaders || !isTrustedDomain(details.url)) {
        callback({ responseHeaders: details.responseHeaders });
        return;
      }

      let alterResponseHeaders = true;

      // Determine wether to alter the response headers
      if (details.referrer) {
        const url = new URL(details.url);
        const referrer = new URL(details.referrer);

        if (
          referrer.hostname === url.hostname ||
          (url.hostname !==
            new URL(urlVariables?.mediator || 'https://www.b.jw-cdn.org/')
              .hostname &&
            isJwDomain(details.referrer))
        ) {
          alterResponseHeaders = false;
        }
      }

      if (alterResponseHeaders) {
        if (
          !details.responseHeaders['access-control-allow-origin'] ||
          !details.responseHeaders['access-control-allow-origin'].includes('*')
        ) {
          details.responseHeaders['access-control-allow-headers'] = [
            'Content-Type,Authorization,X-Client-ID',
          ];
          details.responseHeaders['access-control-allow-origin'] = ['*'];
          details.responseHeaders['access-control-allow-credentials'] = [
            'true',
          ];
        }

        if (details.responseHeaders['x-frame-options']) {
          delete details.responseHeaders['x-frame-options'];
        }
      }

      callback({ responseHeaders: details.responseHeaders });
    });
  });
};
