import type { SettingsValues } from 'src/types';

import { getMeetingStartToday } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { zoomStateDoesChecklistItem } from 'src/helpers/meeting-quick-actions';
import {
  getAfterMeetingSettingsAskedAt,
  getZoomMeetingSequenceOutcome,
  getZoomPostMeetingSequenceOutcome,
} from 'src/helpers/zoom';
import { getPendingMeetingSettingsTime } from 'src/helpers/zoom-meeting-day';
import { useCurrentStateStore } from 'stores/current-state';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { useZoomStateStore } from 'stores/zoom-state';

// The Zoom Meeting Manager ticks some meeting checklist items itself, as it
// does them in Zoom. A user ticking one of those by hand may not know M³ is
// about to do it, and one unticking it may think that undoes it in Zoom: the
// checklist asks them first, saying what M³ does (see
// MeetingQuickActionsChecklist.vue).

/**
 * What the Zoom Meeting Manager does about a meeting checklist item:
 * - `done`: it already did it in Zoom, and ticked it.
 * - `music-start`: it will do it when background music is started after the
 *   meeting.
 * - `music-stop`: it will do it at `at`, when background music stops before
 *   the meeting (or is doing it now, once `at` has passed).
 */
export type ZoomChecklistNotice =
  | { at: number; kind: 'music-stop' }
  | { kind: 'done' }
  | { kind: 'music-start' };

const getMusicStopNotice = (
  itemId: string,
  settings: SettingsValues,
  now: Date,
): null | ZoomChecklistNotice => {
  if (!settings.zoomMeetingManagerAutomateMeetingAudioSettings) return null;
  if (!zoomStateDoesChecklistItem(itemId, getZoomMeetingSequenceOutcome())) {
    return null;
  }
  const at = getPendingMeetingSettingsTime(now);
  return at === null ? null : { at, kind: 'music-stop' };
};

const getMusicStartNotice = (
  itemId: string,
  settings: SettingsValues,
  now: Date,
): null | ZoomChecklistNotice => {
  // After the meeting, only background music started by the user applies
  // the before/after-meeting settings (see automateZoomSettingsOnMusicStart).
  if (
    !settings.zoomMeetingManagerAutomatePostMeetingAudioSettings ||
    !settings.enableMusicButton
  ) {
    return null;
  }
  if (
    !zoomStateDoesChecklistItem(itemId, getZoomPostMeetingSequenceOutcome())
  ) {
    return null;
  }
  const start = getMeetingStartToday(now);
  if (!start) return null;
  const askedAt = getAfterMeetingSettingsAskedAt();
  if (askedAt !== null && askedAt >= start.getTime()) return null;
  return { kind: 'music-start' };
};

/**
 * What to tell a user about to tick or untick a checklist item by hand, or
 * null when it's theirs to do: M³ doesn't do it, its automation is off or
 * paused, or its time is over (it may have failed, then).
 * @param itemId The checklist item clicked
 * @param mode Which checklist it's on
 * @param now When it was clicked
 * @returns The notice, or null for none
 */
export const getZoomChecklistNotice = (
  itemId: string,
  mode: 'after' | 'before',
  now = new Date(),
): null | ZoomChecklistNotice => {
  try {
    const quickActions = useMeetingQuickActionsStore();
    if (quickActions.isItemCheckedAutomatically(itemId)) {
      return { kind: 'done' };
    }
    // Unticking what the user ticked themselves is theirs to do.
    if (quickActions.isItemChecked(itemId)) return null;

    const settings = useCurrentStateStore().currentSettings;
    // Paused (by a failed or skipped check), M³ leaves Zoom to the user.
    if (
      !settings?.zoomMeetingManagerEnable ||
      useZoomStateStore().automationsPaused
    ) {
      return null;
    }
    return mode === 'before'
      ? getMusicStopNotice(itemId, settings, now)
      : getMusicStartNotice(itemId, settings, now);
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { itemId, mode, name: 'getZoomChecklistNotice' } },
    });
    return null;
  }
};
