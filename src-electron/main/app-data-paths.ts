import { app } from 'electron';
import { APP_STORE, IS_TEST, PRODUCT_NAME } from 'src-electron/constants';
import { join, resolve } from 'upath';

/**
 * Moves M³'s data folders, before anything is read from or written to them,
 * for the builds that can't use Electron's defaults:
 * - the portable build keeps everything next to its executable;
 * - a snap keeps userData in $SNAP_USER_COMMON. Its default folder
 *   ($SNAP_USER_DATA) is per revision: snapd copies it whole on every update
 *   and keeps the last few, so the media cache in it would be copied, and
 *   kept several times over, with each update. $SNAP_USER_COMMON is shared
 *   by all revisions;
 * - a test build keeps its own userData, apart from the release's.
 */
export function configureAppDataPaths() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    const portableExecutableDir = resolve(process.env.PORTABLE_EXECUTABLE_DIR);
    app.setPath('appData', portableExecutableDir);
    app.setPath(
      'userData',
      join(portableExecutableDir, `${PRODUCT_NAME} - User Data`),
    );
    app.setPath(
      'temp',
      join(portableExecutableDir, `${PRODUCT_NAME} - Temporary Files`),
    );
  } else if (APP_STORE === 'snap-store' && process.env.SNAP_USER_COMMON) {
    app.setPath('userData', join(process.env.SNAP_USER_COMMON, PRODUCT_NAME));
  } else if (IS_TEST && PRODUCT_NAME) {
    app.setPath('userData', join(app.getPath('appData'), PRODUCT_NAME));
  }
}
