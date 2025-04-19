import type { VideoMarker } from './jw/sqlite';

export interface CacheFile {
  orphaned: boolean;
  parentPath: string;
  path: string;
  size: number;
}

export interface DownloadedFile {
  error?: boolean;
  new?: boolean;
  path: string;
}

export interface DownloadProgressItem {
  complete?: boolean;
  error?: boolean;
  filename: string;
  loaded?: number;
  total?: number;
}

export type DownloadProgressItems = Record<string, DownloadProgressItem>;

export interface DynamicMediaObject {
  cbs?: boolean;
  children?: DynamicMediaObject[];
  customDuration?: { max: number; min: number };
  duration?: number;
  extractCaption?: string;
  fileUrl?: string;
  footnote?: boolean;
  hidden?: boolean;
  isAudio?: boolean;
  isImage?: boolean;
  isVideo?: boolean;
  markers?: VideoMarker[];
  parentUniqueId?: string;
  pubMediaId?: string;
  repeat?: boolean;
  section: MediaSectionIdentifier;
  sectionOriginal: MediaSectionIdentifier;
  sortOrderOriginal: number | string;
  source: 'additional' | 'dynamic' | 'watched';
  streamUrl?: string;
  subtitlesUrl?: string;
  tag?: Tag | undefined;
  thumbnailUrl?: string;
  title: string;
  uniqueId: string;
}

export interface DynamicMediaSection extends MediaSection {
  items: DynamicMediaObject[];
}

export interface FileDownloader {
  dir: string;
  filename?: string;
  lowPriority?: boolean;
  notify?: boolean;
  size?: number;
  url: string;
}

export interface MediaSection {
  alwaysShow: boolean;
  bgColor?: string;
  extraMediaShortcut?: boolean;
  jwIcon?: string;
  label: string;
  mmmIcon?: string;
  uniqueId: MediaSectionIdentifier;
}

export type MediaSectionIdentifier =
  | 'additional'
  | 'ayfm'
  | 'circuitOverseer'
  | 'lac'
  | 'tgw'
  | 'wt'
  | string;

export interface SongItem {
  duration?: number; // or the correct type for duration
  path: string;
  title?: string;
}

export interface SortableMediaList {
  items: Ref<DynamicMediaObject[]>;
  jwIcon?: string | undefined;
  label: string;
  mmmIcon?: string | undefined;
  type: MediaSectionIdentifier;
}
export type SortableMediaLists = SortableMediaList[];

export interface Tag {
  type: string | undefined;
  value: number | string | undefined;
}

export interface VideoDuration {
  duration: number;
  ms: number;
  seconds: number;
  timeScale: number;
}
