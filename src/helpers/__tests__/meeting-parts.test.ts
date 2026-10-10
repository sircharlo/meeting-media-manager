import { describe, expect, it } from 'vitest';

import {
  defaultPartCounts,
  defaultPartDurations,
  distributeSectionMinutes,
  getMeetingPartOffsetMinutes,
  getSectionPartMinutes,
  hasCounselAfterPart,
} from '../meeting-parts';

describe('distributeSectionMinutes', () => {
  it('shares the minutes out evenly, the first parts taking the remainder', () => {
    expect(distributeSectionMinutes('ayfm', 3, 12)).toEqual({
      'ayfm-1': 4,
      'ayfm-2': 4,
      'ayfm-3': 4,
      'ayfm-4': 0,
      'ayfm-5': 0,
    });
    expect(distributeSectionMinutes('lac', 2, 15)).toEqual({
      'lac-1': 8,
      'lac-2': 7,
      'lac-3': 0,
    });
  });

  it('keeps the count within the section', () => {
    expect(distributeSectionMinutes('lac', 9, 15)).toEqual({
      'lac-1': 5,
      'lac-2': 5,
      'lac-3': 5,
    });
    expect(distributeSectionMinutes('ayfm', 0, 14)).toEqual({
      'ayfm-1': 14,
      'ayfm-2': 0,
      'ayfm-3': 0,
      'ayfm-4': 0,
      'ayfm-5': 0,
    });
  });
});

describe('getSectionPartMinutes', () => {
  it('takes a minute of counsel per Apply Yourself part off the section', () => {
    expect(getSectionPartMinutes('ayfm', 1)).toBe(14);
    expect(getSectionPartMinutes('ayfm', 3)).toBe(12);
  });

  it('gives the Living as Christians parts the whole section', () => {
    expect(getSectionPartMinutes('lac', 1)).toBe(15);
    expect(getSectionPartMinutes('lac', 3)).toBe(15);
  });
});

describe('defaultPartDurations', () => {
  it('match the default part counts', () => {
    const ayfm = distributeSectionMinutes(
      'ayfm',
      defaultPartCounts.ayfm,
      getSectionPartMinutes('ayfm', defaultPartCounts.ayfm),
    );
    const lac = distributeSectionMinutes(
      'lac',
      defaultPartCounts.lac,
      getSectionPartMinutes('lac', defaultPartCounts.lac),
    );
    expect(defaultPartDurations).toMatchObject({ ...ayfm, ...lac });
  });
});

describe('getMeetingPartOffsetMinutes', () => {
  it('adds counsel after student parts that have a duration, and skips 0-minute parts', () => {
    const sequence = [
      'bible-reading',
      'ayfm-1',
      'ayfm-2',
      'ayfm-3',
      'song-and-optional-prayer',
    ] as const;
    const durations = {
      'ayfm-1': 3,
      'ayfm-2': 0,
      'ayfm-3': 5,
      'bible-reading': 4,
      'song-and-optional-prayer': 5,
    };
    // 4 + 1 counsel, 3 + 1 counsel, 0 (no counsel), 5 + 1 counsel
    expect(getMeetingPartOffsetMinutes(4, [...sequence], durations)).toBe(15);
    expect(hasCounselAfterPart('ayfm-2', 0)).toBe(false);
    expect(hasCounselAfterPart('ayfm-2', 2)).toBe(true);
  });
});
