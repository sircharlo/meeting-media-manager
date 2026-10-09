import type { MeetingPart } from 'src/types';

import { isCoWeek, isMwMeetingDay, isWeMeetingDay } from 'src/helpers/date';

export const defaultPartDurations: Record<MeetingPart, number> = {
  'abbreviated-wt': 30,
  'ayfm-1': 14,
  'ayfm-2': 0,
  'ayfm-3': 0,
  'ayfm-4': 0,
  'ayfm-5': 0,
  'bible-reading': 4,
  cbs: 30,
  'co-final-talk': 30,
  'co-service-talk': 30,
  'concluding-comments': 3,
  gems: 10,
  introduction: 1,
  'lac-1': 15,
  'lac-2': 0,
  'lac-3': 0,
  'public-talk': 30,
  'song-and-optional-prayer': 5,
  treasures: 10,
  wt: 60,
};

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
      offset += 1;
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
      total += 1;
    }
  }
  return total;
};
