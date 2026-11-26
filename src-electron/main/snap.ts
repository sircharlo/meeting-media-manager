import type { SnapConnections, SnapInterface } from 'src/types';

import { execFile } from 'node:child_process';
import { APP_STORE } from 'src-electron/constants';
import { captureElectronError } from 'src-electron/main/utils';
import { SNAP_MANUAL_INTERFACES } from 'src/constants/snap';

// Where the snap's base (core24) has snapctl, so it isn't looked up through
// PATH.
const SNAPCTL = '/usr/bin/snapctl';

/**
 * Whether one of the snap's plugs is connected, from `snapctl is-connected`:
 * it exits with 0 when it is, and with 1 and nothing on stderr when it isn't.
 * When snapctl fails, it also exits with 1, but says why on stderr; that, a
 * missing snapctl or a timeout can't tell, and gets reported.
 * @param plug The plug, e.g. removable-media.
 * @returns Whether it's connected, or null when snapctl couldn't tell.
 */
export const isSnapPlugConnected = (plug: SnapInterface) =>
  new Promise<boolean | null>((resolve) => {
    execFile(
      SNAPCTL,
      ['is-connected', plug],
      { timeout: 10_000 },
      (error, _stdout, stderr) => {
        if (!error) {
          resolve(true);
          return;
        }
        const errorOutput = String(stderr).trim();
        if (error.code === 1 && !errorOutput) {
          resolve(false);
          return;
        }
        captureElectronError(error, {
          contexts: {
            fn: {
              code: error.code,
              killed: error.killed,
              name: 'isSnapPlugConnected',
              plug,
              stderr: errorOutput,
            },
          },
        });
        resolve(null);
      },
    );
  });

/**
 * Which of the snap's interfaces that the user connects themselves (see
 * SNAP_MANUAL_INTERFACES) are connected, so M³ can tell the user the command
 * that connects the ones that aren't.
 * @returns Each interface's state, without those snapctl couldn't tell
 * about; null outside M³'s snap.
 */
export const getSnapConnections = async (): Promise<null | SnapConnections> => {
  if (APP_STORE !== 'snap-store') return null;
  const states = await Promise.all(
    SNAP_MANUAL_INTERFACES.map(
      async (plug) => [plug, await isSnapPlugConnected(plug)] as const,
    ),
  );
  const connections: SnapConnections = {};
  for (const [plug, connected] of states) {
    if (connected !== null) connections[plug] = connected;
  }
  return connections;
};
