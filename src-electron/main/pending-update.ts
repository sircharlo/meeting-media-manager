import { app } from 'electron';
import { outputJsonSync, readJsonSync, removeSync } from 'fs-extra/esm';
import { join } from 'upath';

/**
 * A downloaded update that waits for the next launch to be installed (see
 * shouldInstallOnLaunch in updater.ts), remembered across sessions.
 *
 * Every function here is synchronous on purpose: an install attempt is
 * counted right before the app quits for the installer, which an async
 * write might not survive.
 */
export interface PendingUpdate {
  /**
   * How many times an install of this version was started. An install that
   * keeps failing stops being retried at every launch.
   */
  installAttempts: number;
  version: string;
}

const getPendingUpdatePath = () =>
  join(app.getPath('userData'), 'pending-update.json');

const isPendingUpdate = (value: unknown): value is PendingUpdate => {
  if (typeof value !== 'object' || value === null) return false;
  const { installAttempts, version } = value as Partial<PendingUpdate>;
  return typeof version === 'string' && Number.isInteger(installAttempts);
};

/**
 * The update waiting for the next launch, if any.
 * @returns The pending update, or null when there is none or the file is unreadable
 */
export const readPendingUpdate = (): null | PendingUpdate => {
  const data: unknown = readJsonSync(getPendingUpdatePath(), { throws: false });
  return isPendingUpdate(data) ? data : null;
};

const writePendingUpdate = (version: string, newAttempts: number) => {
  const previous = readPendingUpdate();
  const previousAttempts =
    previous?.version === version ? previous.installAttempts : 0;
  const pendingUpdate: PendingUpdate = {
    installAttempts: previousAttempts + newAttempts,
    version,
  };
  outputJsonSync(getPendingUpdatePath(), pendingUpdate);
};

/**
 * Remembers that a version is downloaded and waiting, keeping the install
 * attempts already counted for it.
 * @param version The downloaded version
 */
export const rememberPendingUpdate = (version: string) => {
  writePendingUpdate(version, 0);
};

/**
 * Counts one more started install of a version.
 * @param version The version being installed
 */
export const countPendingUpdateInstallAttempt = (version: string) => {
  writePendingUpdate(version, 1);
};

/**
 * Forgets the pending update, once it's installed.
 */
export const clearPendingUpdate = () => {
  removeSync(getPendingUpdatePath());
};
