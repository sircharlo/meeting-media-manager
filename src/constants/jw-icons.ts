/**
 * Centralized map of JW Icons Unicode strings
 * Keys are the identifiers used in the app, values are the Unicode escape sequences
 */
export type jwIconsKeys =
  | 'ayfm'
  | 'ayfm-part'
  | 'bible-reading'
  | 'brochures-and-booklets'
  | 'cbs'
  | 'circuit-overseer'
  | 'g'
  | 'gems'
  | 'lac'
  | 'lac-part'
  | 'magazines'
  | 'meeting-workbooks'
  | 'programs'
  | 'pt'
  | 'tgw'
  | 'tracts-and-invitations'
  | 'w'
  | 'wp'
  | 'ws'
  | 'wt';

export const jwIcons: Record<jwIconsKeys, string> = {
  ayfm: '\ue6ec',
  'ayfm-part': '\ue698',
  'bible-reading': '\ue61f',
  'brochures-and-booklets': '\ue62d',
  cbs: '\ue6c3',
  'circuit-overseer': '\ue6c2',
  g: '\ue61b',
  gems: '\ue694',
  lac: '\ue6bb',
  'lac-part': '\ue6d8',
  magazines: '\ue67c',
  'meeting-workbooks': '\ue680',
  programs: '\ue601',
  pt: '\ue6c2',
  tgw: '\ue65c',
  'tracts-and-invitations': '\ue6dc',
  w: '\ue6ea',
  wp: '\ue6ea',
  ws: '\ue6eb',
  wt: '\ue6ea',
};
