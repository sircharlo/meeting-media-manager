/* eslint-disable vue/component-definition-name-casing */
import Vue from 'vue'
// @ts-ignore
import VueMask from 'v-mask'
import { library, config } from '@fortawesome/fontawesome-svg-core'
import {
  FontAwesomeIcon,
  FontAwesomeLayers,
} from '@fortawesome/vue-fontawesome'
import { faChevronDown, faCaretDown } from '@fortawesome/free-solid-svg-icons'

// Font-Awesome
config.autoAddCss = false
library.add(faChevronDown, faCaretDown)

Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.component('font-awesome-layers', FontAwesomeLayers)

// v-mask
Vue.use(VueMask)
