import type {
  FeatureNudge,
  FeatureNudgeContext,
  SettingsValues,
} from 'src/types';

// Features the "Did you know?" dialog (DialogFeatureNudge) can suggest to a
// profile that isn't using them yet, in the order they're suggested. When
// building a new feature, add it here if it's a good candidate: off by
// default, useful to many congregations, and either a safe toggle or with
// its own setup path. Never suggest default-on features (off means the user
// turned them off), troubleshooting options, or automations that could
// misfire without setup. Each suggestion needs its own friendly
// feature-nudge-<id>-title / -body strings in en.json, explaining in plain
// words what it does and why it's worth turning on.

const SCREENS_FOR_TIMER = 3; // main window, media window, timer

// With a media scene, OBS Studio shows the media in Zoom itself.
const obsShowsMedia = (settings: SettingsValues) =>
  !!(
    settings.obsEnable &&
    settings.obsPort &&
    settings.obsPassword &&
    settings.obsMediaScene
  );

/**
 * OBS Studio only used to show the media in Zoom: a camera scene and a media
 * scene, nothing else. The Zoom Meeting Manager does the same more simply.
 * The scene count is only known while OBS Studio is connected.
 */
export const hasSimpleObsSetup = ({
  obsSceneCount,
  settings,
}: FeatureNudgeContext) =>
  obsShowsMedia(settings) &&
  !settings.obsImageScene &&
  obsSceneCount !== null &&
  obsSceneCount <= 2;

export const FEATURE_NUDGES: FeatureNudge[] = [
  {
    acceptLabel: 'feature-nudge-show-me',
    action: { setting: 'relinkCongregationButton', type: 'settings' },
    getBody: () => 'feature-nudge-schedule-sync-body',
    icon: 'mmm-calendar-month',
    id: 'schedule-sync',
    isEligible: ({ online, settings }) =>
      settings.congregationNameModified &&
      !settings.disableMediaFetching &&
      online,
    title: 'feature-nudge-schedule-sync-title',
  },
  {
    acceptLabel: 'feature-nudge-set-it-up',
    action: { event: 'openZoomSetupAssistant', type: 'event' },
    beta: true,
    getBody: (context) =>
      hasSimpleObsSetup(context)
        ? 'feature-nudge-zoom-obs-body'
        : 'feature-nudge-zoom-body',
    icon: 'mmm-video-meeting',
    id: 'zoom',
    // Not for halls using the screen-sharing shortcut, which excludes it,
    // nor for OBS Studio setups doing more than showing media.
    isEligible: (context) =>
      context.platform === 'win32' &&
      !context.settings.zoomMeetingManagerEnable &&
      !context.settings.zoomEnable &&
      (!obsShowsMedia(context.settings) || hasSimpleObsSetup(context)),
    title: 'feature-nudge-zoom-title',
  },
  {
    acceptLabel: 'feature-nudge-show-me',
    action: { setting: 'enableFolderWatcher', type: 'settings' },
    getBody: () => 'feature-nudge-shared-folder-body',
    icon: 'mmm-watched-media',
    id: 'shared-folder',
    isEligible: ({ settings }) =>
      !settings.enableFolderWatcher && settings.enableMediaDisplayButton,
    title: 'feature-nudge-shared-folder-title',
  },
  {
    acceptLabel: 'feature-nudge-show-me',
    action: { setting: 'enableTimerDisplay', type: 'settings' },
    beta: true,
    getBody: () => 'feature-nudge-meeting-timer-body',
    icon: 'mmm-time',
    id: 'meeting-timer',
    // Only where a screen is free for it, the ideal timer setup.
    isEligible: ({ screenCount, settings }) =>
      !settings.enableTimerDisplay && screenCount >= SCREENS_FOR_TIMER,
    title: 'feature-nudge-meeting-timer-title',
  },
  {
    acceptLabel: 'feature-nudge-show-me',
    action: { setting: 'enableExtraCache', type: 'settings' },
    getBody: () => 'feature-nudge-songbook-videos-body',
    icon: 'mmm-music-note',
    id: 'songbook-videos',
    // A few gigabytes to download, so not on a full disk or metered link.
    isEligible: ({ lowDiskSpace, online, settings }) =>
      !settings.enableExtraCache &&
      settings.enableMediaDisplayButton &&
      !settings.disableMediaFetching &&
      !settings.meteredConnection &&
      !lowDiskSpace &&
      online,
    title: 'feature-nudge-songbook-videos-title',
  },
  {
    acceptLabel: 'feature-nudge-show-me',
    action: { setting: 'autoStartAtLogin', type: 'settings' },
    getBody: () => 'feature-nudge-auto-start-body',
    icon: 'mmm-play',
    id: 'auto-start',
    // Starting at login has no effect on Linux. It's useful when music
    // starts with M³, and its effect is computer-wide, so only with a
    // single profile.
    isEligible: ({ congregationCount, platform, settings }) =>
      (platform === 'win32' || platform === 'darwin') &&
      !settings.autoStartAtLogin &&
      settings.enableMusicButton &&
      settings.autoStartMusic &&
      congregationCount === 1,
    title: 'feature-nudge-auto-start-title',
  },
  {
    acceptLabel: 'feature-nudge-show-me',
    action: { setting: 'obsEnable', type: 'settings' },
    getBody: () => 'feature-nudge-obs-body',
    icon: 'mmm-obs-studio',
    id: 'obs',
    isEligible: ({ settings }) =>
      !settings.obsEnable &&
      !settings.zoomEnable &&
      !settings.zoomMeetingManagerEnable,
    title: 'feature-nudge-obs-title',
  },
];
