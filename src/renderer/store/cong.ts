import { FileStat, WebDAVClient } from 'webdav'
import { CongFile } from './../types/store/storeCong.d'
import { CongStore, ElectronStore } from '~/types'

const defaultState: CongStore = {
  client: null,
  contents: [],
  contentsTree: [],
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
  setContentsTree(state: CongStore, contentsTree: CongFile[]) {
    state.contentsTree = contentsTree
  },
  clear(state: CongStore) {
    Object.assign(state, defaultState)
  },
}
