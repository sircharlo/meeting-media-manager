import type { UrlVariables } from 'src/types';

import { app, session } from 'electron';
import {
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  TRUSTED_DOMAINS,
} from 'src-electron/constants';
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

let sessionListenersInitialized = false;
let webRequestHandlersRegistered = false;

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

/**
 * Derives the Sentry security-report endpoint from the DSN, so the CSP
 * report-uri stays in sync with whichever project SENTRY_DSN points at
 * (and is simply omitted when no DSN is configured, e.g. unofficial builds).
 * @returns The security-report endpoint, or undefined if no DSN is set
 */
const getSentryReportUri = (): string | undefined => {
  if (!SENTRY_DSN) {
    return undefined;
  }

  try {
    const dsn = new URL(SENTRY_DSN);
    const projectId = dsn.pathname.replace(/^\//, '');

    return `https://${dsn.host}/api/${projectId}/security/?sentry_key=${dsn.username}&sentry_environment=${SENTRY_ENVIRONMENT}&sentry_release=${getAppVersion()}`;
  } catch {
    return undefined;
  }
};

const getCSP = (trustedHostnames: string[]) => {
  const sanitizedHostnames = trustedHostnames
    .map((hostname) => hostname.trim().toLowerCase())
    .filter((hostname) => /^[a-z0-9.-]+$/i.test(hostname));

  const trustedOrigins = Array.from(
    new Set(
      sanitizedHostnames.flatMap((hostname) => {
        const parentHostname = hostname.split('.').slice(1).join('.');

        return [
          `https://${hostname}`,
          `https://*.${hostname}`,
          ...(parentHostname.includes('.')
            ? [`https://*.${parentHostname}`]
            : []),
        ];
      }),
    ),
  ).join(' ');

  const sentryReportUri = getSentryReportUri();

  const csp: Record<string, string> = {
    'base-uri': "'none'",
    'connect-src': "'self' https: ws: devtools:",
    'default-src': "'self'",
    'font-src': "'self' https: https://fonts.gstatic.com file:",
    'frame-src': "'self'",
    'img-src': `'self' ${trustedOrigins} file: data: blob:`,
    'media-src': `'self' ${trustedOrigins} file: data:`,
    'object-src': "'none'",
    ...(sentryReportUri ? { 'report-uri': sentryReportUri } : {}),
    'script-src': "'self' https://cdn.jsdelivr.net",
    'style-src': "'self' https://fonts.googleapis.com 'unsafe-inline'",
    'worker-src': "'self' file: blob: https://cdn.jsdelivr.net",
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

const registerSessionHeadersListeners = () => {
  if (webRequestHandlersRegistered) return;
  webRequestHandlersRegistered = true;
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*/*'] },
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

const BASE_DOMAIN_PATTERN =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

// Empty string is accepted so the renderer can still clear these values
// (e.g. when the congregation's base URL changes) instead of being stuck
// with stale trusted domains from a previous, unrelated congregation.
const isEmptyOrValidBaseDomain = (value: string) =>
  value === '' || BASE_DOMAIN_PATTERN.test(value);

const isEmptyOrHttpsUrl = (value: string) => {
  if (value === '') return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Updates the URL variables used to build the CSP and trusted-domain
 * allowlists. Malformed values are ignored (rather than clearing or
 * corrupting the existing trusted state) since this is called with
 * renderer-supplied data that should not be able to widen the app's own
 * trust boundary with garbage input.
 * @param variables The URL variables reported by the renderer
 */
export const setElectronUrlVariables = (variables: UrlVariables) => {
  if (isEmptyOrValidBaseDomain(variables.base)) {
    urlVariables.base = variables.base;
  }
  if (isEmptyOrHttpsUrl(variables.mediator)) {
    urlVariables.mediator = variables.mediator;
  }
  if (isEmptyOrHttpsUrl(variables.pubMedia)) {
    urlVariables.pubMedia = variables.pubMedia;
  }
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
  if (sessionListenersInitialized) return;
  sessionListenersInitialized = true;

  app.on('ready', () => {
    const currentUserAgent = session.defaultSession.getUserAgent();
    session.defaultSession.setUserAgent(
      currentUserAgent.replaceAll(/Electron[/\d.\s]*/g, ''),
    );

    registerSessionHeadersListeners();

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
