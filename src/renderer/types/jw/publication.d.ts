import { MultiMediaItem } from './multiMedia'

export interface Lang {
  direction: string
  locale: string
  name: string
}

export interface Introduction {
  duration: string
  startTime: string
}

export interface Marker extends Introduction {
  mepsParagraphId: number
  endTransitionDuration?: unknown
  label?: string
}

export interface Markers {
  documentId: number
  hash: string
  introduction: Introduction
  markers: Marker[]
  mepsLanguageSpoken: string
  mepsLanguageWritten: string
  type: string
}

export interface PubImage {
  checksum: string | null
  modifiedDatetime: Date | string
  url: string
}

export interface PubFile extends PubImage {
  stream: string
}

export interface BaseMediaFile {
  duration: number
  filesize: number
  markers: Markers | null
  pub: string
  title: string
  track: number
}

export interface SmallMediaFile extends BaseMediaFile {
  BeginParagraphOrdinal?: number
  cacheDir?: string
  cacheFile?: string
  cacheFilename?: string
  checksum: string
  congSpecific?: boolean
  destFilename?: string
  downloadRequired?: boolean
  filepath?: string
  folder?: string
  hidden?: boolean
  isLocal?: boolean
  issue: string
  primaryCategory?: string
  queryInfo?: MultiMediaItem
  safeName?: string
  thumbnail?: string
  trackImage: string
  uniqueId?: string
  url: string
}

export interface MediaFile extends BaseMediaFile {
  bitRate: number
  booknum: number | null
  docid: number
  edition: string
  editionDescr: string
  file: PubFile
  format: string
  formatDescr: string
  frameHeight: number
  frameRate: number
  frameWidth: number
  hasTrack: boolean
  label: string
  mimetype: string
  specialty: string
  specialtyDescr: string
  subtitled: boolean
  trackImage: PubImage
}

export interface FileTypes {
  [key: string]: MediaFile[]
}

export interface Publication {
  booknum: number | null
  fileformat: string[]
  files: { [key: string]: FileTypes }
  formattedDate: string
  issue: string
  languages: { [key: string]: Lang }
  parentPubName: string
  pub: string
  pubImage: PubImage
  pubName: string
  specialty: string
  track: number | null
}
