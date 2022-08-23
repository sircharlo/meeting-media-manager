import { MultiMediaItem, SmallMediaFile } from './jw'

export interface MeetingFileBase {
  downloadRequired?: boolean
  cacheDir?: string
  cacheFilename?: string
  cacheFile?: string
  destFilename?: string
  folder?: string
  safeName?: string
  uniqueId?: string
  congSpecific?: boolean
  hidden?: boolean
  isLocal?: boolean
  filename?: undefined
  color?: string
  recurring?: boolean
}

export interface VideoFile extends SmallMediaFile, MeetingFileBase {
  BeginParagraphOrdinal?: number
  queryInfo?: MultiMediaItem
  filepath?: string
  contents?: Buffer
}

export interface ImageFile extends MeetingFileBase {
  BeginParagraphOrdinal: number
  queryInfo: MultiMediaItem
  title: string
  filepath?: string
  filesize?: number
  url?: undefined
  markers?: undefined
  pub?: undefined
  checksum?: undefined
  primaryCategory?: undefined
  issue?: undefined
  track?: undefined
  contents?: undefined
  thumbnail?: undefined
  trackImage?: undefined
}

export interface LocalFile {
  safeName: string
  filename?: string
  isLocal?: boolean
  filepath?: string
  contents?: Buffer
  url?: string
  folder?: string
  color?: string
  congSpecific?: boolean
  thumbnail?: undefined
  trackImage?: undefined
  recurring?: boolean
}

export declare type MeetingFile = ImageFile | VideoFile
