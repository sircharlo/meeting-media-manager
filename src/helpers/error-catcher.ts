import { captureException } from '@sentry/vue';
import { log } from 'src/shared/vanilla';

type CaptureCtx = Parameters<typeof captureException>[1];

export const errorCatcher = async (error: unknown, context?: CaptureCtx) => {
  if (!error) return;

  // Raw DOM events (e.g. a <video>/<audio> 'error' event with no attached
  // MediaError) carry no message or stack trace and are useless in Sentry.
  if (typeof Event !== 'undefined' && error instanceof Event) return;

  const cause =
    (error instanceof Error && error.cause) ||
    (typeof error === 'object' && error !== null && 'cause' in error
      ? (error as { cause: unknown }).cause
      : undefined);

  if (cause) {
    // The cause is the actual failure; the outer error is just a wrapper
    // adding context, so only the cause needs its own Sentry report.
    errorCatcher(cause, context);
    return;
  }

  if (import.meta.env.IS_DEV) {
    log(error, 'errorHandling', 'error');
    log('context', 'errorHandling', 'warn', context);
  } else {
    captureException(error, context);
  }
};
