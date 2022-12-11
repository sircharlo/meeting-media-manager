import { MultiMediaItem, SmallMediaFile } from './jw'

export interface MeetingFileBase {
  cacheDir?: string
  cacheFile?: string
  cacheFilename?: string
  color?: string
  congSpecific?: boolean
  destFilename?: string
  downloadRequired?: boolean
  filename?: undefined
  folder?: string
  hidden?: boolean
  isLocal?: boolean
  recurring?: boolean
  safeName?: string
  uniqueId?: string
  loading?: boolean
  ignored?: boolean
}

export interface VideoFile extends SmallMediaFile, MeetingFileBase {
  BeginParagraphOrdinal?: number
  contents?: Buffer
  filepath?: string
  queryInfo?: MultiMediaItem
}

export interface ImageFile extends MeetingFileBase {
  BeginParagraphOrdinal: number
  checksum?: undefined
  contents?: undefined
  filepath?: string
  filesize?: number
  issue?: undefined
  markers?: undefined
  primaryCategory?: undefined
  pub?: undefined
  queryInfo: MultiMediaItem
  thumbnail?: undefined
  title: string
  track?: undefined
  trackImage?: undefined
  url?: undefined
}

export interface LocalFile {
  color?: string
  congSpecific?: boolean
  contents?: Buffer
  filename?: string
  filepath?: string
  folder?: string
  hidden?: boolean
  isLocal?: boolean
  recurring?: boolean
  safeName: string
  thumbnail?: undefined
  trackImage?: undefined
  url?: string
  loading?: boolean
  ignored?: boolean
}

export declare type MeetingFile = ImageFile | VideoFile
