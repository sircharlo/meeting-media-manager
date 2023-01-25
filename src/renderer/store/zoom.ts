import { MutationTree } from 'vuex'
import zoomSDK, { EmbeddedClient } from '@zoomus/websdk/embedded'

interface ZoomStore {
  client: typeof EmbeddedClient | null
  connected: boolean
  coHost: boolean
  video: boolean
  sequence: number
  toggleVideo: boolean
}

const defaultState: ZoomStore = {
  client: null,
  connected: false,
  coHost: false,
  video: false,
  sequence: 1,
  toggleVideo: false,
}

export const state = () => Object.assign({}, defaultState)

export const mutations: MutationTree<ZoomStore> = {
  setClient(state, client: typeof EmbeddedClient) {
    state.client = client
  },
  toggleVideo(state, enable: boolean) {
    state.toggleVideo = enable
  },
  setVideo(state, video: boolean) {
    state.video = video
    state.toggleVideo = video
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
