import type { AppStore } from 'src/types';

import os from 'node:os';

// Environment
export const PLATFORM = process?.platform || os.platform();
export const IS_DEV = import.meta.env.IS_DEV;
export const IS_BETA = import.meta.env.IS_BETA;
export const IS_TEST = import.meta.env.IS_TEST;
export const IS_DEMO_MODE =
  process.env.M3_DEMO_MODE === '1' ||
  process.env.M3_DEMO_MODE?.toLowerCase() === 'true';

// The name of M³'s snap (electron-builder names it after package.json's
// name, in test builds too) and its Flatpak's app ID (build/flatpak).
const SNAP_NAME = 'meeting-media-manager';
const FLATPAK_ID = 'io.github.sircharlo.meeting-media-manager';

/**
 * The app store this copy of M³ was installed from, if any: Electron flags
 * Mac App Store and Microsoft Store (MSIX) builds itself, snapd sets
 * SNAP_NAME for a snap, and Flatpak sets FLATPAK_ID. Null for M³'s own
 * installers, the AppImage and the portable build. The store then delivers
 * the updates, so M³'s own updater stays off (see findUpdatesOffReason in
 * main/updater.ts), and a snap keeps its data elsewhere (app-data-paths.ts).
 *
 * Only M³'s own snap and Flatpak count: a program started from another snap
 * or Flatpak inherits its variables (a classic snap's terminal, like VS
 * Code's, passes SNAP_NAME and SNAP_USER_COMMON to everything it starts),
 * and the AppImage started from there must still update itself and keep its
 * data where it was.
 */
export const detectAppStore = (): AppStore | null => {
  if (process.mas) return 'mac-app-store';
  if (process.windowsStore) return 'microsoft-store';
  if (process.env.SNAP_NAME === SNAP_NAME) return 'snap-store';
  if (process.env.FLATPAK_ID === FLATPAK_ID) return 'flathub';
  return null;
};
export const APP_STORE = detectAppStore();

// App
export const APP_ID = import.meta.env.APP_ID;
export const APP_NAME = import.meta.env.APP_NAME;
export const PRODUCT_NAME = import.meta.env.PRODUCT_NAME;
// The Microsoft Store build's package identity (see quasar.config.ts), set
// in every build.
export const MSIX_IDENTITY_NAME = import.meta.env.MSIX_IDENTITY_NAME;
export const MSIX_PUBLISHER = import.meta.env.MSIX_PUBLISHER;

// Sentry
const getSentryEnvironment = () => {
  if (IS_TEST) return 'test';
  if (IS_DEV) return 'development';
  if (IS_BETA) return 'beta';
  return 'production';
};

export const SENTRY_DSN = import.meta.env.SENTRY_DSN;
export const SENTRY_ENVIRONMENT = getSentryEnvironment();

// Domains
export const JW_DOMAINS: string[] = ['jw.org', 'jwevent.org', 'stream.jw.org'];
// SEC-9 (full-audit-2026-09-05.md): `akamaihd.net`/`cloudfront.net` are
// real, load-bearing hosts for JW media assets (e.g. thumbnail/poster
// images - confirmed by a real, historically-hardcoded example URL on
// `assetsnffrgf-a.akamaihd.net`), but they're also self-service, multi-
// tenant CDN platforms: anyone can provision their own subdomain under
// either in minutes, and `isHostnameOrSubdomain`'s `.`-boundary check can't
// tell an attacker's `<random>.cloudfront.net` apart from a legitimate one.
// That's an acceptable, necessary risk for *loading media assets*
// (CORS header rewriting - see `isTrustedDomain` in utils.ts) since a
// static asset host is never itself the source of a navigation, webview, or
// permission request in real usage - so `NAVIGABLE_TRUSTED_DOMAINS`
// deliberately excludes them, and gates the honestly dangerous
// decisions (camera/mic/notification grants, `will-navigate`, webview
// creation, `setWindowOpenHandler`'s auto-open-external) on the narrower
// list instead. See `isTrustedNavigationTarget` in utils.ts.
export const NAVIGABLE_TRUSTED_DOMAINS: string[] = JW_DOMAINS.concat([
  'jw-cdn.org',
]);
export const TRUSTED_DOMAINS: string[] = NAVIGABLE_TRUSTED_DOMAINS.concat([
  'akamaihd.net',
  'cloudfront.net',
]);

// General
export const FULL_HD_RESOLUTION = [1920, 1080] as const;
export const HD_RESOLUTION = [1280, 720] as const;
export const WINDOW_MOVE_THROTTLE_MS = 100;
