import { defineBoot } from '#q-app/wrappers';
import { init, replayIntegration } from '@sentry/electron/renderer';
import {
  browserSessionIntegration,
  browserTracingIntegration,
  init as initVue,
  vueIntegration,
} from '@sentry/vue';
import { IS_DEV } from 'src/constants/general';
import { SENTRY_DSN } from 'src/constants/sentry';
import { errorCatcher } from 'src/helpers/error-catcher';

import { version } from '../../package.json';

export default defineBoot(({ app, router }) => {
  try {
    if (!IS_DEV) {
      init(
        {
          // @ts-expect-error: app does not exist on Sentry renderer, but it does on Sentry vue
          app,
          dsn: SENTRY_DSN,
          integrations: [
            vueIntegration({ app }),
            browserSessionIntegration(),
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
