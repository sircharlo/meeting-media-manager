import { captureException } from '@sentry/electron/renderer';

type CaptureCtx = Parameters<typeof captureException>[1];

/**
 * Logs an error to the console or to Sentry
 * @param error The error to log
 * @param context The context to log with the error
 */
export function capturePreloadError(
  error: Error | string | unknown,
  context?: CaptureCtx,
) {
  if (error instanceof Error && error.cause) {
    capturePreloadError(error.cause, context);
  }

  if (process.env.IS_DEV) {
    console.error(error);
    console.warn('context', context);
  } else {
    captureException(error, context);
  }
}
