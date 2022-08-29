import { Context } from '@nuxt/types'
export default function ({ from, $warn }: Context) {
  if (from.path === '/add') {
    $warn('dontForgetToGetMedia')
  }
}
