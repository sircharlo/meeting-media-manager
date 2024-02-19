import Vue from 'vue'
import { library, config, IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  FontAwesomeIcon,
  FontAwesomeLayers,
} from '@fortawesome/vue-fontawesome'
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faSquareCheck,
  faCaretDown,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons'
import { faSquare } from '@fortawesome/free-regular-svg-icons'

// Font-Awesome
config.autoAddCss = false
library.add(
  faSquare,
  faSquareCheck as IconDefinition,
  faChevronDown as IconDefinition,
  faChevronLeft as IconDefinition,
  faChevronRight as IconDefinition,
  faCaretDown as IconDefinition,
  faTimesCircle as IconDefinition
)

Vue.component('FontAwesomeIcon', FontAwesomeIcon)
Vue.component('FontAwesomeLayers', FontAwesomeLayers)
