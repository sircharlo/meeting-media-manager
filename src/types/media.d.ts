import type { VideoMarker } from './jw/sqlite';

export interface DynamicMediaObject {
  customDuration?: { max: number; min: number };
  duration: number;
  fileUrl: string;
  footnote?: boolean;
  hidden?: boolean;
  isAdditional?: boolean;
  isAudio: boolean;
  isImage: boolean;
  isVideo: boolean;
  markers?: VideoMarker[];
  paragraph?: number | string;
  section: string;
  sectionOriginal: string;
  song?: boolean | string;
  streamUrl?: string;
  subtitlesUrl?: string;
  thumbnailUrl: string;
  title: string;
  uniqueId: string;
}

export interface DownloadedFile {
  error?: boolean;
  new?: boolean;
  path: string;
}

export type DownloadProgressItems = Record<
  string,
  {
    complete?: boolean;
    error?: boolean;
    filename: string;
    loaded?: number;
    total?: number;
  }
>;

export interface FileDownloader {
  dir: string;
  filename?: string;
  lowPriority?: boolean;
  notify?: boolean;
  size?: number;
  url: string;
}

export interface CacheFile {
  orphaned: boolean;
  parentPath: string;
  path: string;
  size: number;
}

export interface SongItem {
  duration?: number; // or the correct type for duration
  path: string;
  title?: string;
}

export interface VideoDuration {
  duration: number;
  ms: number;
  seconds: number;
  timeScale: number;
}
