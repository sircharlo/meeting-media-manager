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
  customDuration?: { max: number; min: number };
  duration: number;
  extractCaption?: string;
  fileUrl: string;
  footnote?: boolean;
  hidden?: boolean;
  isAdditional?: boolean;
  isAudio: boolean;
  isImage: boolean;
  isVideo: boolean;
  markers?: VideoMarker[];
  repeat?: boolean;
  section: MediaSection;
  sectionOriginal: MediaSection;
  streamUrl?: string;
  subtitlesUrl?: string;
  tag?: Tag | undefined;
  thumbnailUrl: string;
  title: string;
  uniqueId: string;
  watched?: string | true;
}

export interface FileDownloader {
  dir: string;
  filename?: string;
  lowPriority?: boolean;
  notify?: boolean;
  size?: number;
  url: string;
}

export type MediaSection =
  | 'additional'
  | 'ayfm'
  | 'circuitOverseer'
  | 'lac'
  | 'tgw'
  | 'wt';

export interface SongItem {
  duration?: number; // or the correct type for duration
  path: string;
  title?: string;
}

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
