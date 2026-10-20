export const DAYS_IN_FUTURE = 35; // How many days in the future to fetch data for by default

// How far ahead of the meeting start background music is allowed to
// auto-start. The before-meeting quick-actions panel shows itself over the
// same window - independent of whether autoStartMusic itself is enabled,
// since the panel's usefulness (recording/checklist/manual music controls)
// doesn't depend on that one setting - and the Zoom Meeting Manager counts
// it as meeting time.
export const AUTO_START_WINDOW_HOURS = 1.25;
