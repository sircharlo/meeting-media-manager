import type { MeetingPartTimings } from 'src/types';

export interface TimerReportStatus {
  amountMinutes: number;
  kind: TimerReportStatusKind;
}

export type TimerReportStatusKind =
  'missing' | 'on-time' | 'overtime' | 'undertime';

export const getActualDurationSeconds = (
  timings?: MeetingPartTimings | null,
) => {
  if (
    timings?.startTime === null ||
    timings?.startTime === undefined ||
    timings.endTime === null ||
    timings.endTime === undefined
  )
    return null;

  return Math.max(0, Math.floor((timings.endTime - timings.startTime) / 1000));
};

export const getTimerReportStatus = (
  timings: MeetingPartTimings | null | undefined,
  plannedMinutes?: number,
): TimerReportStatus => {
  const actualSeconds = getActualDurationSeconds(timings);
  if (actualSeconds === null || !plannedMinutes) {
    return { amountMinutes: 0, kind: 'missing' };
  }

  const diffMinutes = Math.round(actualSeconds / 60 - plannedMinutes);
  if (diffMinutes > 0) {
    return { amountMinutes: diffMinutes, kind: 'overtime' };
  }

  if (diffMinutes < 0) {
    return { amountMinutes: Math.abs(diffMinutes), kind: 'undertime' };
  }

  return { amountMinutes: 0, kind: 'on-time' };
};
