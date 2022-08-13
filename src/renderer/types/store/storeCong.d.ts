import { WebDAVClient, FileStat } from 'webdav/web'

export interface CongFile extends FileStat {
  children?: CongFile[]
  isLocal?: boolean
  congSpecific?: boolean
  safeName?: string
  color?: string
  url?: string
  filepath?: undefined
  contents?: undefined
  thumbnail?: undefined
  trackImage?: undefined
}

export interface CongStore {
  client: WebDAVClient | null
  contents: FileStat[]
  contentsTree: CongFile[]
  prefs: ElectronStore | null
}
