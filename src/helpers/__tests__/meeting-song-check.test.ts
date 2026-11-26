import type {
  DateInfo,
  MediaItem,
  MediaSectionIdentifier,
  MediaSectionWithConfig,
} from 'src/types';

import {
  findDuplicateSongs,
  findSongProblems,
  isSongInDay,
  markDuplicateSongOkay,
  markSongProblemOkay,
} from 'src/helpers/meeting-song-check';
import { describe, expect, it } from 'vitest';

let nextId = 0;

const song = (number: number | string, extra: Partial<MediaItem> = {}) => ({
  tag: { type: 'song', value: number },
  title: `Song ${number}`,
  type: 'media' as const,
  uniqueId: `song-${number}-${nextId++}`,
  ...extra,
});

const media = (extra: Partial<MediaItem> = {}): MediaItem => ({
  title: 'A picture',
  type: 'media',
  uniqueId: `media-${nextId++}`,
  ...extra,
});

const section = (
  uniqueId: MediaSectionIdentifier,
  items: MediaItem[],
): MediaSectionWithConfig => ({ config: { uniqueId }, items });

const day = (...mediaSections: MediaSectionWithConfig[]): DateInfo => ({
  date: new Date(2026, 10, 29),
  mediaSections,
  status: 'complete',
});

const WE = { coWeek: false, meeting: 'we', songbookPub: 'sjjm' } as const;
const MW = { coWeek: false, meeting: 'mw', songbookPub: 'sjjm' } as const;

describe('findDuplicateSongs', () => {
  it('finds a song that is in the meeting twice, with its first item', () => {
    const first = song(12);
    const sections = [
      section('tgw', [first, media()]),
      section('lac', [song(40), song(12)]),
    ];

    expect(findDuplicateSongs(sections)).toEqual([
      { firstItemId: first.uniqueId, kind: 'duplicate', song: '12' },
    ]);
  });

  it('counts a number and its text as the same song', () => {
    expect(findDuplicateSongs([section('wt', [song(7), song('7')])])).toEqual([
      expect.objectContaining({ song: '7' }),
    ]);
  });

  it("doesn't count hidden songs, like the usual last song in the circuit overseer's week", () => {
    const sections = [
      section('lac', [song(40), song(55, { hidden: true })]),
      section('circuit-overseer', [song(55)]),
    ];

    expect(findDuplicateSongs(sections)).toEqual([]);
  });

  it("doesn't count a group whose items are all hidden", () => {
    const hiddenGroup = song(3, {
      children: [media({ hidden: true }), media({ hidden: true })],
    });

    expect(findDuplicateSongs([section('wt', [song(3), hiddenGroup])])).toEqual(
      [],
    );
  });

  it('lists each duplicated song once', () => {
    const sections = [section('wt', [song(1), song(1), song(1), song(2)])];

    expect(findDuplicateSongs(sections).map((p) => p.song)).toEqual(['1']);
  });
});

describe('findSongProblems', () => {
  it('finds nothing wrong with a complete weekend meeting', () => {
    const today = day(
      section('pt', [song(20)]),
      section('wt', [song(30), song(31)]),
    );

    expect(findSongProblems(today, WE)).toEqual([]);
  });

  it('finds the weekend meeting without a song for the public talk', () => {
    const today = day(section('pt', []), section('wt', [song(30), song(31)]));

    expect(findSongProblems(today, WE)).toEqual([{ kind: 'no-pt-song' }]);
  });

  it('finds it when the public talk section is missing altogether', () => {
    expect(findSongProblems(day(section('wt', [song(30)])), WE)).toEqual([
      { kind: 'no-pt-song' },
    ]);
  });

  it("takes a song file without a song tag for a song, by the songbook's name", () => {
    const today = day(
      section('pt', [media({ fileUrl: 'file:///cache/sjjm_E_020.mp4' })]),
    );

    expect(findSongProblems(today, WE)).toEqual([]);
  });

  it("doesn't look for a public talk song at the midweek meeting", () => {
    expect(findSongProblems(day(section('tgw', [song(5)])), MW)).toEqual([]);
  });

  it("finds the circuit overseer's week without his song, at either meeting", () => {
    const midweek = day(
      section('tgw', [song(5)]),
      section('lac', [song(6), song(7, { hidden: true })]),
      section('circuit-overseer', []),
    );
    const weekend = day(
      section('pt', [song(20)]),
      section('wt', [song(30), song(31, { hidden: true })]),
    );

    expect(findSongProblems(midweek, { ...MW, coWeek: true })).toEqual([
      { kind: 'no-co-song' },
    ]);
    expect(findSongProblems(weekend, { ...WE, coWeek: true })).toEqual([
      { kind: 'no-co-song' },
    ]);
  });

  it('lists every problem together, duplicates first', () => {
    const today = day(section('wt', [song(30), song(30)]));

    expect(
      findSongProblems(today, { ...WE, coWeek: true }).map((p) => p.kind),
    ).toEqual(['duplicate', 'no-pt-song', 'no-co-song']);
  });

  it('leaves out what the user said was fine that day', () => {
    const today = day(section('wt', [song(30), song(30)]));
    const [duplicate, noPtSong] = findSongProblems(today, WE);
    if (!duplicate || !noPtSong) throw new Error('expected two problems');

    markSongProblemOkay(today, duplicate);
    markSongProblemOkay(today, noPtSong);
    markSongProblemOkay(today, noPtSong);

    expect(findSongProblems(today, WE)).toEqual([]);
    expect(today.songCheckOkays).toEqual(['duplicate:30', 'no-pt-song']);
  });

  it('asks again about another song in the meeting twice', () => {
    const today = day(section('pt', [song(9)]), section('wt', [song(30)]));
    markDuplicateSongOkay(today, 30);
    today.mediaSections[1]?.items?.push(song(30), song(9));

    expect(findSongProblems(today, WE)).toEqual([
      expect.objectContaining({ kind: 'duplicate', song: '9' }),
    ]);
  });
});

describe('isSongInDay', () => {
  it("finds a song among the day's visible media only", () => {
    const today = day(section('lac', [song(40), song(41, { hidden: true })]));

    expect(isSongInDay(today, 40)).toBe(true);
    expect(isSongInDay(today, '40')).toBe(true);
    expect(isSongInDay(today, 41)).toBe(false);
    expect(isSongInDay(null, 40)).toBe(false);
  });
});
