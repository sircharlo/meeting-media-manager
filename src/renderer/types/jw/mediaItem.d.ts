export interface Subtitles {
  checksum: string
  modifiedDatetime: Date
  url: string
}

export interface File {
  bitRate: number
  checksum: string
  duration: number
  filesize: number
  frameHeight: number
  frameRate: number
  frameWidth: number
  label: string
  mimetype: string
  modifiedDatetime: Date
  progressiveDownloadURL: string
  subtitled: boolean
  subtitles: Subtitles | null
}

export interface Image {
  sm: string
  xs: string
  lg: string
  md: string
}

export interface Images {
  lsr?: Image
  lss?: Image
  pnr?: Image
  sqr?: Image
  sqs?: Image
  wsr?: Image
  wss?: Image
}

export interface MediaItem {
  availableLanguages: string[]
  description: string
  duration: number
  durationFormattedHHMM: string
  durationFormattedMinSec: string
  files: File[]
  firstPublished: Date
  guid: string
  images: Images
  languageAgnosticNaturalKey: string
  naturalKey: string
  primaryCategory: string
  printReferences: string[]
  tags: string[]
  title: string
  type: string
}

export interface MediaItemResult {
  media: MediaItem[]
}
