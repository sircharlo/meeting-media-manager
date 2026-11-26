import type { DevFault } from 'src/types';

import { IS_DEV } from 'src-electron/constants';

// Failures a developer can fake from the Dev actions popup, to see what a
// user would see (see setDevFault in electron.d.ts). Dev builds only: in
// production, nothing can turn them on.
const DEV_FAULTS = new Set<DevFault>(['failDownloads', 'lowDiskSpace']);
const faultsOn = new Set<DevFault>();

const isDevFault = (fault: unknown): fault is DevFault =>
  DEV_FAULTS.has(fault as DevFault);

/** Whether a developer faked this failure (always false in production). */
export const isDevFaultOn = (fault: DevFault) => IS_DEV && faultsOn.has(fault);

/** Turns a faked failure on or off; ignored in production. */
export const setDevFault = (fault: unknown, on: unknown) => {
  if (!IS_DEV || !isDevFault(fault)) return;
  if (on === true) faultsOn.add(fault);
  else faultsOn.delete(fault);
};
