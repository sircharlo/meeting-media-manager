import type { MeetingPart } from 'src/types';

import { isCoWeek, isMwMeetingDay, isWeMeetingDay } from 'src/helpers/date';

/** How many Apply Yourself and Living as Christians parts a meeting usually has. */
export const defaultPartCounts = { ayfm: 3, lac: 2 } as const;

/** Minutes allotted to the whole Apply Yourself section, counsel included. */
export const AYFM_SECTION_MINUTES = 15;
/** Minutes allotted to the Living as Christians parts before the study. */
export const LAC_SECTION_MINUTES = 15;
/** Minutes of counsel after each student part (Bible reading, Apply Yourself). */
export const COUNSEL_MINUTES = 1;

export const MAX_AYFM_PARTS = 5;
export const MAX_LAC_PARTS = 3;

// Three Apply Yourself parts with a minute of counsel each (15 - 3 = 12
// minutes shared out) and two Living as Christians parts (15 minutes shared
// out), matching defaultPartCounts.
export const defaultPartDurations: Record<MeetingPart, number> = {
  'abbreviated-wt': 30,
  'ayfm-1': 4,
  'ayfm-2': 4,
  'ayfm-3': 4,
  'ayfm-4': 0,
  'ayfm-5': 0,
  'bible-reading': 4,
  cbs: 30,
  'co-final-talk': 30,
  'co-service-talk': 30,
  'concluding-comments': 3,
  gems: 10,
  introduction: 1,
  'lac-1': 8,
  'lac-2': 7,
  'lac-3': 0,
  'public-talk': 30,
  'song-and-optional-prayer': 5,
  treasures: 10,
  wt: 60,
};

/**
 * Shares a section's minutes out evenly over its parts: the minutes allotted
 * to the parts themselves (counsel not included), as whole minutes, the
 * first parts getting the remainder. Parts beyond `count` get 0.
 */
export const distributeSectionMinutes = (
  prefix: 'ayfm' | 'lac',
  count: number,
  totalMinutes: number,
): Partial<Record<MeetingPart, number>> => {
  const maxParts = prefix === 'ayfm' ? MAX_AYFM_PARTS : MAX_LAC_PARTS;
  const activeParts = Math.min(Math.max(1, Math.floor(count)), maxParts);
  const base = Math.floor(totalMinutes / activeParts);
  const remainder = totalMinutes % activeParts;
  const durations: Partial<Record<MeetingPart, number>> = {};
  for (let i = 1; i <= maxParts; i++) {
    const key = `${prefix}-${i}` as MeetingPart;
    if (i <= activeParts) {
      durations[key] = base + (i <= remainder ? 1 : 0);
    } else {
      durations[key] = 0;
    }
  }
  return durations;
};

/** The minutes the parts of a section may share, counsel excluded. */
export const getSectionPartMinutes = (prefix: 'ayfm' | 'lac', count: number) =>
  prefix === 'ayfm'
    ? AYFM_SECTION_MINUTES - count * COUNSEL_MINUTES
    : LAC_SECTION_MINUTES;

export const hasCounselAfterPart = (
  part: MeetingPart,
  duration: number,
): boolean =>
  (part === 'bible-reading' || part.startsWith('ayfm-')) && duration > 0;

export const getMeetingPartSequence = (
  date: Date | undefined,
): MeetingPart[] => {
  if (!date) return [];

  if (isWeMeetingDay(date)) {
    const isCo = isCoWeek(date);
    return isCo
      ? [
          'song-and-optional-prayer',
          'public-talk',
          'song-and-optional-prayer',
          'abbreviated-wt',
          'co-final-talk',
          'song-and-optional-prayer',
        ]
      : [
          'song-and-optional-prayer',
          'public-talk',
          'song-and-optional-prayer',
          'wt',
          'song-and-optional-prayer',
        ];
  }

  if (isMwMeetingDay(date)) {
    return [
      'song-and-optional-prayer',
      'introduction',
      'treasures',
      'gems',
      'bible-reading',
      'ayfm-1',
      'ayfm-2',
      'ayfm-3',
      'ayfm-4',
      'ayfm-5',
      'song-and-optional-prayer',
      'lac-1',
      'lac-2',
      'lac-3',
      ...(isCoWeek(date)
        ? (['concluding-comments', 'co-service-talk'] as MeetingPart[])
        : (['cbs', 'concluding-comments'] as MeetingPart[])),
      'song-and-optional-prayer',
    ];
  }

  return [];
};

export const getMeetingPartOffsetMinutes = (
  partIndex: number,
  sequence: MeetingPart[],
  partDurations: Partial<Record<MeetingPart, number>>,
): number => {
  let offset = 0;
  for (let i = 0; i < partIndex; i++) {
    const prevPart = sequence[i];
    if (!prevPart) continue;
    const dur = partDurations[prevPart] ?? 0;
    offset += dur;
    if (hasCounselAfterPart(prevPart, dur)) {
      offset += COUNSEL_MINUTES;
    }
  }
  return offset;
};

/**
 * Both MW and WE meetings are scheduled to run 1h45m: WE = 5m song+prayer +
 * 30m public talk + 5m song + 60m WT study + 5m song+prayer (105m exactly);
 * MW = 5m song+prayer + 25m Treasures + 15m Apply Yourself + 55m Living as
 * Christians (concluding prayer's own length isn't fixed/known in advance,
 * so 105m is the scheduled ceiling, not a derived sum). Used as the
 * fallback "scheduled end" estimate for the meeting quick-actions feature -
 * intentionally a flat constant rather than summing part durations, since
 * the granular defaults below don't reconcile exactly to 105m for MW.
 */
export const MEETING_SCHEDULED_DURATION_MINUTES = 105;

export const getTotalMeetingDurationMinutes = (
  date: Date | undefined,
): number => {
  const sequence = getMeetingPartSequence(date);
  if (!sequence.length) return 0;

  let total = 0;
  for (const part of sequence) {
    const dur = defaultPartDurations[part] ?? 0;
    total += dur;
    if (hasCounselAfterPart(part, dur)) {
      total += COUNSEL_MINUTES;
    }
  }
  return total;
};
