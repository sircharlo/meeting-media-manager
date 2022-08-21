import { Context } from '@nuxt/types'
import { NotifyAction } from './../types/store/storeNotify.d'
export default function (
  { store, $log }: Context,
  inject: (arg0: string, arg1: any) => void
) {
  inject(
    'notify',
    (
      message: string,
      props?: {
        action?: NotifyAction
        type?: string
        dismiss?: boolean
        identifier?: string
        persistent?: boolean
      },
      error?: any
    ) => {
      if (props?.type === 'warning' && error) {
        $log.warn(error)
        props.action = {
          type: 'error',
          label: 'reportIssue',
          url: error,
        }
        props.persistent = true
      } else if (props?.type === 'error' && error) {
        $log.error(error)
        props.action = {
          type: 'error',
          label: 'reportIssue',
          url: error,
        }
        props.persistent = true
      }
      console.log('notify', { message, ...(props ?? {}) })
      store.commit('notify/show', {
        message,
        ...(props ?? {}),
      })
    }
  )

  inject(
    'success',
    (
      message: string,
      props?: {
        action?: NotifyAction
        dismiss?: boolean
        identifier?: string
        persistent?: boolean
      }
    ) => {
      store.commit('notify/show', {
        message,
        type: 'success',
        ...(props ?? {}),
      })
    }
  )

  inject(
    'warn',
    (
      message: string,
      props?: {
        dismiss?: boolean
        identifier?: string
        persistent?: boolean
      },
      error?: any
    ) => {
      let action
      if (error) {
        $log.warn(error)
        action = {
          type: 'error',
          label: 'reportIssue',
          url: error,
        }
        if (props) {
          props.persistent = true
        }
      }
      store.commit('notify/show', {
        message,
        type: 'warning',
        action,
        ...(props ?? { persistent: !!error }),
      })
    }
  )

  inject('error', (message: string, error: any, identifier?: string) => {
    $log.error(error)
    store.commit('notify/show', {
      message,
      type: 'error',
      persistent: true,
      identifier,
      action: {
        type: 'error',
        label: 'reportIssue',
        url: error,
      },
    })
  })
}
