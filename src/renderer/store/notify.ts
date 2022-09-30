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
    console.log('trying to delete', msg)
    console.log(JSON.stringify(state))
    const match = state.find(({ message }) => message === msg)
    console.log(match)
    if (match) {
      state.splice(state.indexOf(match), 1)
    }
  },
}
