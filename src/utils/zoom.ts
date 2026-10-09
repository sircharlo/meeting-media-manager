import type { SettingsValues } from 'src/types';

/**
 * Whether the setup assistant learned what Zoom's microphone and camera
 * buttons say in both states (Zoom only names them in the user's language),
 * which the meeting automations need.
 */
export const areZoomButtonsLearned = (
  settings: null | Partial<SettingsValues> | undefined,
) =>
  !!(
    settings?.zoomMicOnTitle &&
    settings.zoomMicOffTitle &&
    settings.zoomVideoOnTitle &&
    settings.zoomVideoOffTitle
  );

// Zoom meeting IDs are 9 to 11 digits ("123 4567 8901"); invitation links
// carry them after /j/ or /s/ (https://us02web.zoom.us/j/12345678901?pwd=...).
const MEETING_ID_DIGITS = /^\d{9,11}$/;
const MEETING_LINK = /\/(?:j|s|wc(?:\/join)?)\/(\d{9,11})(?:\D|$)/;

/**
 * The meeting ID in what a user typed or pasted: the ID itself (with any
 * spaces, dashes or dots), or a Zoom invitation link. Null if there isn't
 * one.
 */
export const parseZoomMeetingId = (
  input: null | string | undefined,
): null | string => {
  const text = (input ?? '').trim();
  if (!text) return null;
  const fromLink = MEETING_LINK.exec(text)?.[1];
  if (fromLink) return fromLink;
  const digits = text.replaceAll(/[\s\-.]/g, '');
  return MEETING_ID_DIGITS.test(digits) ? digits : null;
};
