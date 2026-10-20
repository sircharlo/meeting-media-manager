import type { SettingsValues } from './settings';

export interface FeatureNudge {
  /** i18n key of the button that accepts the suggestion. */
  acceptLabel: string;
  action: FeatureNudgeAction;
  beta?: boolean;
  /** i18n key of the plain-language explanation, which can depend on the setup. */
  getBody: (context: FeatureNudgeContext) => string;
  icon: string;
  id: FeatureNudgeId;
  isEligible: (context: FeatureNudgeContext) => boolean;
  /** i18n key of the title. */
  title: string;
}

/** What accepting a suggestion does. */
export type FeatureNudgeAction =
  /** Dispatches a global event, e.g. to open a setup assistant. */
  | { event: string; type: 'event' }
  /** Opens Settings at this setting, highlighted (`/settings/<setting>`). */
  | { setting: keyof SettingsValues; type: 'settings' };

/** What a suggestion's eligibility rule can look at. */
export interface FeatureNudgeContext {
  congregationCount: number;
  /** Whether the disk holding the cache is nearly full. */
  lowDiskSpace: boolean;
  /** How many scenes OBS Studio reports, or null while not connected. */
  obsSceneCount: null | number;
  online: boolean;
  platform: NodeJS.Platform;
  screenCount: number;
  settings: SettingsValues;
}

/** A feature the "Did you know?" dialog can suggest (see constants/feature-nudges). */
export type FeatureNudgeId =
  | 'auto-start'
  | 'meeting-timer'
  | 'obs'
  | 'schedule-sync'
  | 'shared-folder'
  | 'songbook-videos'
  | 'zoom';

/** A profile's answers to feature suggestions, persisted per congregation. */
export interface FeatureNudgeProfileState {
  responses: Partial<
    Record<FeatureNudgeId, { at: number; response: FeatureNudgeResponse }>
  >;
  /** "Stop suggesting features" was chosen for this profile. */
  stopped?: boolean;
}

/**
 * What the user did with a suggestion. Accepted and declined suggestions are
 * never shown again; a snoozed one goes to the back of the queue.
 */
export type FeatureNudgeResponse = 'accepted' | 'declined' | 'snoozed';
