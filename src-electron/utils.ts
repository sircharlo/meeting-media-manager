import { captureException } from '@sentry/browser';

import { IS_DEV, JW_DOMAINS, TRUSTED_DOMAINS } from './constants';
import { urlVariables } from './main/session';

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
        urlVariables ? `https://www.${urlVariables.base}/` : undefined,
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
      .map((d) => new URL(`https://www.${d}/`).hostname),
  ).some((domain) => parsedUrl.hostname.endsWith(domain));
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
