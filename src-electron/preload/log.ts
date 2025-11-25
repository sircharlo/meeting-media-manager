import type { ExclusiveEventHintOrCaptureContext } from 'src/types';

import { captureException } from '@sentry/electron';

/**
 * Logs an error to the console or to Sentry
 * @param error The error to log
 * @param context The context to log with the error
 */
export function capturePreloadError(
  error: Error | string | unknown,
  context?: ExclusiveEventHintOrCaptureContext,
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
