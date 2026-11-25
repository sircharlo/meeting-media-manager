export const MEDIA_WINDOW_TITLE = 'Media Player - M³';

/**
 * The Zoom version the Zoom Meeting Manager is tested with (test/zoom-live).
 * An older Zoom gets a warning: its controls can differ (Original sound
 * moved from 6.5's top bar to 7's audio menu, for one). Raise it once a
 * newer Zoom passes the live tests.
 */
export const ZOOM_TESTED_VERSION = '7.2.1';

/**
 * While M³ shares a video or an audio file in Zoom, the host microphone is
 * muted from this many seconds after the media starts playing...
 */
export const HOST_MIC_MUTE_AFTER_MEDIA_START_SECONDS = 5;

/** ...until this many seconds before it ends (src/helpers/zoom.ts). */
export const HOST_MIC_UNMUTE_BEFORE_MEDIA_END_SECONDS = 10;

/**
 * Media that plays for less than this many seconds, from where it started
 * to its end, leaves the host microphone on throughout.
 */
export const HOST_MIC_MIN_MEDIA_SECONDS = 30;

/** The setup assistant's id in the dialog-state store. */
export const ZOOM_SETUP_ASSISTANT_DIALOG_ID = 'zoom-setup-assistant';

/**
 * What the `diagnose` command checks in Zoom, with i18n keys for each check
 * and for how to fix it (shown by the setup assistant and the startup check).
 */
export const ZOOM_DIAGNOSIS_CHECKS = [
  {
    fix: 'zoom-setup-fix-meeting',
    id: 'meeting',
    label: 'zoom-setup-check-meeting',
  },
  {
    fix: 'zoom-setup-fix-toolbar',
    id: 'toolbar',
    label: 'zoom-setup-check-toolbar',
  },
  {
    fix: 'zoom-setup-fix-buttons',
    id: 'videoButton',
    label: 'zoom-setup-check-buttons',
  },
  {
    fix: 'zoom-setup-fix-participants',
    id: 'participantsPanel',
    label: 'zoom-setup-check-participants',
  },
  {
    fix: 'zoom-setup-fix-host',
    id: 'hostControls',
    label: 'zoom-setup-check-host',
  },
] as const;

// What to tell the user when the Zoom helper (src-electron/zoom-helper)
// can't start, by the reason it reports.
const ZOOM_HELPER_ERROR_MESSAGE_KEYS: Record<string, string> = {
  'helper-blocked': 'zoom-helper-error-helper-blocked',
  'helper-missing': 'zoom-helper-error-helper-missing',
  'powershell-broken': 'zoom-helper-error-powershell-broken',
  'powershell-not-found': 'zoom-helper-error-powershell-not-found',
  'powershell-restricted': 'zoom-helper-error-powershell-restricted',
  'windows-only': 'zoom-helper-error-windows-only',
};

export const getZoomHelperErrorMessageKey = (error?: string) =>
  (error && ZOOM_HELPER_ERROR_MESSAGE_KEYS[error]) || // NOSONAR: '' means not set
  'zoom-helper-error-generic';

// Why the helper can't run on this computer at all, whatever M³ does: it's
// down to the computer (no Windows PowerShell, a locked-down one, one that
// doesn't start, or Windows App Control refusing the helper's files), so the
// user is told, and it isn't reported.
const ZOOM_HELPER_UNAVAILABLE_ERRORS = new Set([
  'helper-blocked',
  'powershell-broken',
  'powershell-not-found',
  'powershell-restricted',
  'windows-only',
]);

export const isZoomHelperUnavailableHere = (error?: string) =>
  !!error && ZOOM_HELPER_UNAVAILABLE_ERRORS.has(error);
