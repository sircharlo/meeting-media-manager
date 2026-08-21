import type { DateInfo, SettingsValues } from 'src/types';
import type { MediaPlayingState } from 'stores/current-state';

import { getTodaysMeetingStartDateTime } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { MEETING_SCHEDULED_DURATION_MINUTES } from 'src/helpers/meeting-parts';
import { getVisibleMeetingItems } from 'src/utils/media';

/**
 * Returns the ids of the checklist items that are actually visible to the
 * user for the given mode - enabled themselves *and* under an enabled
 * category - matching the filtering MeetingQuickActionsChecklist.vue applies
 * when rendering, so callers can tell whether every item shown to the user
 * has been checked without duplicating that filter logic.
 */
export const getVisibleChecklistItemIds = (
  settings: SettingsValues,
  mode: 'after' | 'before',
): string[] => {
  const categories =
    mode === 'before'
      ? settings.meetingQuickActionsCategoriesBefore
      : settings.meetingQuickActionsCategoriesAfter;
  const items =
    mode === 'before'
      ? settings.meetingQuickActionsChecklistBefore
      : settings.meetingQuickActionsChecklistAfter;
  const enabledCategoryIds = new Set(
    categories
      .filter((category) => category.enabled)
      .map((category) => category.id),
  );
  return items
    .filter((item) => item.enabled && enabledCategoryIds.has(item.categoryId))
    .map((item) => item.id);
};

/**
 * Predicts when the last visible meeting song will end, based on the current
 * media playback state and the visible items on the selected date. Returns:
 *
 * - `Date` if we can extrapolate a plausible end time for the last song
 * - `null` if nothing has played yet today (summing from cold would produce
 *   a falsely-small number, since the media list is only a few minutes)
 */
export const predictLastSongEndDateTime = (
  playingState: MediaPlayingState,
  dateInfo: DateInfo | null | undefined,
  now = Date.now(),
): Date | null => {
  const visibleItems = getVisibleMeetingItems(dateInfo);
  if (!visibleItems.length) return null;

  // Find the index of the last visible song
  let lastSongIndex = -1;
  for (let i = visibleItems.length - 1; i >= 0; i--) {
    if (visibleItems[i]?.tag?.type === 'song') {
      lastSongIndex = i;
      break;
    }
  }
  if (lastSongIndex === -1) return null;

  // Duration unknown - can't predict an end time at all (an unset/zero
  // duration must NOT be treated as "already over" below, since that would
  // fire the after-panel the instant the last song starts).
  if (!visibleItems[lastSongIndex]?.duration) return null;

  // Nothing has played yet today
  if (!playingState.action || !playingState.uniqueId) return null;

  // Find the currently-playing/paused item in the visible item list
  const currentIndex = visibleItems.findIndex(
    (item) => item.uniqueId === playingState.uniqueId,
  );
  if (currentIndex === -1) return null;

  // Song already passed (current item is after the last song)
  if (currentIndex > lastSongIndex) return null;

  // Extrapolate current position (same pattern as MediaPreview's
  // getExpectedPosition)
  let extrapolatedPosition = playingState.currentPosition || 0;
  if (playingState.action === 'play' && playingState.currentPositionUpdatedAt) {
    const elapsedSeconds = Math.max(
      0,
      (now - playingState.currentPositionUpdatedAt) / 1000,
    );
    extrapolatedPosition += elapsedSeconds * (playingState.playbackRate || 1);
  }

  // Every item's duration between the current position and the last song
  // (inclusive) must be known - silently treating an unset duration as 0
  // would understate remainingSeconds and could fire the after-panel while
  // media for the meeting is still playing, the same failure mode already
  // guarded against for the last song's own duration above.
  const currentDuration = visibleItems[currentIndex]?.duration;
  if (!currentDuration) return null;

  let remainingSeconds = Math.max(0, currentDuration - extrapolatedPosition);

  if (currentIndex !== lastSongIndex) {
    for (let i = currentIndex + 1; i <= lastSongIndex; i++) {
      const itemDuration = visibleItems[i]?.duration;
      if (!itemDuration) return null;
      remainingSeconds += itemDuration;
    }
  }

  // Note: 0 is a valid, meaningful result here ("ending right now") now that
  // the duration-unknown case is ruled out above - it must NOT be treated as
  // "no prediction", or the after-panel would lose its trigger signal at
  // exactly the moment it's most needed (the last few seconds of the song).
  return new Date(now + remainingSeconds * 1000);
};

/**
 * Returns today's scheduled meeting end DateTime (start time + the flat
 * 1h45m both MW and WE meetings are scheduled for - see
 * MEETING_SCHEDULED_DURATION_MINUTES), or null when today isn't a meeting
 * day or no start time is configured. This is only ever a fallback/initial
 * estimate: once the last song starts playing, callers should prefer
 * predictLastSongEndDateTime() instead, which reflects real playback state.
 */
export const getTodaysScheduledMeetingEndDateTime = (
  now = new Date(),
): Date | null => {
  try {
    const start = getTodaysMeetingStartDateTime(now);
    if (!start) return null;

    return new Date(
      start.getTime() + MEETING_SCHEDULED_DURATION_MINUTES * 60 * 1000,
    );
  } catch (error) {
    errorCatcher(error);
    return null;
  }
};
