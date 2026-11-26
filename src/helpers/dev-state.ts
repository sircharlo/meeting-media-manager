import type { DevFault } from 'src/types';

import { dateFromString } from 'src/utils/date';
import { reactive, ref } from 'vue';

// What the dev-only Dev actions popup is faking (see DialogDevActionsPopup).
// Nothing here is persisted, and every check that reads it is behind
// `import.meta.env.DEV`, so production never fakes any of it.

/** Today's meeting, as a developer set it: its type and when it starts. */
export interface DevMeetingOverride {
  /** When the meeting starts, in ms since the epoch. */
  startsAt: number;
  type: 'mw' | 'we';
}

/**
 * Makes today a meeting day whose meeting starts at a given time, so the
 * run-up to the meeting and its end (the quick actions panels, background
 * music starting and stopping by itself, Zoom's meeting-time steps) can be
 * tried with the real congregation, at any time.
 */
export const devMeetingOverride = ref<DevMeetingOverride | null>(null);

/** Renderer-side failures a developer can fake. */
export const devRendererFaults = reactive({
  /** Every fetch fails, the way it does when the connection drops. */
  failFetches: false,
});

/**
 * The main process's faked failures, as the popup turned them on (the main
 * process keeps the real switch, see src-electron/main/dev-faults.ts).
 */
export const devMainFaults = reactive<Record<DevFault, boolean>>({
  failDownloads: false,
  lowDiskSpace: false,
});

export const setDevMainFault = (fault: DevFault, on: boolean) => {
  devMainFaults[fault] = on;
  globalThis.electronApi?.setDevFault(fault, on);
};

const isToday = (date: Date | string) =>
  dateFromString(date).toDateString() === new Date().toDateString();

/** The developer's override of the meeting on `date`, if it's today. */
export const getDevMeetingOn = (
  date: Date | string | undefined,
): DevMeetingOverride | null => {
  const override = devMeetingOverride.value;
  if (!override || !date) return null;
  return isToday(date) ? override : null;
};
