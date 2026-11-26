import type { SnapInterface } from 'src/types';

/**
 * The name of M³'s snap: electron-builder names it after package.json's
 * name, in test builds too.
 */
export const SNAP_NAME = 'meeting-media-manager';

/**
 * The snap's interfaces that the Snap Store doesn't connect by itself, so
 * the user connects them with `snap connect` (forum.snapcraft.io topic
 * 54356): it keeps removable-media for verified publishers, and almost never
 * connects password-manager-service, which opens the whole keyring, not
 * just M³'s own secrets. Electron can't use the Secret portal instead.
 */
export const SNAP_MANUAL_INTERFACES: readonly SnapInterface[] = [
  'removable-media',
  'password-manager-service',
];

/**
 * The command that connects one of the snap's interfaces, for the user to
 * run in a terminal.
 * @param plug The interface, e.g. removable-media.
 * @returns The command, e.g. "snap connect meeting-media-manager:removable-media".
 */
export const getSnapConnectCommand = (plug: SnapInterface) =>
  `snap connect ${SNAP_NAME}:${plug}`;
