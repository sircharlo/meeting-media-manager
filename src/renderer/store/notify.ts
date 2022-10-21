import { MutationTree } from 'vuex'
import { Notify } from '~/types'

const defaultState: Notify = {
  action: undefined, // A button to click
  type: 'info', // Info, warning, error
  dismiss: true, // Whether the user is allowed to dismiss the notification
  identifier: undefined, // A unique identifier (usually a filename or path that triggered the notification)
  message: '', // The message to display
  persistent: false, // Whether the notification dismiss automatically or not
  timestamp: 0, // The timestamp of when the notification was triggered
}

export const state = () => [] as Notify[]

export const mutations: MutationTree<Notify[]> = {
  show(state, payload: Notify) {
    const msg = { ...defaultState, ...payload, timestamp: Date.now() }

    // Prevent duplicate messages
    const match = state.find(
      ({ type, message, identifier }) =>
        type === msg.type &&
        message === msg.message &&
        identifier === msg.identifier
    )
    if (match) {
      match.timestamp = Date.now()
    } else {
      state.push(msg)
    }
  },
  delete(state, index: number) {
    state.splice(index, 1)
  },
  deleteByMessage(state, msg: string) {
    const match = state.find(({ message }) => message === msg)
    if (match) {
      state.splice(state.indexOf(match), 1)
    }
  },
}
