import { Middleware } from '@nuxt/types'

const middleware: Middleware = ({ from, route, localePath, $warn }) => {
  if (from.path === localePath('/add') && route.path !== localePath('/add')) {
    $warn('dontForgetToGetMedia')
  }
}

export default middleware
