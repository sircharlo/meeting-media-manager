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
  watchtower: '\ue6d2',
  'watchtower-square': '\ue6d3',
  wheat: '\ue6d4',
};

export const keywordToJwIconMapping: Record<string, string | undefined> = {
  ayfm: 'wheat',
  'brochures-and-booklets': 'brochure-stack',
  'circuit-overseer': 'speaker',
  g: 'awake-exclamation-mark',
  lac: 'sheep',
  magazines: 'magazine-stack',
  'meeting-workbooks': 'meeting-workbook-stack',
  programs: 'arena',
  pt: 'speaker',
  tgw: 'gem',
  'tracts-and-invitations': 'tract-stack',
  'tv-logo': 'jw-square',
  w: 'watchtower',
  wp: 'watchtower',
  ws: 'watchtower-square',
  wt: 'watchtower',
};
