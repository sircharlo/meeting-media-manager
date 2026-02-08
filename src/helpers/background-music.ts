import type { JwLangCode, SongItem } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { getPublicationDirectoryContents } from 'src/utils/fs';
import { getMetadataFromMediaPath } from 'src/utils/media';
import { formatTime } from 'src/utils/time';

const { path, pathToFileURL } = globalThis.electronApi;
const { basename } = path;

interface NextSongResult {
  nextSongUrl: string;
  secsFromEnd: number;
}

interface SongQueueOptions {
  currentSettings: {
    lang?: string;
  };
  selectedDayMedia?: { fileUrl?: string }[];
  timeBeforeMeetingStart: number;
}

/**
 * Calculates the optimal song queue to fill time until meeting starts
 * This ensures the last song ends precisely when fadeout begins
 */
export function calculateOptimalSongQueue(
  songLibrary: SongItem[],
  meetingSongs: SongItem[],
  timeBeforeMeetingStart: number,
): { queue: SongItem[]; startOffsetSeconds: number } {
  try {
    if (timeBeforeMeetingStart <= 0 || !songLibrary.length) {
      return { queue: [], startOffsetSeconds: 0 };
    }

    // Add meeting songs to the end of the library (they'll be played last)
    if (meetingSongs.length) {
      songLibrary.push(...meetingSongs);
      songLibrary.reverse(); // Reverse so meeting songs come first when we shift
    }

    let totalDuration = 0;
    const queue: SongItem[] = [];

    // Build the queue by cycling through songs until we exceed the available time
    while (totalDuration < timeBeforeMeetingStart && songLibrary.length) {
      const song = songLibrary.shift();
      if (!song) break;

      queue.unshift(song); // Add to beginning to maintain order
      songLibrary.push(song); // Add back to end for cycling
      totalDuration += song.duration ?? 0;
    }

    // Calculate how far into the first song we should start
    // This ensures the last song ends exactly when the fadeout begins
    const startOffsetSeconds = Math.max(
      0,
      totalDuration - timeBeforeMeetingStart,
    );

    return { queue, startOffsetSeconds };
  } catch (error) {
    errorCatcher(error);
    return { queue: [], startOffsetSeconds: 0 };
  }
}

/**
 * Enriches song items with metadata (duration, title)
 */
export async function enrichSongsWithMetadata(
  songs: SongItem[],
): Promise<SongItem[]> {
  const enrichedSongs = [...songs];

  for (const song of enrichedSongs) {
    try {
      const metadata = await getMetadataFromMediaPath(song.path);
      song.duration = metadata?.format?.duration ?? 0;
      song.title = metadata?.common.title ?? basename(song.path);
    } catch (error) {
      errorCatcher(error);
      song.duration = 0;
      song.title = basename(song.path);
    }
  }

  return enrichedSongs;
}

/**
 * Extracts meeting day songs from the selected day's media
 */
export function extractMeetingDaySongs(
  songLibrary: SongItem[],
  selectedDayMedia: { fileUrl?: string }[],
): SongItem[] {
  try {
    const regex = /(_r\d{3,4}P)?\.\w+$/;
    const { fileUrlToPath } = globalThis.electronApi;

    const meetingSongs: SongItem[] = selectedDayMedia
      .map((media) =>
        basename(fileUrlToPath(media.fileUrl?.replace(regex, '') ?? '')),
      )
      .map((fileBasename) => {
        const index = songLibrary.findIndex(
          (song) =>
            basename(song.path.replace(regex, '') || '') === fileBasename,
        );
        if (index !== -1) {
          return songLibrary.splice(index, 1)[0];
        }
        return null;
      })
      .filter((song): song is SongItem => !!song);

    return meetingSongs;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
}

/**
 * Fetches and shuffles the song library
 */
export async function fetchSongLibrary(lang: JwLangCode): Promise<SongItem[]> {
  try {
    const maxAttempts = 10;
    const minSongsRequired = 10;
    let attempts = 0;
    let songs: SongItem[] = [];

    while (songs.length < minSongsRequired && attempts < maxAttempts) {
      songs = (
        await getPublicationDirectoryContents(
          { langwritten: lang || 'E', pub: 'sjjm' },
          'mp3',
        )
      ).sort(() => Math.random() - 0.5);

      if (songs.length >= minSongsRequired) break;

      attempts++;
      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });
    }

    return songs;
  } catch (error) {
    errorCatcher(error);
    return [];
  }
}

/**
 * Formats remaining time for display
 */
export function formatRemainingTime(seconds: number): string {
  return formatTime(Math.max(0, seconds));
}

/**
 * Gets the next song from the queue
 */
export async function getNextSongFromQueue(
  songQueue: SongItem[],
  currentSongTitle: (title: string) => void,
): Promise<NextSongResult> {
  try {
    if (!songQueue.length) {
      return { nextSongUrl: '', secsFromEnd: 0 };
    }

    const nextSong = songQueue.shift();
    if (!nextSong) {
      return { nextSongUrl: '', secsFromEnd: 0 };
    }

    // Add song back to end of queue for continuous play
    songQueue.push(nextSong);

    // Update the playing title
    try {
      const { parseMediaFile } = globalThis.electronApi;
      const metadata = await parseMediaFile(nextSong.path);
      currentSongTitle(metadata.common.title ?? basename(nextSong.path));
    } catch (error) {
      errorCatcher(error);
      currentSongTitle(basename(nextSong.path) ?? '');
    }

    return {
      nextSongUrl: pathToFileURL(nextSong.path),
      secsFromEnd: 0, // This will be set by the queue calculation logic
    };
  } catch (error) {
    errorCatcher(error);
    return { nextSongUrl: '', secsFromEnd: 0 };
  }
}

/**
 * Prepares the complete song queue for a meeting day
 */
export async function prepareMeetingDaySongQueue(
  songLibrary: SongItem[],
  options: SongQueueOptions,
): Promise<{ queue: SongItem[]; startOffsetSeconds: number }> {
  try {
    const { selectedDayMedia, timeBeforeMeetingStart } = options;

    // Extract meeting day songs from the media
    const meetingSongs = selectedDayMedia
      ? extractMeetingDaySongs([...songLibrary], selectedDayMedia)
      : [];

    // Calculate optimal queue with proper timing
    return calculateOptimalSongQueue(
      songLibrary,
      meetingSongs,
      timeBeforeMeetingStart,
    );
  } catch (error) {
    errorCatcher(error);
    return { queue: [], startOffsetSeconds: 0 };
  }
}
