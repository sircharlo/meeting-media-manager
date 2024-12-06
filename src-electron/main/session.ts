import type { UrlVariables } from 'src/types';

import { app, session } from 'electron';

import { TRUSTED_DOMAINS } from '../constants';
//import { JW_DOMAINS, TRUSTED_DOMAINS } from '../constants';
import {
  getAppVersion,
  isJwDomain,
  isSelf,
  isTrustedDomain,
  isValidUrl,
} from './utils';

export let urlVariables: undefined | UrlVariables;

export const setUrlVariables = (variables: UrlVariables) => {
  urlVariables = variables;
};

export const initSessionListeners = () => {
  app.on('ready', () => {
    const currentUserAgent = session.defaultSession.getUserAgent();
    session.defaultSession.setUserAgent(
      currentUserAgent.replace(/Electron[/\d.\s]*/g, ''),
    );

    session.defaultSession.webRequest.onBeforeSendHeaders(
      (details, callback) => {
        if (isTrustedDomain(details.url) && details.requestHeaders) {
          const url = new URL(details.url);
          const baseUrl = `${url.protocol}//${url.hostname}`;
          details.requestHeaders['Referer'] = baseUrl;
          details.requestHeaders['Origin'] = baseUrl;
        }
        callback({ requestHeaders: details.requestHeaders });
      },
    );

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      // Define a Content Security Policy
      // See: https://www.electronjs.org/docs/latest/tutorial/security#7-define-a-content-security-policy
      if (isSelf(details.url)) {
        const trustedDomains = TRUSTED_DOMAINS.concat(
          [
            urlVariables?.mediator,
            urlVariables?.pubMedia,
            urlVariables?.base ? `https://${urlVariables.base}/` : undefined,
          ]
            .filter((d): d is string => !!d && isValidUrl(d))
            .map((d) => new URL(d).hostname),
        )
          .map((d) => `https://*.${d}`)
          .join(' ');
        const csp: Record<string, string> = {
          'base-uri': "'none'",
          'connect-src': "'self' https: ws: devtools:",
          'default-src': "'self'",
          'font-src': "'self' https: https://fonts.gstatic.com file:",
          'frame-src': "'self'",
          'img-src': `'self' ${trustedDomains} file: data: blob:`,
          'media-src': `'self' ${trustedDomains} file: data:`,
          'object-src': "'none'",
          'report-uri': `https://o1401005.ingest.us.sentry.io/api/4507449197920256/security/?sentry_key=0f2ab1c7ddfb118d25704c85957b8188&sentry_environment=${process.env.NODE_ENV}&sentry_release=${getAppVersion()}`,
          'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
          'style-src': "'self' https://fonts.googleapis.com 'unsafe-inline'",
          'worker-src': "'self' file: blob:",
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
            new URL(
              urlVariables && isValidUrl(urlVariables.mediator)
                ? urlVariables.mediator
                : 'https://www.b.jw-cdn.org/',
            ).hostname &&
            url.hostname !== `apps.${urlVariables?.base || 'jw.org'}` &&
            url.hostname !== `donate.${urlVariables?.base || 'jw.org'}` &&
            url.hostname !== `hub.${urlVariables?.base || 'jw.org'}` &&
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
            'Content-Type,Authorization,X-Client-ID,clientreferrer,x-client-version,x-requested-with',
          ];
          details.responseHeaders['access-control-allow-origin'] = [
            details.referrer ? new URL(details.referrer).origin : '*',
          ];
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
