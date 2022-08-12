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
}

export interface VideoFile extends SmallMediaFile, MeetingFileBase {
  BeginParagraphOrdinal?: number
  queryInfo?: MultiMediaItem
  filepath: undefined
}

export interface ImageFile extends MeetingFileBase {
  BeginParagraphOrdinal: number
  queryInfo: MultiMediaItem
  title: string
  filepath?: string
  filesize?: number
  url: undefined
  markers: undefined
  pub: undefined
  checksum: undefined
  primaryCategory: undefined
  issue: undefined
  track: undefined
}

export declare type MeetingFile = ImageFile | VideoFile
