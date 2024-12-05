import os from 'os';
import { fileURLToPath } from 'url';

// needed in case process is undefined under Linux
export const PLATFORM = process?.platform || os.platform();
export const IS_DEV = process.env.NODE_ENV === 'development';
export const CURRENT_DIR = fileURLToPath(new URL('.', import.meta.url));
export const JW_DOMAINS: string[] = ['jw.org'];
export const TRUSTED_DOMAINS: string[] = [
  'jw.org',
  'jw-cdn.org',
  'akamaihd.net',
  'cloudfront.net',
];
export const HD_RESOLUTION = [1280, 720] as const;
