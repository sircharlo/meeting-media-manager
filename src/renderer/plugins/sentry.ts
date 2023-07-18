import { platform } from 'os'
import Vue from 'vue'
import * as Sentry from '@sentry/vue'
import { Plugin } from '@nuxt/types'

const plugin: Plugin = ({ $config, app }, inject) => {
  if ($config.sentryInit) {
    Sentry.init({
      Vue,
      dsn: $config.sentryDSN,
      dist: platform().replace('32', ''),
      enabled: $config.sentryEnabled,
      release: `meeting-media-manager@${
        $config.isDev || !$config.ci ? 'dev' : $config.version.substring(1)
      }`,
      environment: $config.isDev ? 'development' : 'production',
      integrations: app.router
        ? [
            new Sentry.BrowserTracing({
              routingInstrumentation: Sentry.vueRouterInstrumentation(
                app.router
              ),
              tracingOrigins: ['localhost', 'my-site-url.com', /^\//],
            }),
          ]
        : [],
      tracesSampleRate: $config.isDev ? 1.0 : 0.1,
    })
  }
  inject('sentry', Sentry)
}

export default plugin
