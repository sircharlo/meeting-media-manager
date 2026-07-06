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
    if (!import.meta.env.IS_DEV) {
      init({
        app,
        dsn: 'https://40b7d92d692d42814570d217655198db@o1401005.ingest.us.sentry.io/4507449197920256',
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
