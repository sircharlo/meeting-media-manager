import Vue from 'vue'
import * as Sentry from '@sentry/vue'
import { Plugin } from '@nuxt/types'

const plugin: Plugin = ({ $config }, inject) => {
  Sentry.init({
    Vue,
    dsn: $config.sentryDSN,
    release: `meeting-media-manager@${$config.version.substring(1)}`,
    environment: $config.isDev ? 'development' : 'production',
  })
  inject('sentry', Sentry)
}

export default plugin
