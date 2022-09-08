import Vue from 'vue'
// @ts-ignore
import VueMask from 'v-mask'
import { library, config } from '@fortawesome/fontawesome-svg-core'
import {
  FontAwesomeIcon,
  FontAwesomeLayers,
} from '@fortawesome/vue-fontawesome'
import { faChevronDown, faCaretDown } from '@fortawesome/free-solid-svg-icons'
import * as Sentry from '@sentry/vue'
import { Plugin } from '@nuxt/types'

// Font-Awesome
config.autoAddCss = false
library.add(faChevronDown, faCaretDown)

Vue.component('FontAwesomeIcon', FontAwesomeIcon)
Vue.component('FontAwesomeLayers', FontAwesomeLayers)

// v-mask
Vue.use(VueMask)

const plugin: Plugin = ({ $config }) => {
  Sentry.init({
    Vue,
    dsn: $config.sentryDsn,
    release: `meeting-media-manager@${$config.version.substring(1)}`,
    environment: $config.isDev ? 'development' : 'production',
  })
}

export default plugin
