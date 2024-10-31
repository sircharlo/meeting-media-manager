import { captureException } from '@sentry/browser';

import { IS_DEV, JW_DOMAINS, TRUSTED_DOMAINS } from './constants';

/**
 * Check if a given url is a trusted domain
 * @param url The url to check
 * @returns Wether the url is a trusted domain
 */
export function isTrustedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') return false;
    return TRUSTED_DOMAINS.some((domain) =>
      parsedUrl.hostname.endsWith(domain),
    );
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
  return JW_DOMAINS.some((domain) => parsedUrl.hostname.endsWith(domain));
}

/**
 * Checks if a given url is the same as the current app url
 * @param url The url to check
 * @returns Wether the url is the same as the current app url
 */
export function isSelf(url: string): boolean {
  const parsedUrl = new URL(url);
  const parsedAppUrl = new URL(process.env.APP_URL);

  return (
    (!!process.env.DEV && parsedUrl.origin === process.env.APP_URL) ||
    (!process.env.DEV &&
      parsedUrl.protocol === 'file:' &&
      parsedUrl.pathname === parsedAppUrl.pathname)
  );
}

/**
 * Logs an error to the console or to Sentry
 * @param error The error to log
 */
export function errorCatcher(error: Error | string | unknown) {
  if (!IS_DEV) {
    captureException(error);
  } else {
    console.error(error);
  }
}

type Func<T extends unknown[], R> = (...args: T) => R;

/**
 * Throttles a function
 * @param fn The function to throttle
 * @param limit The limit in ms
 * @returns The throttled function
 */
export function throttle<T extends unknown[], R = unknown>(
  fn: Func<T, R>,
  limit = 250,
): Func<T, R> {
  let wait = false;
  let result: R;

  return function (this: unknown, ...args: T): R {
    if (!wait) {
      wait = true;
      setTimeout(() => {
        wait = false;
      }, limit);
      result = fn.apply(this, args);
    }

    return result;
  };
}
