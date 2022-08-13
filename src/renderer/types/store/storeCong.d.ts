import { WebDAVClient, FileStat } from 'webdav/web'

export interface CongFile extends FileStat {
  children?: CongFile[]
}

export interface CongStore {
  client: WebDAVClient | null
  contents: FileStat[]
  contentsTree: CongFile[]
  prefs: ElectronStore | null
}
