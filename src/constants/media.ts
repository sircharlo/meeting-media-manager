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
  'circuit-overseer',
  'lac',
  'tgw',
  'wt',
];

// Standard sections for different meeting types
export const WE_MEETING_SECTIONS: MediaSectionIdentifier[] = ['pt', 'wt'];
export const MW_MEETING_SECTIONS: MediaSectionIdentifier[] = [
  'tgw',
  'ayfm',
  'lac',
];
export const CO_WEEK_ADDITIONAL_SECTION: MediaSectionIdentifier =
  'circuit-overseer';

// Helper function to get sections for a meeting type
export function getMeetingSections(
  meeting: 'mw' | 'we' | false,
  isCoWeek = false,
): MediaSectionIdentifier[] {
  console.log('🔍 [getMeetingSections] meeting', meeting);
  if (!meeting) return [];

  const baseSections =
    meeting === 'we' ? WE_MEETING_SECTIONS : MW_MEETING_SECTIONS;

  if (isCoWeek) {
    return [...baseSections, CO_WEEK_ADDITIONAL_SECTION];
  }
  console.log('🔍 [getMeetingSections] baseSections', baseSections);
  return baseSections;
}
