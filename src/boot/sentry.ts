import {
  browserSessionIntegration,
  browserTracingIntegration,
  init,
  vueIntegration,
} from '@sentry/vue';
import { errorCatcher } from 'src/helpers/error-catcher';

import { defineBoot } from '#q-app';

export default defineBoot(({ app, router }) => {
  try {
    if (!import.meta.env.IS_DEV && import.meta.env.SENTRY_DSN) {
      init({
        app,
        dsn: import.meta.env.SENTRY_DSN,
        integrations: [
          vueIntegration({ app }),
          browserSessionIntegration(),
          browserTracingIntegration({ router }),
        ],
        release: `${import.meta.env.APP_NAME}@${import.meta.env.version}`,
        tracesSampleRate: 1,
      });
    }
  } catch (error) {
    errorCatcher(error);
  }
});
