import {
  browserSessionIntegration,
  browserTracingIntegration,
  init,
  vueIntegration,
} from '@sentry/vue';
import { errorCatcher } from 'src/helpers/error-catcher';
import { log, scrubUserPathsDeep } from 'src/shared/vanilla';

import { defineBoot } from '#q-app';

export default defineBoot(({ app, router }) => {
  try {
    if (import.meta.env.IS_DEV) {
      log('IS_DEV is true, Sentry will not be initialized', 'sentry', 'debug', {
        SENTRY_DSN: import.meta.env.SENTRY_DSN,
      });
      return;
    }
    if (!import.meta.env.SENTRY_DSN) {
      log(
        'Sentry DSN is undefined, Sentry will not be initialized in renderer process',
        'sentry',
        'debug',
        {
          SENTRY_DSN: import.meta.env.SENTRY_DSN,
        },
      );
      return;
    }
    const dsn = import.meta.env.SENTRY_DSN;
    const release = `${import.meta.env.APP_NAME}@${import.meta.env.version}`;
    let environment: 'beta' | 'production' | 'test' = 'production';
    if (import.meta.env.IS_TEST) {
      environment = 'test';
    } else if (import.meta.env.IS_BETA) {
      environment = 'beta';
    }

    log('Sentry initialized (renderer process)', 'sentry', 'debug', {
      dsn,
      environment,
      release,
    });

    init({
      app,
      beforeSend: (event) => {
        const scrubbedEvent = scrubUserPathsDeep(event);
        log('Sentry event sending (renderer process)', 'sentry', 'debug', {
          dsn,
          event: scrubbedEvent,
        });
        return scrubbedEvent;
      },
      dsn,
      environment,
      integrations: [
        vueIntegration({ app }),
        browserSessionIntegration(),
        browserTracingIntegration({ router }),
      ],
      release,
      tracesSampleRate: 1,
    });
  } catch (error) {
    errorCatcher(error);
  }
});
