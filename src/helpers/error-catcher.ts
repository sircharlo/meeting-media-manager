import * as Sentry from '@sentry/vue';

const devMode = process.env.NODE_ENV === 'development';

const errorCatcher = async (originalError: Error | string | unknown) => {
  if (!originalError) return;
  if (!devMode) {
    Sentry.captureException(originalError);
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
