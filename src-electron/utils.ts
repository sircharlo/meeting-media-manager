import { captureException } from '@sentry/browser';

import { IS_DEV, JW_DOMAINS, TRUSTED_DOMAINS } from './constants';

export function isTrustedDomain(url: string): boolean {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:') return false;
  return TRUSTED_DOMAINS.some((domain) => parsedUrl.hostname.endsWith(domain));
}

export function isJwDomain(url: string): boolean {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:') return false;
  return JW_DOMAINS.some((domain) => parsedUrl.hostname.endsWith(domain));
}

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

export function errorCatcher(error: Error | string | unknown) {
  if (!IS_DEV) {
    captureException(error);
  } else {
    console.error(error);
  }
}

type Func<T extends unknown[], R> = (...args: T) => R;

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
