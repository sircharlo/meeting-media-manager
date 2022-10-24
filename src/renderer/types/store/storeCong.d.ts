import { WebDAVClient, FileStat } from 'webdav/dist/web/types'

export interface CongFile extends FileStat {
  children?: CongFile[]
}

export interface CongStore {
  client: WebDAVClient | null
  contents: FileStat[]
  contentsTree: CongFile[]
  prefs: ElectronStore | null
}
