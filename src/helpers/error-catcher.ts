import type { ExclusiveEventHintOrCaptureContext } from '@sentry/vue/node_modules/@sentry/core/build/types/utils/prepareEvent';

import { captureException } from '@sentry/vue';
import { IS_DEV } from 'src/constants/general';

const errorCatcher = async (
  originalError: Error | string | unknown,
  context?: ExclusiveEventHintOrCaptureContext,
) => {
  if (!originalError) return;
  if (!IS_DEV) {
    captureException(originalError, context);
  } else {
    console.error(originalError);
    console.warn('context', context);
  }
};

// const warningCatcher = (warning: string) => {
//   if (process.env.NODE_ENV === 'production') {
//     Sentry.captureMessage(warning);
//   } else {
//     console.warn(warning);
//   }
// };

export { errorCatcher };
