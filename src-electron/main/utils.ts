import { captureException } from '@sentry/electron/main';
import { version } from 'app/package.json';
import { app } from 'electron';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  IS_DEV,
  JW_DOMAINS,
  PLATFORM,
  PRODUCT_NAME,
  TRUSTED_DOMAINS,
} from 'src-electron/constants';
import { urlVariables } from 'src-electron/main/session';
import upath from 'upath';

const { join, resolve } = upath;

type CaptureCtx = Parameters<typeof captureException>[1];

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

const electronUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Gets the shared data path for machine-wide installations
 * @returns The shared data path or null if not available/writable
 */
export async function getSharedDataPath(): Promise<null | string> {
  const isMachineWide = isMachineWideInstallation();
  if (!isMachineWide) return null;

  let sharedPath = '';

  if (PLATFORM === 'win32') {
    sharedPath = join(
      process.env.ProgramData || 'C:\\ProgramData',
      PRODUCT_NAME || 'Meeting Media Manager',
    );
  } else if (PLATFORM === 'darwin') {
    sharedPath = join(
      '/Library/Application Support',
      PRODUCT_NAME || 'Meeting Media Manager',
    );
  } else {
    // Linux
    sharedPath = join(
      '/var/cache',
      (PRODUCT_NAME || 'meeting-media-manager')
        .toLowerCase()
        .replace(/ /g, '-'),
    );
  }

  try {
    // Ensure directory exists (does NOT change permissions)
    await mkdir(sharedPath, { recursive: true });

    const testDir = join(sharedPath, '.cache-test-' + electronUuid());
    await mkdir(testDir, { recursive: true });
    await writeFile(join(testDir, 'test.txt'), 'ok');
    await rm(testDir, { recursive: true });
    return sharedPath;
  } catch {
    return null;
  }
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
 * Checks if the current installation is machine-wide
 * @returns Whether the installation is machine-wide
 */
export function isMachineWideInstallation(): boolean {
  const exe = app.getPath('exe');
  if (PLATFORM === 'win32') {
    return (
      exe.toLowerCase().includes('program files') &&
      !exe.toLowerCase().includes('users')
    );
  } else if (PLATFORM === 'darwin') {
    return exe.startsWith('/Applications') && !exe.startsWith('/Users');
  } else {
    return exe.startsWith('/usr') || exe.startsWith('/opt');
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

    if (process.env.DEV) {
      return parsedUrl.origin === process.env.APP_URL;
    }

    return (
      (parsedUrl.protocol === 'file:' &&
        parsedUrl.pathname.toLowerCase().endsWith('index.html')) ||
      parsedUrl.protocol === 'app:'
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
 * Checks if an update error should be ignored (not reported to Sentry)
 * @param error The error to check
 * @param message An optional additional message
 * @returns Whether the error should be ignored
 */
export function isIgnoredUpdateError(
  error: Error | string | unknown,
  message?: string,
): boolean {
  const ignoreErrors = [
    '504 Gateway Time-out',
    'Code signature at URL',
    'HttpError: 503',
    'HttpError: 504',
    'YAMLException',
    'ECONNRESET',
    'ERR_CONNECTION_RESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAI_AGAIN',
    'SELF_SIGNED_CERT_IN_CHAIN',
    'OSStatus error -60006',
    'read-only volume',
    'ERR_CONNECTION_TIMED_OUT',
    'EPIPE',
    'HttpError: 404',
  ];

  const errorMsg =
    typeof error === 'string' ? error : (error as Error)?.message;
  const errorCode = (error as { code?: string })?.code;

  return ignoreErrors.some((ignoreError) => {
    return (
      message?.includes(ignoreError) ||
      errorMsg?.includes(ignoreError) ||
      (typeof errorCode === 'string' && errorCode.includes(ignoreError))
    );
  });
}

/**
 * Checks if an error is a network-related error that should not be reported to Sentry
 * @param error The error to check
 * @returns Whether the error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  try {
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'ConnectTimeoutError') {
        return true;
      }
      if (error.message.includes('fetch failed')) {
        const cause = error.cause as Record<string, unknown> | undefined;
        if (cause && typeof cause.code === 'string') {
          const networkCodes = [
            'ENOTFOUND',
            'ETIMEDOUT',
            'ECONNREFUSED',
            'ECONNRESET',
            'EAI_AGAIN',
            'UND_ERR_CONNECT_TIMEOUT',
          ];
          if (networkCodes.includes(cause.code)) return true;
        }
        if (
          cause &&
          (cause.name === 'ConnectTimeoutError' ||
            cause.name === 'TimeoutError')
        ) {
          return true;
        }
      }
    }
    return false;
  } catch (e) {
    captureElectronError(e);
    return false;
  }
}

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
  options: { silent?: boolean; timeout?: number } = {},
): Promise<null | T> => {
  try {
    if (!url) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, options.timeout ?? 30000);

    try {
      const response = await fetchRaw(
        `${url}${params ? '?' + params.toString() : ''}`,
        { signal: controller.signal },
      );
      if (response.ok || response.status === 304) {
        return (await response.json()) as T;
      } else if (
        !options.silent &&
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
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (e) {
    if (options.silent || isNetworkError(e)) return null;

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
  context?: CaptureCtx,
) {
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
