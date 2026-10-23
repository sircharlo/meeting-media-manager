import type {
  FeatureNudge,
  FeatureNudgeContext,
  FeatureNudgeProfileState,
  SettingsValues,
} from 'src/types';

import { i18n } from 'boot/i18n';
import { FEATURE_NUDGES } from 'src/constants/feature-nudges';
import { getMeetingStartToday } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getRendererPlatform } from 'src/helpers/fs';
import { MEETING_SCHEDULED_DURATION_MINUTES } from 'src/helpers/meeting-parts';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';

/** No suggestion from this long before a meeting until it ends. */
export const NUDGE_FREE_MINUTES_BEFORE_MEETING = 15;

const MINUTE_MS = 60 * 1000;

/**
 * Whether it's a good time for a suggestion: not from shortly before today's
 * meeting until its scheduled end, when the operator is busy.
 */
export const isOutsideMeetingTime = (
  now = new Date(),
  meetingStart: Date | null = getMeetingStartToday(now),
) => {
  if (!meetingStart) return true;
  const quietFrom =
    meetingStart.getTime() - NUDGE_FREE_MINUTES_BEFORE_MEETING * MINUTE_MS;
  const quietUntil =
    meetingStart.getTime() + MEETING_SCHEDULED_DURATION_MINUTES * MINUTE_MS;
  return now.getTime() < quietFrom || now.getTime() > quietUntil;
};

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/**
 * The suggestion to show next, or null. Suggestions the user accepted or
 * declined never come back. One they snoozed ("Remind me later") goes to the
 * back of the queue: every other eligible suggestion is shown first, and it
 * never comes back the same day. Snoozed ones come back oldest first.
 */
export const pickFeatureNudge = (
  context: FeatureNudgeContext,
  state: FeatureNudgeProfileState | undefined,
  now = new Date(),
  nudges: FeatureNudge[] = FEATURE_NUDGES,
): FeatureNudge | null => {
  if (state?.stopped) return null;
  const responses = state?.responses ?? {};

  const candidates = nudges.filter((nudge) => {
    const answer = responses[nudge.id];
    if (answer && answer.response !== 'snoozed') return false;
    return nudge.isEligible(context);
  });

  const neverShown = candidates.find((nudge) => !responses[nudge.id]);
  if (neverShown) return neverShown;

  const snoozedAt = (nudge: FeatureNudge) => responses[nudge.id]?.at ?? 0;
  return (
    candidates
      .filter((nudge) => !isSameDay(new Date(snoozedAt(nudge)), now))
      .sort((a, b) => snoozedAt(a) - snoozedAt(b))[0] ?? null
  );
};

/** Gathers what the suggestions' eligibility rules look at. */
export const getFeatureNudgeContext = async (
  settings: SettingsValues,
): Promise<FeatureNudgeContext> => {
  const obsState = useObsStateStore();
  const [screens, lowDiskSpace] = await Promise.all([
    globalThis.electronApi.getAllScreens().catch(() => []),
    globalThis.electronApi.getLowDiskSpaceStatus().catch(() => false),
  ]);
  return {
    congregationCount: useCongregationSettingsStore().congregationCount,
    lowDiskSpace,
    obsSceneCount:
      obsState.obsConnectionState === 'connected'
        ? obsState.scenes.length
        : null,
    online: navigator.onLine,
    platform: getRendererPlatform(),
    screenCount: screens.length,
    settings,
    zoomLayoutEnabled: useAppSettingsStore().zoomLayout.enabled,
  };
};

// Session-only: at most one suggestion per profile each time the app runs,
// and none in the session a profile was set up in (the setup wizard just
// asked about these features).
const suggestedThisSession = new Set<string>();
const setUpThisSession = new Set<string>();

export const markFeatureNudgeShown = (congId: string) => {
  suggestedThisSession.add(congId);
};

export const wasFeatureNudgeShownThisSession = (congId: string) =>
  suggestedThisSession.has(congId);

/** Called by the setup wizard for the profile it's setting up. */
export const markSetUpThisSession = (congId: string) => {
  setUpThisSession.add(congId);
};

export const wasSetUpThisSession = (congId: string) =>
  setUpThisSession.has(congId);

/** Forgets this session's suggestions (for tests). */
export const resetFeatureNudgeSession = () => {
  suggestedThisSession.clear();
  setUpThisSession.clear();
};

/** "Reset feature suggestions" in Settings > Advanced, for the current profile. */
export const resetFeatureNudgesForCurrentProfile = () => {
  try {
    const congId = useCurrentStateStore().currentCongregation;
    if (!congId) return;
    useCongregationSettingsStore().resetFeatureNudges(congId);
    createTemporaryNotification({
      message: i18n.global.t('feature-nudge-reset-done'),
      type: 'positive',
    });
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { name: 'resetFeatureNudgesForCurrentProfile' } },
    });
  }
};
