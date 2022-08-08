import { Scene } from 'obs-websocket-js'

interface OBSStore {
  connected: boolean
  scenes: Scene[]
  currentScene: string
}

const defaultState: OBSStore = {
  connected: false,
  scenes: [],
  currentScene: '',
}

export const state = () => Object.assign({}, defaultState)

export const mutations = {
  setConnected(state: OBSStore, connected: boolean) {
    state.connected = connected
  },
  setScenes(state: OBSStore, scenes: Scene[]) {
    state.scenes = scenes
  },
  setCurrentScene(state: OBSStore, scene: string) {
    state.currentScene = scene
  },
  clear(state: OBSStore) {
    Object.assign(state, defaultState)
  },
}
