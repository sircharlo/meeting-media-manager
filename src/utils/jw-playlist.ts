import type { JwPlaylistItem } from 'src/types';

const TICKS_PER_SECOND = 10_000_000;

/**
 * A JW Library playlist item's length and trim, as M³ imports it.
 * `BaseDurationTicks` (the media's own length) can be missing or 0 when the
 * playlist doesn't know it, so `DurationTicks` is the fallback.
 * @param item The playlist item
 * @returns The item's length in ticks (0 when unknown), and its trimmed start
 * and end in seconds (null when not trimmed)
 */
export const getJwPlaylistItemTrim = (
  item: Pick<
    JwPlaylistItem,
    | 'BaseDurationTicks'
    | 'DurationTicks'
    | 'EndTrimOffsetTicks'
    | 'StartTrimOffsetTicks'
  >,
) => {
  const durationTicks = item.BaseDurationTicks || item.DurationTicks || 0; // NOSONAR: 0 means the length isn't known
  const EndTime =
    durationTicks &&
    item.EndTrimOffsetTicks &&
    durationTicks >= item.EndTrimOffsetTicks
      ? (durationTicks - item.EndTrimOffsetTicks) / TICKS_PER_SECOND
      : null;
  const StartTime =
    item.StartTrimOffsetTicks && item.StartTrimOffsetTicks >= 0
      ? item.StartTrimOffsetTicks / TICKS_PER_SECOND
      : null;

  return { durationTicks, EndTime, StartTime };
};
