import { Middleware } from '@nuxt/types'

const middleware: Middleware = ({ from, route, $warn }) => {
  if (from.path.endsWith('/add') && !route.path.endsWith('/add')) {
    $warn('dontForgetToGetMedia')
  }
}

export default middleware
