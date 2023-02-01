import Vue from 'vue'
// @ts-ignore: VueMask has implicitly an any type
import VueMask from 'v-mask'
import { library, config } from '@fortawesome/fontawesome-svg-core'
import {
  FontAwesomeIcon,
  FontAwesomeLayers,
} from '@fortawesome/vue-fontawesome'
import {
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faSquareCheck,
  faCaretDown,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons'
import { faSquare } from '@fortawesome/free-regular-svg-icons'

// Font-Awesome
config.autoAddCss = false
library.add(
  faChevronDown,
  faSquare,
  faSquareCheck,
  faChevronLeft,
  faChevronRight,
  faCaretDown,
  faTimesCircle
)

Vue.component('FontAwesomeIcon', FontAwesomeIcon)
Vue.component('FontAwesomeLayers', FontAwesomeLayers)

// V-mask
Vue.use(VueMask)
