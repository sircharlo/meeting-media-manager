import { Middleware } from '@nuxt/types'

const middleware: Middleware = ({ from, route, localePath, $notify }) => {
  if (from.path === localePath('/add') && route.path !== localePath('/add')) {
    $notify('dontForgetToGetMedia')
  }
}

export default middleware
