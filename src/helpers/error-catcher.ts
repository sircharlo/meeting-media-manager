import { captureException } from '@sentry/vue';

type CaptureCtx = Parameters<typeof captureException>[1];

export const errorCatcher = async (
  error: Error | string | unknown,
  context?: CaptureCtx,
) => {
  if (!error) return;

  if (
    (error instanceof Error && error.cause) ||
    (typeof error === 'object' && error !== null && 'cause' in error)
  ) {
    errorCatcher((error as { cause: unknown }).cause, context);
  }

  if (!process.env.IS_DEV) {
    captureException(error, context);
  } else {
    console.error(error);
    console.warn('context', context);
  }
};
