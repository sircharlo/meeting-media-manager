import { MutationTree } from 'vuex'
import { Notify } from '~/types'

const defaultState: Notify = {
  action: undefined,
  type: 'info',
  dismiss: true,
  identifier: undefined,
  message: '',
  persistent: false,
  timestamp: 0,
}

export const state = () => [] as Notify[]

export const mutations: MutationTree<Notify[]> = {
  show(state, payload: Notify) {
    const msg = { ...defaultState, ...payload, timestamp: Date.now() }

    // Prevent duplicate messages
    const match = state.find(
      ({ type, message }) => type === msg.type && message === msg.message
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
}
