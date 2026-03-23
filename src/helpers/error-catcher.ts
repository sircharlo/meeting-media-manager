import { captureException } from '@sentry/vue';
import { log } from 'src/shared/vanilla';

type CaptureCtx = Parameters<typeof captureException>[1];

export const errorCatcher = async (error: unknown, context?: CaptureCtx) => {
  if (!error) return;

  if (
    (error instanceof Error && error.cause) ||
    (typeof error === 'object' && error !== null && 'cause' in error)
  ) {
    errorCatcher((error as { cause: unknown }).cause, context);
  }

  if (process.env.IS_DEV) {
    log(error, 'errorHandling', 'error');
    log('context', 'errorHandling', 'warn', context);
  } else {
    captureException(error, context);
  }
};
