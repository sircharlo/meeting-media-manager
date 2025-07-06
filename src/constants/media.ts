import type { MediaSectionIdentifier } from 'src/types';

export const FULL_HD = { height: 1080, width: 1920 };

export const JPG_EXTENSIONS = ['jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp'];

export const PURE_IMG_EXTENSIONS = [
  'apng',
  'avif',
  'gif',
  'png',
  'webp',
  'bmp',
  'ico',
  'cur',
].concat(JPG_EXTENSIONS);

export const HEIC_EXTENSIONS = ['heic'];
export const SVG_EXTENSIONS = ['svg'];

export const IMG_EXTENSIONS = [
  ...PURE_IMG_EXTENSIONS,
  ...HEIC_EXTENSIONS,
  ...SVG_EXTENSIONS,
];

export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
export const VIDEO_EXTENSIONS = ['mp4', 'm4v', 'mov', 'mkv', 'avi', 'webm'];

export const PDF_EXTENSIONS = ['pdf'];
export const ZIP_EXTENSIONS = ['zip'];
export const JWPUB_EXTENSIONS = ['jwpub'];
export const JWL_PLAYLIST_EXTENSIONS = ['jwlplaylist'];

export const OTHER_EXTENSIONS = [
  ...PDF_EXTENSIONS,
  ...ZIP_EXTENSIONS,
  ...JWPUB_EXTENSIONS,
  ...JWL_PLAYLIST_EXTENSIONS,
];

export const standardSections: MediaSectionIdentifier[] = [
  'ayfm',
  'circuitOverseer',
  'lac',
  'tgw',
  'wt',
];
