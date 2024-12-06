import { init, replayIntegration } from '@sentry/electron/renderer';
import {
  browserTracingIntegration,
  init as initVue,
  vueIntegration,
} from '@sentry/vue';
import { boot } from 'quasar/wrappers';
import { IS_DEV } from 'src/constants/general';
import { SENTRY_DSN } from 'src/constants/sentry';
import { errorCatcher } from 'src/helpers/error-catcher';

import { version } from '../../package.json';

export default boot(({ app, router }) => {
  try {
    if (!IS_DEV) {
      init(
        {
          // @ts-expect-error: app does not exist on Sentry renderer, but it does on Sentry vue
          app,
          dsn: SENTRY_DSN,
          integrations: [
            vueIntegration({ app }),
            browserTracingIntegration({ router }),
            replayIntegration(),
          ],
          release: `meeting-media-manager@${version}`,
          replaysOnErrorSampleRate: 1.0,
          replaysSessionSampleRate: 0,
          tracesSampleRate: 1.0,
        },
        initVue,
      );
    }
  } catch (error) {
    errorCatcher(error);
  }
});
