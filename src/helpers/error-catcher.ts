import type { ExclusiveEventHintOrCaptureContext } from 'app/node_modules/@sentry/core/build/types/utils/prepareEvent';

import { captureException } from '@sentry/electron/renderer';

export const errorCatcher = async (
  error: Error | string | unknown,
  context?: ExclusiveEventHintOrCaptureContext,
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
