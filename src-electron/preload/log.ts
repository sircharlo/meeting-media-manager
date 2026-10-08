import type {
  PreloadErrorContext,
  PreloadErrorReport,
  SerializedPreloadError,
} from 'src/types';

import { log } from 'src/shared/vanilla';

const describeNonError = (value: unknown) => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

/**
 * Turns a thrown value into plain data that survives Electron IPC's
 * structured clone. A raw Error would arrive with only name/message/stack,
 * losing a Node fs error's `code`/`syscall` (used for Sentry grouping).
 * @param error The thrown value
 * @returns A serializable description of the error
 */
export const serializePreloadError = (
  error: unknown,
): SerializedPreloadError => {
  if (typeof error !== 'object' || error === null || !('message' in error)) {
    return { message: describeNonError(error), name: 'Error' };
  }

  const { code, message, name, stack, syscall } = error as Record<
    string,
    unknown
  >;
  return {
    message: typeof message === 'string' ? message : describeNonError(message),
    name: typeof name === 'string' && name ? name : 'Error',
    ...(typeof code === 'string' && { code }),
    ...(typeof stack === 'string' && { stack }),
    ...(typeof syscall === 'string' && { syscall }),
  };
};

// Lazily imported, like startSecurityScopedAccess in ./fs: a renderer test
// mock imports ./fs (and so this file) without Electron, and a static import
// of the ipcRenderer wrapper would drag in an unresolvable 'electron/renderer'.
const forwardToMain = async (report: PreloadErrorReport) => {
  const { send } = await import('src-electron/preload/ipc');
  try {
    send('capturePreloadError', report);
  } catch {
    // A context value structured clone can't handle (e.g. a function) would
    // otherwise lose the whole report - resend just the error.
    send('capturePreloadError', { error: report.error });
  }
};

/**
 * Reports a preload error to Sentry, or logs it in development.
 *
 * The preload runs in an isolated world (contextIsolation), which has no
 * Sentry client: the renderer's @sentry/vue client lives in the page's main
 * world and the SDK's own client lives in the main process. Calling Sentry
 * here would silently drop the event, so the error is forwarded to the main
 * process, which reports it with captureElectronError.
 * @param error The error to report
 * @param context The context to report with the error
 */
export function capturePreloadError(
  error: unknown,
  context?: PreloadErrorContext,
) {
  // Raw DOM events (e.g. a <video>/<audio> 'error' event with no attached
  // MediaError) carry no message or stack trace and are useless in Sentry.
  if (typeof Event !== 'undefined' && error instanceof Event) return;

  const cause =
    (error instanceof Error && error.cause) ||
    (typeof error === 'object' && error !== null && 'cause' in error
      ? (error as { cause: unknown }).cause
      : undefined);

  // The cause is the actual failure; the outer error is just a wrapper
  // adding context, so only the cause needs its own Sentry report.
  if (
    cause instanceof Error ||
    (typeof Event !== 'undefined' && cause instanceof Event)
  ) {
    capturePreloadError(cause, context);
    return;
  }

  if (import.meta.env.IS_DEV) {
    log(error, 'errorHandling', 'error');
    log('context', 'errorHandling', 'warn', context);
    return;
  }

  forwardToMain({
    ...(context && { context }),
    error: serializePreloadError(error),
  }).catch((forwardError: unknown) => {
    log(forwardError, 'errorHandling', 'error', error);
  });
}
