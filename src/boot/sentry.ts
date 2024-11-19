import { defineBoot } from '#q-app/wrappers';
import { init, replayIntegration } from '@sentry/electron/renderer';
import {
  browserTracingIntegration,
  init as initVue,
  vueIntegration,
} from '@sentry/vue';
import { IS_DEV } from 'src/constants/general';
import { errorCatcher } from 'src/helpers/error-catcher';

import { version } from '../../package.json';

export default defineBoot(({ app, router }) => {
  try {
    if (!IS_DEV)
      init(
        {
          app,
          debug: true,
          dsn: 'https://0f2ab1c7ddfb118d25704c85957b8188@o1401005.ingest.us.sentry.io/4507449197920256',
          integrations: [
            vueIntegration({ app }),
            browserTracingIntegration({ router }),
            replayIntegration(),
          ],
          release: version,
          replaysOnErrorSampleRate: 1.0,
          replaysSessionSampleRate: 0,
          tracesSampleRate: 1.0,
        },
        initVue,
      );
  } catch (error) {
    errorCatcher(error);
  }
});
