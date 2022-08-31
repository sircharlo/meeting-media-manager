import { MutationTree } from 'vuex'
import { MeetingFile, StatStore, Perf, Stats, Origin } from '~/types'

const defaultState: StatStore = {
  online: false,
  initialLoad: true,
  updateSuccess: true,
  performance: new Map(),
  downloads: {
    jworg: {
      cache: [],
      live: [],
    },
    cong: {
      cache: [],
      live: [],
    },
  },
}

export const state = () => Object.assign({}, defaultState)

export const mutations: MutationTree<StatStore> = {
  setOnline(state, online: boolean) {
    state.online = online
  },
  setInitialLoad(state, initialLoad: boolean) {
    state.initialLoad = initialLoad
  },
  setUpdateSuccess(state, success: boolean) {
    state.updateSuccess = success
  },
  startPerf(state, { func, start }: { func: string; start: number }) {
    state.performance.set(func, { start, stop: 0 })
  },
  stopPerf(state, { func, stop }: { func: string; stop: number }) {
    const perf = state.performance.get(func) as Perf
    perf.stop = stop
    state.performance.set(func, perf)
  },
  setDownloads(
    state,
    {
      origin,
      source,
      file,
    }: {
      origin: keyof Stats
      source: keyof Origin
      file: MeetingFile
    }
  ) {
    state.downloads[origin][source].push(file)
  },
  clearPerf(state: StatStore) {
    state.performance = new Map()
  },
  clearDownloadStats(state: StatStore) {
    Object.assign(state.downloads, defaultState.downloads)
  },
  clearAll(state: StatStore) {
    Object.assign(state, defaultState)
  },
}
