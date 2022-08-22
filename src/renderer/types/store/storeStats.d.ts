import { MeetingFile } from './../media'

export interface Perf {
  start: number
  stop: number
}

export interface Origin {
  cache: MeetingFile[]
  live: MeetingFile[]
}

export interface Stats {
  jworg: Origin
  cong: Origin
}

export interface StatStore {
  online: boolean
  updateSuccess: boolean
  performance: Map<string, Perf>
  downloads: Stats
}
