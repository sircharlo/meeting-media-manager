import { MutationTree } from 'vuex'
import zoomSDK, { EmbeddedClient, Participant } from '@zoomus/websdk/embedded'

interface ZoomStore {
  client: typeof EmbeddedClient | null
  participants: Participant[]
  connected: boolean
  coHost: boolean
  sequence: number
  started: boolean
  websocket: WebSocket | null
  userID: number | null
  hostID: number | null
  spotlights: number[]
}

const defaultState: ZoomStore = {
  client: null,
  participants: [],
  connected: false,
  coHost: false,
  sequence: 1,
  started: false,
  websocket: null,
  userID: null,
  hostID: null,
  spotlights: [],
}

export const state = () => Object.assign({}, defaultState)

export const mutations: MutationTree<ZoomStore> = {
  setClient(state, client: typeof EmbeddedClient) {
    state.client = client
  },
  setUserID(state, userID: number) {
    state.userID = userID
  },
  setHostID(state, hostID: number) {
    state.hostID = hostID
  },
  setSpotlights(state, spotlights: number[]) {
    state.spotlights = spotlights
  },
  setParticipants(state, participants: Participant[]) {
    state.participants = participants
  },
  setStarted(state, started: boolean) {
    state.started = started
  },
  setWebSocket(state, websocket: WebSocket) {
    state.websocket = websocket
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
