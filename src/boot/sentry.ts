import { defineBoot } from '@quasar/app-vite/wrappers';
import { init, replayIntegration } from '@sentry/electron/renderer';
import {
  browserSessionIntegration,
  browserTracingIntegration,
  init as initVue,
  vueIntegration,
} from '@sentry/vue';
import { errorCatcher } from 'src/helpers/error-catcher';

export default defineBoot(({ app, router }) => {
  try {
    if (!process.env.IS_DEV) {
      init(
        {
          // @ts-expect-error: app does not exist on Sentry renderer, but it does on Sentry vue
          app,
          integrations: [
            vueIntegration({ app }),
            browserSessionIntegration(),
            browserTracingIntegration({ router }),
            replayIntegration(),
          ],
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
