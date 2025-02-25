import type { ExclusiveEventHintOrCaptureContext } from 'app/node_modules/@sentry/core/build/types/utils/prepareEvent';

import { captureException } from '@sentry/electron/main';
import { version } from 'app/package.json';
import { app } from 'electron';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IS_DEV,
  JW_DOMAINS,
  PLATFORM,
  TRUSTED_DOMAINS,
} from 'src-electron/constants';
import { urlVariables } from 'src-electron/main/session';

/**
 * Gets the current app version
 * @returns The app version
 */
export function getAppVersion() {
  return IS_DEV ? version : app.getVersion();
}

/**
 * Returns the correct path for an icon based on the platform
 * @param icon The icon name
 * @returns The icon path
 */
export function getIconPath(icon: 'beta' | 'icon' | 'media-player') {
  return resolve(
    join(
      fileURLToPath(
        new URL(IS_DEV ? './../../src-electron' : '.', import.meta.url),
      ),
      'icons',
      `${icon}.${PLATFORM === 'win32' ? 'ico' : PLATFORM === 'darwin' ? 'icns' : 'png'}`,
    ),
  );
}

/**
 * Checks if a given url is a JW domain
 * @param url The url to check
 * @returns Whether the url is a JW domain
 */
export function isJwDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') return false;
    return JW_DOMAINS.concat(
      [urlVariables?.base]
        .filter((d): d is string => !!d)
        .map((d) => new URL(`https://${d}/`).hostname),
    ).some((domain) => parsedUrl.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

/**
 * Checks if a given url is the same as the current app url
 * @param url The url to check
 * @returns Whether the url is the same as the current app url
 */
export function isSelf(url?: string): boolean {
  try {
    if (!url) return false;
    const parsedUrl = new URL(url);

    return (
      (!!process.env.DEV && parsedUrl.origin === process.env.APP_URL) ||
      (!process.env.DEV &&
        parsedUrl.protocol === 'file:' &&
        parsedUrl.pathname.endsWith('index.html'))
    );
  } catch {
    return false;
  }
}

/**
 * Check if a given url is a trusted domain
 * @param url The url to check
 * @returns Whether the url is a trusted domain
 */
export function isTrustedDomain(url?: string): boolean {
  if (!url) return false;
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
  } catch {
    return false;
  }
}

/**
 * Checks if a given url is a valid url
 * @param url The url to check
 * @returns Whether the url is a valid url
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Fetches a raw response from a given url
 * @param url The url to fetch
 * @param init The fetch init options
 * @returns The fetch response
 */
export const fetchRaw = async (url: string, init?: RequestInit) => {
  console.debug('fetchRaw', { init, url });
  return fetch(url, init);
};

/**
 * Fetches a json response from a given url
 * @param url The url to fetch
 * @param params The url parameters
 * @returns The json response or null if the fetch failed
 */
export const fetchJson = async <T>(
  url: string,
  params?: URLSearchParams,
): Promise<null | T> => {
  try {
    if (!url) return null;
    const response = await fetchRaw(
      `${url}${params ? '?' + params.toString() : ''}`,
    );
    if (response.ok || response.status === 304) {
      return await response.json();
    } else if (
      ![403, 404].includes(response.status) &&
      !(response.status === 400 && params?.get('pub')?.startsWith('S-'))
    ) {
      captureElectronError(new Error('Failed to fetch json!'), {
        contexts: {
          fn: {
            headers: response.headers,
            name: 'fetchJson',
            params: Object.fromEntries(params || []),
            responseUrl: response.url,
            status: response.status,
            statusText: response.statusText,
            type: response.type,
            url,
          },
        },
      });
    }
  } catch (e) {
    const { default: isOnline } = await import('is-online');
    const online = await isOnline();
    if (online) {
      captureElectronError(e, {
        contexts: {
          fn: {
            message: e instanceof Error ? e.message : '',
            name: 'fetchJson',
            params: Object.fromEntries(params || []),
            responseUrl: `${url}?${params ? params.toString() : ''}`,
            url,
          },
        },
      });
    }
  }
  return null;
};

/**
 * Logs an error to the console or to Sentry
 * @param error The error to log
 * @param context The context to log with the error
 */
export function captureElectronError(
  error: Error | string | unknown,
  context?: ExclusiveEventHintOrCaptureContext,
) {
  if (error instanceof Error && error.cause) {
    captureElectronError(error.cause, context);
  }

  if (IS_DEV) {
    console.error(error);
    console.warn('context', context);
  } else {
    captureException(error, context);
  }
}

/**
 * Throttles a function to only run once every `delay` milliseconds
 * @param func The function to throttle
 * @param delay The delay in milliseconds
 * @returns The throttled function
 */
export const throttle = <T>(func: (...args: T[]) => void, delay: number) => {
  let prev = 0;
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
