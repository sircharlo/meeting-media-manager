import { MutationTree } from 'vuex'
import { FileStat, WebDAVClient } from 'webdav/dist/web/types'
import { CongFile } from './../types/store/storeCong.d'
import { CongStore, ElectronStore } from '~/types'

const defaultState: CongStore = {
  client: null, // The WebDAV client
  contents: [], // The contents of the directory (Media, Hidden, ForcedPrefs)
  contentsTree: [], // The contents of the directory in a tree format (children property)
  prefs: null, // The preferences that are forced by the server
}

export const state = () => Object.assign({}, defaultState)

export const mutations: MutationTree<CongStore> = {
  setClient(state, client: WebDAVClient) {
    state.client = client
  },
  setPrefs(state, prefs: ElectronStore) {
    state.prefs = prefs
  },
  setContents(state, contents: FileStat[]) {
    state.contents = contents
  },
  setContentsTree(state, contentsTree: CongFile[]) {
    state.contentsTree = contentsTree
  },
  clear(state) {
    Object.assign(state, defaultState)
  },
}
