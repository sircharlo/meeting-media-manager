import { captureException } from '@sentry/electron/renderer';
import { log } from 'src/shared/vanilla';

type CaptureCtx = Parameters<typeof captureException>[1];

/**
 * Logs an error to the console or to Sentry
 * @param error The error to log
 * @param context The context to log with the error
 */
export function capturePreloadError(error: unknown, context?: CaptureCtx) {
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
  } else {
    captureException(error, context);
  }
}
