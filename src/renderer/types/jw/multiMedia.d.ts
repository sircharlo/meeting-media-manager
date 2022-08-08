export interface MultiMediaItem {
  BeginParagraphOrdinal?: number
  Caption: string
  CaptionContent?: string | null
  CaptionRich?: string | null
  CategoryType: number
  CreditLine?: string
  CreditLineContent?: string | null
  CreditLineRich?: string | null
  DataType?: number
  DocumentId: number
  DocumentMultimediaId?: number
  EndParagraphOrdinal?: number
  FileName?: string
  FilePath: string
  Height?: number | null
  IssueTagNumber?: number
  KeySymbol?: string | null
  Label: string
  LabelRich?: string | null
  LinkMultimediaId?: number | null
  LocalPath?: string
  MajorType: number
  MepsDocumentId?: number | null
  MepsLanguageIndex?: number
  MimeType: string
  MinorType?: number
  MultiMeps?: number | null
  MultimediaId: number
  NextParagraphOrdinal?: number
  SizeConstraint?: number | null
  SuppressZoom?: number
  TargetParagraphNumberLabel?: string | null
  Track?: number | null
  Width?: number | null
  tableQuestionIsUsed?: boolean
}

export interface MultiMediaImage {
  BeginParagraphOrdinal?: number
  checksum?: string
  filepath?: string
  filesize?: number
  safeName?: string
  folder?: string
  queryInfo: MultiMediaItem
  title: string
  congSpecific?: boolean
  url?: undefined
  pub?: undefined
  markers: undefined
  hidden?: boolean
  isLocal?: boolean
  uniqueId?: string
}

export interface MultiMediaExtract {
  BeginParagraphOrdinal: number
  DocumentId: number
  EndParagraphOrdinal: number
  IssueTagNumber: string
  Lang: string
  Link: string
  RefBeginParagraphOrdinal: number | null
  RefEndParagraphOrdinal: number | null
  RefMepsDocumentId: number
  RefPublicationId: number
  UniqueEnglishSymbol: string
}

export interface MultiMediaExtractRef {
  BeginParagraphOrdinal: number
  DocumentId: number
  SourceDocumentId: number
}
