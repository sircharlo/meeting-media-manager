import { MutationTree, GetterTree } from 'vuex'

interface PresentStore {
  mediaScreenInit: boolean
  mediaScreenVisible: boolean
  background: string
  screens: { id: number; class: string; text: string }[]
  shortcuts: { name: string; domain: string; fn: string }[]
}

const defaultState: PresentStore = {
  mediaScreenInit: false, // Whether the media screen has been initialized (is it open)
  mediaScreenVisible: true, // Whether the media screen is visible (is it minimized or not)
  background: '', // Either html of the yeartext (<p>...</p>) or a URL to the custom background
  screens: [], // The available monitors
  shortcuts: [], // The shortcuts that have been registered
}

export const state = () => Object.assign({}, defaultState)

export const mutations: MutationTree<PresentStore> = {
  setBackground(state, background: string) {
    state.background = background
  },
  setMediaScreenVisible(state, visible: boolean) {
    state.mediaScreenVisible = visible
  },
  setMediaScreenInit(state, init: boolean) {
    state.mediaScreenInit = init
  },
  addScreen(state, screen: { id: number; class: string; text: string }) {
    state.screens.push(screen)
  },
  setScreens(state, screens: { id: number; class: string; text: string }[]) {
    state.screens = screens
  },
  addShortcut(state, shortcut: { name: string; domain: string; fn: string }) {
    const shortcuts = state.shortcuts ?? []
    state.shortcuts = [...shortcuts, shortcut]
  },
  setShortcuts(
    state,
    shortcuts: { name: string; domain: string; fn: string }[]
  ) {
    state.shortcuts = shortcuts
  },
  clear(state) {
    Object.assign(state, defaultState)
  },
}

export const getters: GetterTree<PresentStore, PresentStore> = {
  shortcuts: (state) => state.shortcuts,
}
