import type { UrlVariables } from 'src/types';

import { app, session } from 'electron';
import { TRUSTED_DOMAINS } from 'src-electron/constants';
import {
  getAppVersion,
  isJwDomain,
  isSelf,
  isTrustedDomain,
  isValidUrl,
} from 'src-electron/main/utils';

export const urlVariables: UrlVariables = {
  base: '',
  mediator: '',
  pubMedia: '',
};

const getTrustedHostnames = () => {
  return TRUSTED_DOMAINS.concat(
    [
      urlVariables?.mediator,
      urlVariables?.pubMedia,
      urlVariables?.base ? `https://${urlVariables.base}/` : undefined,
    ]
      .filter((d): d is string => !!d && isValidUrl(d))
      .map((d) => new URL(d).hostname),
  );
};

const getCSP = (trustedHostnames: string[]) => {
  const trustedOrigins = trustedHostnames
    .map((d) => `https://*.${d}`)
    .join(' ');

  const csp: Record<string, string> = {
    'base-uri': "'none'",
    'connect-src': "'self' https: ws: devtools:",
    'default-src': "'self'",
    'font-src': "'self' https: https://fonts.gstatic.com file:",
    'frame-src': "'self'",
    'img-src': `'self' ${trustedOrigins} file: data: blob:`,
    'media-src': `'self' ${trustedOrigins} file: data:`,
    'object-src': "'none'",
    'report-uri': `https://o1401005.ingest.us.sentry.io/api/4507449197920256/security/?sentry_key=40b7d92d692d42814570d217655198db&sentry_environment=${process.env.NODE_ENV}&sentry_release=${getAppVersion()}`,
    'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
    'style-src': "'self' https://fonts.googleapis.com 'unsafe-inline'",
    'worker-src': "'self' file: blob:",
  };

  return Object.entries(csp)
    .map(([key, value]) => `${key} ${value}`)
    .join('; ');
};

const shouldAlterResponseHeaders = (url: URL, referrer: string | undefined) => {
  if (!referrer) return true;

  const referrerUrl = new URL(referrer);
  if (referrerUrl.hostname === url.hostname) return false;

  const mediatorHostname = new URL(
    isValidUrl(urlVariables.mediator)
      ? urlVariables.mediator
      : 'https://www.b.jw-cdn.org/',
  ).hostname;

  const isInternalSubdomain =
    url.hostname === `apps.${urlVariables?.base || 'jw.org'}` ||
    url.hostname === `donate.${urlVariables?.base || 'jw.org'}` ||
    url.hostname === `hub.${urlVariables?.base || 'jw.org'}`;

  if (
    (url.hostname !== mediatorHostname && !isInternalSubdomain) ||
    !isJwDomain(referrer)
  ) {
    return true;
  }

  return false;
};

const applyCORSHeaders = (
  responseHeaders: Record<string, string[]>,
  referrer: string | undefined,
) => {
  if (responseHeaders['access-control-allow-origin']?.includes('*')) {
    return;
  }

  responseHeaders['access-control-allow-headers'] = [
    'Content-Type,Authorization,X-Client-ID,clientreferrer,x-client-version,x-requested-with',
  ];
  responseHeaders['access-control-allow-origin'] = [
    referrer ? new URL(referrer).origin : '*',
  ];
  responseHeaders['access-control-allow-credentials'] = ['true'];

  if (responseHeaders['x-frame-options']) {
    delete responseHeaders['x-frame-options'];
  }
};

const updateSessionHeadersListener = () => {
  const trustedHostnames = getTrustedHostnames();
  const urls = trustedHostnames.flatMap((domain) => [
    `*://*.${domain}/*`,
    `*://${domain}/*`,
  ]);

  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls },
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
};

export const setElectronUrlVariables = (variables: UrlVariables) => {
  urlVariables.base = variables.base;
  urlVariables.mediator = variables.mediator;
  urlVariables.pubMedia = variables.pubMedia;
  updateSessionHeadersListener();
};

export const quitStatus = {
  isAppQuitting: false,
  shouldQuit: false,
};

export const setAppQuitting = (quitting: boolean) => {
  quitStatus.isAppQuitting = quitting;
};

export const setShouldQuit = (quit: boolean) => {
  quitStatus.shouldQuit = quit;
};

export const initSessionListeners = () => {
  app.on('ready', () => {
    const currentUserAgent = session.defaultSession.getUserAgent();
    session.defaultSession.setUserAgent(
      currentUserAgent.replaceAll(/Electron[/\d.\s]*/g, ''),
    );

    updateSessionHeadersListener();

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      if (isSelf(details.url)) {
        const trustedHostnames = getTrustedHostnames();
        details.responseHeaders ??= {};
        details.responseHeaders['Content-Security-Policy'] = [
          getCSP(trustedHostnames),
        ];
      }

      if (!details.responseHeaders || !isTrustedDomain(details.url)) {
        callback({ responseHeaders: details.responseHeaders });
        return;
      }

      const url = new URL(details.url);
      if (shouldAlterResponseHeaders(url, details.referrer)) {
        applyCORSHeaders(details.responseHeaders, details.referrer);
      }

      callback({ responseHeaders: details.responseHeaders });
    });
  });
};
