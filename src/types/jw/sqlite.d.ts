import type { JwLangCode } from './lang';

export interface DatedTextItem {
  BeginParagraphOrdinal: number;
  Caption: string;
  CaptionRich: string;
  DocumentId: number;
  EndParagraphOrdinal: null | number;
  FirstBibleCitationId: null | number;
  FirstDateOffset: number;
  FirstFootnoteId: null | number;
  LastBibleCitationId: null | number;
  LastDateOffset: number;
  LastFootnoteId: null | number;
  Link: string;
}

export interface DocumentItem {
  DocumentId: number;
  FeatureTitle: string;
  Title: string;
}

export interface JwPlaylistItem {
  Accuracy: number;
  BaseDurationTicks?: number;
  BookNumber: number;
  ChapterNumber: number;
  DocumentId: number;
  DurationTicks: number;
  EndAction: number;
  EndTrimOffsetTicks: number;
  Hash: string;
  IndependentMediaFilePath: string;
  IssueTagNumber: number;
  KeySymbol: string;
  Label: string;
  LocationId: number;
  MepsLanguage: number;
  MimeType: string;
  OriginalFilename: string;
  PlaylistItemId: number;
  StartTrimOffsetTicks: number;
  ThumbnailFilePath: string;
  Title: string;
  Track: number;
  Type: number;
}

export interface MultimediaExtractItem {
  BeginParagraphOrdinal: number;
  DocumentId: number;
  EndParagraphOrdinal: number;
  FilePath?: string;
  IssueTagNumber: string;
  Lang: JwLangCode;
  Link: string;
  RefBeginParagraphOrdinal: null | number;
  RefEndParagraphOrdinal: null | number;
  RefMepsDocumentId: number;
  RefPublicationId: number;
  UniqueEnglishSymbol: string;
}

export interface MultimediaExtractRefItem {
  BeginParagraphOrdinal: number;
  DocumentId: number;
  SourceDocumentId: number;
}

export interface MultimediaItem {
  AlternativeLanguage?: JwLangCode;
  BeginParagraphOrdinal: number;
  BeginPosition?: number;
  BibleBookId?: number;
  BookDisplayTitle?: string;
  BookNumber?: number;
  Caption: string;
  CaptionContent?: null | string;
  CaptionRich?: null | string;
  CategoryType: number;
  ChapterNumber?: number;
  CoverPictureFilePath?: string;
  CreditLine?: string;
  CreditLineContent?: null | string;
  CreditLineRich?: null | string;
  DataType?: number;
  DocumentId: number;
  DocumentMultimediaId?: number;
  Duration?: number;
  EndParagraphOrdinal?: number;
  EndTime?: number;
  FileName?: string;
  FilePath: string;
  HasMediaLinks?: number;
  Height?: null | number;
  IssueTagNumber?: number;
  KeySymbol?: null | string;
  Label: string;
  LabelRich?: null | string;
  Link?: null | string;
  LinkedPreviewFilePath?: string;
  LinkMultimediaId?: null | number;
  LocalPath?: string;
  MajorType: number;
  MepsDocumentId?: null | number;
  MepsLanguageIndex?: number;
  MimeType: string;
  MinorType?: number;
  MultimediaId: number;
  Multimeps?: null | number;
  NextParagraphOrdinal?: number;
  Repeat?: boolean;
  SizeConstraint?: null | number;
  StartTime?: number;
  StreamUrl?: string;
  SuppressZoom?: number;
  tableQuestionIsUsed?: boolean;
  TargetParagraphNumberLabel: number;
  ThumbnailFilePath?: string;
  ThumbnailUrl?: string;
  Track?: null | number;
  VerseLabel?: string;
  VerseNumber?: number;
  VideoMarkers?: VideoMarker[];
  Width?: null | number;
}

export interface MultimediaItemsFetcher {
  BeginParagraphOrdinal?: number;
  db: string;
  docId?: number;
  EndParagraphOrdinal?: number;
  lang?: string;
  mepsId?: number;
}

export interface PlaylistTagItem {
  Name: string;
}

export interface PublicationInfo {
  VersionNumber: number;
  Year: number;
}

export interface PublicationIssuePropertyItem {
  Title: string;
}

export interface PublicationItem {
  IssueTagNumber: number;
  MepsLanguageIndex: number;
  UndatedSymbol: string;
  UniqueEnglishSymbol: string;
}

export type QueryResponseItem =
  | DatedTextItem
  | DocumentItem
  | JwPlaylistItem
  | MultimediaExtractItem
  | MultimediaExtractRefItem
  | MultimediaItem
  | PlaylistTagItem
  | PublicationInfo
  | PublicationItem
  | TableItem
  | TableItemCount
  | VideoMarker;

export interface TableItem {
  name: string;
}

export interface TableItemCount {
  count: number;
}

export interface VideoMarker {
  BaseDurationTicks?: number;
  BeginTransitionDurationTicks: number;
  BeginTransitionFrameCount: number;
  Caption: string;
  CaptionRich: string;
  DurationTicks: number;
  EndTransitionDurationTicks: number;
  EndTransitionFrameCount: number;
  FrameCount: number;
  Label: string;
  LabelRich: string;
  MultimediaId: number;
  SegmentFormat: number;
  StartFrame: number;
  StartTimeTicks: number;
  Style: string;
  VideoMarkerId: number;
}
