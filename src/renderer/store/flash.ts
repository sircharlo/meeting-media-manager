import { Flash } from '~/types'

const defaultState: Flash = {
  message: '',
  color: 'info',
  duration: 6,
}

export const state = () => Object.assign({}, defaultState)

export const mutations = {
  show(state: Flash, payload: Flash) {
    Object.assign(state, payload)
  },
  clear(state: Flash) {
    Object.assign(state, defaultState)
  },
}

export const getters = {
  message(state: Flash) {
    return state.message
  },
  color(state: Flash) {
    return state.color
  },
  duration(state: Flash) {
    return state.duration
  },
}
