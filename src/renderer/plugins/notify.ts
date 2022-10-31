import { Plugin } from '@nuxt/types'
import { NotifyAction } from './../types/store/storeNotify.d'
const plugin: Plugin = ({ store, $log }, inject) => {
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
      error?: unknown
    ): void => {
      if (error !== undefined) {
        if (!props) {
          props = {}
        }
        props.action = {
          type: 'error',
          label: 'reportIssue',
          url: error,
        }
        props.persistent = true

        if (props.type === 'warning') {
          $log.warn(error)
        } else {
          $log.error(error)
        }
      }

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
    ): void => {
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
      error?: unknown
    ): void => {
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

  inject(
    'error',
    (message: string, error: unknown, identifier?: string): void => {
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
    }
  )
}

export default plugin
