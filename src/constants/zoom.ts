export const MEDIA_WINDOW_TITLE = 'Media Player - M³';

// What to tell the user when the Zoom helper (src-electron/zoom-helper)
// can't start, by the reason it reports.
const ZOOM_HELPER_ERROR_MESSAGE_KEYS: Record<string, string> = {
  'powershell-not-found': 'zoom-helper-error-powershell-not-found',
  'powershell-restricted': 'zoom-helper-error-powershell-restricted',
  'windows-only': 'zoom-helper-error-windows-only',
};

export const getZoomHelperErrorMessageKey = (error?: string) =>
  (error && ZOOM_HELPER_ERROR_MESSAGE_KEYS[error]) ||
  'zoom-helper-error-generic';
