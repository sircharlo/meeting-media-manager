export const MEDIA_WINDOW_TITLE = 'Media Player - M³';

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
  'helper-missing': 'zoom-helper-error-helper-missing',
  'powershell-not-found': 'zoom-helper-error-powershell-not-found',
  'powershell-restricted': 'zoom-helper-error-powershell-restricted',
  'windows-only': 'zoom-helper-error-windows-only',
};

export const getZoomHelperErrorMessageKey = (error?: string) =>
  (error && ZOOM_HELPER_ERROR_MESSAGE_KEYS[error]) ||
  'zoom-helper-error-generic';
