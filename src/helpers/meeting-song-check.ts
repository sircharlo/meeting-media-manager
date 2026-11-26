import type {
  DateInfo,
  MediaItem,
  MediaSectionIdentifier,
  MediaSectionWithConfig,
} from 'src/types';

import { CO_WEEK_ADDITIONAL_SECTION } from 'src/constants/media';

/** How a meeting's songs are checked (see findSongProblems). */
export interface SongCheckContext {
  /** The circuit overseer visits that week. */
  coWeek: boolean;
  meeting: 'mw' | 'we';
  /** The songbook's publication code, e.g. sjjm, to recognize song files. */
  songbookPub?: string;
}

/**
 * Something wrong with a meeting's songs that stops the meeting if nobody
 * fixes it before it starts (see findSongProblems).
 */
export type SongProblem =
  /** The same song is in the meeting more than once. */
  | { firstItemId: string; kind: 'duplicate'; song: string }
  /** The circuit overseer's visit: no song after his talk yet. */
  | { kind: 'no-co-song' }
  /** The weekend meeting: no song for the public talk yet. */
  | { kind: 'no-pt-song' };

// A group item whose every child is hidden is hidden too (see
// useMediaSection's isItemEffectivelyHidden).
const isHidden = (item: MediaItem) =>
  item.hidden || // NOSONAR: boolean OR, not a default
  (!!item.children?.length && item.children.every((child) => child.hidden));

const visibleItems = (section: MediaSectionWithConfig | undefined) =>
  (section?.items ?? []).filter((item) => !isHidden(item));

const songNumber = (item: MediaItem) => {
  const value = item.tag?.type === 'song' ? item.tag.value : undefined;
  return value === undefined || value === '' ? undefined : String(value);
};

// A song file added some other way (a playlist, a dropped file) has no song
// tag: its file name gives it away.
const isSong = (item: MediaItem, songbookPub?: string) =>
  item.tag?.type === 'song' ||
  (!!songbookPub &&
    [item.fileUrl, item.streamUrl].some((url) => url?.includes(songbookPub)));

const sectionHasSong = (
  sections: MediaSectionWithConfig[],
  id: MediaSectionIdentifier,
  songbookPub?: string,
) =>
  visibleItems(
    sections.find((section) => section.config?.uniqueId === id),
  ).some((item) => isSong(item, songbookPub));

/**
 * The songs that are in these sections more than once, in the order they
 * first appear, each with its first item (to show it). Hidden items don't
 * count: during the circuit overseer's visit, M³ hides the usual last song.
 */
export const findDuplicateSongs = (
  sections: MediaSectionWithConfig[] | undefined,
): Extract<SongProblem, { kind: 'duplicate' }>[] => {
  const firstItems = new Map<string, MediaItem>();
  const duplicates = new Set<string>();
  for (const item of (sections ?? []).flatMap(visibleItems)) {
    const song = songNumber(item);
    if (!song) continue;
    if (firstItems.has(song)) duplicates.add(song);
    else firstItems.set(song, item);
  }
  return [...duplicates].map((song) => ({
    firstItemId: firstItems.get(song)?.uniqueId ?? '',
    kind: 'duplicate',
    song,
  }));
};

/** What "It's on purpose" remembers for a problem (DateInfo.songCheckOkays). */
export const songProblemKey = (problem: SongProblem) =>
  problem.kind === 'duplicate' ? `duplicate:${problem.song}` : problem.kind;

/**
 * What's wrong with a meeting day's songs:
 * - a song that's in the meeting more than once;
 * - the weekend meeting: no song in the public talk's section (the speaker's
 *   opening song, which nobody adds for M³);
 * - the circuit overseer's visit, at either meeting: no song in his section.
 *   M³ hides the usual last song that week, and the song he chose replaces
 *   it.
 * Leaves out what the user said was fine for that day (songCheckOkays).
 */
export const findSongProblems = (
  day: DateInfo,
  { coWeek, meeting, songbookPub }: SongCheckContext,
): SongProblem[] => {
  const sections = day.mediaSections ?? [];
  const problems: SongProblem[] = findDuplicateSongs(sections);
  if (meeting === 'we' && !sectionHasSong(sections, 'pt', songbookPub)) {
    problems.push({ kind: 'no-pt-song' });
  }
  if (
    coWeek &&
    !sectionHasSong(sections, CO_WEEK_ADDITIONAL_SECTION, songbookPub)
  ) {
    problems.push({ kind: 'no-co-song' });
  }
  const okays = new Set(day.songCheckOkays ?? []);
  return problems.filter((problem) => !okays.has(songProblemKey(problem)));
};

const markOkay = (day: DateInfo, key: string) => {
  if (day.songCheckOkays?.includes(key)) return;
  day.songCheckOkays = [...(day.songCheckOkays ?? []), key];
};

/** Remembers for that day that a problem is fine (see findSongProblems). */
export const markSongProblemOkay = (day: DateInfo, problem: SongProblem) => {
  markOkay(day, songProblemKey(problem));
};

/** Remembers for that day that the song is in it twice on purpose. */
export const markDuplicateSongOkay = (day: DateInfo, song: number | string) => {
  markOkay(
    day,
    songProblemKey({ firstItemId: '', kind: 'duplicate', song: String(song) }),
  );
};

/** Whether that song is already in the day's visible media. */
export const isSongInDay = (
  day: DateInfo | null | undefined,
  song: number | string,
) =>
  (day?.mediaSections ?? [])
    .flatMap(visibleItems)
    .some((item) => songNumber(item) === String(song));
