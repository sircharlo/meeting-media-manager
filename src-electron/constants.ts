import os from 'os';

// Environment
export const PLATFORM = process?.platform || os.platform();
export const IS_TEST = process.env.TEST_VERSION == 'true';
export const IS_DEV = process.env.NODE_ENV === 'development';

// App
export const APP_NAME = IS_TEST
  ? 'meeting-media-manager-test'
  : 'meeting-media-manager';
export const PRODUCT_NAME = IS_TEST
  ? 'Meeting Media Manager - Test'
  : 'Meeting Media Manager';

// Domains
export const JW_DOMAINS: string[] = ['jw.org'];
export const TRUSTED_DOMAINS: string[] = [
  'jw.org',
  'jw-cdn.org',
  'akamaihd.net',
  'cloudfront.net',
];

// General
export const HD_RESOLUTION = [1280, 720] as const;
