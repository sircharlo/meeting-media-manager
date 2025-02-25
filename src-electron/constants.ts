import os from 'node:os';

// Environment
export const PLATFORM = process?.platform || os.platform();
export const IS_DEV = process.env.IS_DEV;
export const IS_BETA = process.env.IS_BETA;
export const IS_TEST = process.env.IS_TEST;

// App
export const APP_ID = process.env.APP_ID;
export const APP_NAME = process.env.APP_NAME;
export const PRODUCT_NAME = process.env.PRODUCT_NAME;

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
