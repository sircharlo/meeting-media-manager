import { Context } from '@nuxt/types'
export default function (
  { store }: Context,
  inject: (arg0: string, arg1: any) => void
) {
  inject('flash', (message: string, color: string = 'info') => {
    store.commit('flash/show', {
      message,
      color,
    })
  })

  inject('success', (message: string) => {
    store.commit('flash/show', {
      message,
      color: 'success',
    })
  })

  inject('warn', (message: string) => {
    store.commit('flash/show', {
      message,
      color: 'warning',
    })
  })

  inject('error', (message: string) => {
    store.commit('flash/show', {
      message,
      color: 'error',
    })
  })
}
