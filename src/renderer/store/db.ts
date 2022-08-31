import { MutationTree, ActionTree, GetterTree } from 'vuex'
import { Database } from 'sql.js'

interface DBStore {
  dbs: Map<string, Map<string, Database>>
}

const defaultState: DBStore = {
  dbs: new Map(),
}

export const state = () => Object.assign({}, defaultState)

export const mutations: MutationTree<DBStore> = {
  set(state, { pub, issue, db }: { pub: string; issue: string; db: Database }) {
    let pubMap = state.dbs.get(pub)
    if (!pubMap) {
      state.dbs.set(pub, new Map())
      pubMap = state.dbs.get(pub) as Map<string, Database>
    }
    const issueMap = new Map(pubMap.set(issue, db))
    state.dbs = new Map(state.dbs.set(pub, issueMap))
  },
  clear(state) {
    state.dbs = new Map()
  },
}

export const actions: ActionTree<DBStore, DBStore> = {
  get({ state }, { pub, issue }: { pub: string; issue: string }) {
    return state.dbs.get(pub)?.get(issue)
  },
}

export const getters: GetterTree<DBStore, DBStore> = {
  dbs(state) {
    return JSON.parse(JSON.stringify(state))
  },
}
