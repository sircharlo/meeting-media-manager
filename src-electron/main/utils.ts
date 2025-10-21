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

const captureElectronErrorState: {
  globalWindowMs: number;
  lastSentAt: number;
  title: Map<string, { lastSent: number; suppressed: number }>;
  titleWindowMs: number;
  trailingPayload: null | {
    context?: ExclusiveEventHintOrCaptureContext;
    error: unknown;
  };
  trailingTimeout: null | ReturnType<typeof setTimeout>;
} = {
  globalWindowMs: 1000,
  lastSentAt: 0,
  title: new Map<string, { lastSent: number; suppressed: number }>(),
  titleWindowMs: 2 * 60 * 1000,
  trailingPayload: null,
  trailingTimeout: null,
};

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
      ![403, 404, 429, 502].includes(response.status) &&
      !(
        response.status === 400 &&
        ['S', 'CO'].some((p) => params?.get('pub')?.startsWith(`${p}-`))
      )
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

  const now = Date.now();
  const key = ((): string => {
    if (error instanceof Error) return `${error.name}: ${error.message}`;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  })();

  if (!captureElectronErrorState.title.has(key)) {
    captureElectronErrorState.title.set(key, { lastSent: 0, suppressed: 0 });
  }
  const tState = captureElectronErrorState.title.get(key) || {
    lastSent: 0,
    suppressed: 0,
  };

  if (now - tState.lastSent < captureElectronErrorState.titleWindowMs) {
    tState.suppressed += 1;
    return;
  }

  const suppressed = tState.suppressed;
  tState.lastSent = now;
  tState.suppressed = 0;

  const augmentedContext: ExclusiveEventHintOrCaptureContext | undefined =
    suppressed > 0
      ? (() => {
          const baseCtx =
            context && typeof context === 'object'
              ? (context as Record<string, unknown>)
              : {};
          const baseContexts =
            baseCtx.contexts && typeof baseCtx.contexts === 'object'
              ? (baseCtx.contexts as Record<string, unknown>)
              : {};
          const baseExtra =
            baseCtx.extra && typeof baseCtx.extra === 'object'
              ? (baseCtx.extra as Record<string, unknown>)
              : {};
          const baseTags =
            baseCtx.tags && typeof baseCtx.tags === 'object'
              ? (baseCtx.tags as Record<string, unknown>)
              : {};
          return {
            ...(baseCtx as ExclusiveEventHintOrCaptureContext),
            contexts: {
              ...baseContexts,
              rateLimit: {
                suppressedSinceLastSend: suppressed,
                titleKey: key,
                windowMs: captureElectronErrorState.titleWindowMs,
              },
            },
            extra: { ...baseExtra, rate_limit_suppressed_count: suppressed },
            tags: { ...baseTags, rate_limited: 'per-title' },
          } as ExclusiveEventHintOrCaptureContext;
        })()
      : context;

  const bypass = (() => {
    const c: unknown = augmentedContext || {};
    const anyC = c as {
      forceSend?: boolean;
      level?: string;
      mechanism?: { handled?: boolean };
    };
    return (
      anyC?.forceSend === true ||
      anyC?.level === 'fatal' ||
      anyC?.mechanism?.handled === false
    );
  })();

  const sendNow = () => {
    if (IS_DEV) {
      console.error(error);
      console.warn('context', augmentedContext);
    } else {
      captureException(error, augmentedContext);
    }
  };

  const elapsed = now - captureElectronErrorState.lastSentAt;
  if (bypass || elapsed >= captureElectronErrorState.globalWindowMs) {
    captureElectronErrorState.lastSentAt = now;
    sendNow();
    if (captureElectronErrorState.trailingTimeout) {
      clearTimeout(captureElectronErrorState.trailingTimeout);
      captureElectronErrorState.trailingTimeout = null;
      captureElectronErrorState.trailingPayload = null;
    }
  } else {
    captureElectronErrorState.trailingPayload = {
      context: augmentedContext,
      error,
    };
    if (!captureElectronErrorState.trailingTimeout) {
      captureElectronErrorState.trailingTimeout = setTimeout(() => {
        const payload = captureElectronErrorState.trailingPayload;
        if (payload) {
          captureElectronErrorState.lastSentAt = Date.now();
          if (IS_DEV) {
            console.error(payload.error);
            console.warn('context', payload.context);
          } else {
            captureException(payload.error, payload.context);
          }
          captureElectronErrorState.trailingPayload = null;
        }
        captureElectronErrorState.trailingTimeout = null;
      }, captureElectronErrorState.globalWindowMs - elapsed);
    }
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

/**
 * Throttles a function to run at regular intervals AND at the end
 * @param func The function to throttle
 * @param delay The delay in milliseconds
 * @returns The throttled function with trailing execution
 */
export const throttleWithTrailing = <T>(
  func: (...args: T[]) => void,
  delay: number,
) => {
  let lastExecTime = 0;
  let timeoutId: null | ReturnType<typeof setTimeout> = null;
  let lastArgs: null | T[] = null;

  return (...args: T[]) => {
    const now = Date.now();
    lastArgs = args;

    // Execute immediately if enough time has passed
    if (now - lastExecTime >= delay) {
      lastExecTime = now;
      func(...args);

      // Clear any pending trailing execution
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    } else {
      // Schedule trailing execution if not already scheduled
      if (!timeoutId) {
        timeoutId = setTimeout(
          () => {
            if (lastArgs) {
              lastExecTime = Date.now();
              func(...lastArgs);
              timeoutId = null;
              lastArgs = null;
            }
          },
          delay - (now - lastExecTime),
        );
      }
    }
  };
};
