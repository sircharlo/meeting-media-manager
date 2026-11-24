// How many full weeks (Monday to Sunday), starting with the current one, to
// fetch data for by default. The header's date picker shows one row per week,
// so every row it shows is complete.
export const WEEKS_TO_FETCH = 6;

// How far ahead of the meeting start background music is allowed to
// auto-start. The before-meeting quick-actions panel shows itself over the
// same window - independent of whether autoStartMusic itself is enabled,
// since the panel's usefulness (recording/checklist/manual music controls)
// doesn't depend on that one setting - and the Zoom Meeting Manager counts
// it as meeting time.
export const AUTO_START_WINDOW_HOURS = 1.25;
