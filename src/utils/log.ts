import type { ExclusiveEventHintOrCaptureContext } from '@sentry/vue/node_modules/@sentry/core/build/types/utils/prepareEvent';

import { captureException } from '@sentry/vue';
import { IS_DEV } from 'src/constants/general';

export const captureError = async (
  originalError: Error | string | unknown,
  context?: ExclusiveEventHintOrCaptureContext,
) => {
  if (!originalError) return;
  if (IS_DEV) {
    console.error(originalError);
    console.warn('context', context);
  } else {
    captureException(originalError, context);
  }
};
