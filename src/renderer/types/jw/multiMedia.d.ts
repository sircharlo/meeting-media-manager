export interface MultiMediaItem {
  BeginParagraphOrdinal: number
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
  Link?: string | null
  LocalPath?: string
  LinkMultimediaId?: number | null
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
  tableQuestionIsUsed?: boolean
  TargetParagraphNumberLabel: number
  Track?: number | null
  Width?: number | null
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
