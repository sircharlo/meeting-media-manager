import os from 'node:os';

// Environment
export const PLATFORM = process?.platform || os.platform();
export const IS_DEV = import.meta.env.IS_DEV;
export const IS_BETA = import.meta.env.IS_BETA;
export const IS_TEST = import.meta.env.IS_TEST;
export const IS_DEMO_MODE =
  process.env.M3_DEMO_MODE === '1' ||
  process.env.M3_DEMO_MODE?.toLowerCase() === 'true';

// App
export const APP_ID = import.meta.env.APP_ID;
export const APP_NAME = import.meta.env.APP_NAME;
export const PRODUCT_NAME = import.meta.env.PRODUCT_NAME;

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
// (img-src/media-src/connect-src, CORS header rewriting - see
// `TRUSTED_DOMAINS`/`getTrustedHostnames()` in session.ts) since a static
// asset host is never itself the source of a navigation, webview, or
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
