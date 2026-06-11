/**
 * Centralized map of JW Icons Unicode strings
 * Keys are the identifiers used in the app, values are the Unicode escape sequences
 */
export const fallbackJwIconsGlyphMap: Record<string, string> = {
  arena: '\ue60a',
  'awake-exclamation-mark': '\ue646',
  'brochure-stack': '\ue675',
  gem: '\ue720',
  'jw-square': '\ue74a',
  'magazine-stack': '\ue770',
  'meeting-workbook-stack': '\ue780',
  sheep: '\ue800',
  speaker: '\ue810',
  'tract-stack': '\ue86c',
  video: '\ue884',
  watchtower: '\ue890',
  'watchtower-square': '\ue892',
  wheat: '\ue898',
  'wine-bread': '\ue89a',
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
