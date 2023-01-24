import { MutationTree } from 'vuex'
import zoomSDK, { EmbeddedClient } from '@zoomus/websdk/embedded'

interface ZoomStore {
  client: typeof EmbeddedClient | null
  connected: boolean
  coHost: boolean
  sequence: number
}

const defaultState: ZoomStore = {
  client: null,
  connected: false,
  coHost: false,
  sequence: 1,
}

export const state = () => Object.assign({}, defaultState)

export const mutations: MutationTree<ZoomStore> = {
  setClient(state, client: typeof EmbeddedClient) {
    state.client = client
  },
  increaseSequence(state) {
    state.sequence += 1
  },
  setConnected(state, connected: boolean) {
    state.connected = connected
  },
  setCoHost(state, coHost: boolean) {
    state.coHost = coHost
  },
  clear(state) {
    if (state.client) {
      zoomSDK.destroyClient()
    }
    Object.assign(state, defaultState)
  },
}
