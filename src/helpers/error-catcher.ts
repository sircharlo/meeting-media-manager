import { captureException } from '@sentry/electron/renderer';

type CaptureCtx = Parameters<typeof captureException>[1];

export const errorCatcher = async (
  error: Error | string | unknown,
  context?: CaptureCtx,
) => {
  if (!error) return;

  if (error instanceof Error && error.cause) {
    errorCatcher(error.cause, context);
  }

  if (!process.env.IS_DEV) {
    captureException(error, context);
  } else {
    console.error(error);
    console.warn('context', context);
  }
};
