import Vue from 'vue'
import { library, config } from '@fortawesome/fontawesome-svg-core'
import {
  FontAwesomeIcon,
  FontAwesomeLayers,
} from '@fortawesome/vue-fontawesome'
import {
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faCaretDown,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons'

// Font-Awesome
config.autoAddCss = false
library.add(
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCaretDown,
  faTimesCircle
)

Vue.component('FontAwesomeIcon', FontAwesomeIcon)
Vue.component('FontAwesomeLayers', FontAwesomeLayers)
