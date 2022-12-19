import { MutationTree, ActionTree, GetterTree } from 'vuex'
// eslint-disable-next-line import/named
import { Database } from 'sql.js'

interface DBStore {
  dbs: Map<string, Map<string, Database>> // A map of databases to extract media from jwpub files
}

const defaultState: DBStore = {
  dbs: new Map(),
}

export const state = () => Object.assign({}, defaultState)

export const mutations: MutationTree<DBStore> = {
  set(
    state,
    {
      lang,
      pub,
      issue,
      db,
    }: { lang: string; pub: string; issue: string; db: Database }
  ) {
    let pubMap = state.dbs.get(pub + lang)
    if (!pubMap) {
      state.dbs.set(pub + lang, new Map())
      pubMap = state.dbs.get(pub + lang) as Map<string, Database>
    }
    const issueMap = new Map(pubMap.set(issue, db))
    state.dbs = new Map(state.dbs.set(pub + lang, issueMap))
  },
  clear(state) {
    state.dbs = new Map()
  },
}

export const actions: ActionTree<DBStore, DBStore> = {
  get(
    { state },
    { lang, pub, issue }: { lang: string; pub: string; issue: string }
  ) {
    return state.dbs.get(pub + lang)?.get(issue)
  },
}

export const getters: GetterTree<DBStore, DBStore> = {
  dbs(state) {
    return JSON.parse(JSON.stringify(state))
  },
}
