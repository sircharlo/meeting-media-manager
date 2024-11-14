import type { ExclusiveEventHintOrCaptureContext } from '@sentry/core/build/types/utils/prepareEvent';

import { captureException } from '@sentry/browser';
import { version } from 'app/package.json';
import { app, systemPreferences } from 'electron';

import { IS_DEV, JW_DOMAINS, PLATFORM, TRUSTED_DOMAINS } from './constants';
import { isDownloadErrorExpected } from './main/downloads';
import { urlVariables } from './main/session';
import { logToWindow } from './main/window/window-base';
import { mainWindow } from './main/window/window-main';

export function getAppVersion() {
  return IS_DEV ? version : app.getVersion();
}

export async function askForMediaAccess() {
  if (PLATFORM !== 'darwin') return;
  const types = ['camera', 'microphone'] as const;

  for (const type of types) {
    try {
      const access = systemPreferences.getMediaAccessStatus(type);
      if (access !== 'granted') {
        logToWindow(mainWindow, `No ${type} access`, access, 'error');
        const result = await systemPreferences.askForMediaAccess(type);
        logToWindow(mainWindow, `${type} result:`, result, 'debug');
      }
    } catch (e) {
      errorCatcher(e);
    }
  }
}

/**
 * Check if a given url is a trusted domain
 * @param url The url to check
 * @returns Wether the url is a trusted domain
 */
export function isTrustedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') return false;
    return TRUSTED_DOMAINS.concat(
      [
        urlVariables?.mediator,
        urlVariables?.pubMedia,
        urlVariables?.base ? `https://${urlVariables.base}/` : undefined,
      ]
        .filter((d): d is string => !!d)
        .map((d) => new URL(d).hostname),
    ).some((domain) => parsedUrl.hostname.endsWith(domain));
  } catch (e) {
    return false;
  }
}

/**
 * Checks if a given url is a JW domain
 * @param url The url to check
 * @returns Wether the url is a JW domain
 */
export function isJwDomain(url: string): boolean {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:') return false;
  return JW_DOMAINS.concat(
    [urlVariables?.base]
      .filter((d): d is string => !!d)
      .map((d) => new URL(`https://${d}/`).hostname),
  ).some((domain) => parsedUrl.hostname.endsWith(domain));
}

/**
 * Checks if a given url is the same as the current app url
 * @param url The url to check
 * @returns Wether the url is the same as the current app url
 */
export function isSelf(url?: string): boolean {
  if (!url) return false;
  const parsedUrl = new URL(url);
  const parsedAppUrl = new URL(process.env.APP_URL);

  return (
    (!!process.env.DEV && parsedUrl.origin === process.env.APP_URL) ||
    (!process.env.DEV &&
      parsedUrl.protocol === 'file:' &&
      parsedUrl.pathname === parsedAppUrl.pathname)
  );
}

export const fetchRaw = async (url: string, init?: RequestInit) => {
  console.debug('fetchRaw', { init, url });
  try {
    return fetch(url, init);
  } catch (e) {
    errorCatcher(e, {
      contexts: {
        fn: {
          isDownloadErrorExpected: await isDownloadErrorExpected(),
          name: 'src-electron/utils fetchRaw',
          params: init,
          url,
        },
      },
    });
    return {
      ok: false,
      status: 400,
    } as Response;
  }
};

export const fetchJson = async <T>(
  url: string,
  params?: URLSearchParams,
): Promise<null | T> => {
  try {
    if (!url) return null;
    const response = await fetchRaw(
      `${url}?${params ? params.toString() : ''}`,
    );
    if (response.ok) {
      return await response.json();
    } else if (![400, 404].includes(response.status)) {
      errorCatcher(response, {
        contexts: {
          fn: {
            name: 'fetchJson',
            params: Object.fromEntries(params || []),
            url,
          },
        },
      });
    }
  } catch (e) {
    errorCatcher(e, {
      contexts: {
        fn: {
          name: 'fetchJson',
          params: Object.fromEntries(params || []),
          url,
        },
      },
    });
  }
  return null;
};

/**
 * Logs an error to the console or to Sentry
 * @param error The error to log
 */
export function errorCatcher(
  error: Error | string | unknown,
  context?: ExclusiveEventHintOrCaptureContext,
) {
  if (!IS_DEV) {
    captureException(error, context);
  } else {
    console.error(error);
    console.warn('context', context);
  }
}

export const throttle = <T>(func: (...args: T[]) => void, delay: number) => {
  let prev = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: T[]) => {
    const now = new Date().getTime();
    if (now - prev > delay) {
      prev = now;
      return func(...args);
    }
  };
};

// If ever we need to debounce a function in the main or preload processes
//
// export const debounce = <T>(func: (...args: T[]) => void, delay: number) => {
//   let timeoutId: null | ReturnType<typeof setTimeout> = null;
//   return (...args: T[]) => {
//     if (timeoutId) {
//       clearTimeout(timeoutId);
//     }
//     timeoutId = setTimeout(() => {
//       func(...args);
//     }, delay);
//   };
// };
