import { MutationTree, GetterTree } from 'vuex'

interface Congregation {
  name: string
}

const defaultState: Congregation = {
  name: "", // Default congregation name
}

export const state = () => Object.assign({}, defaultState)

export const mutations: MutationTree<Congregation> = {
  setName(state, name: string) {
    state.name = name.replace("prefs-", "")
  },
  clear(state) {
    Object.assign(state, defaultState)
  },
}

export const getters: GetterTree<Congregation, Congregation> = {
  name(state) {
    return state
  },
}
