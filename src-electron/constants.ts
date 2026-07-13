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

// Domains
export const JW_DOMAINS: string[] = ['jw.org', 'jwevent.org', 'stream.jw.org'];
export const TRUSTED_DOMAINS: string[] = JW_DOMAINS.concat([
  'jw-cdn.org',
  'akamaihd.net',
  'cloudfront.net',
]);

// General
export const HD_RESOLUTION = [1280, 720] as const;
export const WINDOW_MOVE_THROTTLE_MS = 100;
