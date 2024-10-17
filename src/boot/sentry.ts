 import {init, replayIntegration} from '@sentry/electron/renderer';
import {browserTracingIntegration, init as initVue, vueIntegration} from '@sentry/vue';
import { boot } from 'quasar/wrappers';
import { errorCatcher } from 'src/helpers/error-catcher';

import packageInfo from '../../package.json';
const devMode = process.env.NODE_ENV === 'development';

export default boot(({ app, router }) => {
  try {
    if (!devMode)
      init({
        // @ts-expect-error: app does not exist on Sentry renderer, but it does on Sentry vue
        app,
        debug: true,
        dsn: 'https://0f2ab1c7ddfb118d25704c85957b8188@o1401005.ingest.us.sentry.io/4507449197920256',
        integrations: [
          vueIntegration({ app }),
          browserTracingIntegration({ router }),
          replayIntegration(),
        ],
        release: packageInfo.version,
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        tracesSampleRate: 1.0,
      }, initVue);
  } catch (error) {
    errorCatcher(error);
  }
});
