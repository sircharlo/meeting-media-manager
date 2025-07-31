import type { VideoMarker } from './jw/sqlite';

export interface CacheAnalysis {
  allCacheFilesSize: number;
  cacheFiles: CacheFile[];
  frequentlyUsedDirectories: Set<string>;
  untouchableDirectories: Set<string>;
  unusedCacheFoldersSize: number;
  unusedParentDirectories: Record<string, number>;
  usedParentDirectories: Record<string, number>;
}

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
  bgColor?: string;
  cbs?: boolean;
  children?: DynamicMediaObject[];
  customDuration?: { max: number; min: number };
  duration?: number;
  extractCaption?: string;
  filesize?: number;
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
  textColor?: string;
  thumbnailUrl?: string;
  title: string;
  type?: 'divider' | 'media'; // New property to distinguish media items from dividers
  uniqueId: string;
}

export interface DynamicMediaSection extends MediaSection {
  items: DynamicMediaObject[];
}

export interface DynamicMediaSectionConfig {
  condition: boolean;
  extraMediaShortcut: boolean;
  id: MediaSectionIdentifier;
  jwIcon?: string;
  labelKey: string;
}

export interface FileDownloader {
  dir: string;
  filename?: string;
  lowPriority?: boolean;
  notify?: boolean;
  size?: number;
  url: string;
}

export interface MediaDivider {
  bgColor?: string;
  section: MediaSectionIdentifier;
  sortOrderOriginal: number | string;
  textColor?: string;
  title: string;
  uniqueId: string;
}

export interface MediaSection {
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
