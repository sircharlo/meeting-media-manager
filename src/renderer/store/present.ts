interface PresentStore {
  mediaScreenInit: boolean
  mediaScreenVisible: boolean
  background: string
  screens: { id: string; class: string; text: string }[]
  shortcuts: { name: string; domain: string; fn: string }[]
}

const defaultState: PresentStore = {
  mediaScreenInit: false,
  mediaScreenVisible: true,
  background: 'yeartext.png',
  screens: [],
  shortcuts: [],
}

export const state = () => Object.assign({}, defaultState)

export const mutations = {
  setBackground(state: PresentStore, background: string) {
    state.background = background
  },
  setMediaScreenVisible(state: PresentStore, visible: boolean) {
    state.mediaScreenVisible = visible
  },
  setMediaScreenInit(state: PresentStore, init: boolean) {
    state.mediaScreenInit = init
  },
  addScreen(
    state: PresentStore,
    screen: { id: string; class: string; text: string }
  ) {
    state.screens.push(screen)
  },
  setScreens(
    state: PresentStore,
    screens: { id: string; class: string; text: string }[]
  ) {
    state.screens = screens
  },
  addShortcut(
    state: PresentStore,
    shortcut: { name: string; domain: string; fn: string }
  ) {
    const shortcuts = state.shortcuts ?? []
    state.shortcuts = [...shortcuts, shortcut]
  },
  setShortcuts(
    state: PresentStore,
    shortcuts: { name: string; domain: string; fn: string }[]
  ) {
    state.shortcuts = shortcuts
  },
  clear(state: PresentStore) {
    Object.assign(state, defaultState)
  },
}

export const getters = {
  shortcuts: (state: PresentStore) => state.shortcuts,
}
