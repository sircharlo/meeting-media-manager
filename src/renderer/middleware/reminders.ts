import { Middleware } from '@nuxt/types'

const middleware: Middleware = ({ from, route, $warn }) => {
  if (from.path === '/add' && route.path !== '/add') {
    $warn('dontForgetToGetMedia')
  }
}

export default middleware
