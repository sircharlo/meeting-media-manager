import { captureException } from '@sentry/vue';
import { IS_DEV } from 'src/constants/general';

const errorCatcher = async (originalError: Error | string | unknown) => {
  if (!originalError) return;
  if (!IS_DEV) {
    captureException(originalError);
  } else {
    console.error(originalError);
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
