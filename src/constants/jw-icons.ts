/**
 * Centralized map of JW Icons Unicode strings
 * Keys are the identifiers used in the app, values are the Unicode escape sequences
 */
export const fallbackJwIconsGlyphMap: Record<string, string> = {
  arena: '\ue601',
  'awake-exclamation-mark': '\ue619',
  'brochure-stack': '\ue62b',
  gem: '\ue658',
  'jw-square': '\ue666',
  'magazine-stack': '\ue675',
  'meeting-workbook-stack': '\ue679',
  sheep: '\ue6a4',
  speaker: '\ue6ab',
  'tract-stack': '\ue6c4',
  video: '\ue6ce',
  watchtower: '\ue6d2',
  'watchtower-square': '\ue6d3',
  wheat: '\ue6d4',
  'wine-bread': '\ue6d5',
};

export const keywordToJwIconMapping: Record<string, string | undefined> = {
  ayfm: 'wheat',
  'ayfm-part': 'wheat',
  'bible-reading': 'bible',
  'brochures-and-booklets': 'brochure-stack',
  cbs: 'speaker-audience',
  'circuit-overseer': 'speaker',
  'co-final-talk': 'speaker',
  'co-service-talk': 'speaker',
  'concluding-comments': 'speaker',
  g: 'awake-exclamation-mark',
  gems: 'person-raised-hand',
  introduction: 'speaker',
  lac: 'sheep',
  'lac-part': 'sheep',
  magazines: 'magazine-stack',
  'meeting-workbooks': 'meeting-workbook-stack',
  memorial: 'wine-bread',
  programs: 'arena',
  pt: 'speaker',
  'public-talk': 'speaker',
  tgw: 'gem',
  'tracts-and-invitations': 'tract-stack',
  treasures: 'speaker-audience',
  'tv-logo': 'jw-square',
  w: 'watchtower',
  'welcome-video': 'video',
  wp: 'persons-doorstep',
  ws: 'watchtower-square',
  wt: 'watchtower',
};

export type JwIconKeyword = keyof typeof keywordToJwIconMapping;
