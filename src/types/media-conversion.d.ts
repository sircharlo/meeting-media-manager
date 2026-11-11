/** A file being made playable, as the media sync popup lists it. */
export interface MediaConversionJob {
  /** From the item, for the progress percentage. */
  durationSeconds?: number;
  /** Why it failed, for the popup's tooltip. */
  error?: string;
  finishedAt?: number;
  id: string;
  /** The media item's id, so its row can show the progress. */
  mediaUniqueId: string;
  /** null while the duration is unknown, or before ffmpeg reports. */
  percent: null | number;
  problem: PlaybackProblem;
  /** An item imported into M³ (its copy is replaced) or from the watched folder (a converted copy is kept in the cache). */
  source: 'additional' | 'watched';
  sourcePath: string;
  startedAt?: number;
  status: MediaConversionStatus;
  title: string;
}

export type MediaConversionStatus =
  'cancelled' | 'converting' | 'done' | 'failed' | 'preparing' | 'queued';

export interface PlaybackConversionProgress {
  id: string;
  /** 0 to 100. */
  percent: number;
}

/** Asks the main process to convert a file into one that plays. */
export interface PlaybackConversionRequest {
  /** From the file's metadata; without it, progress has no percentage. */
  durationSeconds?: number;
  id: string;
  /** The picture plays as it is: only the sound needs converting. */
  keepVideo?: boolean;
  /** Where to write the MP4. Written there directly, so pass a temporary path. */
  outputPath: string;
  sourcePath: string;
}

/** How a file was converted. */
export interface PlaybackConversionResult {
  /** The video encoder used ('copy' when only the sound needed converting). */
  encoder: string;
}

/**
 * What keeps a file from playing on this computer: Chromium has no decoder
 * here for its picture (or for its container, such as AVI), or for any of
 * its sound tracks. `codec` names what was found, for the user and Sentry.
 */
export interface PlaybackProblem {
  codec: string;
  missing: 'picture' | 'sound';
}
