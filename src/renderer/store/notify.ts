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

export const state = () => []

export const mutations = {
  show(state: Notify[], payload: Notify) {
    const msg = { ...defaultState, ...payload, timestamp: Date.now() }
    state.push(msg)
  },
  delete(state: Notify[], index: number) {
    state.splice(index, 1)
  },
}
