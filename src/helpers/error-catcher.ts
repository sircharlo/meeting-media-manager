import type { ExclusiveEventHintOrCaptureContext } from '@sentry/vue/node_modules/@sentry/core/build/types/utils/prepareEvent';

import { captureException } from '@sentry/vue';
import { IS_DEV } from 'src/constants/general';

export const errorCatcher = async (
  originalError: Error | string | unknown,
  context?: ExclusiveEventHintOrCaptureContext,
) => {
  if (!originalError) return;

  if (originalError instanceof Error && originalError.cause) {
    errorCatcher(originalError.cause, context);
  }

  if (!IS_DEV) {
    captureException(originalError, context);
  } else {
    console.error(originalError);
    console.warn('context', context);
  }
};
