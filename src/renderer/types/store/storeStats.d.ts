import { SmallMediaFile, MultiMediaImage } from '../jw'

export interface Perf {
  start: number
  stop: number
}

export interface Origin {
  cache: (SmallMediaFile | MultiMediaImage)[]
  live: (SmallMediaFile | MultiMediaImage)[]
}

export interface Stats {
  jworg: Origin
  cong: Origin
}

export interface StatStore {
  online: boolean
  performance: Map<string, Perf>
  downloads: Stats
}
