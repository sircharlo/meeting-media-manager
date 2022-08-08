import { WebDAVClient, FileStat } from 'webdav/web'
import { ElectronStore } from './../types/prefs'

interface CongStore {
  client: WebDAVClient | null
  contents: FileStat[]
  prefs: ElectronStore | null
}

const defaultState: CongStore = {
  client: null,
  contents: [],
  prefs: null,
}

export const state = () => Object.assign({}, defaultState)

export const mutations = {
  setClient(state: CongStore, client: WebDAVClient) {
    state.client = client
  },
  setPrefs(state: CongStore, prefs: ElectronStore) {
    state.prefs = prefs
  },
  setContents(state: CongStore, contents: FileStat[]) {
    state.contents = contents
  },
  clear(state: CongStore) {
    Object.assign(state, defaultState)
  },
}
