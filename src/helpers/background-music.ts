import type { JwLangCode, SongItem } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import {
  fetchBackgroundMusicSongLibrary,
  resolveBackgroundMusicPlaybackUrl,
} from 'src/helpers/jw-media';
import { log } from 'src/shared/vanilla';
import { formatTime } from 'src/utils/time';

const { basename } = globalThis.electronApi;
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

const getDebugTimestamp = () => new Date().toISOString();

const getElapsedMilliseconds = (startedAt: number) => {
  return Math.round(performance.now() - startedAt);
};

const logBackgroundMusicTiming = (
  message: string,
  startedAt?: number,
  details?: Record<string, unknown>,
) => {
  const elapsed =
    typeof startedAt === 'number'
      ? ` +${getElapsedMilliseconds(startedAt)}ms`
      : '';

  log(
    `[${getDebugTimestamp()}]${elapsed} ${message}`,
    'backgroundMusic',
    'debug',
    details,
  );
};

/**
 * Calculates the optimal song queue to fill time until meeting starts
 * This ensures the last song ends precisely when fadeout begins
 */
export function calculateOptimalSongQueue(
  songLibrary: SongItem[],
  meetingSongs: SongItem[],
  timeBeforeMeetingStart: number,
): { queue: SongItem[]; startOffsetSeconds: number } {
  const startedAt = performance.now();
  try {
    logBackgroundMusicTiming(
      'calculate optimal song queue started',
      undefined,
      {
        meetingSongs: meetingSongs.length,
        songs: songLibrary.length,
        timeBeforeMeetingStart,
      },
    );

    if (timeBeforeMeetingStart <= 0 || !songLibrary.length) {
      logBackgroundMusicTiming(
        'calculate optimal song queue skipped',
        startedAt,
      );
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

    logBackgroundMusicTiming(
      'calculate optimal song queue finished',
      startedAt,
      {
        queueLength: queue.length,
        startOffsetSeconds,
        totalDuration,
      },
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
  const startedAt = performance.now();
  logBackgroundMusicTiming('normalize API song metadata started', undefined, {
    songs: songs.length,
  });

  const enrichedSongs = [...songs];

  for (const [index, song] of enrichedSongs.entries()) {
    const songStartedAt = performance.now();
    song.duration = song.duration ?? 0;
    song.title = song.title || basename(song.path);
    logBackgroundMusicTiming('API song metadata normalized', songStartedAt, {
      duration: song.duration,
      index: index + 1,
      path: song.path,
      remoteUrl: song.remoteUrl,
      songs: enrichedSongs.length,
      title: song.title,
      track: song.track,
    });
  }

  logBackgroundMusicTiming('normalize API song metadata finished', startedAt, {
    songs: enrichedSongs.length,
  });

  return enrichedSongs;
}

/**
 * Extracts meeting day songs from the selected day's media
 */
export function extractMeetingDaySongs(
  songLibrary: SongItem[],
  selectedDayMedia: { fileUrl?: string }[],
): SongItem[] {
  const startedAt = performance.now();
  try {
    logBackgroundMusicTiming('extract meeting day songs started', undefined, {
      selectedDayMedia: selectedDayMedia.length,
      songs: songLibrary.length,
    });

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

    logBackgroundMusicTiming('extract meeting day songs finished', startedAt, {
      meetingSongs: meetingSongs.length,
    });

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
  const startedAt = performance.now();
  try {
    logBackgroundMusicTiming('fetch API song library started', undefined, {
      lang,
    });

    const songs = (await fetchBackgroundMusicSongLibrary(lang)).sort(
      () => Math.random() - 0.5,
    );

    logBackgroundMusicTiming('fetch API song library finished', startedAt, {
      songs: songs.length,
    });

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
  const startedAt = performance.now();
  try {
    logBackgroundMusicTiming('get next song from queue started', undefined, {
      queueLength: songQueue.length,
    });

    if (!songQueue.length) {
      logBackgroundMusicTiming('get next song from queue skipped', startedAt);
      return { nextSongUrl: '', secsFromEnd: 0 };
    }

    const nextSong = songQueue.shift();
    if (!nextSong) {
      return { nextSongUrl: '', secsFromEnd: 0 };
    }

    // Add song back to end of queue for continuous play
    songQueue.push(nextSong);

    currentSongTitle(nextSong.title || basename(nextSong.path));
    const playbackUrlStartedAt = performance.now();
    const nextSongUrl = await resolveBackgroundMusicPlaybackUrl(nextSong);
    logBackgroundMusicTiming(
      'next song playback URL resolved',
      playbackUrlStartedAt,
      {
        path: nextSong.path,
        remoteUrl: nextSong.remoteUrl,
        title: nextSong.title,
        track: nextSong.track,
        usingRemoteUrl: nextSongUrl === nextSong.remoteUrl,
      },
    );

    const result = {
      nextSongUrl,
      secsFromEnd: 0, // This will be set by the queue calculation logic
    };

    logBackgroundMusicTiming('get next song from queue finished', startedAt, {
      nextSongUrl: result.nextSongUrl,
      queueLength: songQueue.length,
    });

    return result;
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
  const startedAt = performance.now();
  try {
    logBackgroundMusicTiming(
      'prepare meeting day song queue started',
      undefined,
      {
        selectedDayMedia: options.selectedDayMedia?.length ?? 0,
        songs: songLibrary.length,
        timeBeforeMeetingStart: options.timeBeforeMeetingStart,
      },
    );

    const { selectedDayMedia, timeBeforeMeetingStart } = options;

    // Extract meeting day songs from the media
    const meetingSongs = selectedDayMedia
      ? extractMeetingDaySongs([...songLibrary], selectedDayMedia)
      : [];

    // Calculate optimal queue with proper timing
    const result = calculateOptimalSongQueue(
      songLibrary,
      meetingSongs,
      timeBeforeMeetingStart,
    );

    logBackgroundMusicTiming(
      'prepare meeting day song queue finished',
      startedAt,
      {
        queueLength: result.queue.length,
        startOffsetSeconds: result.startOffsetSeconds,
      },
    );

    return result;
  } catch (error) {
    errorCatcher(error);
    return { queue: [], startOffsetSeconds: 0 };
  }
}
