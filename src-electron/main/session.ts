import type { UrlVariables } from 'src/types';

import { app, session } from 'electron';

//import { JW_DOMAINS, TRUSTED_DOMAINS } from '../constants';
import { isJwDomain, isSelf, isTrustedDomain } from './../utils';

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
      // Define a Content Security Policy
      // See: https://www.electronjs.org/docs/latest/tutorial/security#7-define-a-content-security-policy
      if (isSelf(details.url)) {
        const csp: Record<string, string> = {
          'base-uri': "'none'",
          'connect-src': "'self' https: ws:",
          'default-src': "'self'",
          'font-src': "'self' https: file: data:",
          'frame-src': "'self' https:",
          'img-src': "'self' https: file: data:",
          'media-src': "'self' https: file: data:",
          'object-src': "'none'",
          'script-src': "'self' https: 'unsafe-inline' 'unsafe-eval'",
          'style-src': "'self' https: 'unsafe-inline'",
          'worker-src': "'self' blob:",
        };

        if (!details.responseHeaders) details.responseHeaders = {};
        details.responseHeaders['Content-Security-Policy'] = [
          Object.entries(csp)
            .map(([key, value]) => `${key} ${value}`)
            .join('; '),
        ];
      }

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
