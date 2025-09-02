import { defineBoot } from '@quasar/app-vite/wrappers';
import {
  browserSessionIntegration,
  browserTracingIntegration,
  init,
  vueIntegration,
} from '@sentry/vue';
import { errorCatcher } from 'src/helpers/error-catcher';

export default defineBoot(({ app, router }) => {
  try {
    if (!process.env.IS_DEV) {
      init({
        app,
        integrations: [
          vueIntegration({ app }),
          browserSessionIntegration(),
          browserTracingIntegration({ router }),
        ],
        tracesSampleRate: 1.0,
      });
    }
  } catch (error) {
    errorCatcher(error);
  }
});
